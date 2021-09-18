// import { ChatDatabase } from '../../shared/database';
import { ChatDatabase } from '@architect/shared/database';
import { LambdaHandler } from '@architect/functions/http';
import arc from '@architect/functions';

export const handler: LambdaHandler = async (event, context) => {
  console.log('ws-connect called with', event);
  const connectionId = event.requestContext.connectionId;
  const roomId = event.queryStringParameters?.roomId || 'default';
  const createdAt = new Date();

  const dbInstance = await ChatDatabase.getInstance();
  dbInstance.joinRoom(roomId, connectionId);

  return { statusCode: 200, body: '' };
};
