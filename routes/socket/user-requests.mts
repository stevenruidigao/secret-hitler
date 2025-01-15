import { Socket } from 'socket.io';

import Account from '../../models/account.mts';
import Game from '../../models/game.mts';
import ModAction from '../../models/modAction.mts';
import PlayerNote from '../../models/playerNote.mts';
import PlayerReport from '../../models/playerReport.mts';
import { getProfile } from '../../models/profile/utils.mts';
import Signups from '../../models/signups.mts';

import { CURRENT_SEASON_NUMBER } from '../../src/frontend-scripts/constants.mts';
import version from '../../version.mts';

import { obfIP } from './ip-obf.mts';
import {
	games,
	userList,
	generalChats,
	accountCreationDisabled,
	ipbansNotEnforced,
	gameCreationDisabled,
	limitNewPlayers,
	bypassVPNCheck,
	userListEmitter,
	formattedUserList,
	gameListEmitter,
	formattedGameList,
	staffList
} from './models.mts';
import { sendInProgressGameUpdate } from './util.mts';

/**
 * @param {object} socket - user socket reference.
 */
export const sendUserList = (socket?: any) => {
	// eslint-disable-line one-var
	if (socket) {
		const staffUserList = Object.keys(staffList).filter(
			name => staffList[name] === 'trialmod' || staffList[name] === 'moderator' || staffList[name] === 'editor' || staffList[name] === 'admin'
		);

		if (staffUserList.includes(socket?.handshake?.session?.passport?.user)) {
			socket.emit('userList', { list: formattedUserList(true) });
		} else {
			socket.emit('userList', { list: formattedUserList(false) });
		}
	} else {
		userListEmitter.send = true;
	}
};

export const getModInfo = (games: any[], users: any[], socket: Socket, queryObj: any, count = 1, isTrial: boolean, isAEM: boolean) => {
	const maskEmail = (email: string) => (email && email.split('@')[1]) || '';
	ModAction.find(queryObj)
		.sort({ $natural: -1 })
		.limit(500 * count)
		.then((actions: any[]) => {
			const list = users.map(user => {
				const usr: any = userList.find((userListUser: any) => user.username === userListUser.userName);

				return usr
					? {
							status: usr.status,
							isRainbow: user.isRainbowOverall,
							userName: user.username,
							ip: user.lastConnectedIP || user.signupIP,
							email: `${user.verified ? '+' : '-'}${maskEmail(user.verification.email)}`
					  }
					: {};
			});

			list.forEach(user => {
				if (user.ip && user.ip != '') {
					try {
						user.ip = '-' + obfIP(user.ip);
					} catch (e) {
						user.ip = 'ERROR';
						console.log(e);
					}
				}
			});

			actions.forEach(action => {
				if (action.ip && action.ip != '') {
					if (action.ip.startsWith('-')) {
						action.ip = 'ERROR'; // There are some bugged IPs in the list right now, need to suppress it.
					} else {
						try {
							action.ip = '-' + obfIP(action.ip);
						} catch (e) {
							action.ip = 'ERROR';
							console.log(e);
						}
					}
				}
			});

			const gList: any[] = [];

			if (games) {
				Object.values(games).forEach(game => {
					gList.push({
						name: game.general.name,
						uid: game.general.uid,
						electionNum: game.general.electionCount,
						casual: game.general.casualGame,
						private: game.general.private,
						custom: game.customGameSettings.enabled,
						unlisted: game.general.unlistedGame
					});
				});
			}

			socket.emit('modInfo', {
				modReports: actions,
				accountCreationDisabled,
				ipbansNotEnforced,
				gameCreationDisabled,
				limitNewPlayers,
				bypassVPNCheck,
				userList: list,
				gameList: gList,
				showActions: !isTrial && isAEM
			});
		})
		.catch((err: Error) => {
			console.log(err, 'err in finding mod actions');
		});
};

export const sendSignups = (socket: Socket, types = ['local', 'discord', 'github']) => {
	Signups.find({ type: { $in: types } })
		.sort({ $natural: -1 })
		.limit(500)
		.select({ unobfuscatedIP: 0 })
		.then((signups: any[]) => {
			socket.emit('signupsInfo', signups);
		})
		.catch((err: Error) => {
			console.log(err, 'err in finding signups');
		});
};

export const sendAllSignups = (socket: Socket) => {
	sendSignups(socket, ['local', 'private', 'discord', 'github']);
};

export const sendPrivateSignups = (socket: Socket) => {
	sendSignups(socket, ['private']);
};

/**
 * @param {array} games - list of all games
 * @param {object} socket - user socket reference.
 * @param {number} count - depth of modinfo requested.
 * @param {boolean} isTrial - true if the user is a trial mod.
 * @param {boolean} isAEM - true if the user is a AEM member.
 */
export const sendModInfo = (games: any[], socket: Socket, count: number, isTrial: boolean, isAEM: boolean) => {
	const userNames = userList.map((user: any) => user.userName);

	Account.find({ username: { $in: userNames }, 'gameSettings.isPrivate': { $ne: true } })
		.then((users) => {
			getModInfo(games, users, socket, {}, count, isTrial, isAEM);
		})
		.catch((err: Error) => {
			console.log(err, 'err in sending mod info');
		});
};

/**
 * @param {object} socket - user socket reference.
 */
