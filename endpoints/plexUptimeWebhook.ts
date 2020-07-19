import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';

export class PlexUptimeWebhookEndpooint extends ApiEndpoint {
  public path = 'plexuptime';

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
      const sendTo = await read.getEnvironmentReader().getSettings().getValueById('tautulli_postto_plexuptime');
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
      let messageText = ``;
      if (payload._type === 'serverdown') {
        messageText = `${payload.server_name} is Down!`;
      } else if (payload._type === 'serverup') {
        messageText = `${payload.server_name} is Back Up!`;
      } else if (payload._type === 'serverremotedown') {
        messageText = `${payload.server_name} Remote Access is Down!`;
      } else if (payload._type === 'serverremoteup') {
        messageText = `${payload.server_name} Remote Access is Back Up!`;
      }

      // ATTACHMENT TITLE
      let attachmentTitle = ``;
      if (payload._type === 'serverdown') {
        attachmentTitle = `${payload.server_name} down at ${payload.datestamp} ${payload.timestamp}`;
      } else if (payload._type === 'serverup') {
        attachmentTitle = `${payload.server_name} back up at ${payload.datestamp} ${payload.timestamp}`;
      } else if (payload._type === 'serverremotedown') {
        attachmentTitle = `${payload.server_name} remote down at ${payload.datestamp} ${payload.timestamp}`;
      } else if (payload._type === 'serverremoteup') {
        attachmentTitle = `${payload.server_name} remote back up at ${payload.datestamp} ${payload.timestamp}`;
      }

      // ATTACHMENT COLOR
      const color = '##0FBA2C';

      const attachment: IMessageAttachment = {
        collapsed: true,
        color,
        imageUrl: '', // BIG Image
        thumbnailUrl: '', // SMALL Image
        title: {
          value: attachmentTitle,
          link: payload.plex_url,
        },
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
