import _ from 'lodash';

import Account from '@/models/account.ts';
import GameSummaryBuilder from '@/models/game-summary/GameSummaryBuilder.ts';

import type { ActiveGame } from '../game.d.ts';
import { sendInProgressGameUpdate, sendInProgressModChatUpdate } from '../util.ts';

import { shufflePolicies, startElection } from './common.ts';
import { CURRENT_SEASON_NUMBER } from '@/src/frontend-scripts/constants.ts';

/**
 * @param {object} game - game to act on.
 */
const beginGame = (game: ActiveGame) => {
	const { experiencedMode } = game.general;
	const { customGameSettings } = game;

	if (!game.private.seatedPlayers) {
		game.private.seatedPlayers = [];
		console.warn('seatedPlayers was undefined, setting to empty array, game:', JSON.stringify(game));
	}

	const { seatedPlayers } = game.private;

	game.general.timeStarted = Date.now();
	game.general.type = Math.floor((game.publicPlayersState.length - 5) / 2);

	if (!customGameSettings.enabled) {
		// Standard game, this object needs populating.
		customGameSettings.hitlerZone = 3;
		customGameSettings.vetoZone = 5;
		customGameSettings.trackState = { lib: 0, fas: 0 };
		customGameSettings.deckState = { lib: 6, fas: 11 };
		if (game.general.type === 0) {
			// 5-6 players
			customGameSettings.fascistCount = 1;
			customGameSettings.hitKnowsFas = true;
			customGameSettings.powers = [null, null, 'deckpeek', 'bullet', 'bullet'];
			if (game.general.rebalance6p && game.publicPlayersState.length === 6) customGameSettings.trackState.fas = 1;
		} else if (game.general.type === 1) {
			// 7-8 players
			customGameSettings.fascistCount = 2;
			customGameSettings.hitKnowsFas = false;
			customGameSettings.powers = [null, 'investigate', 'election', 'bullet', 'bullet'];
			if (game.general.rebalance7p && game.publicPlayersState.length === 7) customGameSettings.deckState.fas = 10;
		} else {
			// 9-10 players
			customGameSettings.fascistCount = 3;
			customGameSettings.hitKnowsFas = false;
			customGameSettings.powers = ['investigate', 'investigate', 'election', 'bullet', 'bullet'];
			if (game.general.rebalance9p2f && game.publicPlayersState.length === 9) customGameSettings.deckState.fas = 10;
		}
	}

	shufflePolicies(game, true);

	const roles: any[] = [
		{
			cardName: 'hitler',
			icon: 6,
			team: 'fascist',
		},
	]
		.concat(
			_.shuffle(
				// With custom games, up to 8 libs can be in a game, but there are only 6 cards. Two are re-used in this case.
				_.range(0, 8)
					.map((el: any): any => {
						if (game.general.avalonSH?.withPercival)
							return {
								cardName: el === 1 ? 'percival' : el === 0 ? 'merlin' : 'liberal',
								icon: el <= 1 ? undefined : (el - 2) % 6,
								team: 'liberal',
							};

						if (game.general.avalonSH)
							return {
								cardName: el === 0 ? 'merlin' : 'liberal',
								icon: el === 0 ? undefined : (el - 1) % 6,
								team: 'liberal',
							};

						return {
							cardName: 'liberal',
							icon: el % 6,
							team: 'liberal',
						};
					})
					.slice(0, game.publicPlayersState.length - customGameSettings.fascistCount - 1),
			),
		)
		.concat(
			_.shuffle(
				_.range(18, 21)
					.map((el) => {
						if (game.general.avalonSH?.withPercival) {
							return {
								cardName: el % 3 === 0 ? 'morgana' : 'fascist',
								icon: el,
								team: 'fascist',
							};
						}

						return {
							cardName: 'fascist',
							icon: el,
							team: 'fascist',
						};
					})
					.slice(0, customGameSettings.fascistCount),
			),
		);

	game.general.status = 'Dealing roles..';

	game.publicPlayersState.forEach((player) => {
		player.cardStatus.cardDisplayed = true;
	});

	seatedPlayers.forEach((player: any, i: number) => {
		// TODO: check, used to be seatedPlayers
		const index = Math.floor(Math.random() * roles.length);

		player.role = roles[index];

		roles.splice(index, 1);
		player.playersState = _.range(0, game.publicPlayersState.length).map((play: any) => ({}));

		player.playersState.forEach((play: any, index: number) => {
			play.notificationStatus = play.nameStatus = '';

			play.cardStatus = i === index ? { cardBack: player.role } : {};
		});

		if (game.general.avalonSH?.withPercival) {
			player.gameChats.push({
				gameChat: true,
				timestamp: new Date(),
				chat: [
					{ text: 'This game has ' },
					{
						text: 'merlin',
						type: 'merlin',
					},
					{ text: ', ' },
					{
						text: 'percival',
						type: 'percival',
					},
					{ text: ' and ' },
					{
						text: 'morgana',
						type: 'morgana',
					},
					{ text: '.' },
				],
			});
		} else if (game.general.avalonSH) {
			player.gameChats.push({
				gameChat: true,
				timestamp: new Date(),
				chat: [
					{ text: 'This game has ' },
					{
						text: 'merlin',
						type: 'merlin',
					},
					{ text: '.' },
				],
			});
		}

		if (!game.general.disableGamechat) {
			player.gameChats.push({
				timestamp: Date.now() + 1,
				gameChat: true,
				chat: [
					{
						text: 'The game begins and you receive the ',
					},
					{
						text: player.role.cardName,
						type: player.role.cardName,
					},
					{
						text: ' role and take seat ',
					},
					{
						text: `#${i + 1}.`,
						type: 'player',
					},
				],
			});
		} else {
			player.gameChats.push({
				gameChat: true,
				timestamp: new Date(),
				chat: [
					{
						text: 'The game begins.',
					},
				],
			});
		}

		const modOnlyChat = {
			timestamp: new Date(),
			gameChat: true,
			chat: [
				{
					text: `${player.userName} {${i + 1}}`,
					type: 'player',
				},
				{
					text: ' is assigned the ',
				},
				{
					text: player.role.cardName === 'hitler' ? 'hitler' : player.role.cardName,
					type: player.role.cardName,
				},
				{
					text: ' role.',
				},
			],
		};
		game.private.hiddenInfoChat?.push(modOnlyChat);
		sendInProgressModChatUpdate(game, modOnlyChat);
	});

	const libPlayers = seatedPlayers.filter((player: any) => player.role.team === 'liberal'); // TODO: check, used to be seatedPlayers
	const fasPlayers = seatedPlayers.filter((player: any) => player.role.team !== 'liberal');
	const lib = libPlayers.map((player: any) => player.userName) || []; // TODO: check - is this right?
	const fas = fasPlayers.map((player: any) => player.userName) || [];
	const libElo = { overall: 1600, season: 1600 };
	const fasElo = { overall: 1600, season: 1600 };

	Account.find({
		username: { $in: seatedPlayers?.map((player: any) => player.userName) },
	}).then((accounts) => {
		libElo.overall = lib.reduce((prev: any, curr: any) => (accounts.find((account) => account.username === curr)?.overall?.elo || 1600) + prev, 0) / lib.length;
		libElo.season =
			lib.reduce(
				(prev: any, curr: any) => (accounts.find((account) => account.username === curr)?.seasons?.get(CURRENT_SEASON_NUMBER.toString())?.elo || 1600) + prev,
				0,
			) / lib.length;
		fasElo.overall = fas.reduce((prev: any, curr: any) => (accounts.find((account) => account.username === curr)?.overall?.elo || 1600) + prev, 0) / fas.length;
		fasElo.season =
			fas.reduce(
				(prev: any, curr: any) => (accounts.find((account) => account.username === curr)?.seasons?.get(CURRENT_SEASON_NUMBER.toString())?.elo || 1600) + prev,
				0,
			) / fas.length;
	});

	game.private.summary = new GameSummaryBuilder(
		game.general.uid,
		new Date(),
		{
			rebalance6p: game.general.rebalance6p && seatedPlayers?.length === 6,
			rebalance7p: game.general.rebalance7p && seatedPlayers?.length === 7,
			rebalance9p: false,
			rerebalance9p: game.general.rerebalance9p && seatedPlayers?.length === 9,
			casualGame: Boolean(game.general.casualGame),
			practiceGame: Boolean(game.general.practiceGame),
			unlistedGame: Boolean(game.general.unlistedGame),
			avalonSH: game.general.avalonSH,
			noTopdecking: game.general.noTopdecking,
		},
		game.customGameSettings,
		seatedPlayers?.map((p: any) => ({
			username: p.userName,
			role: p.role.cardName,
			icon: p.role.icon,
		})) || [],
		libElo,
		fasElo,
	);

	console.log(game.private.summary);

	game.private.unSeatedGameChats = [
		{
			gameChat: true,
			timestamp: new Date(),
			chat: [
				{
					text: 'The game begins.',
				},
			],
		},
	];

	sendInProgressGameUpdate(game);
	const hitlerPlayer = seatedPlayers?.find((player: any) => player.role.cardName === 'hitler');

	if (!hitlerPlayer) {
		return;
	}

	setTimeout(
		() => {
			seatedPlayers?.forEach((player: any, i: number) => {
				// TODO: check if this is needed: const { seatedPlayers } = game.private;
				const { cardName } = player.role;
				player.playersState[seatedPlayers.indexOf(player)].nameStatus = cardName;

				if (cardName === 'fascist' || cardName === 'morgana') {
					if (customGameSettings.fascistCount === 2) {
						const otherFascist = seatedPlayers?.find(
							(play: any) => play.role.team === 'fascist' && play.role.cardName !== 'hitler' && play.userName !== player.userName,
						);
						const otherFascistIndex = seatedPlayers?.indexOf(otherFascist);

						if (!otherFascist) {
							return;
						}

						if (!game.general.disableGamechat) {
							player.gameChats.push({
								timestamp: new Date(),
								gameChat: true,
								chat: [
									{
										text: 'You see that the other ',
									},
									{
										text: 'fascist',
										type: 'fascist',
									},
									{
										text: ' in this game is ',
									},
									{
										text: game.general.blindMode ? `{${otherFascistIndex + 1}}` : `${otherFascist.userName} {${otherFascistIndex + 1}}`,
										type: 'player',
									},
									{
										text: '.',
									},
								],
							});
						}
						player.playersState[otherFascistIndex].nameStatus = 'fascist';
						player.playersState[otherFascistIndex].notificationStatus = 'fascist';
					} else if (customGameSettings.fascistCount === 3) {
						const otherFascists = seatedPlayers.filter(
							(play: any) => play.role.team === 'fascist' && play.role.cardName !== 'hitler' && play.userName !== player.userName,
						);

						if (!game.general.disableGamechat) {
							player.gameChats.push({
								timestamp: new Date(),
								gameChat: true,
								chat: [
									{
										text: 'You see that the other ',
									},
									{
										text: 'fascists',
										type: 'fascist',
									},
									{
										text: ' in this game are ',
									},
									{
										text: game.general.blindMode
											? `{${seatedPlayers.indexOf(otherFascists[0]) + 1}}`
											: `${otherFascists[0].userName} {${seatedPlayers.indexOf(otherFascists[0]) + 1}}`,
										type: 'player',
									},
									{
										text: ' and ',
									},
									{
										text: game.general.blindMode
											? `{${seatedPlayers.indexOf(otherFascists[1]) + 1}}`
											: `${otherFascists[1].userName} {${seatedPlayers.indexOf(otherFascists[1]) + 1}}`,
										type: 'player',
									},
									{
										text: '.',
									},
								],
							});
						}
						otherFascists.forEach((fascistPlayer: any) => {
							player.playersState[seatedPlayers.indexOf(fascistPlayer)].nameStatus = 'fascist';
						});
						otherFascists.forEach((fascistPlayer: any) => {
							player.playersState[seatedPlayers.indexOf(fascistPlayer)].notificationStatus = 'fascist';
						});
					}

					const chat = {
						timestamp: new Date(),
						gameChat: true,
						chat: [
							{
								text: 'You see that ',
							},
							{
								text: 'hitler',
								type: 'hitler',
							},
							{
								text: ' in this game is ',
							},
							{
								text: game.general.blindMode
									? `{${seatedPlayers.indexOf(hitlerPlayer) + 1}}`
									: `${hitlerPlayer.userName} {${seatedPlayers.indexOf(hitlerPlayer) + 1}}`,
								type: 'player',
							},
						],
					};

					if (!game.general.disableGamechat) {
						if (customGameSettings.hitKnowsFas) {
							chat.chat.push(
								{ text: '. They also see that you are a ' },
								{
									text: 'fascist',
									type: 'fascist',
								},
								{ text: '.' },
							);
						} else {
							chat.chat.push(
								{ text: '. They do not know you are a ' },
								{
									text: 'fascist',
									type: 'fascist',
								},
								{ text: '.' },
							);
						}
						player.gameChats.push(chat);
					}

					player.playersState[seatedPlayers.indexOf(hitlerPlayer)].notificationStatus = 'hitler';
					player.playersState[seatedPlayers.indexOf(hitlerPlayer)].nameStatus = 'hitler';
				} else if (cardName === 'hitler') {
					if (customGameSettings.hitKnowsFas) {
						if (customGameSettings.fascistCount === 1) {
							const otherFascist = seatedPlayers.find((player: any) => player.role.team === 'fascist' && player.role.cardName !== 'hitler');

							if (!game.general.disableGamechat) {
								player.gameChats.push({
									timestamp: new Date(),
									gameChat: true,
									chat: [
										{
											text: 'You see that the other ',
										},
										{
											text: 'fascist',
											type: 'fascist',
										},
										{
											text: ' in this game is ',
										},
										{
											text: game.general.blindMode
												? `{${seatedPlayers.indexOf(otherFascist) + 1}}`
												: `${otherFascist.userName} {${seatedPlayers.indexOf(otherFascist) + 1}}`,
											type: 'player',
										},
										{
											text: '.  They know who you are.',
										},
									],
								});
							}
							player.playersState[seatedPlayers.indexOf(otherFascist)].nameStatus = 'fascist';
							player.playersState[seatedPlayers.indexOf(otherFascist)].notificationStatus = 'fascist';
						} else {
							const otherFascists = seatedPlayers.filter((play: any) => play.role.team === 'fascist' && play.userName !== player.userName);

							if (!game.general.disableGamechat) {
								player.gameChats.push({
									timestamp: new Date(),
									gameChat: true,
									chat: [
										{
											text: 'You see that the other ',
										},
										{
											text: 'fascists',
											type: 'fascist',
										},
										{
											text: ' in this game are ',
										},
										{
											text: game.general.blindMode
												? `{${seatedPlayers.indexOf(otherFascists[0]) + 1}}`
												: `${otherFascists[0].userName} {${seatedPlayers.indexOf(otherFascists[0]) + 1}}`,
											type: 'player',
										},
										{
											text: customGameSettings.fascistCount === 3 ? ', ' : '',
										},
										{
											text:
												customGameSettings.fascistCount === 3
													? game.general.blindMode
														? `{${seatedPlayers.indexOf(otherFascists[2]) + 1}}`
														: `${otherFascists[2].userName} {${seatedPlayers.indexOf(otherFascists[2]) + 1}}`
													: '',
											type: 'player',
										},
										{
											text: customGameSettings.fascistCount === 3 ? ', and' : ' and ',
										},
										{
											text: game.general.blindMode
												? `{${seatedPlayers.indexOf(otherFascists[1]) + 1}}`
												: `${otherFascists[1].userName} {${seatedPlayers.indexOf(otherFascists[1]) + 1}}`,
											type: 'player',
										},
										{
											text: '.',
										},
									],
								});
							}
							otherFascists.forEach((fascistPlayer: any) => {
								player.playersState[seatedPlayers.indexOf(fascistPlayer)].nameStatus = 'fascist';
								player.playersState[seatedPlayers.indexOf(fascistPlayer)].notificationStatus = 'fascist';
							});
						}
					} else {
						if (!game.general.disableGamechat) {
							player.gameChats.push({
								timestamp: new Date(),
								gameChat: true,
								chat: [
									{
										text: `There ${customGameSettings.fascistCount === 1 ? 'is' : 'are'} `,
									},
									{
										text: customGameSettings.fascistCount === 1 ? '1 fascist' : customGameSettings.fascistCount === 2 ? '2 fascists' : '3 fascists',
										type: 'fascist',
									},
									{
										text: ', they know who you are.',
									},
								],
							});
						}
					}
				} else if (game.general.avalonSH && cardName === 'merlin') {
					const fascists = seatedPlayers.filter((play: any) => play.role.team === 'fascist');

					if (fascists.length === 2) {
						player.gameChats.push({
							timestamp: new Date(),
							gameChat: true,
							chat: [
								{
									text: 'You see that the ',
								},
								{
									text: 'fascists',
									type: 'fascist',
								},
								{
									text: ' in this game are ',
								},
								{
									text: game.general.blindMode
										? `{${seatedPlayers.indexOf(fascists[0]) + 1}}`
										: `${fascists[0].userName} {${seatedPlayers.indexOf(fascists[0]) + 1}}`,
									type: 'player',
								},
								{
									text: ' and ',
								},
								{
									text: game.general.blindMode
										? `{${seatedPlayers.indexOf(fascists[1]) + 1}}`
										: `${fascists[1].userName} {${seatedPlayers.indexOf(fascists[1]) + 1}}`,
									type: 'player',
								},
								{
									text: '.',
								},
							],
						});
					} else if (fascists.length === 3) {
						player.gameChats.push({
							timestamp: new Date(),
							gameChat: true,
							chat: [
								{
									text: 'You see that the ',
								},
								{
									text: 'fascists',
									type: 'fascist',
								},
								{
									text: ' in this game are ',
								},
								{
									text: game.general.blindMode
										? `{${seatedPlayers.indexOf(fascists[0]) + 1}}`
										: `${fascists[0].userName} {${seatedPlayers.indexOf(fascists[0]) + 1}}`,
									type: 'player',
								},
								{
									text: ', ',
								},
								{
									text: game.general.blindMode
										? `{${seatedPlayers.indexOf(fascists[1]) + 1}}`
										: `${fascists[1].userName} {${seatedPlayers.indexOf(fascists[1]) + 1}}`,
									type: 'player',
								},
								{
									text: ' and ',
								},
								{
									text: game.general.blindMode
										? `{${seatedPlayers.indexOf(fascists[2]) + 1}}`
										: `${fascists[2].userName} {${seatedPlayers.indexOf(fascists[2]) + 1}}`,
									type: 'player',
								},
								{
									text: '.',
								},
							],
						});
					} else if (fascists.length === 4) {
						player.gameChats.push({
							timestamp: new Date(),
							gameChat: true,
							chat: [
								{
									text: 'You see that the ',
								},
								{
									text: 'fascists',
									type: 'fascist',
								},
								{
									text: ' in this game are ',
								},
								{
									text: game.general.blindMode
										? `{${seatedPlayers.indexOf(fascists[0]) + 1}}`
										: `${fascists[0].userName} {${seatedPlayers.indexOf(fascists[0]) + 1}}`,
									type: 'player',
								},
								{
									text: ', ',
								},
								{
									text: game.general.blindMode
										? `{${seatedPlayers.indexOf(fascists[1]) + 1}}`
										: `${fascists[1].userName} {${seatedPlayers.indexOf(fascists[1]) + 1}}`,
									type: 'player',
								},
								{
									text: ', ',
								},
								{
									text: game.general.blindMode
										? `{${seatedPlayers.indexOf(fascists[2]) + 1}}`
										: `${fascists[2].userName} {${seatedPlayers.indexOf(fascists[2]) + 1}}`,
									type: 'player',
								},
								{
									text: ' and ',
								},
								{
									text: game.general.blindMode
										? `{${seatedPlayers.indexOf(fascists[3]) + 1}}`
										: `${fascists[3].userName} {${seatedPlayers.indexOf(fascists[3]) + 1}}`,
									type: 'player',
								},
								{
									text: '.',
								},
							],
						});
					}
					fascists.forEach((p: any) => (player.playersState[seatedPlayers.indexOf(p)].nameStatus = 'fascist'));
				} else if (game.general.avalonSH?.withPercival && cardName === 'percival') {
					const candidates = seatedPlayers.filter((player: any) => player.role.cardName === 'merlin' || player.role.cardName === 'morgana');

					player.gameChats.push({
						timestamp: new Date(),
						gameChat: true,
						chat: [
							{
								text: 'You see that ',
							},
							{
								text: 'merlin',
								type: 'merlin',
							},
							{
								text: ' and ',
							},
							{
								text: 'morgana',
								type: 'morgana',
							},
							{
								text: ' are ',
							},
							{
								text: game.general.blindMode
									? `{${seatedPlayers.indexOf(candidates[0]) + 1}}`
									: `${candidates[0].userName} {${seatedPlayers.indexOf(candidates[0]) + 1}}`,
								type: 'player',
							},
							{
								text: ' and ',
							},
							{
								text: game.general.blindMode
									? `{${seatedPlayers.indexOf(candidates[1]) + 1}}`
									: `${candidates[1].userName} {${seatedPlayers.indexOf(candidates[1]) + 1}}`,
								type: 'player',
							},
							{
								text: ', but you do not know which is which.',
							},
						],
					});

					player.playersState[seatedPlayers.indexOf(candidates[0])].nameStatus = 'merlin_candidate';
					player.playersState[seatedPlayers.indexOf(candidates[1])].nameStatus = 'merlin_candidate';
				}

				player.playersState[i].cardStatus.isFlipped = true;
			});
			sendInProgressGameUpdate(game);
		},
		process.env.NODE_ENV === 'development' ? 100 : experiencedMode ? 200 : 2000,
	);

	setTimeout(
		() => {
			seatedPlayers.forEach((player: any, i: number) => {
				// TODO: used to be `seatedPlayers`
				if (!player.playersState) {
					return;
				}
				player.playersState[i].cardStatus.isFlipped = false;
				player.playersState.forEach((play: any) => {
					play.notificationStatus = '';
				});
			});
			sendInProgressGameUpdate(game, true);
		},
		process.env.NODE_ENV === 'development' ? 100 : 5000,
	);

	setTimeout(
		() => {
			game.publicPlayersState.forEach((player: any) => {
				player.cardStatus.cardDisplayed = false;
			});
			sendInProgressGameUpdate(game, true);
		},
		process.env.NODE_ENV === 'development' ? 100 : experiencedMode ? 5200 : 7000,
	);

	setTimeout(
		() => {
			seatedPlayers.forEach((player: any) => {
				player.playersState.forEach((state: any) => {
					state.cardStatus = {};
				});
			});
			game.gameState.presidentIndex = -1;
			startElection(game);
		},
		process.env.NODE_ENV === 'development' ? 100 : experiencedMode ? 5400 : 9000,
	);

	for (let affectedPlayerNumber = 0; affectedPlayerNumber < game.publicPlayersState.length; affectedPlayerNumber++) {
		const affectedSocketId = Array.from(io.sockets.sockets.keys()).find((socketId) => {
			const s = io.sockets.sockets.get(socketId);

			if (!s) return false;

			const handshake = s.handshake as any;

			return handshake?.session?.passport && handshake.session.passport.user === game.publicPlayersState[affectedPlayerNumber].userName;
		});

		const affectedSocket = affectedSocketId && io.sockets.sockets.get(affectedSocketId);

		if (!affectedSocket) {
			continue;
		}

		if (process.env.NODE_ENV !== 'development') {
			affectedSocket.emit('pingPlayer', 'Secret Hitler IO: The game has started!');
		}
	}
};

