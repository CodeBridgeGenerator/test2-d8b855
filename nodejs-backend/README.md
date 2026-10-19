# Getting Started with Code Bridge App

Getting started 

## Option 1

1. Download and install Docker
2. run docker composer up

## Option 2

### Downlaod and Install
1. node version > 22
2. git scm lts
3. Enable Ubuntu for WSL
4. Enable Powershell scripting
5. MongoDB Community 8 
6. MongoDB Compass
7. VS Code Lts

### Commands to Run
1. Set your temp password for mailServer in .env_example

2. Install your dependencies

    ```
    cd path/to/project
    npm run launch
    ```

3. Start your app

    ```
    npm run launch
    ```

    or with [nodemon](https://www.npmjs.com/package/nodemon) script monitoring tool

    ```
    npm run dev
    ```

## Testing

Simply run `npm test` and all your tests in the `test/` directory will be run.

## Help

For more information about Code Bridge visit our [website](https://codebridge.my/).  
For more information on all the things you can do with Feathers visit the [Feathers Docs](https://crow.docs.feathersjs.com/api/).

## Running on with PM2

pm2 status
pm2 restart ecosystem.config.js --env production
pm2 restart ecosystem.config.js --env stg
