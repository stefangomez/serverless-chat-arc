'use strict';
const { exec } = require('child_process');
const fs = require('fs');

const _inventory = require('@architect/inventory');
const { toLogicalID } = require('@architect/utils');

async function cmd() {
  const inventory = await _inventory();
  const { inv } = inventory;
  const appname = inv.app;
  // TODO: get production from env var
  const production = false;
  const stackname = `${toLogicalID(appname)}${production ? 'Production' : 'Staging'}`;
  console.log('stackname', stackname);
  exec(`aws cloudformation describe-stacks --stack-name ${stackname}`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    const stackInfo = JSON.parse(stdout).Stacks[0].Outputs;
    const outputs = Object.fromEntries(stackInfo.map(o => [o.OutputKey, o.OutputValue])) || [];
    const outputsStr = JSON.stringify(outputs);
    console.log('stackOutputs', outputs);
    fs.writeFileSync('webapp/src/app-config.json', outputsStr);
    fs.writeFileSync('mobile-app/app-config.json', outputsStr);
  });
}

cmd();
