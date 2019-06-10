import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { IMessageAction, IMessageAttachment, IMessageAttachmentField, MessageActionButtonsAlignment, MessageActionType, MessageProcessingType } from '@rocket.chat/apps-engine/definition/messages';
import * as msgHelper from '../lib/helpers/messageHelper';
import { AppPersistence } from '../lib/persistence';

export class RecentlyAddedWebhookEndpooint extends ApiEndpoint {
  public path = 'recentlyadded';

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
      const sendTo = await read.getEnvironmentReader().getSettings().getValueById('tautulli_postto_recentlyadded');
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

      const media_type = payload.media_type;
      // tslint:disable-next-line:max-line-length
      const showAsPossiblyUpdated = media_type === 'show' || media_type === 'season' || media_type === 'artist' || media_type === 'album';

      // MESSAGE TEXT
      let messageText = '';
      if (showAsPossiblyUpdated === true) {
        messageText = `A new *${media_type}* was recently added _(or updated)_ in library *${payload.library_name}* on server *${payload.server_name}*.`;
      } else {
        messageText = `A new *${media_type}* was recently added in library *${payload.library_name}* on server *${payload.server_name}*.`;
      }

      // ATTACHMENT TITLE
      let attachmentTitle = 'Unknown!';
      if (media_type === 'movie') {
        attachmentTitle = `${payload.title} (${payload.year})`;
      } else if (media_type === 'show') {
        attachmentTitle = `${payload.show_name}`;
      } else if (media_type === 'season') {
        attachmentTitle = `${payload.show_name} - S${payload.season_num00}`;
      } else if (media_type === 'episode') {
        attachmentTitle = `${payload.show_name} - S${payload.season_num00}E${payload.episode_num00} - ${payload.episode_name}`;
      } else if (media_type === 'artist') {
        attachmentTitle = `${payload.artist_name}`;
      } else if (media_type === 'album') {
        attachmentTitle = `${payload.artist_name} - ${payload.album_name}`;
      } else if (media_type === 'track') {
        attachmentTitle = `${payload.artist_name} - ${payload.album_name} - ${payload.track_name}`;
      }

      // ATTACHMENT FIELDS
      const fields = new Array<IMessageAttachmentField>();

      if (payload.air_date || payload.release_date) {
        let title = '';
        let value = '';
        if (payload.air_date && payload.release_date) {
          title = 'Aired/Released';
          if (payload.air_date === payload.release_date) {
            value = payload.air_date;
          } else {
            value = payload.air_date + '\n' + payload.release_date;
          }
        } else if (payload.air_date) {
          title = 'Aired';
          value = payload.air_date;
        } else if (payload.release_date) {
          title = 'Released';
          value = payload.release_date;
        }
        fields.push({
          short: true,
          title,
          value,
        });
      }
      if (payload.studio) {
        fields.push({
          short: true,
          title: 'Studio',
          value: payload.studio,
        });
      }
      if (payload.content_rating) {
        let ratingsText = payload.content_rating ? ('Content: ' + payload.content_rating + '\n') : '' +
          payload.critic_rating ? ('Critic: ' + payload.critic_rating + '\n') : '' +
          payload.audience_rating ? ('Audience: ' + payload.audience_rating + '\n') : '';
        if (ratingsText.length > 0) {
          ratingsText = ratingsText.substring(0, ratingsText.length - 1); // Remove last '\n'
          fields.push({
            short: true,
            title: 'Ratings',
            value: ratingsText,
          });
        }
      }
      if (payload.genres) {
        fields.push({
          short: true,
          title: 'Genre(s)',
          value: payload.genres,
        });
      }
      if (payload.directors) {
        fields.push({
          short: true,
          title: 'Director(s)',
          value: payload.directors,
        });
      }
      if (payload.writers) {
        fields.push({
          short: true,
          title: 'Writer(s)',
          value: payload.writers,
        });
      }
      if (payload.actors) {
        fields.push({
          short: false,
          title: 'Actor(s)',
          value: payload.actors,
        });
      }

      // ATTACHMENT ACTIONS
      const actions = new Array<IMessageAction>();

