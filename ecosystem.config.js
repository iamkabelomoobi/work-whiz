module.exports = {
  apps : [{
    script: 'index.js',
    watch: '.'
  }, {
    script: './service-worker/',
    watch: ['./service-worker']
  }],

  deploy : {
    production : {
      user : process.env.SSH_USERNAME,
      host : process.env.SSH_HOST,
      ref  : 'origin/master',
      repo : process.env.GIT_REPO,
      path : process.env.DEPLOY_PATH,
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};