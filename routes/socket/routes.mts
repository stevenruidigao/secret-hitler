import userEvents from './user-events.mts';

const {
	handleUpdatedTruncateGame,
	handleUpdatedReportGame,
	handleAddNewGame,
	handleAddNewGameChat,
	handleNewGeneralChat,
	handleUpdatedGameSettings,
	handleSocketDisconnect,
	handleUserLeaveGame,
	checkUserStatus,
	updateSeatedUser,
	handleUpdateWhitelist,
	handleAddNewClaim,
	handleModerationAction,
	handlePlayerReport,
	handlePlayerReportDismiss,
	handleUpdatedBio,
	handleUpdatedRemakeGame,
	handleUpdatedPlayerNote,
	handleSubscribeModChat,
	handleModPeekVotes,
	handleModPeekRemakes,
	handleGameFreeze,
	handleHasSeenNewPlayerModal,
	handleFlappyEvent,
	handleUpdatedTheme,
	handleOpenChat,
	handleCloseChat,
	handleUnsubscribeChat,
	handleAddNewModDMChat
} = userEvents;

import {
	sendPlayerNotes,
	sendUserReports,
	sendGameInfo,
	sendUserGameSettings,
	sendModInfo,
	sendGameList,
	sendGeneralChats,
	sendUserList,
	sendReplayGameData,
	sendSignups,
	sendAllSignups,
	sendPrivateSignups,
	updateUserStatus
} from './user-requests.mts';

import https from 'https';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';

import Account from '../../models/account.mts';
import { TOU_CHANGES } from '../../src/frontend-scripts/constants.mjs';
import version from '../../version.mjs';

import { games, emoteList, cloneSettingsFromRedis, modDMs, getStaffList } from './models.mts';
import { handleAEMMessages } from './util.mts';

import { selectPlayerToAssassinate } from './game/assassination.mts';
import { selectChancellor } from './game/election-util.mts';
import { selectVoting, selectPresidentPolicy, selectChancellorPolicy, selectChancellorVoteOnVeto, selectPresidentVoteOnVeto } from './game/election.mts';
import { saveAndDeleteGame } from './game/end-game.mts';
import {
	selectSpecialElection,
	selectPartyMembershipInvestigate,
	selectPolicies,
	selectPlayerToExecute,
	selectPartyMembershipInvestigateReverse,
	selectOnePolicy,
	selectBurnCard
} from './game/policy-powers.mts';

dayjs.extend(duration);
dayjs.extend(relativeTime);

let modUserNames: any[] = [],
	editorUserNames: any[] = [],
	adminUserNames: any[] = [];

const gamesGarbageCollector = () => {
	const currentTime = new Date();
	Object.keys(games).forEach(gameName => {
		let toDelete = false;
		const currentGame = games[gameName];
		if (!currentGame) return;

		const completedTimer =
			currentGame.gameState &&
			currentGame.gameState.isCompleted &&
			currentGame.gameState.timeCompleted &&
			new Date(currentGame.gameState.timeCompleted + 1000 * 60 * 2);
		const abandonedTimer = currentGame.general && currentGame.general.timeAbandoned && new Date(currentGame.general.timeAbandoned.getTime() + 1000 * 60 * 2);

		// To come maybe later
		// const modDeleteTimer = games[gameName].general.modDeleteDelay && new Date(games[gameName].general.modDeleteDelay.getTime() + 900000);

		// DEBUG
		// console.log(
		// 	'Name: ',
		// 	gameName,
		// 	// '\nDelay: ',
		// 	// games[gameName].general.modDeleteDelay,
		// 	'\nCurrent Time: ',
		// 	currentTime,
		// 	// '\nDelay Timer: ',
		// 	// modDeleteTimer,
		// 	'\nCompleted Timer: ',
		// 	completedTimer
		// );

		toDelete = (!games[gameName].general.modDeleteDelay && completedTimer && completedTimer < currentTime) || (abandonedTimer && abandonedTimer < currentTime);

		// if (games[gameName] && modDeleteTimer && modDeleteTimer < currentTime) {
		// console.log('Mod Delete Delay Timer Expired. Deleting... ');
		// toDelete = true;
		// }

		if (toDelete && currentGame.publicPlayersState) {
			for (let affectedPlayerNumber = 0; affectedPlayerNumber < currentGame.publicPlayersState.length; affectedPlayerNumber++) {
				const affectedSocketId = Array.from(io.sockets.sockets.keys()).find(
					socketId =>
						io.sockets.sockets.get(socketId).handshake.session.passport &&
						io.sockets.sockets.get(socketId).handshake.session.passport.user === currentGame.publicPlayersState[affectedPlayerNumber].userName
				);
				if (!io.sockets.sockets.get(affectedSocketId)) {
					continue;
				}

				// I'm entirely unsure why socketio seems to misbehave with these combined so often - probably just bad timing
				if (io.sockets.sockets && io.sockets.sockets.get(affectedSocketId)) io.sockets.sockets.get(affectedSocketId).emit('toLobby', currentGame.uid);
				if (io.sockets.sockets && io.sockets.sockets.get(affectedSocketId)) io.sockets.sockets.get(affectedSocketId).leave(gameName);
			}

			saveAndDeleteGame(gameName);
		}
	});

	// also clone in global settings from redis
	cloneSettingsFromRedis();
};

