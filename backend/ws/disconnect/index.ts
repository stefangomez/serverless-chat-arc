import { LambdaHandler } from '@architect/functions/http';
import arc from '@architect/functions';

const sendLeaveMessages = async (
  messageId: string,
  connectionId: string | undefined,
  roomId: string,
  leftUsername: string
) => {
  const data = await arc.tables();
  const queryResp = await data.chatapp.query({
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: { ':id': `room#${roomId}` },
  });
  const connections = queryResp?.Items || [];
  const timestamp = new Date().getTime();
  await Promise.all(
    connections.map(async (conn: any) => {
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
export const handler: LambdaHandler = async (event, context) => {
  console.log('ws-disconnect called with', event);
  const connectionId = event.requestContext.connectionId;
  const messageId = event.requestContext.messageId || event.requestContext.requestId;

  const data = await arc.tables();

  const queryResp = await data.chatapp.query({
    IndexName: 'GSI',
    KeyConditionExpression: 'sortKey = :sortKey',
    ExpressionAttributeValues: { ':sortKey': `listeners#${connectionId}` },
  });
  await Promise.all(
    queryResp?.Items.map(async (dbObj: any) => {
      await data.chatapp.delete({ id: dbObj.id, sortKey: dbObj.sortKey });
      await sendLeaveMessages(
        messageId,
        connectionId,
        dbObj.id.split('room#')[1],
        dbObj.username || dbObj.connectionId
      );
    })
  );

  return { statusCode: 200, body: '' };
};
