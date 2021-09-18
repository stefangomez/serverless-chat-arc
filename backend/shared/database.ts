import { ArcDataIndexable } from '@architect/functions/tables';
import arc from '@architect/functions';

export type Participant = {
  id: string;
  sortKey: string;
  roomId: string;
  connectionId: string;
  createdAt: string;
  username?: string;
};
export class ChatDatabase {
  constructor(private db: ArcDataIndexable) {}

  public static getInstance = async () => {
    const db = await arc.tables();
    return new ChatDatabase(db);
  };

  public async joinRoom(roomId: string, connectionId: string) {
    const createdAt = new Date();
    const newParticipant: Participant = {
      id: `room#${roomId}`,
      sortKey: `participant#${connectionId}`,
      roomId,
      connectionId,
      createdAt: createdAt.toISOString(),
    };
    await this.db.chatapp.put(newParticipant);
  }

  public async updateParticipant(roomId: string, connectionId: string, username: string) {
    await this.db.chatapp.update({
      Key: { id: `room#${roomId}`, sortKey: `participant#${connectionId}` },
      UpdateExpression: 'set #username = :username',
      ExpressionAttributeNames: { '#username': 'username' },
      ExpressionAttributeValues: { ':username': username },
    });
  }
  public async deleteParticipant(participant: Participant) {
    await this.db.chatapp.delete({ id: participant.id, sortKey: participant.sortKey });
  }

  public async getParticipants(roomId: string): Promise<Participant[]> {
    const queryResp = await this.db.chatapp.query({
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: { ':id': `room#${roomId}` },
    });
    return queryResp?.Items || [];
  }
  public async getParticipantConnections(connectionId: string): Promise<Participant[]> {
    const queryResp = await this.db.chatapp.query({
      IndexName: 'GSI',
      KeyConditionExpression: 'sortKey = :sortKey',
      ExpressionAttributeValues: { ':sortKey': `participant#${connectionId}` },
    });
    return queryResp?.Items || [];
  }
}
