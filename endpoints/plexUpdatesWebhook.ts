import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { IMessageAction, IMessageAttachment, IMessageAttachmentField, MessageActionButtonsAlignment, MessageActionType, MessageProcessingType } from '@rocket.chat/apps-engine/definition/messages';
import * as msgHelper from '../lib/helpers/messageHelper';
import { AppPersistence } from '../lib/persistence';

export class PlexUpdatesWebhookEndpooint extends ApiEndpoint {
  public path = 'plexupdates';

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
      const alias = await read.getEnvironmentReader().getSettings().getValueById('tautulli_alias');
      const sendTo = await read.getEnvironmentReader().getSettings().getValueById('tautulli_postto_plexupdates');
      const senderName = await read.getEnvironmentReader().getSettings().getValueById('tautulli_sender');
      const sender = await read.getUserReader().getById(senderName);

      let room;
      if (sendTo.startsWith('@')) {
        room = await read.getRoomReader().getDirectByUsernames([senderName, sendTo.substring(1, sendTo.length)]);
      } else if (sendTo.startsWith('#')) {
        room = await read.getRoomReader().getByName(sendTo.substring(1, sendTo.length));
      }

      if (!room) {
        return this.success();
      }

      // MESSAGE TEXT
      const messageText = `New Plex Update Available!`;

      // ATTACHMENT TITLE
      const attachmentTitle = `${payload.server_name} has an Update!`;

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
          title: 'Tautulli Version',
          value: `${payload.tautulli_version}`,
        });
      }
      if (payload.update_version) {
        fields.push({
          short: true,
          title: 'New Plex Version',
          value: `${payload.update_version}` + payload.update_channel ? ` (${payload.update_channel})` : '',
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
      let text = `*(v${payload.server_version} -> v${payload.update_version})*`;

      if (payload.update_release_date) {
        text += `\n*Released: *${payload.update_release_date}`;
      }
      if (payload.update_requirements) {
        text += `\n*Update Requirements: *${payload.update_requirements}`;
      }
      if (payload.update_release_date) {
        text += `\n*Released: *${payload.update_release_date}`;
      }
      if (payload.update_extra_info) {
        text += `\n*Extra Update Info: *${payload.update_extra_info}`;
      }
      if (payload.update_changelog_added) {
        text += `\n*Changelog Added: *${payload.update_changelog_added}`;
      }
      if (payload.update_changelog_fixed) {
        text += `\n*Changelog Fixed: *${payload.update_changelog_fixed}`;
      }

      // ATTACHMENT COLOR
      const color = '#f9be03';

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
