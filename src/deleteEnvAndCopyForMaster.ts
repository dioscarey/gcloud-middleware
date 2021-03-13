
import readline from 'readline';
import colors from "colors";

import {DeleteEnvOptions} from './interfaces'
import {RlCommand} from './utils/common';

const { createClient } = require('contentful-management');

const NODENEV = process.env.NODE_ENV

const rl = NODENEV === 'test' ? null : readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

export default class deleteEnvAndCopyFromMaster {
  private DELAY: number = 3000;
  private MAX_NUMBER_OF_TRIES: number = 10;
  private enviornmentBase: string
  private cmaToken: string
  private spaceId: string
  private skipQuestions: boolean

  constructor(options: DeleteEnvOptions) {
    this.cmaToken = options.cmaToken
    this.spaceId = options.spaceId
    this.enviornmentBase = options.enviornmentBase;
    this.skipQuestions = !!options.skipQuestions;
  }

  private async runCopy(options: any): Promise<boolean> {
  
    try { 
  
      const client = await createClient({
          accessToken: this.cmaToken
        });
  
      const space = await client.getSpace(this.spaceId);
  
      let environment;
      console.info('Running with the following configuration');
      console.info(`SPACE_ID: ${this.spaceId}`);
      console.info(`ENVIRONMENT_ID_TO_CREATE: ${this.enviornmentBase}`);
  
      // ---------------------------------------------------------------------------
      console.info(`Checking for existing versions of environment: ${this.enviornmentBase}`);
  
      try {
        environment = await space.getEnvironment(this.enviornmentBase);
        if(environment){
          await environment.delete();
          console.info('Environment deleted');        
          if(options && options.delete) {
            return true;
          }
        }                                      
  
      } catch(e) {
        environment = null;
        if(NODENEV !== 'test')
          console.error(colors.yellow('Environment not found'));
      }    

      if(environment || (options && options.forceCreateEnvironment))
      console.info(`Creating environment ${this.enviornmentBase}`);
      environment = await space.createEnvironmentWithId(this.enviornmentBase, { name: this.enviornmentBase });

      // ---------------------------------------------------------------------------
      
      let count: number = 0;
      console.info('Waiting for environment processing...');
  
      while (count < this.MAX_NUMBER_OF_TRIES) {
        const status = (await space.getEnvironment(environment.sys?.id)).sys.status?.sys?.id;
  
        if (status === 'ready' || status === 'failed') {
          if (status === 'ready') {
            console.info(`Successfully processed new environment (${this.enviornmentBase})`);
          } else {
            console.info('Environment creation failed');
          }
          break;
        }
        console.info('Still waiting...');
        await new Promise(resolve => setTimeout(resolve, this.DELAY));
        count++;
      }    
      
      console.info(colors.green("Completed!"))
      if(NODENEV !== 'test') {
        process.exit();
      }
      return true;
    } catch(e) {
      console.error(e);    
      return false;
    }

  }

  private async continueDeleteEnv(answer: string) {
    if(/y|Y/.test(answer)){
      try {
        await this.start({
          forceCreateEnvironment: true
        });          
        return true;
      }catch(e) {
        console.error(e);
        return false;
      }
    }

    if(rl)
      rl.close();

    return true;
  }


  async start(options: any = {}){

    if(!this.enviornmentBase)
      throw new Error(" No ENVIRONMENT_ID_TO_CREATE declared. Ej ENVIRONMENT_ID_TO_CREATE='dev'");
  
    console.info("Creating new Environment from Master");
    return await this.runCopy(options);

  }

  async deleteEnv() : Promise<boolean> {
    const r = await this.runCopy({
      delete: true
    });

    return r;
  }

  async askBeforeCreateCopy () { 

    if(this.skipQuestions) {
      return await this.continueDeleteEnv('Y');
    }else {
      if(rl){
        const answer = await RlCommand(rl, `If you have changes in "${this.enviornmentBase}" environment will be deleted. Do you want to continue (y/n)? `)
        return await this.continueDeleteEnv(answer);
      }
      else  {
        return true;
      }
    }
    
  }

}