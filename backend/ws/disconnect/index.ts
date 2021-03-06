import { ChatDatabase, Participant } from '@architect/shared/database';

import { LambdaHandler } from '@architect/functions/http';
import arc from '@architect/functions';

const sendLeaveMessages = async (leftParticipant: Participant, messageId: string) => {
  const participants = await ChatDatabase.getParticipants(leftParticipant.roomId);
  const timestamp = new Date().getTime();
  await Promise.all(
    participants.map(async participant => {
      try {
        const res = await arc.ws.send({
          id: participant.connectionId,
          payload: {
            numUsers: participants.length,
            messageId,
            type: 'user_leave',
            text: `${leftParticipant.username || leftParticipant.connectionId} left the room`,
            sender: leftParticipant.username || leftParticipant.connectionId,
            roomId: leftParticipant.roomId,
            sentAt: timestamp,
            serverReceivedAt: timestamp,
            connectionId: leftParticipant.connectionId,
          },
        });
        return res;
      } catch (e) {
        console.log(`error sending message to connectionId: ${participant.connectionId}`);
        console.log(e);
        await ChatDatabase.deleteParticipant(participant);

        return null;
      }
    })
  );
};

export const handler: LambdaHandler = async (event, context) => {
  console.log('ws-disconnect called with', event);
  const connectionId = event.requestContext.connectionId;
  const messageId = event.requestContext.messageId || event.requestContext.requestId;

  if (connectionId) {
    const connections = await ChatDatabase.getParticipantConnections(connectionId);
    await Promise.all(
      connections.map(async participant => {
        await ChatDatabase.deleteParticipant(participant);
        await sendLeaveMessages(participant, messageId);
      })
    );
  }
  return { statusCode: 200, body: '' };
};
