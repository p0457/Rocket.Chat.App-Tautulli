import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { IMessageAction, IMessageAttachment, IMessageAttachmentField, MessageActionButtonsAlignment, MessageActionType, MessageProcessingType } from '@rocket.chat/apps-engine/definition/messages';
import * as msgHelper from '../lib/helpers/messageHelper';
import { AppPersistence } from '../lib/persistence';

export class TautulliUpdatesWebhookEndpooint extends ApiEndpoint {
  public path = 'tautulliupdates';

  public async post(
      request: IApiRequest,
      endpoint: IApiEndpointInfo,
      read: IRead,
      modify: IModify,
      http: IHttp,
      persis: IPersistence,
  ): Promise<IApiResponse> {
      if (!request.content) {
        return this.success();
      }

      let payload: any;

      if (request.headers['content-type'] === 'application/x-www-form-urlencoded') {
        payload = JSON.parse(request.content.payload);
      } else {
        payload = request.content;
      }

      const avatarUrl = await read.getEnvironmentReader().getSettings().getValueById('tautulli_icon');
      const alias = await read.getEnvironmentReader().getSettings().getValueById('tautulli_name');
      const sendTo = await read.getEnvironmentReader().getSettings().getValueById('tautulli_postto_tautulliupdates');
      const sender = await read.getUserReader().getById('rocket.cat');

      let room;
      if (sendTo.startsWith('@')) {
        room = await read.getRoomReader().getDirectByUsernames(['rocket.cat', sendTo.substring(1, sendTo.length)]);
      } else if (sendTo.startsWith('#')) {
        room = await read.getRoomReader().getByName(sendTo.substring(1, sendTo.length));
      }

      if (!room) {
        return this.success();
      }

      // MESSAGE TEXT
      const messageText = `New Tautulli Update Available!`;

      // ATTACHMENT TITLE
      const attachmentTitle = `Tautulli has an Update!`;

      // ATTACHMENT FIELDS
      const fields = new Array<IMessageAttachmentField>();

      fields.push({
        short: true,
        title: 'Address',
        value: `${payload.server_url} (${payload.server_ip}:8181)`,
      });
      if (payload.server_platform) {
        fields.push({
          short: true,
          title: 'Platform',
          value: `${payload.server_platform}`,
        });
      }
      if (payload.server_machine_id) {
        fields.push({
          short: true,
          title: 'Machine',
          value: `${payload.server_machine_id}`,
        });
      }
      if (payload.tautulli_version) {
        fields.push({
          short: true,
          title: 'Plex Version',
          value: `${payload.server_version}`,
        });
      }
      if (payload.update_version) {
        fields.push({
          short: true,
          title: 'New Tautulli Version',
          value: `${payload.tautulli_update_version}`,
        });
      }

      // ATTACHMENT ACTIONS
      const actions = new Array<IMessageAction>();

      if (payload.server_url) {
        actions.push({
          type: MessageActionType.BUTTON,
          url: payload.server_url,
          text: 'View Plex Server',
          msg_in_chat_window: false,
          msg_processing_type: MessageProcessingType.SendMessage,
        });
      }
      if (payload.server_ip) {
        actions.push({
          type: MessageActionType.BUTTON,
          url: payload.server_ip + ':8181',
          text: 'View Tautulli Server',
          msg_in_chat_window: false,
          msg_processing_type: MessageProcessingType.SendMessage,
        });
      }

      // ATTACHMENT TEXT
      let text = `*(v${payload.tautulli_version} -> v${payload.tautulli_update_version})*`;

      if (payload.tautulli_update_changelog) {
        text += `\n*Changelog: *${payload.tautulli_update_changelog}`;
      }

      // ATTACHMENT COLOR
      const color = '#292b2f';

      const attachment: IMessageAttachment = {
        collapsed: true,
        color,
        imageUrl: '', // BIG Image
        thumbnailUrl: '', // SMALL Image
        title: {
          value: attachmentTitle,
          link: payload.server_url,
        },
        fields,
        actions,
        actionButtonsAlignment: MessageActionButtonsAlignment.HORIZONTAL,
        text,
      };

      const message = modify.getCreator().startMessage({
        room,
        sender,
        groupable: false,
        avatarUrl,
        alias,
        text: messageText,
      }).setAttachments([attachment]);

      await modify.getCreator().finish(message);

      return this.success();
  }
}
