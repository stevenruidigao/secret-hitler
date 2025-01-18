import _ from 'lodash';

import type { ActiveGame } from '../game.d.ts';
import { sendGameList } from '../user-requests.ts';
import { sendInProgressGameUpdate } from '../util.ts';

import { selectChancellor } from './election-util.ts';

/**
 * @param {object} game - game to act on.
 * @param {boolean} isStart - true if this is the initial shuffle.
 */
export const shufflePolicies = (game: ActiveGame, isStart?: boolean) => {
	if (!game) {
		return;
	}

	if (isStart) {
		game.trackState.enactedPolicies = [];
		if (game.customGameSettings.trackState && game.customGameSettings.trackState.lib > 0) {
			game.trackState.policyCount.liberal = game.customGameSettings.trackState.lib;
			_.range(0, game.customGameSettings.trackState.lib).forEach((num) => {
				game.trackState.enactedPolicies.push({
					cardBack: 'liberal',
					isFlipped: true,
					position: `liberal${num + 1}`,
				});
			});
		}
		if (game.customGameSettings.trackState && game.customGameSettings.trackState.fas > 0) {
			game.trackState.policyCount.fascist = game.customGameSettings.trackState.fas;
			_.range(0, game.customGameSettings.trackState.fas).forEach((num) => {
				game.trackState.enactedPolicies.push({
					cardBack: 'fascist',
					isFlipped: true,
					position: `fascist${num + 1}`,
				});
			});
		}
	}

	const libCount = game.customGameSettings.deckState.lib - game.trackState.policyCount.liberal;
	const fasCount = game.customGameSettings.deckState.fas - game.trackState.policyCount.fascist;

	if (!game.private) {
		game.private = {};
	}

	game.private.policies = _.shuffle(
		_.range(0, libCount)
			.map((num) => 'liberal')
			.concat(_.range(0, fasCount).map((num) => 'fascist')),
	);

	game.gameState.undrawnPolicyCount = game.private?.policies.length || 0;

	if (!game.general.disableGamechat) {
		const chat = {
			timestamp: new Date(),
			gameChat: true,
			chat: [
				{
					text: 'Deck shuffled: ',
				},
				{
					text: `${libCount} liberal`,
					type: 'liberal',
				},
				{
					text: ' and ',
				},
				{
					text: `${fasCount} fascist`,
					type: 'fascist',
				},
				{
					text: ' policies.',
				},
			],
		};

		if (!game.private.seatedPlayers) {
			game.private.seatedPlayers = [];
		}

		game.private.seatedPlayers.forEach((player) => {
			player.gameChats.push(chat);
		});

		if (!game.private.unSeatedGameChats) {
			game.private.unSeatedGameChats = [];
		}

		game.private.unSeatedGameChats.push(chat);
	}

	const modOnlyChat: any = {
		timestamp: new Date(),
		gameChat: true,
		chat: [{ text: 'The deck has been shuffled: ' }],
	};

	game.private.policies.forEach((policy: string) => {
		modOnlyChat.chat.push({
			text: policy === 'liberal' ? 'B' : 'R',
			type: policy,
		});
	});

	if (!game.private.hiddenInfoChat) {
		game.private.hiddenInfoChat = [];
	}

	game.private.hiddenInfoChat.push(modOnlyChat);
};

/**
 * @param {object} game - game to act on.
 * @param {number} specialElectionPresidentIndex - number of index of the special election player (optional)
 */
