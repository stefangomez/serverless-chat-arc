import { ArcDataIndexable } from '@architect/functions/tables';
import arc from '@architect/functions';

export class ChatDatabase {
  constructor(private db: ArcDataIndexable) {}

  public static getInstance = async () => {
    const db = await arc.tables();
    return new ChatDatabase(db);
  };

  public async joinRoom(roomId: string, connectionId?: string) {
    const createdAt = new Date();
    await this.db.chatapp.put({
      id: `room#${roomId}`,
      sortKey: `listeners#${connectionId}`,
      connectionId,
      createdAt: createdAt.toISOString(),
    });
  }
}
