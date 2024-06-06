module.exports = {
    apps: [
      {
        name: 'backend',
        script: 'src/server.js',
        cwd: '/var/www/WKN/backend',
        watch: true,
        env: {
          NODE_ENV: 'development',
          PORT: 3001
        },
        env_production: {
          NODE_ENV: 'production',
          PORT: 3001
        }
      }
    ]
  };