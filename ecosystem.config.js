module.exports = {
  apps: [
    {
      name: "backend-manutencao",
      script: "dist/server.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      // * .env já é lido pelo dotenv.config() em src/config/env.ts a partir
      // * do `cwd` do processo — o `cwd` acima garante que isso funcione
      // * independente de onde o comando `pm2 start` for executado.
    },
  ],
};
