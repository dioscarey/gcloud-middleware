#!/usr/bin/env node
'use strict';

//* modules
import {program} from 'commander';
import {spawnSync} from 'child_process';
//* dependencies
import importContent from './importContent';
import deleteEnvAndCopyFromMaster from './deleteEnvAndCopyForMaster';
import {ImportOptions, DeleteEnvOptions} from './interfaces';
import {KeysNeeded} from './utils/common';

!(async () => {

  let opts: any = {};

  program
    .storeOptionsAsProperties(false)
    .passCommandToAction(false)
    
  program
    .name("cont")
    .usage('[command] [options]')
    .option('-v, --version', 'Version')
    .action((options) =>  {
      if(options.version) {
        const ver = spawnSync('npm', ['info', '@a3labs/contentful', 'version'], {
          encoding : 'utf8',
        });
        console.log(ver.stdout)      
      } 
    })

  program  
    .command("merge")
    .usage("[--from, env] [--to, env] [--space-id] [--cma-token]")
    .description('Merge Contentful content from branch to another branch')
    .requiredOption('-f, --from <env>', 'Environemnt Ex. -f dev')
    .requiredOption('-t, --to <env>', 'Environemnt Ex. -t master')
    .option('--space-id <id>', 'Contentful Space Id')
    .option('--cma-token <id>', 'Contentful CMA Token')  
    .option('--skip-questions', 'Skip any question')
    .option('--use-current-difference-content', 'Use contents already imported from Contentful')
    .option('--force-update-content-types-and-entries', 'If you delete a content type or entry will be removed from --env-base branch')
    .action((options) => { // <--- passed options, not Command
      opts = options
    });

  program  
    .command("diff")
    .usage("[--from, branch] [--to, branch] [--space-id] [--cma-token]")
    .description('It deletes a branch if exists and creates a copy from master.')
    .requiredOption('-f, --from <env>', 'Environemnt Ex. -f dev')
    .requiredOption('-t, --to <env>', 'Environemnt Ex. -t master')
    .option('--space-id <id>', 'Contentful Space Id')
    .option('--cma-token <id>', 'Contentful CMA Token')
    .option('--use-current-difference-content', 'Use contents already imported from Contentful')
    .option('--force-update-content-types-and-entries', 'If you delete a content type or entry will be removed from --env-base branch')
    .action((options) => { // <--- passed options, not Command
      opts = options
    });

  program  
    .command("newEnv")
    .alias("new")
    .alias("update")
    .usage("[--env] [--space-id] [--cma-token]")
    .description('It deletes an branch if exists and creates a copy from master.')
    .requiredOption('-e, --env <env>', 'Environemnt Ex. -f dev')
    .option('--space-id <id>', 'Contentful Space Id')
    .option('--cma-token <id>', 'Contentful CMA Token')
    .action((options) => { // <--- passed options, not Command
      opts = options
    });

  program  
    .command("delete")
    .usage("[--env, branch] [--space-id] [--cma-token]")
    .description('It deletes a branch if exists.')
    .requiredOption('-e, --env <env>', 'Environemnt Ex. -f test')
    .option('--space-id <id>', 'Contentful Space Id')
    .option('--cma-token <id>', 'Contentful CMA Token')
    .action((options) => { // <--- passed options, not Command
      opts = options
    });

  program  
    .command("info")
    .description('Info.')
    .action((options) => { // <--- passed options, not Command
      opts = options
    });

  program.parse(process.argv);

  try {

    const {CONTENTFUL_CMS, CONTENTFUL_SPACE_ID} = process.env;

    opts['cmaToken'] = opts['cmaToken'] || CONTENTFUL_CMS || null;
    opts['spaceId'] = opts['spaceId'] || CONTENTFUL_SPACE_ID || null;

    if(program.args[0] === "info") {
      console.info("CONTENTFUL_CMS: ",CONTENTFUL_CMS  || '--');
      console.info("CONTENTFUL_SPACE_ID: ",CONTENTFUL_SPACE_ID  || '--');
      process.exit();
    } else 
    if(program.args[0] === "merge") {

      KeysNeeded(opts);
      console.info(opts);

      const compareEnv: ImportOptions = {
        envBase: opts['to'],
        envCompare: opts['from'],
        spaceId: opts['spaceId'],
        cmaToken: opts['cmaToken'],
        skipQuestions: !!opts['skipQuestions'],
        useCurrentDifferenceContent: !!opts['useCurrentDifferenceContent'],
        forceUpdateContentTypesAndEntries: !!opts['forceUpdateContentTypesAndEntries']
      }

      const icft = new importContent(compareEnv);
      const icftResult = await icft.start();
      if(icftResult) {
        process.exit();
      } else {
        console.error("Something went wrong")
      }
      
    }else
    if(program.args[0] === "diff") {

      KeysNeeded(opts);
      console.info(opts);
      
      const compareEnv: ImportOptions = {
        envBase: opts['to'],
        envCompare: opts['from'],
        spaceId: opts['spaceId'],
        cmaToken: opts['cmaToken'],
        onlyDiff: true,
        useCurrentDifferenceContent: !!opts['useCurrentDifferenceContent'],
        forceUpdateContentTypesAndEntries: !!opts['forceUpdateContentTypesAndEntries']
      }

      const icft = new importContent(compareEnv);
      icft.start();
      
    }else
    if(program.args[0] === "newEnv" || program.args[0] === "new" || program.args[0] === "update") {

      KeysNeeded(opts);
      console.info(opts);

      if(!opts['env'])
        throw new Error("[-e, --env] params needed!" )

      const deleteEnvOptions: DeleteEnvOptions ={
        enviornmentBase: opts['env'],
        spaceId: opts['spaceId'],
        cmaToken: opts['cmaToken'],
      }

      const deacfm = new deleteEnvAndCopyFromMaster(deleteEnvOptions);
      const deacfmResult = deacfm.askBeforeCreateCopy();
      if(deacfmResult) {
        process.exit();
      }else {
        console.error("Something went wrong!");
      }

    }else
    if(program.args[0] === "delete") {

      KeysNeeded(opts);
      console.info(opts);

      if(opts['env'].toLowerCase() === "master") {
        throw new Error('You cannot delete Master enviorment')
      }

      const deleteEnvOptions: DeleteEnvOptions = {
        enviornmentBase: opts['env'],
        spaceId: opts['spaceId'],
        cmaToken: opts['cmaToken'],
      }

      const deacfm = new deleteEnvAndCopyFromMaster(deleteEnvOptions);
      const result = await deacfm.deleteEnv();
      if(result) {
        process.exit();
      }else {
        console.error("Something went wrong!");
      }

    } else {

      const h = spawnSync('cont', ['--help'], {
        encoding : 'utf8',
      }); 
      console.log(h.stdout)      

      process.exit();
    }
  } catch(error) {
    console.error({error})
    process.exit();
  }

})();