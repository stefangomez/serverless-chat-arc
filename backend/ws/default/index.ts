import { LambdaHandler } from '@architect/functions/http';
import arc from '@architect/functions';

export const handler: LambdaHandler = async (event, context) => {
  console.log('ws-default called with', event);

  const timestamp = new Date().getTime();
  const connectionId = event.requestContext.connectionId;
  const messageId = event.requestContext.messageId;
  const message = event.body && JSON.parse(event.body);
  const roomId = message.roomId || 'default';
  const sentAt = message.sentAt || timestamp;
  const username = message.username || connectionId;
  const data = await arc.tables();
  const queryResp = await data.chatapp.query({
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: { ':id': `room#${roomId}` },
  });
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
