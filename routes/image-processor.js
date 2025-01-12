const path = require('path');
const sharp = require('sharp');

const Account = require('../models/account');
const { userList, userListEmitter, games } = require('./socket/models');
const { sendCommandChatsUpdate } = require('./socket/util');
const { sendGameList } = require('./socket/user-requests');

module.exports.ProcessImage = (username, raw, callback) => {
	sharp(Buffer.from(raw, 'base64'))
		.resize(70, 95)
		.toFile(path.join('public/images/custom-cardbacks/', path.basename(`${username}.png`)), err => {
			if (err) {
				callback(null, err);
				return;
			}

			Account.findOne({ username: username }).then(account => {
				account.gameSettings.customCardback = account.gameSettings.customCardback || {};
				account.gameSettings.customCardback.fileExtension = 'png';
				account.gameSettings.customCardback.saveTime = Date.now().toString();
				account.gameSettings.customCardback.uid = Math.random()
					.toString(36)
					.substring(2);

				account.save(() => {
					const user = userList.find(u => u.userName === username);

					if (user) {
						user.customCardback = user.customCardback || {};
						user.customCardback.fileExtension = 'png';
						user.customCardback.uid = account.gameSettings.customCardback.uid;
						userListEmitter.send = true;
					}

					Object.keys(games).forEach(uid => {
						const game = games[uid];
						const foundUser = game.publicPlayersState.find(user => user.userName === username);

						if (foundUser) {
							foundUser.customCardback = {}; // reset cardback?
							sendCommandChatsUpdate(game);
							sendGameList();
						}
					});

					const socketId = Object.keys(io.sockets.sockets).find(
						socketId => io.sockets.sockets[socketId].handshake.session.passport && io.sockets.sockets[socketId].handshake.session.passport.user === username
					);

					if (socketId && io.sockets.sockets[socketId]) {
						io.sockets.sockets[socketId].emit('gameSettings', account.gameSettings);
					}

					callback('Image uploaded successfully.');
				});
			});
		});
};