export const startElection = (game: any, specialElectionPresidentIndex?: number) => {
	const { experiencedMode } = game.general;

	if (game.trackState.fascistPolicyCount >= game.customGameSettings.vetoZone) {
		game.gameState.isVetoEnabled = true;
	}

	if (game.gameState.undrawnPolicyCount < 3) {
		shufflePolicies(game);
	}

	/**
	 * @return {number} index of the president
	 */
	game.gameState.presidentIndex = (() => {
		const { presidentIndex, specialElectionFormerPresidentIndex } = game.gameState;

		/**
		 * @param {number} index - index of the current president
		 * @return {number} index of the next president
		 */
		const nextPresidentIndex = (index: number) => {
			const nextIndex = index + 1 === game.general.playerCount ? 0 : index + 1;

			if (game.publicPlayersState[nextIndex].isDead) {
				return nextPresidentIndex(nextIndex);
			} else {
				return nextIndex;
			}
		};

		if (Number.isInteger(specialElectionPresidentIndex)) {
			return specialElectionPresidentIndex;
		} else if (Number.isInteger(specialElectionFormerPresidentIndex)) {
			game.gameState.specialElectionFormerPresidentIndex = null;
			return nextPresidentIndex(specialElectionFormerPresidentIndex);
		} else {
			return nextPresidentIndex(presidentIndex);
		}
	})();

	game.private.summary = game.private.summary.nextTurn().updateLog({ presidentId: game.gameState.presidentIndex, deckState: _.clone(game.private.policies) });

	const { seatedPlayers } = game.private; // eslint-disable-line one-var
	const { presidentIndex, previousElectedGovernment } = game.gameState;
	const pendingPresidentPlayer = seatedPlayers[presidentIndex];

	game.general.electionCount++;
	sendGameList();
	game.general.status = `Election #${game.general.electionCount}: president to select chancellor.`;
	if (!experiencedMode && !game.general.disableGamechat) {
		pendingPresidentPlayer.gameChats.push({
			gameChat: true,
			timestamp: new Date(),
			chat: [
				{
					text: 'You are president and must select a chancellor.',
				},
			],
		});
	}

	pendingPresidentPlayer.playersState
		.filter(
			(player: any, index: number) =>
				seatedPlayers[index] &&
				!seatedPlayers[index].isDead &&
				index !== presidentIndex &&
				(game.general.livingPlayerCount > 5 ? !previousElectedGovernment.includes(index) : previousElectedGovernment[1] !== index),
		)
		.forEach((player: any) => {
			player.notificationStatus = 'notification';
		});

	game.publicPlayersState.forEach((player: any) => {
		player.cardStatus.cardDisplayed = false;
		player.governmentStatus = '';
	});

	game.publicPlayersState[presidentIndex].governmentStatus = 'isPendingPresident';
	game.publicPlayersState[presidentIndex].isLoader = true;
	game.gameState.phase = 'selectingChancellor';

	if (game.general.timedMode) {
		if (game.private.timerId) {
			clearTimeout(game.private.timerId);
			game.private.timerId = null;
		}
		game.gameState.timedModeEnabled = true;
		game.private.timerId = setTimeout(
			() => {
				if (game.gameState.timedModeEnabled) {
					const chancellorIndex = _.shuffle(game.gameState.clickActionInfo[1])[0];

					selectChancellor({ user: pendingPresidentPlayer.userName }, game, { chancellorIndex });
					game.private.replayGameChats.push({
						gameChat: true,
						timestamp: new Date(),
						chat: [
							{
								text: pendingPresidentPlayer.userName,
								type: 'player',
							},
							{
								text: ' was forced by the timer to select a random chancellor.',
							},
						],
					});
				}
			},
			typeof process.env.DEVTIMEDDELAY === 'number' ? process.env.DEVTIMEDDELAY : game.general.timedMode * 1000,
		)[Symbol.toPrimitive]();
	}

	game.gameState.clickActionInfo =
		game.general.livingPlayerCount > 5
			? [
					pendingPresidentPlayer.userName,
					seatedPlayers
						.filter((player: any, index: number) => !player.isDead && index !== presidentIndex && !previousElectedGovernment.includes(index))
						.map((el: any) => seatedPlayers.indexOf(el)),
				]
			: [
					pendingPresidentPlayer.userName,
					seatedPlayers
						.filter((player: any, index: number) => !player.isDead && index !== presidentIndex && previousElectedGovernment[1] !== index)
						.map((el: any) => seatedPlayers.indexOf(el)),
				];

	sendInProgressGameUpdate(game);
};
