const path = require('path');
const cwd = path.basename(path.resolve(process.cwd()));

// How to run pm2
//pm2 start ecosystem.config.js --env prd

module.exports = {
    apps: [
        {
            // name: cwd + "-" + "test2",
            script: 'src/',
            instance_var: 'INSTANCE_ID',
            appendEnvToName: true,
            // Standard Output (console.log) will go here
            //out_file: "/home/ubuntu/app/logs/test2stg-out.log",
            // Error Output (console.error) will go here
            //error_file: "/home/ubuntu/app/logs/test2-stg-error.log",
            // Optional: Add a date prefix to your logs
            //log_date_format: "YYYY-MM-DD HH:mm:ss Z",

            env_prd: {
                NODE_ENV: 'prd'
            },
            env_stg: {
                NODE_ENV: 'stg'
            },
            env_uat: {
                NODE_ENV: 'uat'
            },
            env_sit: {
                NODE_ENV: 'sit'
            }
        }
    ]
};
