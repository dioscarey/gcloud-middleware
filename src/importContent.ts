// Modules
import * as fs from "fs";
import colors from "colors";
import _, { reject } from "lodash";
import * as path from "path";
import readline from 'readline'
import {spawnSync} from "child_process";
// Dependencies
import deleteEnvAndCopyFromMaster from './deleteEnvAndCopyForMaster';
import compareTwoObjects from './utils/compareTwoObjects'
import {ImportOptions, DeleteEnvOptions, ContentTypeModelStructure, ContentTypeFieldStructure, MigrationAction} from './interfaces'
import {WriteJsonFile, ParseJsonFiles, RlCommand, parseOptionsList} from './utils/common';
import { resolve } from 'path';

const { runMigration } = require('contentful-migration')
const contentfulImport = require('contentful-import');

const NODENEV = process.env.NODE_ENV;

const rl = NODENEV === 'test' ? null : readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

export default class importContentfulToMaster { 
    private runMigration: boolean = false;
    private cmaToken: string
    private spaceId: string
    private validTypes: Array<String> = []
    private validIds: Array<String> = []
    private contentTypeIds: Array<String> = []
    private entriesIds: Array<String> = []
    private ignoreEntries: boolean = false;
    private mergeOnlyDiff: boolean = false;
    private skipQuestions: boolean = false;
    private useCurrentDifferenceContent: boolean = false;
    private envBase: string;
    private envCompare: string;
    private newMigrationFile: any = {};
    private totalEntitites: any = {};
    private differenceContentPath: string;
    private differenceContentFolderName: string = 'differenceContent';
    private migrationActions: Array<MigrationAction> = []
    private forceUpdateContentTypesAndEntries: boolean = false;
    
    constructor(options: ImportOptions) {
        this.cmaToken = options.cmaToken
        this.spaceId = options.spaceId;
        this.contentTypeIds = options.contentTypeIds ? parseOptionsList(options.contentTypeIds) : [];
        this.entriesIds = options.entriesIds ? parseOptionsList(options.entriesIds) : [];
        this.ignoreEntries = !!options.ignoreEntries;
        this.mergeOnlyDiff = !!options.onlyDiff;
        this.skipQuestions = !!options.skipQuestions;
        this.useCurrentDifferenceContent = !!options.useCurrentDifferenceContent;
        this.envBase = options.envBase
        this.envCompare = options.envCompare
        this.differenceContentPath = path.join(__dirname, '../', this.differenceContentFolderName);
        this.forceUpdateContentTypesAndEntries = !!options.forceUpdateContentTypesAndEntries
        if (this.contentTypeIds.length > 0) {
            this.validTypes.push('contentTypes')
            !this.ignoreEntries && this.validTypes.push('entries')
            this.validIds = this.validIds.concat(this.contentTypeIds);
        }
        if (this.entriesIds.length > 0) {
            !this.contentTypeIds.length && this.validTypes.push('entries')
            this.validIds = this.validIds.concat(this.entriesIds);
        }
    }

    private importFilesFromContentful (base: string, filename: string) : void {
        console.info("Importing content from the '"+base+"' branch... ");
        if(!fs.existsSync(this.differenceContentPath)) {
            fs.mkdirSync(this.differenceContentPath)
        }

        if(!fs.existsSync(path.join(this.differenceContentPath, filename))) {
            WriteJsonFile(path.join(this.differenceContentPath, filename), {});
        }

        const ls = spawnSync('npx', ['contentful' ,'space', 'export', '--space-id', this.spaceId, '--management-Token', this.cmaToken, '--environment-id', base, '--content-file', path.join(this.differenceContentPath, filename)], { 
            encoding : 'utf8',
            cwd: path.resolve(__dirname,'../')
        });       

        if (ls.stderr) {
            console.error(ls.stderr);
            throw new Error(ls.stderr);
        }

        console.info(`Number of files ${ls.stdout}`);
    }

    private async continueMergeToBase(answer: string) {    
        if(/y|Y/.test(answer)) {
            const deleteEnvOptions: DeleteEnvOptions ={
                cmaToken: this.cmaToken,
                spaceId: this.spaceId,
                enviornmentBase: this.envCompare
            }
            const deacfm = new deleteEnvAndCopyFromMaster(deleteEnvOptions);
            return await deacfm.start();
        } else {
            console.info(colors.green("DONE!!"));
            if(rl)
                rl.close();

            return true;
        }                    
    }

