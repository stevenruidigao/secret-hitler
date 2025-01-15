import { Socket } from 'socket.io';

import { games, userList, testIP } from '../models.mts';
import { sendInProgressGameUpdate } from '../util.mts';
import Account from '../../../models/account.mts';
import { sendUserList } from '../user-requests.mts';

/**
 * @param {object} socket - socket reference.
 * @param {function} callback - success callback.
 */
export const checkUserStatus = (socket: Socket, callback: Function) => {
	const handshake = socket?.handshake as any;

	if (!handshake?.session) return;

	const { passport } = handshake.session;

	if (passport && Object.keys(passport).length) {
		const { user } = passport;
		const { sockets } = io.sockets;

		const game = games[Object.keys(games).find((gameName: string) => games[gameName].publicPlayersState.find((player: any) => player.userName === user && !player.leftGame)) || ''];

		const oldSocketID = Object.keys(sockets).find(
			socketID => {
				const s = sockets.get(socketID);

				if (!s) return false;

				const handshake = s.handshake as any;

				return handshake.session.passport &&
					Object.keys(handshake.session.passport).length &&
					handshake.session.passport.user === user &&
					socketID !== socket.id;
			}
		);

		const oldSocket = oldSocketID && sockets.get(oldSocketID);

		if (oldSocketID && oldSocket) {
			oldSocket.emit('manualDisconnection');
			sockets.delete(oldSocketID);
		}

		const reconnectingUser = game ? game.publicPlayersState.find((player: any) => player.userName === user) : undefined;

		if (game && game.gameState.isStarted && !game.gameState.isCompleted && reconnectingUser) {
			reconnectingUser.connected = true;
			socket.join(game.general.uid);
			socket.emit('updateSeatForUser');
			sendInProgressGameUpdate(game);
		}

		if (user) {
			// Double-check the user isn't sneaking past IP bans.
			const logOutUser = (username: string) => {
				const bannedUserlistIndex = userList.findIndex(user => user.userName === username);

				socket.emit('manualDisconnection');
				socket.disconnect(true);

				if (bannedUserlistIndex >= 0) {
					userList.splice(bannedUserlistIndex, 1);
				}

				// destroySession(username);
			};

			Account.findOne({ username: user }, function(err: Error, account: any) {
				if (account) {
					if (account.isBanned || (account.isTimeout && new Date() < account.isTimeout)) {
						logOutUser(user);
					} else {
						testIP(account.lastConnectedIP, (banType: string) => {
							if (banType && banType != 'new' && banType != 'fragbanSmall' && banType != 'fragbanLarge' && !account.gameSettings.ignoreIPBans) logOutUser(user);
							else {
								sendUserList();
								callback();
							}
						});
					}
				}
			});
		} else callback();
	} else callback();
};

export const handleHasSeenNewPlayerModal = (socket: Socket) => {
	const handshake = socket?.handshake as any;

	if (!handshake?.session) return;

	const { passport } = handshake.session;

	if (passport && Object.keys(passport).length) {
		const { user } = passport;
		Account.findOne({ username: user }).then((account: any) => {
			account.hasNotDismissedSignupModal = false;
			socket.emit('checkRestrictions');
			account.save();
		});
	}
};