/**
 * @param {object} game - game to act on.
 */
export default (game: ActiveGame) => {
	game.gameState.isTracksFlipped = true;
	let startGamePause = process.env.NODE_ENV === 'development' ? 1 : 5;

	const countDown = setInterval(() => {
		if (!startGamePause) {
			clearInterval(countDown);
			beginGame(game);
		} else {
			game.general.status = `Game starts in ${startGamePause} second${startGamePause === 1 ? '' : 's'}.`;
			sendInProgressGameUpdate(game, true);
			startGamePause--;
		}
	}, 1000)[Symbol.toPrimitive]();

	game.private.hiddenInfoChat = [];
	game.private.hiddenInfoSubscriptions = [];
	game.private.hiddenInfoShouldNotify = true;

	game.general.playerCount = game.publicPlayersState.length;
	game.general.livingPlayerCount = game.publicPlayersState.length;
	game.general.type = game.general.playerCount < 7 ? 0 : game.general.playerCount < 9 ? 1 : 2; // different fascist tracks
	game.publicPlayersState = _.shuffle(game.publicPlayersState);
	game.private.seatedPlayers = _.cloneDeep(game.publicPlayersState);
	game.private.seatedPlayers.forEach((player: any) => {
		player.gameChats = [];
		player.wasInvestigated = false;
	});
	game.gameState.audioCue = '';
	game.private.policies = [];
	game.private.voteSpamData = game.private.seatedPlayers.map((player: any) => ({
		unvoteTimer: -1,
	}));
};
