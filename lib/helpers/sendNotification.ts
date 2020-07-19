import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export async function sendNotification(text: string, read: IRead, modify: IModify, user: IUser, room: IRoom): Promise<void> {
    const senderName = await read.getEnvironmentReader().getSettings().getValueById('tautulli_sender');
    const sender = await read.getUserReader().getById(senderName);

    modify.getNotifier().notifyUser(user, modify.getCreator().startMessage({
        sender,
        room,
        text,
        groupable: false,
    }).getMessage());
}
