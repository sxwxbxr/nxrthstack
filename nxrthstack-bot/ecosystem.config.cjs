module.exports = {
  apps: [
    {
      name: 'nxrthstack-bot',
      script: 'dist/index.js',
      cwd: 'D:/Projects/nxrthstack/nxrthstack-bot',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
      },
      // Logging
      error_file: 'logs/error.log',
      out_file: 'logs/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // Restart policy
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