const ensureAuthenticated = (socket: any) => {
	if (socket.handshake && socket.handshake.session) {
		const { passport } = socket.handshake.session;

		return Boolean(passport && passport.user && Object.keys(passport).length);
	}
};

const findGame = (data: any) => {
	if (games && data && data.uid) {
		return games[data.uid];
	}
};

const ensureInGame = (passport: any, game: any) => {
	if (game && game.publicPlayersState && game.gameState && passport && passport.user) {
		const player = game.publicPlayersState.find((player: any) => player.userName === passport.user);

		return Boolean(player);
	}
};

const gatherStaffUsernames = () => {
	Account.find({ staffRole: { $exists: true } })
		.then((accounts: any[]) => {
			modUserNames = accounts.filter((account: any) =>account.staffRole === 'moderator').map((account: any) =>account.username);
			editorUserNames = accounts.filter((account: any) =>account.staffRole === 'editor').map((account: any) =>account.username);
			adminUserNames = accounts.filter((account: any) =>account.staffRole === 'admin').map((account: any) =>account.username);
		})
		.catch((err: Error) => {
			console.log(err, 'err in finding staffroles');
		});
};

export const socketRoutes = () => {
	setInterval(gamesGarbageCollector, 30000);

	gatherStaffUsernames();

	io.on('connection', (socket: any) => {
		checkUserStatus(socket, () => {
			socket.emit('version', { current: version });

			// defensively check if game exists
			socket.use((packet: any, next: any) => {
				const data = packet[1];
				const uid = data && data.uid;
				const isGameFound = uid && findGame(data);

				if (!uid || isGameFound) {
					return next();
				} else {
					socket.emit('gameUpdate', {});
				}
			});

			const { passport } = socket.handshake.session;
			const authenticated = ensureAuthenticated(socket);

			let isAEM = false;
			let isTrial = false;
			let isTourneyMod = false;

			if (authenticated && passport && passport.user) {
				Account.findOne({ username: passport.user }).then((account: any) => {
					if (
						account.staffRole &&
						account.staffRole.length > 0 &&
						account.staffRole !== 'trialmod' &&
						account.staffRole !== 'altmod' &&
						account.staffRole !== 'veteran'
					) {
						isAEM = true;
					}
					if (account.staffRole && account.staffRole.length > 0 && account.staffRole === 'trialmod') isTrial = true;
					if (account.isTournamentMod) isTourneyMod = true;
				});
			}

			sendGeneralChats(socket);
			sendGameList(socket, isAEM);

			let isRestricted: boolean | undefined = true;

			const checkRestriction = (account: any) => {
				if (!account || !passport || !passport.user || !socket) return;
				const parseVer = (ver: string) => {
					const vals: any = ver.split('.');
					vals.forEach((v: string, i: number) => (vals[i] = parseInt(v)));
					return vals;
				};
				const firstVerNew = (v1: any[], v2: any[]) => {
					for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
						if (!v2[i]) return true;
						if (!v1[i] || isNaN(v1[i]) || v1[i] < v2[i]) return false;
						if (v1[i] > v2[i]) return true;
					}
					return true;
				};

				if (account.touLastAgreed && account.touLastAgreed.length) {
					const changesSince: any[] = [];
					const myVer = parseVer(account.touLastAgreed);
					TOU_CHANGES.forEach(change => {
						if (!firstVerNew(myVer, parseVer(change.changeVer))) changesSince.push(change);
					});
					if (changesSince.length) {
						socket.emit('touChange', changesSince);
						return true;
					}
				} else {
					socket.emit('touChange', [TOU_CHANGES[TOU_CHANGES.length - 1]]);
					return true;
				}
				const warnings = account.warnings.filter((warning: any) => !warning.acknowledged);
				if (warnings.length > 0) {
					const { moderator, acknowledged, ...firstWarning } = warnings[0]; // eslint-disable-line no-unused-vars
					socket.emit('warningPopup', firstWarning);
					return true;
				}
				// implement other restrictions as needed
				socket.emit('removeAllPopups');
				return false;
			};

			if (passport && passport.user && authenticated) {
				Account.findOne({ username: passport.user }).then((account: any) => {
					isRestricted = checkRestriction(account);
				});
			}

			// Instantly sends the userlist as soon as the websocket is created.
			// For some reason, sending the userlist before this happens actually doesn't work on the client. The event gets in, but is not used.
			socket.conn.on('upgrade', () => {
				sendUserList(socket);
				socket.emit('emoteList', emoteList);

				// sockets should not be unauthenticated but let's make sure anyway
				if (passport && passport.user) {
					const dmID = Object.keys(modDMs).find(x => modDMs[x].subscribedPlayers.indexOf(passport.user) !== -1);
					if (dmID) {
						socket.emit('preOpenModDMs');
						socket.emit('openModDMs', handleAEMMessages(modDMs[dmID], passport.user, modUserNames, editorUserNames, adminUserNames));
					}
				}
			});

			socket.on('receiveRestrictions', () => {
				Account.findOne({ username: passport.user }).then((account: any) => {
					isRestricted = checkRestriction(account);
				});
			});

			socket.on('seeWarnings', (username: string) => {
				if (isAEM) {
					Account.findOne({ username: username }).then((account: any) => {
						if (account) {
							if (account.warnings && account.warnings.length > 0) {
								socket.emit('sendWarnings', { username, warnings: account.warnings });
							} else {
								socket.emit('sendAlert', `That user doesn't have any warnings.`);
							}
						} else {
							socket.emit('sendAlert', `That user doesn't exist.`);
						}
					});
				} else {
					socket.emit('sendAlert', `Are you sure you're supposed to be doing that?`);
					console.log(passport.user, 'tried to receive warnings for', username);
				}
			});

			// user-events
			socket.on('disconnect', () => {
				handleSocketDisconnect(socket);
			});

			socket.on('requestUserList', () => {
				sendUserList(socket);
			});

			socket.on('feedbackForm', (data: any) => {
				if (!(passport && passport.user && authenticated)) {
					socket.emit('feedbackResponse', { status: 'error', message: 'You are not logged in.' });
					return;
				}

				if (!(data && data.feedback)) {
					socket.emit('feedbackResponse', { status: 'error', message: 'You cannot submit empty feedback.' });
					return;
				}

				if (data.feedback.length <= 1900) {
					Account.findOne({ username: passport.user }).then((account: any) => {
						if (!account.feedbackSubmissions) account.feedbackSubmissions = [];
						const newFeedback = {
							date: new Date(),
							feedback: data.feedback
						};

						if (account.feedbackSubmissions.length >= 2) {
							const secondMostRecentIndex = account.feedbackSubmissions.length - 2;
							if (newFeedback.date.valueOf() - account.feedbackSubmissions[secondMostRecentIndex].date > 1000 * 60 * 60 * 24) {
								// if it's been 24 hours since the *2nd* most recent feedback submission
								account.feedbackSubmissions.push(newFeedback);
							} else {
								socket.emit('feedbackResponse', {
									status: 'error',
									message:
										'You can only submit feedback twice a day. You can submit feedback again in ' +
										dayjs.duration(24 * 60 * 60 * 1000 - (newFeedback.date.valueOf() - account.feedbackSubmissions[secondMostRecentIndex].date)).humanize() +
										'.'
								});
								return;
							}
						} else {
							account.feedbackSubmissions.push(newFeedback);
						}

						let feedback: any = {
							content: `__**Player**__: ${passport.user}\n__**Feedback**__: ${data.feedback}`,
							username: 'Feedback',
							allowed_mentions: { parse: [] }
						};

						try {
							feedback = JSON.stringify(feedback);
							const req = https.request({
								hostname: 'discordapp.com',
								path: process.env.DISCORDFEEDBACKURL,
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
									'Content-Length': Buffer.byteLength(feedback)
								}
							});
							req.end(feedback);
							socket.emit('feedbackResponse', { status: 'success', message: 'Thank you for submitting feedback!' });
						} catch (e) {
							console.log(e);
							socket.emit('feedbackResponse', { status: 'error', message: 'An unknown error occurred.' });
						}

						account.save();
					});
				} else {
					socket.emit('feedbackResponse', { status: 'error', message: 'Your feedback is too long.' });
				}
			});

			socket.on('flappyEvent', (data: any) => {
				if (isRestricted) return;
				const game = findGame(data);
				if (authenticated && ensureInGame(passport, game)) {
					handleFlappyEvent(data, game);
				}
			});

			socket.on('hasSeenNewPlayerModal', () => {
				if (authenticated) {
					handleHasSeenNewPlayerModal(socket);
				}
			});

			socket.on('getSignups', () => {
				if (authenticated && isAEM) {
					sendSignups(socket);
				}
			});

			socket.on('getAllSignups', () => {
				if (authenticated && isAEM) {
					sendAllSignups(socket);
				}
			});

			socket.on('getPrivateSignups', () => {
				if (authenticated && isAEM) {
					sendPrivateSignups(socket);
				}
			});

			socket.on('regatherAEMUsernames', () => {
				if (authenticated && isAEM) {
					gatherStaffUsernames();
					getStaffList();
				}
			});

			socket.on('aemOpenChat', (data: any) => {
				if (authenticated && isAEM) {
					handleOpenChat(socket, data, modUserNames, editorUserNames, adminUserNames);
				}
			});

			socket.on('aemCloseChat', (data: any) => {
				if (authenticated && isAEM) {
					handleCloseChat(socket, data, modUserNames, editorUserNames, adminUserNames);
				}
			});

			socket.on('aemUnsubscribeChat', (data: any) => {
				if (authenticated && isAEM) {
					handleUnsubscribeChat(socket, data, modUserNames, editorUserNames, adminUserNames);
				}
			});

			socket.on('modDMsAddChat', (data: any) => {
				if (authenticated) {
					handleAddNewModDMChat(socket, passport, data, modUserNames, editorUserNames, adminUserNames);
				}
			});

			socket.on('confirmTOU', () => {
				if (authenticated && isRestricted) {
					Account.findOne({ username: passport.user }).then((account: any) => {
						account.touLastAgreed = TOU_CHANGES[0].changeVer;
						account.save();
						isRestricted = checkRestriction(account);
					});
				}
			});

			socket.on('acknowledgeWarning', () => {
				if (authenticated && isRestricted) {
					Account.findOne({ username: passport.user }).then((acc: any) => {
						acc.warnings[acc.warnings.findIndex((warning: any) => !warning.acknowledged)].acknowledged = true;
						acc.markModified('warnings');
						acc.save(() => (isRestricted = checkRestriction(acc)));
					});
				}
			});

			socket.on('handleUpdatedPlayerNote', (data: any) => {
				handleUpdatedPlayerNote(socket, passport, data);
			});

			socket.on('handleUpdatedTheme', (data: any) => {
				handleUpdatedTheme(socket, passport, data);
			});

			socket.on('updateModAction', (data: any) => {
				if (authenticated && isAEM) {
					handleModerationAction(socket, passport, data, false, modUserNames, editorUserNames.concat(adminUserNames));
				}
			});
			socket.on('addNewClaim', (data: any) => {
				const game = findGame(data);
				if (authenticated && ensureInGame(passport, game)) {
					handleAddNewClaim(socket, passport, game, data);
				}
			});
			socket.on('updateGameWhitelist', (data: any) => {
				const game = findGame(data);
				if (authenticated && ensureInGame(passport, game)) {
					handleUpdateWhitelist(passport, game, data);
				}
			});
			socket.on('updateTruncateGame', (data: any) => {
				handleUpdatedTruncateGame(data);
			});
			socket.on('addNewGameChat', (data: any) => {
				const game = findGame(data);
				if (isRestricted) return;
				if (authenticated) {
					handleAddNewGameChat(socket, passport, data, game, modUserNames, editorUserNames, adminUserNames, handleAddNewClaim, isTourneyMod);
				}
			});
			socket.on('updateReportGame', (data: any) => {
				try {
					handleUpdatedReportGame(socket, data);
				} catch (e) {
					console.log(e, 'err in player report');
				}
			});
			socket.on('addNewGame', (data: any) => {
				if (isRestricted) return;
				if (authenticated) {
					handleAddNewGame(socket, passport, data);
				}
			});
			socket.on('updateGameSettings', (data: any) => {
				if (authenticated) {
					handleUpdatedGameSettings(socket, passport, data);
				}
			});

			socket.on('addNewGeneralChat', (data: any) => {
				if (isRestricted) return;

				if (authenticated) {
					handleNewGeneralChat(socket, passport, data, modUserNames, editorUserNames, adminUserNames);
				}
			});
			socket.on('leaveGame', (data: any) => {
				const game = findGame(data);

				if (game && game.general && io.sockets.adapter.rooms[game.general.uid] && socket) {
					socket.leave(game.general.uid);
				}

				if (authenticated && game) {
					handleUserLeaveGame(socket, game, data, passport);
				}
			});
			socket.on('updateSeatedUser', (data: any) => {
				if (isRestricted) return;
				if (authenticated) {
					updateSeatedUser(socket, passport, data);
				}
			});
			socket.on('playerReport', (data: any, callback: Function) => {
				if (isRestricted || !data || !data.comment || data.comment.length > 140) return;
				if (authenticated) {
					handlePlayerReport(passport, data, callback);
				}
			});
			socket.on('playerReportDismiss', () => {
				if (authenticated && isAEM) {
					handlePlayerReportDismiss();
				}
			});
			socket.on('updateRemake', (data: any) => {
				const game = findGame(data);
				if (authenticated && ensureInGame(passport, game)) {
					handleUpdatedRemakeGame(passport, game, data, socket);
				}
			});
			socket.on('updateBio', (data: any) => {
				if (authenticated) {
					handleUpdatedBio(socket, passport, data);
				}
			});
			// user-requests

			socket.on('getPlayerNotes', (data: any) => {
				sendPlayerNotes(socket, data);
			});
			socket.on('getGameList', () => {
				sendGameList(socket);
			});
			socket.on('getGameInfo', (uid: string) => {
				sendGameInfo(socket, uid);
			});
			socket.on('getUserList', () => {
				sendUserList(socket);
			});
			socket.on('getGeneralChats', () => {
				sendGeneralChats(socket);
			});
			socket.on('getUserGameSettings', () => {
				sendUserGameSettings(socket);
			});
			socket.on('selectedChancellorVoteOnVeto', (data: any) => {
				if (isRestricted) return;
				const game = findGame(data);
				if (authenticated && ensureInGame(passport, game)) {
					selectChancellorVoteOnVeto(passport, game, data);
				}
			});
			socket.on('getModInfo', (count: number) => {
				if (authenticated && (isAEM || isTrial)) {
					sendModInfo(games, socket, count, isTrial, isAEM);
				}
			});
			socket.on('subscribeModChat', (uid: string) => {
				const game = findGame({ uid });
				if (authenticated && (isAEM || (isTourneyMod && game.general.unlistedGame))) {
					if (game && game.private && game.private.seatedPlayers) {
						const players = game.private.seatedPlayers.map((player: any) => player.userName);
						Account.find({ staffRole: { $exists: true, $ne: 'veteran' } }).then((accounts: any[]) => {
							const staff = accounts
								.filter((acc: any) => {
									acc.staffRole && acc.staffRole.length > 0 && players.includes(acc.username);
								})
								.map(acc => acc.username);
							if (staff.length) {
								socket.emit('sendAlert', `AEM members are present: ${JSON.stringify(staff)}`);
								return;
							}
							handleSubscribeModChat(socket, passport, game);
						});
					} else socket.emit('sendAlert', 'Game is missing.');
				}
			});
			socket.on('modPeekVotes', (data: any) => {
				if (!data) return;
				const uid = data.uid;
				const game = findGame({ uid });
				if (authenticated && (isAEM || (isTourneyMod && game.general.unlistedGame))) {
					if (game && game.private && game.private.seatedPlayers) {
						handleModPeekVotes(socket, passport, game, data.modName);
					} else {
						socket.emit('sendAlert', 'Game is missing.');
					}
				}
			});
			socket.on('modGetRemakes', (data: any) => {
				if (!data) return;
				const uid = data.uid;
				const game = findGame({ uid });
				if (authenticated && (isAEM || (isTourneyMod && game.general.unlistedGame))) {
					if (game && game.private && game.private.seatedPlayers) {
						handleModPeekRemakes(socket, passport, game, data.modName);
					} else {
						socket.emit('sendAlert', 'Game is missing.');
					}
				}
			});
			socket.on('modFreezeGame', (data: any) => {
				const uid = data.uid;
				const game = findGame({ uid });
				if (authenticated && (isAEM || (isTourneyMod && game.general.unlistedGame))) {
					if (game && game.private && game.private.seatedPlayers) {
						handleGameFreeze(socket, passport, game, data.modName);
					} else {
						socket.emit('sendAlert', 'Game is missing.');
					}
				}
			});
			socket.on('getUserReports', () => {
				if (authenticated && (isAEM || isTrial)) {
					sendUserReports(socket);
				}
			});
			socket.on('updateUserStatus', (type: string, gameId: string) => {
				const game = findGame({ uid: gameId });
				if (authenticated && ensureInGame(passport, game)) {
					updateUserStatus(passport, game);
				} else if (authenticated) {
					updateUserStatus(passport);
				}
			});
			socket.on('getReplayGameData', (uid: string) => {
				sendReplayGameData(socket, uid);
			});
			// election

			socket.on('presidentSelectedChancellor', (data: any) => {
				if (isRestricted) return;
				const game = findGame(data);
				if (authenticated && ensureInGame(passport, game)) {
					selectChancellor(socket, passport, game, data);
				}
			});
			socket.on('selectedVoting', (data: any) => {
				if (isRestricted) return;
				const game = findGame(data);
				if (authenticated && ensureInGame(passport, game)) {
					selectVoting(passport, game, data, socket);
				}
			});
			socket.on('selectedPresidentPolicy', (data: any) => {
				if (isRestricted) return;
				const game = findGame(data);
				if (authenticated && ensureInGame(passport, game)) {
					selectPresidentPolicy(passport, game, data, false, socket);
				}
			});
			socket.on('selectedChancellorPolicy', (data: any) => {
				if (isRestricted) return;
				const game = findGame(data);
				if (authenticated && ensureInGame(passport, game)) {
					selectChancellorPolicy(passport, game, data, false, socket);
				}
			});
			socket.on('selectedPresidentVoteOnVeto', (data: any) => {
				if (isRestricted) return;
				const game = findGame(data);
				if (authenticated && ensureInGame(passport, game)) {
					selectPresidentVoteOnVeto(passport, game, data, socket);
				}
			});
			// policy-powers
			socket.on('selectPartyMembershipInvestigate', (data: any) => {
				if (isRestricted) return;
				const game = findGame(data);
				if (authenticated && ensureInGame(passport, game)) {
					selectPartyMembershipInvestigate(passport, game, data, socket);
				}
			});
			socket.on('selectPartyMembershipInvestigateReverse', (data: any) => {
				if (isRestricted) return;
				const game = findGame(data);
				if (authenticated && ensureInGame(passport, game)) {
					selectPartyMembershipInvestigateReverse(passport, game, data, socket);
				}
			});
			socket.on('selectedPolicies', (data: any) => {
				if (isRestricted) return;
				const game = findGame(data);
				if (authenticated && ensureInGame(passport, game)) {
					if (game.private.lock.policyPeekAndDrop) selectOnePolicy(passport, game);
					else selectPolicies(passport, game, socket);
				}
			});
			socket.on('selectedPresidentVoteOnBurn', (data: any) => {
				if (isRestricted) return;
				const game = findGame(data);
				if (authenticated && ensureInGame(passport, game)) {
					selectBurnCard(passport, game, data, socket);
				}
			});
			socket.on('selectedPlayerToExecute', (data: any) => {
				if (isRestricted) return;
				const game = findGame(data);
				if (authenticated && ensureInGame(passport, game)) {
					selectPlayerToExecute(passport, game, data, socket);
				}
			});
			socket.on('selectedSpecialElection', (data: any) => {
				if (isRestricted) return;
				const game = findGame(data);
				if (authenticated && ensureInGame(passport, game)) {
					selectSpecialElection(passport, game, data, socket);
				}
			});
			socket.on('selectedPlayerToAssassinate', (data: any) => {
				if (isRestricted) return;
				const game = findGame(data);
				if (authenticated && ensureInGame(passport, game)) {
					selectPlayerToAssassinate(passport, game, data, socket);
				}
			});
		});
	});
};
