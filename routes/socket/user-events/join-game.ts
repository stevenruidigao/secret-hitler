import { Socket } from 'socket.io';

import Account from '../../../models/account.ts';
import { CURRENT_SEASON_NUMBER } from '../../../src/frontend-scripts/constants.ts';
import { userInBlacklist } from '../../../utils/index.ts';

import type { ActiveGame, Player } from '../game.d.ts';
import { games, limitNewPlayers } from '../models.ts';
import { updateUserStatus, sendGameList } from '../user-requests.ts';
import { sendCommandChatsUpdate } from '../util.ts';

import { checkStartConditions } from './leave-game.ts'; // this used to be a separate game-countdown.js but that isn't really helpful tbh

/**
 * @param {object} socket - user socket reference.
 * @param {object} passport - socket authentication.
 * @param {object} data - from socket emit.
 */
export const updateSeatedUser = (socket: Socket, passport: any, data: { uid: string, password?: string }) => {
	// Authentication Assured in routes.ts
	// In-game Assured in routes.ts
	const game: ActiveGame = games[data.uid];
	// prevents race condition between 1) taking a seat and 2) the game starting

	if (!game || !game.gameState || game.gameState.isTracksFlipped) {
		return; // Game already started
	}

	const isBlacklistSafe = !game.private?.gameCreatorBlacklist || !userInBlacklist(passport.user, game.private.gameCreatorBlacklist); // we can check blacklist before hitting mongo

	if (!isBlacklistSafe) {
		socket.emit('gameJoinStatusUpdate', {
			status: 'blacklisted'
		});
		return;
	}

	Account.findOne({ username: passport.user }).then((account) => {
		const isNotMaxedOut = game.publicPlayersState.length < game.general.maxPlayersCount;
		const isNotInGame = !game.publicPlayersState.find((player) => player.userName === passport.user);
		const isRainbowSafe = !game.general.rainbowgame || (game.general.rainbowgame && account?.isRainbowOverall);
		const isPrivateSafe =
			!game.general.private ||
			(game.general.private && (data.password === game.private?.privatePassword || game.general.whitelistedPlayers.includes(passport.user)));
		const isMeetingEloMinimum = !game.general.eloMinimum || (account?.seasons && game.general.eloMinimum <= (account.seasons.get(CURRENT_SEASON_NUMBER.toString())?.elo || 1600)) || game.general.eloMinimum <= (account?.overall?.elo || 1600);
		const isMeetingXPMinimum = !game.general.xpMinimum || game.general.xpMinimum <= (account?.overall?.xp || 0);

		if ((account?.overall?.wins || 0) + (account?.overall?.losses || 0) < 3 && limitNewPlayers.status && !game.general.private) {
			return;
		}

		if (isNotMaxedOut && isNotInGame && isRainbowSafe && isPrivateSafe && isBlacklistSafe && isMeetingEloMinimum && isMeetingXPMinimum) {
			const { publicPlayersState } = game;
			const player: Player = {
				userName: passport.user,
				connected: true,
				isDead: false,
				customCardback: account?.gameSettings?.customCardback,
				isPrivate: account?.gameSettings?.isPrivate || false,
				tournyWins: account?.gameSettings?.tournyWins,
				previousSeasonAward: account?.gameSettings?.previousSeasonAward || '',
				specialTournamentStatus: account?.gameSettings?.specialTournamentStatus || '',
				staff: account?.gameSettings?.staff,
				cardStatus: {
					cardDisplayed: false,
					isFlipped: false,
					cardFront: 'secretrole',
					cardBack: {}
				}
			};

			if (game.general.isTourny) {
				if (
					game.general.tournyInfo.queuedPlayers.map((player: any) => player.userName).includes(player.userName) ||
					game.general.tournyInfo.queuedPlayers.length >= game.general.maxPlayersCount
				) {
					return;
				}

				game.general.tournyInfo.queuedPlayers.push(player);

				if (!game.chats) {
					game.chats = [];
				}
	
				game.chats.push({
					timestamp: new Date(),
					gameChat: true,
					chat: [
						{
							text: `${passport.user}`,
							type: 'player'
						},
						{
							text: ` (${game.general.tournyInfo.queuedPlayers.length}/${game.general.maxPlayersCount}) has entered the tournament queue.`
						}
					]
				});
			} else {
				publicPlayersState.unshift(player);
			}

			socket.emit('updateSeatForUser', true);
			checkStartConditions(game);
			updateUserStatus(passport, game);
			sendCommandChatsUpdate(game);
			sendGameList();
		}
	});
};
