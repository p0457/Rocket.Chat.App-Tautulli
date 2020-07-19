import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import usage from './usage';

export async function sendNotification(text: string, read: IRead, modify: IModify, user: IUser, room: IRoom): Promise<void> {
  const icon = await read.getEnvironmentReader().getSettings().getValueById('tautulli_icon');
  const username = await read.getEnvironmentReader().getSettings().getValueById('tautulli_alias');
  const senderName = await read.getEnvironmentReader().getSettings().getValueById('tautulli_sender');
  const sender = await read.getUserReader().getById(senderName);

  modify.getNotifier().notifyUser(user, modify.getCreator().startMessage({
      sender,
      room,
      text,
      groupable: false,
      alias: username,
      avatarUrl: icon,
  }).getMessage());
}

export async function sendNotificationSingleAttachment(attachment: IMessageAttachment, read: IRead, modify: IModify, user: IUser, room: IRoom): Promise<void> {
  const icon = await read.getEnvironmentReader().getSettings().getValueById('tautulli_icon');
  const username = await read.getEnvironmentReader().getSettings().getValueById('tautulli_alias');
  const senderName = await read.getEnvironmentReader().getSettings().getValueById('tautulli_sender');
  const sender = await read.getUserReader().getById(senderName);

  modify.getNotifier().notifyUser(user, modify.getCreator().startMessage({
      sender,
      room,
      groupable: false,
      alias: username,
      avatarUrl: icon,
      attachments: [attachment],
  }).getMessage());
}

export async function sendNotificationMultipleAttachments(attachments: Array<IMessageAttachment>, read: IRead, modify: IModify, user: IUser, room: IRoom): Promise<void> {
  const icon = await read.getEnvironmentReader().getSettings().getValueById('tautulli_icon');
  const username = await read.getEnvironmentReader().getSettings().getValueById('tautulli_alias');
  const senderName = await read.getEnvironmentReader().getSettings().getValueById('tautulli_sender');
  const sender = await read.getUserReader().getById(senderName);

  modify.getNotifier().notifyUser(user, modify.getCreator().startMessage({
      sender,
      room,
      groupable: false,
      alias: username,
      avatarUrl: icon,
      attachments,
  }).getMessage());
}

export async function sendUsage(read: IRead, modify: IModify, user: IUser, room: IRoom, scope: string, additionalText?): Promise<void> {
  let text = '';

  let usageObj = usage[scope];
  if (!usageObj) {
    for (const p in usage) {
      if (usage.hasOwnProperty(p)) {
        if (usage[p].command === scope) {
          usageObj = usage[p];
        }
      }
    }
  }
  if (usageObj && usageObj.command && usageObj.usage && usageObj.description) {
    text = '*Usage: *' + usageObj.usage + '\n>' + usageObj.description;
  }

  if (additionalText) {
    text = additionalText + '\n' + text;
  }

  // tslint:disable-next-line:max-line-length
  await this.sendNotification(text, read, modify, user, room);
  return;
}
