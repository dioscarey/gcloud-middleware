# Install

`` 
npm i -g contentful-migrate-content
``

``
yarn global add contentful-migrate-content
``

# Credentials

To get the CMS-TOKEN go to > Settings > Api Keys > Content management tokens 

``   
  echo "CONTENTFUL_CMS=<CMS-TOKEN>" >> ~/.bash_profile
`` 

`` 
  echo "CONTENTFUL_SPACE_ID=<SPACE-ID>" >> ~/.bash_profile
`` 

or

``   
  echo "CONTENTFUL_CMS=<CMS-TOKEN>" >> ~/.zshrc
`` 

`` 
  echo "CONTENTFUL_SPACE_ID=<SPACE-ID>" >> ~/.zshrc
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
`` cont new --env <Enviornment>`` 

#### Important!

Once you create a new enviorment you need to give access for the new branch in the Api Key settings (You need to be authorized to make this change).

### Delete branch
`` cont delete --env <Enviornment>`` 

### Differences between branches
`` cont diff --from <Env> --to <Env>`` 

| Option  | Description  |
|---|---|
| --use-current-difference-content | Use the schema already imported from Contentful. |
| --force-update-content-types-and-entries | It removes Content Types and Entries. |

### Limitations

- The merge doesn't work as github does. Do the merge only to the main work branch Ex.
You have 2 branches, **master** and **dev**. Only do merge from dev to master, **NO** **master** to **dev** cause you may lose your work progress. 
If you have 3 branches (**master**, **uat** and **dev**), do merge from **dev** to **uat** and then **uat** to **master**. 

There're some pending works to improve.



