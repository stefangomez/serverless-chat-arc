import { ChatDatabase } from '@architect/shared/database';
import { LambdaHandler } from '@architect/functions/http';

export const handler: LambdaHandler = async (event, context) => {
  console.log('ws-connect called with', event);
  const connectionId = event.requestContext.connectionId;
  const roomId = event.queryStringParameters?.roomId || 'default';

  if (connectionId) {
    const dbInstance = await ChatDatabase.getInstance();
    await dbInstance.joinRoom(roomId, connectionId);
  }

  return { statusCode: 200, body: '' };
};