export const sendUserGameSettings = (socket: Socket) => {
	const handshake = socket?.handshake as any;

	if (!handshake?.session) return;

	const { passport } = handshake.session;

	if (!passport || !passport.user) return;

	Account.findOne({ username: passport.user })
		.then((account) => {
			socket.emit('gameSettings', account?.gameSettings);

			const userListNames = userList.map((user: any) => user.userName);

			getProfile(passport.user);

			if (account && !userListNames.includes(passport.user)) {
				const userListInfo: Record<string, any> = {
					userName: passport.user,
					playerPronouns: account.gameSettings?.playerPronouns,
					staffRole: account.staffRole || '',
					isContributor: account.isContributor || false,
					staff: account.gameSettings?.staff,
					isRainbowOverall: account.isRainbowOverall,
					isRainbowSeason: account.isRainbowSeason,
					isPrivate: account.gameSettings?.isPrivate,
					tournyWins: account.gameSettings?.tournyWins,
					blacklist: account.gameSettings?.blacklist,
					customCardback: account.gameSettings?.customCardback,
					previousSeasonAward: account.gameSettings?.previousSeasonAward,
					specialTournamentStatus: account.gameSettings?.specialTournamentStatus,
					overall: account.overall,
					season: account.seasons ? account.seasons.get(CURRENT_SEASON_NUMBER.toString()) : {},
					status: {
						type: 'none',
						gameId: null
					}
				};

				userList.push(userListInfo);
				sendUserList();
			}

			getProfile(passport.user);

			socket.emit('version', {
				current: version,
				lastSeen: account?.lastVersionSeen || 'none'
			});
		})
		.catch((err: Error) => {
			console.log(err);
		});
};

/**
 * @param {object} socket - user socket reference.
 * @param {object} data - data about the request
 */
export const sendPlayerNotes = (socket: Socket, data: any) => {
	PlayerNote.find({ userName: data.userName, notedUser: { $in: data.seatedPlayers } })
		.then((notes: any) => {
			if (notes) {
				socket.emit('notesUpdate', notes);
			}
		})
		.catch((err: Error) => {
			console.log(err, 'err in getting playernotes');
		});
};

/**
 * @param {object} socket - user socket reference.
 * @param {string} uid - uid of game.
 */
export const sendReplayGameData = (socket: Socket, uid: string) => {
	Game.findOne({ uid })
		.select({ _id: 0, _v: 0 })
		.then((game) => {
			if (game) {
				socket.emit('replayGameData', game);
			}
		})
		.catch((err: Error) => {
			if (err) {
				console.log(err, 'game err retrieving for replay');
			}
		});
};

/**
 * @param {object} socket - user socket reference.
 * @param {boolean} isAEM - user AEM designation
 */
export const sendGameList = (socket?: any, isAEM?: boolean) => {
	// eslint-disable-line one-var
	if (socket) {
		let gameList = formattedGameList();
		gameList = gameList.filter(game => isAEM || (game && !game.isUnlisted));
		socket.emit('gameList', gameList);
	} else {
		gameListEmitter.send = true;
	}
};

/**
 * @param {object} socket - user socket reference.
 */
export const sendUserReports = (socket: Socket) => {
	PlayerReport.find()
		.sort({ $natural: -1 })
		.limit(500)
		.then((reports: any[]) => {
			socket.emit('reportInfo', reports);
		});
};

/**
 * @param {object} socket - user socket reference.
 */
export const sendGeneralChats = (socket: Socket) => {
	socket.emit('generalChats', generalChats);
};

/**
 * @param {object} passport - socket authentication.
 * @param {object} game - target game.
 * @param {string} override - type of user status to be displayed.
 */
export const updateUserStatus = (passport: any, game?: any, override?: string) => {
	const user: any = userList.find((user: any) => user.userName === passport.user);

	if (user) {
		user.status = {
			type:
				override && game && !game.general.unlistedGame
					? override
					: game
					? game.general.private
						? 'private'
						: !game.general.unlistedGame && game.general.rainbowgame
						? 'rainbow'
						: !game.general.unlistedGame
						? 'playing'
						: 'none'
					: 'none',
			gameId: game ? game.general.uid : false
		};

		sendUserList();
	}
};

/**
 * @param {object} socket - user socket reference.
 * @param {string} uid - uid of game.
 */
export const sendGameInfo = (socket: Socket, uid: string) => {
	const game = games[uid];
	const handshake = socket?.handshake as any;

	if (!handshake?.session) return;

	const { passport } = handshake.session;

	if (game && game.publicPlayersState && game.general) {
		if (passport && Object.keys(passport).length) {
			const player = game.publicPlayersState.find((player: any) => player.userName === passport.user);

			if (player) {
				player.leftGame = false;
				player.connected = true;
				if (game.general) game.general.timeAbandoned = null;
				socket.emit('updateSeatForUser', true);
				updateUserStatus(socket, game);
			} else {
				updateUserStatus(socket, game, 'observing');
			}
		}

		socket.join(uid);
		sendInProgressGameUpdate(game);
		socket.emit('joinGameRedirect', game.general.uid);
	} else {
		Game.findOne({ uid })
			.then((game) => {
				socket.emit('manualReplayRequest', game ? game.uid : '');
			})
			.catch((err: Error) => {
				if (err) {
					console.log(err, 'game err retrieving for replay');
				}
			});
	}
};
