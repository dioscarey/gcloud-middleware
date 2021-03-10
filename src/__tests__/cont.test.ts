'use strict';

//* dependencies
import importContent from '../importContent';
import deleteEnvAndCopyFromMaster from '../deleteEnvAndCopyForMaster';
import {ImportOptions, DeleteEnvOptions} from '../interfaces';
import {KeysNeeded} from '../utils/common';

const credentials: any = {};

credentials['cmaToken'] = process.env.CONTENTFUL_CMS || null;
credentials['spaceId'] = process.env.CONTENTFUL_SPACE_ID || null;
console.log(credentials)

test('Create new enviornment: testJest', async () => {
  const opts: any = {
    enviornmentBase: 'testJest',
    ...credentials
  }

  KeysNeeded(opts);

  const deleteEnvOptions: DeleteEnvOptions = {
    enviornmentBase: opts['enviornmentBase'],
    spaceId: opts['spaceId'],
    cmaToken: opts['cmaToken'],
    skipQuestions: true
  }

  const deacfm = new deleteEnvAndCopyFromMaster(deleteEnvOptions);
  await deacfm.askBeforeCreateCopy();

});

test('Create new enviornment: testJestTwo', async () => {
  const opts: any = {
    enviornmentBase: 'testJestTwo',
    ...credentials
  }

  KeysNeeded(opts);

  const deleteEnvOptions: DeleteEnvOptions = {
    enviornmentBase: opts['enviornmentBase'],
    spaceId: opts['spaceId'],
    cmaToken: opts['cmaToken'],
    skipQuestions: true
  }

  const deacfm = new deleteEnvAndCopyFromMaster(deleteEnvOptions);
  await deacfm.askBeforeCreateCopy();

});

test("Merge from testJestTwo to testJest", async () => {
  const opts: any = {
    skipQuestions: true,
    forceUpdateContentTypesAndEntries: true,
    from: "testJestTwo",
    to: "testJest",
    ...credentials
  }

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
    console.info("Done!");
  } else {
    console.error("Something went wrong")
  }
})

test('Delete enviornment: testJest', async () => {
  const opts: any = {
    enviornmentBase: 'testJest',
    skipQuestions: true,
    ...credentials
  }

  KeysNeeded(opts);

  const deleteEnvOptions: DeleteEnvOptions = {
    enviornmentBase: opts['enviornmentBase'],
    ...credentials
  }

  const deacfm = new deleteEnvAndCopyFromMaster(deleteEnvOptions);
  const result = await deacfm.deleteEnv();
  expect(result).toEqual(true);

});

test('Delete enviornment: testJestTwo', async () => {
  const opts: any = {
    enviornmentBase: 'testJestTwo',
    skipQuestions: true,
    ...credentials
  }

  KeysNeeded(opts);

  const deleteEnvOptions: DeleteEnvOptions = {
    enviornmentBase: opts['enviornmentBase'],
    ...credentials
  }

  const deacfm = new deleteEnvAndCopyFromMaster(deleteEnvOptions);
  const result = await deacfm.deleteEnv();
  expect(result).toEqual(true);

});