import { Socket } from 'socket.io';

import Account from '@/models/account.ts';
import Game from '@/models/game.ts';
import ModAction from '@/models/modAction.ts';
import PlayerNote from '@/models/playerNote.ts';
import PlayerReport from '@/models/playerReport.ts';
import { getProfile } from '@/models/profile/utils.ts';
import Signups from '@/models/signups.ts';

import type { ActiveGame } from '@/shared/game.d.ts';
import { CURRENT_SEASON_NUMBER } from '@/shared/constants.ts';
import version from '@/shared/version.ts';

import { obfIP } from './ip-obf.ts';
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
	staffList,
	User,
} from './models.ts';
import { sendInProgressGameUpdate } from './util.ts';

/**
 * @param {object} socket - user socket reference.
 */
export const sendUserList = (socket?: Socket) => {
	// eslint-disable-line one-var
	if (socket) {
		const staffUserList = Object.keys(staffList).filter(
			(name) => staffList[name] === 'trialmod' || staffList[name] === 'moderator' || staffList[name] === 'editor' || staffList[name] === 'admin',
		);

		const handshake: any = socket.handshake;

		if (staffUserList.includes(handshake?.session?.passport?.user)) {
			socket.emit('userList', { list: formattedUserList(true) });
		} else {
			socket.emit('userList', { list: formattedUserList(false) });
		}
	} else {
		userListEmitter.send = true;
	}
};

export const getModInfo = (games: Record<any, any>, users: any[], socket: Socket, queryObj: any, count = 1, isTrial: boolean, isAEM: boolean) => {
	const maskEmail = (email: string) => (email && email.split('@')[1]) || '';
	ModAction.find(queryObj)
		.sort({ $natural: -1 })
		.limit(500 * count)
		.then((actions) => {
			const list = users.map((user) => {
				const usr = userList.find((userListUser) => user.username === userListUser.userName);

				return usr
					? {
							status: usr.status,
							isRainbow: user.isRainbowOverall,
							userName: user.username,
							ip: user.lastConnectedIP || user.signupIP,
							email: `${user.verified ? '+' : '-'}${maskEmail(user.verification.email)}`,
						}
					: {};
			});

			list.forEach((user) => {
				if (user.ip && user.ip != '') {
					try {
						user.ip = '-' + obfIP(user.ip);
					} catch (e) {
						user.ip = 'ERROR';
						console.log(e);
					}
				}
			});

			actions.forEach((action) => {
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
				Object.values(games).forEach((game) => {
					gList.push({
						name: game.general.name,
						uid: game.general.uid,
						electionNum: game.general.electionCount,
						casual: game.general.casualGame,
						private: game.general.private,
						custom: game.customGameSettings.enabled,
						unlisted: game.general.unlistedGame,
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
				showActions: !isTrial && isAEM,
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
		.then((signups) => {
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
export const sendModInfo = (games: Record<any, ActiveGame>, socket: Socket, count: number, isTrial: boolean, isAEM: boolean) => {
	const userNames = userList.map((user) => user.userName);

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
	const handshake: any = socket?.handshake;

	if (!handshake?.session) return;

	const { passport } = handshake.session;

	if (!passport || !passport.user) return;

	Account.findOne({ username: passport.user })
		.then((account) => {
			socket.emit('gameSettings', account?.gameSettings);

			const userListNames = userList.map((user) => user.userName);

			getProfile(passport.user);

			if (account && !userListNames.includes(passport.user)) {
				const userListInfo: User = {
					userName: passport.user,
					playerPronouns: account.gameSettings?.playerPronouns,
					staffRole: account.staffRole || '',
					isContributor: account.isContributor || false,
					staff: account.gameSettings?.staff,
					isRainbowOverall: account.isRainbowOverall || false,
					isRainbowSeason: account.isRainbowSeason || false,
					isPrivate: account.gameSettings?.isPrivate || false,
					tournyWins: account.gameSettings?.tournyWins,
					blacklist: account.gameSettings?.blacklist,
					customCardback: account.gameSettings?.customCardback,
					previousSeasonAward: account.gameSettings?.previousSeasonAward,
					specialTournamentStatus: account.gameSettings?.specialTournamentStatus,
					overall: account.overall
						? (account.overall as any).toObject()
						: {
								wins: 0,
								losses: 0,
								rainbowWins: 0,
								rainbowLosses: 0,
								elo: 1600,
								xp: 0,
							},
					season: account.seasons
						? (account.seasons.get(CURRENT_SEASON_NUMBER.toString()) as any).toObject()
						: {
								wins: 0,
								losses: 0,
								rainbowWins: 0,
								rainbowLosses: 0,
								elo: 1600,
								xp: 0,
							},
					status: {
						type: 'none',
						gameId: null,
					},
				};

				userListInfo.overall.elo = Math.floor(userListInfo.overall.elo);
				userListInfo.season.elo = Math.floor(userListInfo.season.elo);

				userList.push(userListInfo);
				sendUserList();
			}

			getProfile(passport.user);

			socket.emit('version', {
				current: version,
				lastSeen: account?.lastVersionSeen || 'none',
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
		.then((notes) => {
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
export const sendGameList = (socket?: Socket, isAEM?: boolean) => {
	// eslint-disable-line one-var
	if (socket) {
		let gameList = formattedGameList();
		gameList = gameList.filter((game) => isAEM || (game && !game.isUnlisted));
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
		.then((reports) => {
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
export const updateUserStatus = (passport: any, game?: ActiveGame, override?: string) => {
	const user = userList.find((user) => user.userName === passport.user);

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
			gameId: game ? game.general.uid : false,
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
	const handshake: any = socket?.handshake;

	if (!handshake?.session) return;

	const { passport } = handshake.session;

	if (game && game.publicPlayersState && game.general) {
		if (passport && Object.keys(passport).length) {
			const player = game.publicPlayersState.find((player) => player.userName === passport.user);

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
