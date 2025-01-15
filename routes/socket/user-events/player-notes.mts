import PlayerNote from '../../../models/playerNote.mts';

import { sendPlayerNotes } from '../user-requests.mts';

/**
 * @param {object} socket - user socket reference.
 * @param {object} data - from socket emit.
 */
export const handleUpdatedPlayerNote = (socket: any, data: any) => {
	PlayerNote.findOne({ userName: data.userName, notedUser: data.notedUser }).then((note: any) => {
		if (note) {
			note.note = data.note;
			note.save(() => {
				sendPlayerNotes(socket, { userName: data.userName, seatedPlayers: [data.notedUser] });
			});
		} else {
			const playerNote = new PlayerNote({
				userName: data.userName,
				notedUser: data.notedUser,
				note: data.note
			});

			playerNote.save(() => {
				sendPlayerNotes(socket, { userName: data.userName, seatedPlayers: [data.notedUser] });
			});
		}
	});
};
