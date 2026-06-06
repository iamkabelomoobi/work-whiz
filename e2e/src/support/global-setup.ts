/* eslint-disable */
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const axios = require('axios');

const TEST_PORT = 3101;
const TEST_HOST = '127.0.0.1';
const STATE_FILE = path.join(process.cwd(), 'e2e/.tmp/auth-e2e-state.json');
const MAILDEV_BIN = path.join(
  process.cwd(),
  'node_modules/.bin/maildev',
);
const PRISMA_BIN = path.join(
  process.cwd(),
  'node_modules/.bin/prisma',
);
const NODE_BIN = process.execPath;

const isPortOpen = (host: string, port: number): Promise<boolean> =>
  new Promise(resolve => {
    const socket = net.createConnection({ host, port });

    socket.setTimeout(500);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
  });

const resolveServicePort = async (
  host: string,
  candidates: number[],
  serviceName: string,
): Promise<number> => {
  for (const port of candidates) {
    if (await isPortOpen(host, port)) {
      return port;
    }
  }

  throw new Error(
    `No ${serviceName} instance is listening on any of: ${candidates.join(', ')}`,
  );
};

const waitForHealth = async (server: {
  exitCode: number | null;
  signalCode: NodeJS.Signals | null;
}) => {
  const baseURL = `http://${TEST_HOST}:${TEST_PORT}`;

  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(
        `Auth e2e server exited before becoming ready: code=${server.exitCode} signal=${server.signalCode}`,
      );
    }

    try {
      const response = await axios.get(`${baseURL}/health`, {
        validateStatus: () => true,
      });

      if (response.status === 200) {
        return;
      }
    } catch (error) {
      // ignore and retry
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for ${TEST_HOST}:${TEST_PORT}`);
};

const waitForMaildev = async () => {
  const baseURL = 'http://127.0.0.1:1080';

  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await axios.get(`${baseURL}/healthz`, {
        validateStatus: () => true,
      });

      if (response.status === 200) {
        return;
      }
    } catch (error) {
      // ignore and retry
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Timed out waiting for Maildev on 127.0.0.1:1080');
};

module.exports = async function () {
  console.log('\nSetting up...\n');

  const postgresPort = await resolveServicePort(TEST_HOST, [5432, 5433], 'Postgres');
  const redisPort = await resolveServicePort(TEST_HOST, [6379, 6380], 'Redis');

  const runtimeEnv = {
    ...process.env,
    NODE_ENV: 'development',
    HOST: TEST_HOST,
    PORT: String(TEST_PORT),
    BETTER_AUTH_URL: `http://${TEST_HOST}:${TEST_PORT}`,
    POSTGRES_HOST: TEST_HOST,
    POSTGRES_PORT: String(postgresPort),
    DATABASE_URL: `postgresql://postgres:postgres@${TEST_HOST}:${postgresPort}/work_whiz`,
    REDIS_HOST: TEST_HOST,
    REDIS_PORT: String(redisPort),
    REDIS_URL: `redis://${TEST_HOST}:${redisPort}`,
  };

  const migrate = spawnSync(PRISMA_BIN, ['db', 'push', '--force-reset'], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: runtimeEnv,
  });

  if (migrate.status !== 0) {
    throw new Error('Prisma db push failed before auth e2e setup');
  }

  const generate = spawnSync(PRISMA_BIN, ['generate'], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: runtimeEnv,
  });

  if (generate.status !== 0) {
    throw new Error('Prisma generate failed before auth e2e setup');
  }

  const tmpDir = path.dirname(STATE_FILE);
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const maildev = spawn(MAILDEV_BIN, ['--smtp', '1025', '--web', '1080'], {
    cwd: process.cwd(),
    env: {
      ...runtimeEnv,
      NODE_ENV: 'development',
      MAILDEV_HOST: TEST_HOST,
      MAILDEV_PORT: '1025',
    },
    stdio: 'ignore',
    detached: false,
  });

  await waitForMaildev();

  const server = spawn(NODE_BIN, ['dist/work-whiz/main.js'], {
    cwd: process.cwd(),
    env: runtimeEnv,
    stdio: 'ignore',
    detached: false,
  });

  try {
    await waitForHealth(server);
  } catch (error) {
    for (const child of [server, maildev]) {
      if (!child?.pid) continue;

      try {
        child.kill('SIGTERM');
      } catch (_) {
        // ignore
      }
    }

    throw error;
  }

  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify(
      {
        port: TEST_PORT,
        postgresPort,
        redisPort,
        serverPid: server.pid,
        maildevPid: maildev.pid,
      },
      null,
      2,
    ),
  );
};

export {};
