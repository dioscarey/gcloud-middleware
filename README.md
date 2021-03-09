# Install

`` 
npm i -g contentful-migrate-content
``

# @a3labs/contentful Package

[https://github.com/processway/contentful-migrate-content](https://github.com/processway/contentful-migrate-content)

# Access

``   
  echo "CONTENTFUL_CMS=<CMS-TOKEN>" >> ~/.bash_profile
`` 

`` 
  echo "CONTENTFUL_SPACE_ID=<SPACE-ID>" >> ~/.bash_profile
`` 
# Merge branches.

If you want to see only the difference of the content branches, run the following command:

`` 
cont diff --from <BRANCH> --to <BRANCH> --space-id <SPACE-ID> --cma-token <CMA-TOKEN>``
``

To merge a branch, run:

`` 
cont merge --from <BRANCH> --to <BRANCH> --space-id <SPACE-ID> --cma-token <CMA-TOKEN>``
``

# Create a new branch from Master.

`` 
cont new --env test --space-id <SPACE-ID> --cma-token <CMA-TOKEN>`` 
``

**IMPORTANT!**
Once you create a new enviorment you need to give access for the new branch in the Api Key settings (You need to be authorized to make this change).

# How the merge works.

The content-cli was created by the Process Way team supported with  multiple Contentful cli's, you should try to fully understand how the process works.

The main file is called **importContent.ts**

The process is as follows:

## First step:

We import all the Contentful content in a JSON file. Then, we will get two files, master.json and dev.json file.

## Second step:

We compare the content of the previous version (master.json) with the content of the new version (dev.json). If the new content version is ahead, we extract the entire JSON schema that contains all the new changes.

## Third step:

After having the schema of the new version, we create a new file called diffcontent.json, which it contains the new JSON schema with the most recent changes.

## Fourth step:

We export all the changes (diffcontent.json) to the Master branch.

## Last step:

After the new content is exported to Master, we synchronize all the changes made in Master to have the latest versions in Dev branch. 

# a3labs Contentful CLI

### Usage

### cont info
`` cont help`` 

### Merge from Contentful branch to another branch
`` cont merge --from dev --to master --space-id <SPACE-ID> --cma-token <CMA-TOKEN>`` 

| Option  | Description  |
|---|---|
| --skip-questions | Skip any question. |
| --use-current-difference-content | Use the schema already imported from Contentful. |
| --force-update-content-types-and-entries | It removes Content Types and Entries. |


### Create new branch from Master
`` cont new --env <Enviornment> --space-id <SPACE-ID> --cma-token <CMA-TOKEN>`` 

#### Important!

Once you create a new enviorment you need to give access for the new branch in the Api Key settings (You need yp be authorized to make this change).

### Delete branch
`` cont delete --env <Enviornment> --space-id <SPACE-ID> --cma-token <CMA-TOKEN>`` 

### Differences between branches
`` cont diff --from dev --to master --space-id <SPACE-ID> --cma-token <CMA-TOKEN>`` 

| Option  | Description  |
|---|---|
| --use-current-difference-content | Use the schema already imported from Contentful. |
| --force-update-content-types-and-entries | It removes Content Types and Entries. |