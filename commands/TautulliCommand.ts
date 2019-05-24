import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { buildUrl } from '../lib/helpers/buildUrl';
import * as msgHelper from '../lib/helpers/messageHelper';
import { sendNotification } from '../lib/helpers/sendNotification';
import { AppPersistence } from '../lib/persistence';
import { TautulliApp } from '../TautulliApp';

enum Command {
  Help = 'help',
  SetServer = 'set-server',
  GetLibraries = 'get-libraries',
}

export class TautulliCommand implements ISlashCommand {
  public command = 'tautulli';
  public i18nParamsExample = 'slashcommand_params';
  public i18nDescription = 'slashcommand_description';
  public providesPreview = false;

  public constructor(private readonly app: TautulliApp) {}

  public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
    const [command] = context.getArguments();

    switch (command) {
      case Command.Help:
        await this.processHelpCommand(context, read, modify, http, persis);
        break;
      case Command.SetServer:
        await this.processSetServerCommand(context, read, modify, http, persis);
        break;
      case Command.GetLibraries:
        await this.processGetLibrariesCommand(context, read, modify, http, persis);
        break;
      default:
        await this.processHelpCommand(context, read, modify, http, persis);
        break;
    }
  }

  private async processHelpCommand(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
    await msgHelper.sendNotificationSingleAttachment({
      collapsed: false,
      color: '#e4a00e',
      title: {
        value: 'Tautulli App Help Commands',
      },
      text: '`/tautulli help`\n>Show this help menu\n'
        + '`/tautulli set-server [SERVER URL] [API KEY]`\n>Sets the Server URL and API Key\n'
        + '`/tautulli get-libraries`\n>Shows all Tautulli Libraries\n',
    }, read, modify, context.getSender(), context.getRoom());
    return;
  }

  private async processSetServerCommand(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
    const [, serverUrl, apiKey] = context.getArguments();

    if (!serverUrl || !apiKey) {
      await sendNotification('Usage: `/tautulli set-server [SERVER URL] [API KEY]`', read, modify, context.getSender(), context.getRoom());
      return;
    }

    const persistence = new AppPersistence(persis, read.getPersistenceReader());

    await persistence.setUserServerUrl(serverUrl, context.getSender());
    await persistence.setUserApiKey(apiKey, context.getSender());

    await sendNotification('Successfully stored your Tautulli Server URL and API Key!', read, modify, context.getSender(), context.getRoom());
  }

  private async processGetLibrariesCommand(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
    const persistence = new AppPersistence(persis, read.getPersistenceReader());
    const serverUrl = await persistence.getUserServerUrl(context.getSender());
    const apiKey = await persistence.getUserApiKey(context.getSender());
    if (!serverUrl || !apiKey) {
      // tslint:disable-next-line:max-line-length
      await sendNotification('Server URL or API Key not provided! Use command `/tautulli set-server [SERVER URL] [API KEY]`', read, modify, context.getSender(), context.getRoom());
      return;
    }

    const url = buildUrl(serverUrl, apiKey, 'get_libraries');

    const response = await http.get(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Rocket.Chat.App-tautulli',
      },
    });
    console.log('****1', response);

    let text;
    if (response && response.content) {
      try {
        const json = JSON.parse(response.content);
        if (Array.isArray(json)) {
          // tslint:disable-next-line:prefer-for-of
          for (let x = 0; x < json.length; x++) {
            const library = json[x];
            if (library.section_id) {
              text += 'Id: ' + library.section_id + ' ';
            }
            if (library.section_name) {
              text += 'Name: ' + library.section_name + ' ';
            }
            if (library.section_type) {
              text += '(' + library.section_type.charAt(0).toUpperCase() + library.section_type.slice(1) + ')\n';
            }
          }
        }
      } catch (err) {
        text = 'Failed to parse the response!';
      }
    }

    await sendNotification(text, read, modify, context.getSender(), context.getRoom());
  }
}
