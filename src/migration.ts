
import fs from 'fs';
import path from 'path';
import Migration, {MigrationContext } from 'contentful-migration'
import {MigrationAction} from './interfaces'

const jsonFile = fs.readFileSync(path.join(__dirname, '../differenceContent/migrationContent.json'), 'utf8');
const {migrationActions} = JSON.parse(jsonFile);

export = async function (migration: Migration, context: MigrationContext) {
  if(migrationActions && migrationActions.length) {
    for( let mat = 0; mat < migrationActions.length; mat++ ){

      const contentType: MigrationAction = migrationActions[mat];
      let ct: any;
      if(contentType.contentTypeAction === "delete") { 
        if(contentType.entryAction === "delete") {

          console.info("Entry to delete -> ", contentType.entryId)
          try {
            await context.makeRequest({
              method:'DELETE',
              url: `entries/${contentType.entryId}/published`
            });
            console.info("Entry unpublished | ",contentType.entryId)
          }catch(e) {
            console.info("Unable to unpblish")
          }
        
          try {
            await context.makeRequest({
              method:'DELETE',
              url: `entries/${contentType.entryId}`
            });
            console.info("Entry deleted | ",contentType.entryId)
          }catch(e) {
            console.info("Unable to delete")
          }

        } else {

          const resp = await context.makeRequest({
            method:'GET',
            url: `/entries?content_type=${contentType.contentTypeName}&limit=1000`
          })

          if(resp.items.length > 0) {
            for (let i = 0; i <resp.items.length; i++) {            
              const entryId = resp.items[i].sys.id;

              console.info("Entry to delete -> ",entryId)
              try {
                await context.makeRequest({
                  method:'DELETE',
                  url: `entries/${entryId}/published`
                });
              }catch(e) {
                console.info("Unable to unpblish")
              }
            
              try {
                await context.makeRequest({
                  method:'DELETE',
                  url: `entries/${entryId}`
                });
              }catch(e) {
                console.info("Unable to delete")
              }
              
            }
          }          
          migration.deleteContentType(contentType.contentTypeName)
        }        
      }else 
      if(contentType.contentTypeAction === "edit") {
        ct = migration.editContentType(contentType.contentTypeName);
        if(contentType.fieldAction == "delete"){
          ct.deleteField(contentType.fieldId);       
        }
      }
    }          
  } 
}
