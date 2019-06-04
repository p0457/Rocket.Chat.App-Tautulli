import { IPersistence, IPersistenceRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export class AppPersistence {
  constructor(private readonly persistence: IPersistence, private readonly persistenceRead: IPersistenceRead) {}

  public async setUserApiKey(apiKey: string, user: IUser): Promise<void> {
    const userAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, user.id);
    const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'tautulli-api-key');

    await this.persistence.updateByAssociations([userAssociation, typeAssociation], { apiKey }, true);
  }

  public async getUserApiKey(user: IUser): Promise<string | undefined> {
    const userAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, user.id);
    const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'tautulli-api-key');

    const [result] = await this.persistenceRead.readByAssociations([userAssociation, typeAssociation]);

    return result ? (result as any).apiKey : undefined;
  }

  public async setUserServerUrl(serverUrl: string, user: IUser): Promise<void> {
    const userAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, user.id);
    const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'tautulli-server-url');

    await this.persistence.updateByAssociations([userAssociation, typeAssociation], { serverUrl }, true);
  }

  public async getUserServerUrl(user: IUser): Promise<string | undefined> {
    const userAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, user.id);
    const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'tautulli-server-url');

    const [result] = await this.persistenceRead.readByAssociations([userAssociation, typeAssociation]);

    return result ? (result as any).serverUrl : undefined;
  }

  /* KEYWORDS MODEL
  [
    {
      userId: '',
      keyword: 'something or another'
    }
  ]
  */

  public async setRecentlyAddedKeywords(keywords): Promise<void> {
    keywords = JSON.stringify(keywords);
    const miscAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'tautulli-recentlyadded-keywords');

    await this.persistence.updateByAssociations([miscAssociation], { keywords }, true);
  }

  public async getRecentlyAddedKeywords(): Promise<any> {
    const miscAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'tautulli-recentlyadded-keywords');

    const [result] = await this.persistenceRead.readByAssociations([miscAssociation]);

    const actualResult = result ? (result as any).keywords : undefined;
    if (!actualResult) {
      return [];
    } else {
      return JSON.parse(actualResult);
    }
  }
}
