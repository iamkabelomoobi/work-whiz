/* eslint-disable */

import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';

module.exports = async function () {
  // Configure axios for tests to use.
  const host = process.env.HOST ?? '127.0.0.1';
  const port = process.env.PORT ?? '3101';
  const baseURL = `http://${host}:${port}`;

  const stateFile = path.join(process.cwd(), 'e2e/.tmp/auth-e2e-state.json');
  if (fs.existsSync(stateFile)) {
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

    if (state.postgresPort) {
      process.env.POSTGRES_HOST = host;
      process.env.POSTGRES_PORT = String(state.postgresPort);
      process.env.DATABASE_URL = `postgresql://postgres:postgres@${host}:${state.postgresPort}/work_whiz`;
    }

    if (state.redisPort) {
      process.env.REDIS_HOST = host;
      process.env.REDIS_PORT = String(state.redisPort);
      process.env.REDIS_URL = `redis://${host}:${state.redisPort}`;
    }
  }

  process.env.E2E_BASE_URL = baseURL;
  axios.defaults.baseURL = baseURL;
};
