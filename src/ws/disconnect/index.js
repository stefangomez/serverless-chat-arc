let arc = require('@architect/functions');

/**
 * used to clean up event.requestContext.connectionId
 */
exports.handler = async function ws(event, other) {
  console.log('ws-disconnect called with', event);
  console.log('ws-disconnect called with other', other);
  let connectionId = event.requestContext.connectionId;

  let data = await arc.tables();

  let queryResp = await data.chatapp.query({
    IndexName: 'GSI',
    KeyConditionExpression: 'sortKey = :sortKey',
    ExpressionAttributeValues: { ':sortKey': `listeners#${connectionId}` },
  });
  console.log('queryResp', queryResp);
  queryResp?.Items.forEach(async dbObj => {
    await data.chatapp.delete({ id: dbObj.id, sortKey: dbObj.sortKey });
  });

  return { statusCode: 200 };
};
