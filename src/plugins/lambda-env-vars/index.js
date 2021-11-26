const { toLogicalID } = require('@architect/utils');

module.exports = {
  package: function ({ arc, cloudformation: cfn, stage = 'staging', inventory, createFunction }) {
    const lambdaEnvVars = arc['lambda-env-vars'] || [{}];
    const { tables } = lambdaEnvVars[0] || {};
    const envVarsToAdd = {};
    if (tables) {
      Object.keys(tables).forEach(tableName => {
        const envVarName = tables[tableName];
        const cfnName = `${toLogicalID(tableName)}Table`;
        envVarsToAdd[envVarName] = { Ref: cfnName };
      });
    }
    // console.log('tables', tables);
    const resourceKeys = Object.keys(cfn.Resources);
    resourceKeys.forEach(key => {
      const resource = cfn.Resources[key];
      if (resource.Type === 'AWS::Serverless::Function') {
        console.log(`processing function ${key}`);
        resource.Properties.Environment = resource.Properties.Environment || { Variables: {} };
        resource.Properties.Environment.Variables = { ...resource.Properties.Environment.Variables, ...envVarsToAdd };
      }
    });
    // console.log(JSON.stringify({ arc, cfn, stage, inventory }, null, 2));
    return cfn;
  },
};
