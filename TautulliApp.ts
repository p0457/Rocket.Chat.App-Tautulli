import {
  IConfigurationExtend, IEnvironmentRead, ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';
import { TautulliCommand } from './commands/TautulliCommand';
import { TautulliRecentlyAddedKeywordsCommand } from './commands/TautulliRecentlyAddedKeywordsCommand';
import { PlexUpdatesWebhookEndpooint } from './endpoints/plexUpdatesWebhook';
import { PlexUptimeWebhookEndpooint } from './endpoints/plexUptimeWebhook';
import { RecentlyAddedWebhookEndpooint } from './endpoints/recentlyAddedWebhook';
import { TautulliUpdatesWebhookEndpooint } from './endpoints/tautulliUpdatesWebhook';

export class TautulliApp extends App {
    constructor(info: IAppInfo, logger: ILogger) {
        super(info, logger);
    }

    protected async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
      await configuration.settings.provideSetting({
        id: 'tautulli_name',
        type: SettingType.STRING,
        packageValue: 'Tautulli',
        required: true,
        public: false,
        i18nLabel: 'customize_name',
        i18nDescription: 'customize_name_description',
      });

      await configuration.settings.provideSetting({
        id: 'tautulli_icon',
        type: SettingType.STRING,
        packageValue: 'https://raw.githubusercontent.com/tgardner851/Rocket.Chat.App-tautulli/master/icon.jpg',
        required: true,
        public: false,
        i18nLabel: 'customize_icon',
        i18nDescription: 'customize_icon_description',
      });

      await configuration.settings.provideSetting({
        id: 'tautulli_postto_recentlyadded',
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: 'customize_postto_recentlyadded',
        i18nDescription: 'customize_postto_recentlyadded_description',
      });

      await configuration.api.provideApi({
        visibility: ApiVisibility.PRIVATE,
        security: ApiSecurity.UNSECURE,
        endpoints: [new RecentlyAddedWebhookEndpooint(this)],
      });

      await configuration.settings.provideSetting({
        id: 'tautulli_postto_plexupdates',
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: 'customize_postto_plexupdates',
        i18nDescription: 'customize_postto_plexupdates_description',
      });

      await configuration.api.provideApi({
        visibility: ApiVisibility.PRIVATE,
        security: ApiSecurity.UNSECURE,
        endpoints: [new PlexUpdatesWebhookEndpooint(this)],
      });

      await configuration.settings.provideSetting({
        id: 'tautulli_postto_tautulliupdates',
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: 'customize_postto_tautulliupdates',
        i18nDescription: 'customize_postto_tautulliupdates_description',
      });

      await configuration.api.provideApi({
        visibility: ApiVisibility.PRIVATE,
        security: ApiSecurity.UNSECURE,
        endpoints: [new TautulliUpdatesWebhookEndpooint(this)],
      });

      await configuration.settings.provideSetting({
        id: 'tautulli_postto_plexuptime',
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: 'customize_postto_plexuptime',
        i18nDescription: 'customize_postto_plexuptime_description',
      });

      await configuration.api.provideApi({
        visibility: ApiVisibility.PRIVATE,
        security: ApiSecurity.UNSECURE,
        endpoints: [new PlexUptimeWebhookEndpooint(this)],
      });

      await configuration.slashCommands.provideSlashCommand(new TautulliCommand(this));
      await configuration.slashCommands.provideSlashCommand(new TautulliRecentlyAddedKeywordsCommand(this));
    }
}
