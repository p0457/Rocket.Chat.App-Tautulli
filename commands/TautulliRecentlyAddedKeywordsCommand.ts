import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import * as msgHelper from '../lib/helpers/messageHelper';
import { AppPersistence } from '../lib/persistence';
import { TautulliApp } from '../TautulliApp';

export class TautulliRecentlyAddedKeywordsCommand implements ISlashCommand {
  public command = 'tautulli-recentlyadded-keywords';
  public i18nParamsExample = 'slashcommand_recentlyaddedkeywords_params';
  public i18nDescription = 'slashcommand_recentlyaddedkeywords_description';
  public providesPreview = false;

  public constructor(private readonly app: TautulliApp) {}

  public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
    const args = context.getArguments();
    if (args.length === 0) {
      await msgHelper.sendUsage(read, modify, context.getSender(), context.getRoom(), this.command, 'Too few arguments!');
      return;
    }
    const action = args[0];
    let keyword = '';
    // tslint:disable-next-line:prefer-for-of
    for (let x = 1; x < args.length; x++) {
      keyword += args[x] + ' ';
    }
    keyword = keyword.toLowerCase().trim();

    if (!action) {
      await msgHelper.sendUsage(read, modify, context.getSender(), context.getRoom(), this.command, 'No action provided!');
      return;
    }

    const actualAction = action.toLowerCase().trim();
    if (actualAction !== 'add' && actualAction !== 'remove' && actualAction !== 'list') {
      await msgHelper.sendUsage(read, modify, context.getSender(), context.getRoom(), this.command, 'Invalid action!');
      return;
    }

    const persistence = new AppPersistence(persis, read.getPersistenceReader());

    try {
      let allKeywords = await persistence.getRecentlyAddedKeywords();
      let keywords = new Array();
      if (!allKeywords || !Array.isArray(allKeywords)) {
        allKeywords = [];
      } else {
        keywords = allKeywords.filter((savedKeyword) => {
          return savedKeyword.userId ? (savedKeyword.userId === context.getSender().id) : false;
        });
        if (!keywords) {
          keywords = [];
        }
      }

      if (actualAction === 'add') {
        if (!keyword) {
          await msgHelper.sendUsage(read, modify, context.getSender(), context.getRoom(), this.command, 'Keyword required for add action!');
          return;
        }
        const keywordExists = keywords.find((savedKeyword) => {
          return savedKeyword === keyword;
        });
        if (keywordExists) {
          await msgHelper.sendUsage(read, modify, context.getSender(), context.getRoom(), this.command, 'Keyword `' + keyword + '` already exists!');
          return;
        }
        allKeywords.push({
          userId: context.getSender().id,
          userName: context.getSender().username,
          keyword,
        });
        await persistence.setRecentlyAddedKeywords(allKeywords);
        await msgHelper.sendNotification('Keyword `' + keyword + '` added!', read, modify, context.getSender(), context.getRoom());
        return;
      } else if (actualAction === 'remove') {
        if (!keyword) {
          await msgHelper.sendUsage(read, modify, context.getSender(), context.getRoom(), this.command, 'Keyword required for remove action!');
          return;
        }
        const keywordExists = keywords.find((savedKeyword) => {
          return savedKeyword.keyword === keyword;
        });
        if (!keywordExists) {
          await msgHelper.sendUsage(read, modify, context.getSender(), context.getRoom(), this.command, 'Keyword `' + keyword + '` doesn\'t exist!');
          return;
        }
        allKeywords = allKeywords.filter((keywordScope) => {
          if (keywordScope.userId === context.getSender().id && keywordScope.keyword === keyword) {
            return false;
          } else {
            return true;
          }
        });
        await persistence.setRecentlyAddedKeywords(allKeywords);
        await msgHelper.sendNotification('Keyword `' + keyword + '` removed!', read, modify, context.getSender(), context.getRoom());
        return;
      } else if (actualAction === 'list') {
        let text = keywords.length === 0 ? 'None found!' : '';
        keywords.forEach((keywordDisplay) => {
          text += keywordDisplay.keyword + '\n';
        });
        if (text.endsWith('\n')) {
          text = text.substring(0, text.length - 1); // Remove last '\n'
        }
        await msgHelper.sendNotificationSingleAttachment({
          collapsed: false,
          color: '#e4a00e',
          title: {
            value: 'Keywords',
          },
          text,
        }, read, modify, context.getSender(), context.getRoom());
      }
    } catch (e) {
      console.log('Failed to act on keywords command!', e);
      await msgHelper.sendUsage(read, modify, context.getSender(), context.getRoom(), this.command, 'An error has occurred!');
      return;
    }
  }
}
