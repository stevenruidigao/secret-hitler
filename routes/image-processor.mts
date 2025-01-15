import path from 'path';
import sharp from 'sharp';

import Account from '../models/account.mts';
import { userList, userListEmitter, games } from './socket/models.mts';
import { sendCommandChatsUpdate } from './socket/util.mts';
import { sendGameList } from './socket/user-requests.mts';

const io = global.io;

export const processImage = (username: string, raw: string, callback: any) => {
	sharp(Buffer.from(raw, 'base64'))
		.resize(70, 95)
		.toFile(path.join('public/images/custom-cardbacks/', path.basename(`${username}.png`)), err => {
			if (err) {
				callback(null, err);
				return;
			}

			Account.findOne({ username: username }).then((account: any) => {
				account.gameSettings.customCardback = account.gameSettings.customCardback || {};
				account.gameSettings.customCardback.fileExtension = 'png';
				account.gameSettings.customCardback.saveTime = Date.now().toString();
				account.gameSettings.customCardback.uid = Math.random()
					.toString(36)
					.substring(2);

				account.save(() => {
					const user: any = userList.find((u: any) => u.userName === username);

					if (user) {
						user.customCardback = user.customCardback || {};
						user.customCardback.fileExtension = 'png';
						user.customCardback.uid = account.gameSettings.customCardback.uid;
						userListEmitter.send = true;
					}

					Object.keys(games).forEach(uid => {
						const game = games[uid];
						const foundUser = game.publicPlayersState.find((user: any) => user.userName === username);

						if (foundUser) {
							foundUser.customCardback = {}; // reset cardback?
							sendCommandChatsUpdate(game);
							sendGameList();
						}
					});

					const socketId = Array.from(io.sockets.sockets.keys()).find(socketId => {
						const socket = io.sockets.sockets.get(socketId);
						const handshake = socket?.handshake as any;

						return handshake?.session?.passport?.user === username;
					});

					const socket = socketId && io.sockets.sockets.get(socketId);

					if (socketId && socket) {
						socket.emit('gameSettings', account.gameSettings);
					}

					callback('Image uploaded successfully.');
				});
			});
		});
};
