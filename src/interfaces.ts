// ---------------
//* Merge env Options
export interface ImportOptions {
  envBase: string,
  envCompare: string,  
  spaceId: string,
  cmaToken: string,
  onlyDiff?:boolean,
  skipQuestions?: boolean,
  useCurrentDifferenceContent?: boolean
  forceUpdateContentTypesAndEntries?: boolean
}

// ---------------
//* Delete env Options
export interface DeleteEnvOptions {
  enviornmentBase: string,
  spaceId: string,
  cmaToken: string
  skipQuestions?: boolean
}

// ---------------
//* Content Type Structure
export interface ContentTypeFieldStructure {
  id: string,
  name: string,
  type: string,
  localized: boolean,
  required: boolean,
  validations: any,
  disabled: boolean,
  omitted: boolean,
  items?: any
  linkType?: string
}

export interface ContentTypeSysSctructure {
  id: string,
  type: string,
  name: string,
  description: string,
  updatedAt: string,
  publishedVersion: string,
  space?: string
  contentType?: any,
  fields?: any
}

export interface ContentTypeModelStructure {
  sys: ContentTypeSysSctructure,
  displayField: string,
  name: string,
  fields: Array<ContentTypeFieldStructure>
}

// ---------------
//* Migration Structure

export interface MigrationAction {
  contentTypeAction: string,
  contentTypeName: string,
  fieldId?:string,
  fieldAction?: string,
  fieldName?: string,
  entryAction?: string,
  entryId?: string,
}