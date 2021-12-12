import * as AWS from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient({
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined,
  apiVersion: '2012-08-10',
});

const DEFAULT_PARAMS = {
  TableName: process.env.CHAT_APP_TABLE || 'default',
};

export type Participant = {
  id: string;
  sortKey: string;
  roomId: string;
  connectionId: string;
  createdAt: string;
  username?: string;
};

export class ChatDatabase {
  public static async joinRoom(roomId: string, connectionId: string) {
    const createdAt = new Date();
    const newParticipant: Participant = {
      id: `room#${roomId}`,
      sortKey: `participant#${connectionId}`,
      roomId,
      connectionId,
      createdAt: createdAt.toISOString(),
    };
    await docClient.put({ ...DEFAULT_PARAMS, Item: newParticipant }).promise();
  }

  public static async updateParticipant(roomId: string, connectionId: string, username: string) {
    await docClient
      .update({
        ...DEFAULT_PARAMS,
        Key: { id: `room#${roomId}`, sortKey: `participant#${connectionId}` },
        UpdateExpression: 'set #username = :username',
        ExpressionAttributeNames: { '#username': 'username' },
        ExpressionAttributeValues: { ':username': username },
      })
      .promise();
  }
  public static async deleteParticipant(participant: Participant) {
    await docClient.delete({ ...DEFAULT_PARAMS, Key: { id: participant.id, sortKey: participant.sortKey } }).promise();
  }

  public static async getParticipants(roomId: string): Promise<Participant[]> {
    const queryResp = await docClient
      .query({
        ...DEFAULT_PARAMS,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: { ':id': `room#${roomId}` },
      })
      .promise();
    return (queryResp?.Items as Participant[]) || [];
  }

  public static async getParticipantConnections(connectionId: string): Promise<Participant[]> {
    const queryResp = await docClient
      .query({
        ...DEFAULT_PARAMS,
        IndexName: 'GSI',
        KeyConditionExpression: 'sortKey = :sortKey',
        ExpressionAttributeValues: { ':sortKey': `participant#${connectionId}` },
      })
      .promise();
    return (queryResp?.Items as Participant[]) || [];
  }
}
