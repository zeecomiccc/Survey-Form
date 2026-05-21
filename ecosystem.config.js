module.exports = {
  apps: [
    {
      name: 'survey-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      // Restart if the process exits or becomes unresponsive
      autorestart: true,
      max_restarts: 50,
      min_uptime: '10s',
      restart_delay: 5000,
      // Restart if memory grows too large (common cause of silent hangs)
      max_memory_restart: '512M',
      // Log rotation — check these when the app "stops"
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
