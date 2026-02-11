module.exports = {
  apps: [
    {
      name: "minecraft-agent",
      script: "dist/index.js",
      env: {
        NODE_ENV: "production",
      },
      restart_delay: 5000,
      max_restarts: 10,
      exp_backoff_restart_delay: 100,
    },
  ],
};
