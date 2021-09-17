import { LambdaHandler } from '@architect/functions/http';
import arc from '@architect/functions';

export const handler: LambdaHandler = async (event, context) => {
  console.log('ws-default called with', event);

  let timestamp = new Date().getTime();
  let connectionId = event.requestContext.connectionId;
  let messageId = event.requestContext.messageId;
  let message = event.body && JSON.parse(event.body);
  let roomId = message.roomId || 'default';
  let sentAt = message.sentAt || timestamp;
  let username = message.username || connectionId;
  // let text = `${timestamp} - Echoing ${message.text}`
  let data = await arc.tables();
  let queryResp = await data.chatapp.query({
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: { ':id': `room#${roomId}` },
  });
  console.log('queryResp', queryResp);
  const connections = queryResp?.Items || [];
  if (message.type === 'user_join' || message.type === 'user_rename') {
    await data.chatapp.update({
      Key: { id: `room#${roomId}`, sortKey: `listeners#${connectionId}` },
      UpdateExpression: 'set #username = :username',
      ExpressionAttributeNames: { '#username': 'username' },
      ExpressionAttributeValues: { ':username': username },
    });
  }
  await Promise.all(
    connections.map(async (conn: any) => {
      try {
        const res = await arc.ws.send({
          id: conn.connectionId,
          payload: {
            numUsers: connections.length,
            messageId,
            type: message.type || 'message',
            text: message.text,
            oldUsername: message.oldUsername,
            sender: username,
            roomId,
            sentAt,
            serverReceivedAt: timestamp,
            connectionId,
            isSelf: conn.connectionId === connectionId,
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

  return { statusCode: 200, body: '' };
};
