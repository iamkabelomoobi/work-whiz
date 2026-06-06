/* eslint-disable */
const fs = require('node:fs');
const path = require('node:path');

const STATE_FILE = path.join(process.cwd(), 'e2e/.tmp/auth-e2e-state.json');

module.exports = async function () {
  if (!fs.existsSync(STATE_FILE)) {
    console.log('\nTearing down...\n');
    return;
  }

  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

  for (const pid of [state.serverPid, state.maildevPid]) {
    if (!pid) continue;

    try {
      process.kill(pid, 'SIGTERM');
    } catch (error) {
      // ignore missing processes
    }
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  for (const pid of [state.serverPid, state.maildevPid]) {
    if (!pid) continue;

    try {
      process.kill(pid, 0);
      process.kill(pid, 'SIGKILL');
    } catch (error) {
      // ignore missing processes
    }
  }

  fs.unlinkSync(STATE_FILE);
  console.log('\nTearing down...\n');
};

export {};
