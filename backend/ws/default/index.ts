import { ChatDatabase } from '@architect/shared/database';
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

  if (connectionId) {
    if (message.type === 'user_join' || message.type === 'user_rename') {
      await ChatDatabase.updateParticipant(roomId, connectionId, username);
    }
    const participants = await ChatDatabase.getParticipants(roomId);

    await Promise.all(
      participants.map(async participant => {
        try {
          const res = await arc.ws.send({
            id: participant.connectionId,
            payload: {
              numUsers: participants.length,
              messageId,
              type: message.type || 'message',
              text: message.text,
              oldUsername: message.oldUsername,
              sender: username,
              roomId,
              sentAt,
              serverReceivedAt: timestamp,
              connectionId,
              isSelf: participant.connectionId === connectionId,
            },
          });
          return res;
        } catch (e) {
          console.log(`error sending message to connectionId: ${connectionId}`);
          console.log(e);
          await ChatDatabase.deleteParticipant(participant);
          return null;
        }
      })
    );
  }

  return { statusCode: 200, body: '' };
};