    private async mergeToBase() {
        return new Promise<boolean>((resolve, reject) => {
            const optionsImportToMaster = {
                contentFile: path.join(this.differenceContentPath, 'diffcontent.json'),
                spaceId: this.spaceId, 
                managementToken: this.cmaToken,
                environmentId: this.envBase
            }
        
            console.info(`
                Options to Import 
                contentFile : ${optionsImportToMaster.contentFile}
                enviornmentId: ${this.envBase},
            `)
        
            console.info(`Merging from "${this.envCompare}" to "${this.envBase}"`);

            contentfulImport(optionsImportToMaster)
            .then(async () => {
                console.info('Data imported successfully');
                console.info("Starting to create '"+this.envCompare+"' branch from Master ...");        

                if(this.envCompare === "master") {
                    return resolve(true);
                }
                
                if(rl){
                    const answer = await RlCommand(rl, `Do you want to update "${this.envCompare} from Master." (y/n)? `);
                    return await this.continueMergeToBase(answer);        
                } else {
                    return await this.continueMergeToBase('Y');
                }
            })
            .catch((err: any) => {
                console.error(err);
                reject(false);
            })
        })
    }

    private startMigration(next: any): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const options = {
                filePath: path.join(__dirname, './migration.js'),
                spaceId: this.spaceId,
                accessToken: this.cmaToken,
                environmentId: this.envBase,
                yes: true
            }
            