      if (payload.plex_url) {
        actions.push({
          type: MessageActionType.BUTTON,
          url: payload.plex_url,
          text: 'View on Plex',
          msg_in_chat_window: false,
          msg_processing_type: MessageProcessingType.SendMessage,
        });
      }
      if (payload.imdb_url) {
        actions.push({
          type: MessageActionType.BUTTON,
          url: payload.imdb_url,
          text: 'View on IMDb',
          msg_in_chat_window: false,
          msg_processing_type: MessageProcessingType.SendMessage,
        });
      }
      if (payload.themoviedb_url) {
        actions.push({
          type: MessageActionType.BUTTON,
          url: payload.themoviedb_url,
          text: 'View on TheMovieDB',
          msg_in_chat_window: false,
          msg_processing_type: MessageProcessingType.SendMessage,
        });
      }
      if (payload.thetvdb_url) {
        actions.push({
          type: MessageActionType.BUTTON,
          url: payload.thetvdb_url,
          text: 'View on TheTVDB',
          msg_in_chat_window: false,
          msg_processing_type: MessageProcessingType.SendMessage,
        });
      }
      if (payload.tvmaze_url) {
        actions.push({
          type: MessageActionType.BUTTON,
          url: payload.tvmaze_url,
          text: 'View on TVMaze',
          msg_in_chat_window: false,
          msg_processing_type: MessageProcessingType.SendMessage,
        });
      }
      if (payload.trakt_url) {
        actions.push({
          type: MessageActionType.BUTTON,
          url: payload.trakt_url,
          text: 'View on Trakt.tv',
          msg_in_chat_window: false,
          msg_processing_type: MessageProcessingType.SendMessage,
        });
      }
      if (payload.lastfm_url) {
        actions.push({
          type: MessageActionType.BUTTON,
          url: payload.lastfm_url,
          text: 'View on Last.fm',
          msg_in_chat_window: false,
          msg_processing_type: MessageProcessingType.SendMessage,
        });
      }
      if (media_type === 'show' || media_type === 'season' || media_type === 'episode') {
        const showName = payload.show_name;
        let showNameShortened = showName;
        if (showName.length > 30) {
          showNameShortened = showName.substring(0, 30);
        }
        const command = `/tautulli-recentlyadded-keywords add ${showNameShortened}`;
        actions.push({
          type: MessageActionType.BUTTON,
          text: 'Subscribe to Show',
          msg: command,
          msg_in_chat_window: true,
          msg_processing_type: MessageProcessingType.RespondWithMessage,
        });
      }

      // ATTACHMENT TEXT
      let text = '';

      if (payload.tagline) {
        text += '>' + payload.tagline + '\n';
      }
      if (payload.summary) {
        text += '*Summary: *' + payload.summary + '\n';
      }

      if (text.endsWith('\n')) {
        text = text.substring(0, text.length - 1); // Remove last '\n'
      }

      // ATTACHMENT COLOR
      let color = '#000000';
      if (media_type === 'movie') {
        color = '#FFC12B';
      } else if (media_type === 'show') {
        color = '#0344b7';
      } else if (media_type === 'season') {
        color = '#034cce';
      } else if (media_type === 'episode') {
        color = '#0455e5';
      } else if (media_type === 'artist') {
        color = '#a31903';
      } else if (media_type === 'album') {
        color = '#b71c03';
      } else if (media_type === 'track') {
        color = '#CC2004';
      }

      const attachment: IMessageAttachment = {
        collapsed: false,
        color,
        imageUrl: payload.poster_url, // BIG Image
        thumbnailUrl: '', // SMALL Image
        title: {
          value: attachmentTitle,
          link: payload.plex_url,
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

      try {
        // Notify users if needed
        const persistence = new AppPersistence(persis, read.getPersistenceReader());

        const userNotifications = new Array();
        const keywords = await persistence.getRecentlyAddedKeywords();
        const sendNotifications = async () => {
          await keywords.forEach(async (userKeyword) => {
            if (attachmentTitle.toLowerCase().indexOf(userKeyword.keyword) !== -1) {
              const dmRoom = await read.getRoomReader().getDirectByUsernames(['rocket.cat', userKeyword.userName]);
              const existingNotification = userNotifications.find((userNotification) => {
                return userNotification.userName === userKeyword.userName;
              });
              if (!existingNotification) {
                userNotifications.push({
                  userName: userKeyword.userName,
                  room: dmRoom,
                  keyword: userKeyword.keyword,
                });
                const userMessage = modify.getCreator().startMessage({
                  room: dmRoom,
                  sender,
                  groupable: false,
                  avatarUrl,
                  alias,
                  text: 'Notifying based on keyword `' + userKeyword.keyword + '`\n' + messageText,
                }).setAttachments([attachment]);
                await modify.getCreator().finish(userMessage);
              }
            }
          });
          return this.success();
        };
        return sendNotifications();
      } catch (e) {
        console.log('Failed to notify one or more users!', e);
        return this.success();
      }
  }
}
