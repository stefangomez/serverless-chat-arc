let arc = require('@architect/functions');

/**
 * notes:
 * - verify event.headers.Origin to enforce same-origin
 * - non 200 response will disconnect the client socket
 */
exports.handler = async function ws(event) {
  console.log('ws-connect called with', event);
  let connectionId = event.requestContext.connectionId;
  let roomId = event.queryStringParameters?.roomId || 'default';
  let createdAt = new Date();

  let data = await arc.tables();
  await data.chatapp.put({
    id: `room#${roomId}`,
    sortKey: `listeners#${connectionId}`,
    connectionId,
    createdAt: createdAt.toISOString(),
  });
  return { statusCode: 200 };
};