            runMigration(options)
            .then(async () => {
                await next();
                resolve(true);
            })
            .catch((e:any) => {
                console.error(e);
                reject(e);
            })
        })
    }

    private async continueMergeContentDifference (answer: string): Promise<boolean> {
        if(/y|Y/.test(answer)) {
            if(this.runMigration) {
                console.info(colors.yellow("Migration is going to run first!\n"))
                return await this.startMigration(await this.mergeToBase);
            }

            return await this.mergeToBase();            
        } else {
            return true;
        }                        
    }

    private async mergeContentDifference(thereAreChanges: boolean): Promise<boolean> {
        const diffContPathFile = path.join(this.differenceContentPath, 'diffcontent.json');

        WriteJsonFile(diffContPathFile, this.newMigrationFile);

        console.info(colors.green(" -> "+diffContPathFile+" file updated \n"));
        if(!thereAreChanges){
            console.info(" * THERE ARE NO CHANGES * ")
            if(rl)
                rl.close();
            
            return true;
        }       
                
        if(this.mergeOnlyDiff){
            console.info("Diff completed!")
            if(rl)
                rl.close();
            
            return true;
        }

        if(this.skipQuestions || !rl) {
            return await this.continueMergeContentDifference('Y');
        } else {
            const answer = await RlCommand(rl, `Do you want to do merge from "${this.envCompare}" to "${this.envBase}" (y/n)? `)
            return await this.continueMergeContentDifference(answer);
        }
        
    }    

    private verifyIsModelHasDifferenceStructure(model: ContentTypeModelStructure, compareModel: ContentTypeModelStructure) {

        if(model.fields && model.fields.length && compareModel.fields && compareModel.fields.length) {
            _.forEach(compareModel.fields, (field:ContentTypeFieldStructure, pos: number) => {
                const posField = model.fields.findIndex((compareField: ContentTypeFieldStructure) => compareField.id === field.id)
                if(posField > -1) {
                    const oldObj = compareModel.fields[posField];
                    const newObj = compareTwoObjects(field, oldObj);
                    const fieldMoved = posField !== pos;
                    if(fieldMoved) {
                        console.info(`  - Field position changed | ${field.id} | Pos ${pos} to ${posField}`)
                    }

                    if(oldObj && newObj.type && oldObj.type && newObj.id !== oldObj.id) {
                        throw new Error(colors.red(`  - Field Type are different: "${oldObj.type}" -> "${field.type}" \n >> Path > Content Model [name: '${compareModel.name}'] > Field [name: '${oldObj.name}'] `))
                    }
                } else {
                    console.info(colors.yellow(`  - WARN: Field deleted | "${field.id}" will be deleted in env:"${this.envBase}" from 'ContentType' -> ${compareModel.name} `));
                    this.migrationActions.push({
                        contentTypeAction: "edit",
                        contentTypeName: model.sys.id,
                        fieldId: field.id,
                        fieldAction: "delete",
                        fieldName: field.name
                    })
                }
            })
        }        
    }

    private showEntriesDiff(fields: any, oldfields: any, options: any = {}){
        
        const entries: any = [];
        const oldfieldsArray: Array<any> = Object.keys(oldfields);
        
        Object.keys(fields).forEach((key, pos) => {            
            
            if(oldfields[key] && !_.isEqual(fields[key], oldfields[key])) {                
                const posOldField = oldfieldsArray.findIndex((oldKey) => key === oldKey);
                const fieldMoved = posOldField !== pos;
                entries.push({
                    key,
                    status: fieldMoved ? 'changed and position moved' : 'changed'
                })
            } else 
            if(!oldfields[key]){
                entries.push({
                    key,
                    status: 'new'
                })
            }

        })

        oldfieldsArray.forEach(key => {
            if(!fields[key]) {
                entries.push({
                    key,
                    status: 'deleted'
                })
            }
        })

        if(entries.length){
            entries.forEach(({key, status}: any) => {
                
                if(options.warn || status === 'deleted')
                    console.info(colors.yellow(`  - WARN: Field ${status} | id: ${key}`))
                else{
                    let log = `  - Field ${status}: | id: ${key}`;
                    console.info(log);
                }
                    
            })
        }

    }

    private async parseContentfulFiles(): Promise<boolean>{

        let thereAreChanges: boolean = false;        
        
        const oldFile: any = ParseJsonFiles(path.join(this.differenceContentPath, this.envBase+'.json')); 
        const newFile: any = ParseJsonFiles(path.join(this.differenceContentPath, this.envCompare+'.json'));             
        
        _.forEach(newFile, (value: string, type:string) => {
            //validate type
            if((type !== "webhooks" && type !== "roles") && (this.validTypes.length === 0 || this.validTypes.includes(type))) {

            console.info(`
------------------------------
    Verifying  ${type}
------------------------------
            `);

            this.newMigrationFile[type] = [];
            this.totalEntitites[type] = 0;

            _.forEach(newFile[type], (newModel: ContentTypeModelStructure) => {
                
                if(newModel.sys?.id && (!this.validIds.length || ((!this.entriesIds.length && !this.ignoreEntries) || this.validIds.includes(newModel.sys.id)))){
                    console.info(newModel.sys?.id);

                    let result = type === "editorInterfaces"
                        ? oldFile[type].findIndex((o: {sys: any}) => o.sys.contentType?.sys?.id === newModel.sys?.contentType?.sys?.id )
                        : oldFile[type].findIndex((o: {sys: any}) => o.sys.id == newModel.sys?.id );
                    
                    if(result > -1){

                        const oldModel: ContentTypeModelStructure = oldFile[type][result];

                        if(type === "editorInterfaces") {

                            if(newModel.sys.updatedAt && newModel.sys.updatedAt > oldModel.sys.updatedAt) { 
                                console.info(`⦿ Old version updated at ${oldModel.sys.updatedAt} - New Version updated at ${newModel.sys.updatedAt} | Content-type: ${newModel.sys.contentType.sys.id}`);
                                thereAreChanges = true;
                                this.totalEntitites[type]++;
                                this.newMigrationFile[type].push(newModel);
                            } else
                            if(newModel.sys.updatedAt < oldModel.sys.updatedAt)
                                console.info(colors.yellow(`* "${this.envBase}" version is ${oldModel.sys.updatedAt} - "${this.envCompare}" version is ${newModel.sys.updatedAt} | Content-type id: ${newModel.sys.contentType.sys.id}`));                            

                        } else {

                            if(newModel.sys.publishedVersion && newModel.sys.publishedVersion > oldModel.sys.publishedVersion){
                                if(newModel.sys.id) {
                                    
                                    if(type === 'entries') {
                                        console.info(`⦿ Entry Updated | Content-type: ${newModel.sys.contentType.sys.id} | id: ${newModel.sys.id}  | Versions: (old ${oldModel.sys.publishedVersion || oldModel.sys.updatedAt} - new ${newModel.sys.publishedVersion || newModel.sys.updatedAt})`);                                        
                                        this.showEntriesDiff(newModel.fields, oldModel.fields);
                                    }else {
                                        console.info(`⦿ Updated | id: ${newModel.sys.id} | Versions: (old ${oldModel.sys.publishedVersion || oldModel.sys.updatedAt} - new ${newModel.sys.publishedVersion || newModel.sys.updatedAt})`);                                        
                                    }
                                } else {
                                    console.info(`Name: ${newModel.name} | displayField: ${newModel.displayField} | Fields: ${newModel.fields ? newModel.fields.length : 0} | Versions: (old ${oldModel.sys.publishedVersion || oldModel.sys.updatedAt} - new ${newModel.sys.publishedVersion || newModel.sys.updatedAt})`);
                                }
                                
                                thereAreChanges = true;
                                this.totalEntitites[type]++;

                                if(type === "contentTypes") {
                                    this.verifyIsModelHasDifferenceStructure(newModel, oldModel);
                                }
                                    
                                this.newMigrationFile[type].push(newModel);

                            }else
                            if(newModel.sys.publishedVersion < oldModel.sys.publishedVersion) {
                                if(type === 'entries') {
                                    console.info(colors.yellow(`⦿ ${newModel.sys.type} up | Content-type: ${newModel.sys.contentType.sys.id} | id: ${newModel.sys.id} | "${this.envBase}" v: ${oldModel.sys.publishedVersion} > "${this.envCompare}" v: ${newModel.sys.publishedVersion}`));
                                    this.showEntriesDiff(oldModel.fields, newModel.fields, {warn: true});
                                }else {
                                    console.info(colors.yellow(`⦿ ${newModel.sys.type} up | id: ${newModel.sys.id} | "${this.envBase}" v: ${oldModel.sys.publishedVersion} > "${this.envCompare}" v: ${newModel.sys.publishedVersion}`));
                                }                                
                            }
                                
                        }

                    }else{  

                        if(type === "entries") {
                            console.info(`⦿ New ${type} schema | Content-type: ${newModel.sys.contentType.sys.id} | id: ${newModel.sys.id}`)
                        }else {
                            console.info(`⦿ New ${newModel.sys.type} schema | id: ${newModel.sys.id}`);
                        }                        
                        
                        thereAreChanges = true;
                        this.totalEntitites[type]++;
                        this.newMigrationFile[type].push(newModel);
                    }

                } 
                
            });

            if(this.totalEntitites[type] == 0) {
                console.info("No changes");                
            }             
        }       
            
        });   


        if(this.forceUpdateContentTypesAndEntries) {
            const contentTypesToDelete: Array<string> = [];
            const entriesToDelete: Array<string> = [];
            _.forEach(oldFile["contentTypes"], (oldModel: ContentTypeModelStructure, pos: number) => {
                const contentTypeNotExists = newFile["contentTypes"].findIndex((o: {sys: any}) => o.sys.id == oldModel.sys.id ) === -1;

                if(contentTypeNotExists) {  
                    const contentTypeId = oldModel.sys.id;
                    thereAreChanges = true;
                    contentTypesToDelete.push(contentTypeId);
                    this.migrationActions.push({
                        contentTypeAction: "delete",
                        contentTypeName: contentTypeId                        
                    })
                }
            })

            console.info(`
------------------------------
    Content Modules to delete 
------------------------------
total: ${contentTypesToDelete.length}
list:
- ${contentTypesToDelete.join("\n - ")}
            `);

            _.forEach(oldFile["entries"], (oldModel: ContentTypeModelStructure, pos: number) => {
                const contentTypeNotExists = contentTypesToDelete.findIndex((coid:string) => coid === oldModel.sys.contentType.sys.id ) === -1;
                if(contentTypeNotExists) {
                    const entryNotExists = newFile["entries"].findIndex((o: {sys: any}) => o.sys.id == oldModel.sys.id ) === -1;

                    if(entryNotExists) {  
                        thereAreChanges = true;
                        entriesToDelete.push(`id: ${oldModel.sys.id} | contentType: ${oldModel.sys?.contentType?.sys?.id}`)
                        this.migrationActions.push({
                            contentTypeAction: "delete",
                            contentTypeName: oldModel.sys.id,
                            entryAction: 'delete',
                            entryId: oldModel.sys.id
                        })
                    }
                }                
            })

            console.info(`
------------------------------
    Entries to delete 
------------------------------
total: ${entriesToDelete.length}
list:
- ${entriesToDelete.join("\n - ")}
            `);
        }

        if(!thereAreChanges){ 
            return true;
        } else {

            if(this.migrationActions.length > 0) {
                WriteJsonFile(path.resolve(__dirname, '../differenceContent', 'migrationContent.json'), {migrationActions: this.migrationActions})
                if(!this.runMigration)
                    this.runMigration = true;
            }        

            await this.mergeContentDifference(thereAreChanges);
            return true;
        }        

    }

    private async importFiles (): Promise<void> {

        if (!fs.existsSync(this.differenceContentPath)){
            fs.mkdirSync(this.differenceContentPath);
        }

        if(!this.useCurrentDifferenceContent) {
            this.importFilesFromContentful(this.envCompare, this.envCompare+'.json');
            this.importFilesFromContentful(this.envBase, this.envBase+'.json');
        }
        
        await this.parseContentfulFiles();
    }

    async start(): Promise<boolean> {

        if(this.mergeOnlyDiff) { 
            console.info(colors.green("Show only diff"))
        }
        try{
            await this.importFiles();
            return true;
        }catch(e) {
            console.error(e);
            return false;
        }
                
    }

}