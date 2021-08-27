let arc = require('@architect/functions');

/**
 * append a timestamp and echo the message back to the connectionId
 */
exports.handler = async function ws(event) {
  console.log('ws-default called with', event);

  let timestamp = new Date().getTime();
  let connectionId = event.requestContext.connectionId;
  let messageId = event.requestContext.messageId;
  let message = JSON.parse(event.body);
  let roomId = message.roomId || 'default';
  let sentAt = message.sentAt || timestamp;
  // let text = `${timestamp} - Echoing ${message.text}`
  let data = await arc.tables();
  let queryResp = await data.chatapp.query({
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: { ':id': `room#${roomId}` },
  });
  console.log('queryResp', queryResp);
  queryResp?.Items.forEach(async dbObj => {
    try {
      await arc.ws.send({
        id: dbObj.connectionId,
        payload: { messageId, text: message.text, sender: connectionId, roomId, sentAt, serverReceivedAt: timestamp },
      });
    } catch (e) {
      console.log(`error sending message to connectionId: ${connectionId}`);
      console.log(e);
    }
  });

  return { statusCode: 200 };
};
