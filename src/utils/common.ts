
import fs from 'fs';

export function WriteJsonFile(filePath:string, jsonData: any) { 
  fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
}

export function ParseJsonFiles(filePath: string): any {
  const jsonFile = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(jsonFile);
}

export function KeysNeeded(opts: any) {
  if(!opts['spaceId'] || !opts['cmaToken'])
    throw new Error("Credentials required | declare `Global CMS and Space ID` or use cont <Command(s)> --space-id=<SPACE_ID> --cma-token=<CMA_TOKEN>");
}

export function RlCommand(rl: any, question: string){
  return new Promise<string>((resolve, reject) => {
    return rl.question(question, (answer:string) => resolve(answer))
  })
}

export function parseOptionsList(ids: string): any {
  try {
    return ids.split(',');
  } catch (e) {
    console.error(e);
    throw new Error("Invalid content type ids structure, expected  --content-type-ids=contentType1,contentType2")
  }
}



