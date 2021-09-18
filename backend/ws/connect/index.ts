import { LambdaHandler } from '@architect/functions/http';
import arc from '@architect/functions';

export const handler: LambdaHandler = async (event, context) => {
  console.log('ws-connect called with', event);
  const connectionId = event.requestContext.connectionId;
  const roomId = event.queryStringParameters?.roomId || 'default';
  const createdAt = new Date();

  const data = await arc.tables();
  await data.chatapp.put({
    id: `room#${roomId}`,
    sortKey: `listeners#${connectionId}`,
    connectionId,
    createdAt: createdAt.toISOString(),
  });
  return { statusCode: 200, body: '' };
};
