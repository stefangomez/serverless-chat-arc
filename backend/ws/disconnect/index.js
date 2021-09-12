let arc = require('@architect/functions');

/**
 * used to clean up event.requestContext.connectionId
 */

const sendLeaveMessages = async (messageId, connectionId, roomId, leftUsername) => {
  let data = await arc.tables();
  let queryResp = await data.chatapp.query({
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: { ':id': `room#${roomId}` },
  });
  console.log('queryResp', queryResp);
  const connections = queryResp?.Items || [];
  const timestamp = new Date().getTime();
  await Promise.all(
    connections.map(async conn => {
      try {
        const res = await arc.ws.send({
          id: conn.connectionId,
          payload: {
            numUsers: connections.length,
            messageId,
            type: 'user_leave',
            text: `${leftUsername} left the room`,
            sender: leftUsername,
            roomId,
            sentAt: timestamp,
            serverReceivedAt: timestamp,
            connectionId,
          },
        });
        return res;
      } catch (e) {
        console.log(`error sending message to connectionId: ${connectionId}`);
        console.log(e);
        await data.chatapp.delete({ id: conn.id, sortKey: conn.sortKey });

        return null;
      }
    })
  );
};
exports.handler = async function ws(event, other) {
  console.log('ws-disconnect called with', event);
  console.log('ws-disconnect called with other', other);
  let connectionId = event.requestContext.connectionId;
  let messageId = event.requestContext.messageId || event.requestContext.requestId;

  let data = await arc.tables();

  let queryResp = await data.chatapp.query({
    IndexName: 'GSI',
    KeyConditionExpression: 'sortKey = :sortKey',
    ExpressionAttributeValues: { ':sortKey': `listeners#${connectionId}` },
  });
  console.log('queryResp', queryResp);
  queryResp?.Items.forEach(async dbObj => {
    await data.chatapp.delete({ id: dbObj.id, sortKey: dbObj.sortKey });
    await sendLeaveMessages(messageId, connectionId, dbObj.id.split('room#')[1], dbObj.username || dbObj.connectionId);
  });

  return { statusCode: 200 };
};
