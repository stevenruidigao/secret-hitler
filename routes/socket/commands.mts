import { Server, Socket } from 'socket.io';

import Account from '../../models/account.mts';

import type { ActiveGame } from './game.d.ts';
import { selectPlayerToAssassinate } from './game/assassination.mts';
import { selectChancellor } from './game/election-util.mts';
import { selectVoting } from './game/election.mts';
import { User } from './models.mts';
import { makeReport } from './report.mts';
import { sendInProgressGameUpdate, sendCommandChatsUpdate, LineGuess } from './util.mts';

const io: Server = global.io;

const sendMessage = (game: ActiveGame, user: User, message: string, date = new Date()) => {
	if (!game.private.commandChats) {
		game.private.commandChats = {};
		console.warn('game.private.commandChats was undefined, setting to empty object, game:', JSON.stringify(game));
	}

	return game.private.commandChats[user.userName].push({
		gameChat: true,
		timestamp: date,
		chat: [
			{
				text: message
			}
		]
	});
}

/**
 * Parses a message into a command object.
 *
 * @param {string} msg - the message string.
 *
 * @return {{ name: string, args: (string[]|null), command: (Command|null) }} - the name of the invoked command, as well as the parsed arguments and command object.
 */
export const parseCommand = (msg: string): {
	name: string;
	args: (string[] | null);
	command: (Command | null);
} => {
	const trimPrefix = (s: string, prefix: string) => (s.startsWith(prefix) ? s.slice(prefix.length) : s);
	const cmdRegex = /^\/(\w*)/i;
	const name = cmdRegex.exec(msg.trim()) as RegExpExecArray;
	const cmd = commands.getCommand(name[1]);

	if (!cmd) {
		return { name: name[1], args: null, command: null };
	}

	msg = trimPrefix(msg, name[0]).trim();
	const parsedArgs = cmd.argumentsFormat.exec(msg);

	return { name: name[1].toLowerCase(), args: parsedArgs && parsedArgs.slice(1), command: cmd };
};

/**
 * Runs a command given a user message.
 *
 * @param {Object} socket - socket reference for the user who invoked the command.
 * @param {Object} passport - socket authentication.
 * @param {Object} user - user object who invoked the command.
 * @param {Object} game - game object.
 * @param {string} msg - the message sent by the user.
 * @param {boolean} AEM - whether the user is AEM.
 * @param {boolean} isSeated - whether the user is sat in the game.
 */
export const runCommand = (socket: Socket, passport: any, user: User, game: ActiveGame, msg: string, AEM: boolean, isSeated: boolean) => {
	try {
		if (!game.private.commandChats) {
			game.private.commandChats = {};
			console.warn('game.private.commandChats was undefined, setting to empty object, game:', JSON.stringify(game));
		}
	
		if (!game.private.commandChats[user.userName]) {
			game.private.commandChats[user.userName] = [];
		}

		const { name, command, args } = parseCommand(msg);

		if (!command) {
			sendMessage(game, user, `Unknown command /${name}. Use /help for a list of commands.`);
			return;
		}

		if (command.aemOnly && !AEM) {
			sendMessage(game, user, 'You do not have permission to use this command.');
			return;
		}

		if (command.observerOnly && isSeated) {
			sendMessage(game, user, 'This command cannot be used by seated players.');
			return;
		}

		if (command.seatedOnly && !isSeated) {
			sendMessage(game, user, 'This command cannot be used by observers.');
			return;
		}

		if (command.gameStartedOnly && (!game.gameState.isStarted || game.gameState.isCompleted)) {
			sendMessage(game, user, 'This command can only be used during an in-progress game.');
			return;
		}

		if (!args) {
			sendMessage(game, user, `You're not doing this right. Some examples: ${command.examples.join(', ')}`);
			return;
		}

		command.run(socket, passport, user, game, args, AEM, isSeated);
	} finally {
		if (game.gameState.isTracksFlipped) {
			sendInProgressGameUpdate(game, false);
		} else {
			sendCommandChatsUpdate(game);
		}
	}
};

/**
 * @callback Run
 * @param {Object} socket - socket reference for the user who invoked the command.
 * @param {Object} passport - socket authentication.
 * @param {Object} user - user object who invoked the command.
 * @param {Object} game - game object.
 * @param {string[]} args - the parsed arguments used to invoke the command.
 * @param {boolean} [AEM=] - whether the user is AEM.
 * @param {boolean} [isSeated=] - whether the user is sat in the game.
 */

/**
 * @typedef {Object} Command - objects representing information about commands.
 * @property {string[]} name - the names that can be used to call the command.
 * @property {string} description - a short description of what the command does.
 * @property {string[]} examples - examples of how to use the command.
 * @property {RegExp} argumentsFormat - a regex that determines how the arguments are parsed.
 * @property {boolean} aemOnly - whether the command can only be used by AEM.
 * @property {boolean} observerOnly - whether the command can only be used by observers.
 * @property {boolean} seatedOnly - whether the command can only be used by seated players.
 * @property {boolean} gameStartedOnly - whether the command can only be used during a started game.
 * @property {Run} [run=] - the function called to run the command.
 */
type Command = {
	name: string[];
	description: string;
	examples: string[];
	argumentsFormat: RegExp;
	aemOnly: boolean;
	observerOnly: boolean;
	seatedOnly: boolean;
	gameStartedOnly: boolean;
	run?: any;
}

/**
 * @type {Command[]}
 */
export const commands: Command[] & {
	getCommand: (name: string) => Command | null;
} = [
	{
		name: ['help'],
		description: 'Use your social deduction skills to figure it out',
		examples: ['/help'],
		argumentsFormat: /.*/,
		aemOnly: false,
		observerOnly: false,
		seatedOnly: false,
		gameStartedOnly: false
	},
	{
		name: ['g', 'gl', 'guessline', 'guesslines', 'guesslimes'],
		description: 'Submits a line guess',
		examples: ['/g 123', '/g 56h7', '/g 7890h'],
		argumentsFormat: /^((?:\dh?)+)$/i,
		aemOnly: false,
		observerOnly: true,
		seatedOnly: false,
		gameStartedOnly: true
	},
	{
		name: ['gm', 'guessmerlin'],
		description: 'Submits a merlin guess',
		examples: ['/gm 1'],
		argumentsFormat: /^(\d+)$/i,
		aemOnly: false,
		observerOnly: true,
		seatedOnly: false,
		gameStartedOnly: true
	},
	{
		name: ['pingmod', 'pingmods', 'pingmoderator', 'pingaem', 'pingeditor'],
		description: 'Pings a moderator with a message',
		examples: ['/pingmod Help me'],
		argumentsFormat: /(.*)/,
		aemOnly: false,
		observerOnly: false,
		seatedOnly: true,
		gameStartedOnly: false
	},
	{
		name: ['ping'],
		description: 'Pings a player',
		examples: ['/ping 5'],
		argumentsFormat: /^(\d{1,2})$/,
		aemOnly: false,
		observerOnly: false,
		seatedOnly: true,
		gameStartedOnly: true
	},
	{
		name: ['forcerigdeck'],
		description: 'Changes the deck in the current game, definitely not fake',
		examples: ['/forcerigdeck B', '/forcerigdeck rrrrrrrrrrrbbbbbb'],
		argumentsFormat: /^([RB]{1,27})$/i,
		aemOnly: true,
		observerOnly: true,
		seatedOnly: false,
		gameStartedOnly: true
	},
	{
		name: ['forcevote', 'fv'],
		description: 'Forces a player to vote',
		examples: ['/forcevote 4 ja', '/forcevote 10 nein'],
		argumentsFormat: /^(\d{1,2})\s+(ya|ja|jah|nein|yes|no|true|false)$/i,
		aemOnly: true,
		observerOnly: true,
		seatedOnly: false,
		gameStartedOnly: true
	},
	{
		name: ['forceskip', 'fs'],
		description: 'Forcibly skips a government',
		examples: ['/forceskip 3'],
		argumentsFormat: /^(\d{1,2})$/,
		aemOnly: true,
		observerOnly: true,
		seatedOnly: false,
		gameStartedOnly: true
	},
	{
		name: ['forcepick'],
		description: 'Forcibly picks a chancellor',
		examples: ['/forcepick 3 5'],
		argumentsFormat: /^(\d{1,2})\s+(\d{1,2})$/,
		aemOnly: true,
		observerOnly: true,
		seatedOnly: false,
		gameStartedOnly: true
	},
	{
		name: ['forceping'],
		description: 'Forcibly pings a player',
		examples: ['/forceping 7'],
		argumentsFormat: /^(\d{1,2})$/,
		aemOnly: true,
		observerOnly: true,
		seatedOnly: false,
		gameStartedOnly: true
	},
	{
		name: ['forcerigrole'],
		description: 'Changes a players role, definitely not fake.',
		examples: ['/forcerigrole 1 fascist', '/forcerigrole 9 liberal'],
		argumentsFormat: /^(\d{1,2})\s+(hitler|fascist|liberal|h|f|l|hit|fas|lib|merlin|percival|morgana)$/i,
		aemOnly: true,
		observerOnly: true,
		seatedOnly: false,
		gameStartedOnly: true
	}
] as any;

/**
 * Finds a command in the commands array by name, case-insensitive.
 *
 * @param {string} name - the name of the command to find.
 *
 * @return {Command|null} - the command with that name or null if it is not found.
 */
commands.getCommand = function(name: string) {
	return this.find((c) => c.name.includes(name.toLowerCase())) || null;
};

(commands.getCommand('help') as Command).run = (socket: Socket, passport: any, user: User, game: ActiveGame, args: any, AEM: boolean, isSeated: boolean) => {
	let i = 1;
	sendMessage(game, user, 'List of Commands:');

	if (!game.private.commandChats) {
		game.private.commandChats = {};
		console.warn('game.private.commandChats was undefined, setting to empty object, game:', JSON.stringify(game));
	}

	for (const command of commands) {
		const isNotUsable =
			(command.aemOnly && !AEM) ||
			(command.observerOnly && isSeated) ||
			(command.seatedOnly && !isSeated) ||
			(command.gameStartedOnly && (!game.gameState.isStarted || game.gameState.isCompleted));

		if (!isNotUsable) {
			game.private.commandChats[user.userName].push({
				gameChat: true,
				timestamp: Date.now() + i++,
				chat: [
					{
						text: `/${command.name[0]}`,
						type: 'player'
					},
					{
						text: ` - ${command.description}`
					}
				]
			});
		}
	}
};

(commands.getCommand('g') as Command).run = (socket: Socket, passport: any, user: User, game: ActiveGame, args: any) => {
	if (!game.private.seatedPlayers) {
		game.private.seatedPlayers = [];
		console.warn('seatedPlayers was undefined, setting to empty array, game:', JSON.stringify(game));
	}

	const { seatedPlayers } = game.private;

	if (game.general.private || (game.customGameSettings && game.customGameSettings.enabled)) {
		sendMessage(game, user, 'Line guessing is only enabled in ranked and practice games.');
		return;
	}

	if (game.trackState.policyCount.fascist >= 3 && !['specialElection', 'deckPeek'].includes(game.gameState.phase || '')) { // TODO: check
		sendMessage(game, user, 'Hitler zone has begun, so line guessing has closed.');
		return;
	}

	const guess = LineGuess.parse(args[0]);
	const playerCount = seatedPlayers.length;
	const fasCount = Math.trunc((playerCount - 1) / 2);

	if (!guess) {
		sendMessage(game, user, 'Invalid line guess. Examples of valid line guesses are 12h3, 567.');
		return;
	}

	if (guess.regs.length !== fasCount) {
		sendMessage(game, user, 'Incorrect number of fascists in guess.');
		return;
	}

	if (guess.regs.some(x => x > playerCount)) {
		sendMessage(game, user, 'Invalid seat number.');
		return;
	}

	if (!game.guesses) {
		game.guesses = {};
	}

	if (game.guesses[user.userName]) {
		sendMessage(game, user, `Updated line guess. (${guess.toString()})`);
	} else {
		sendMessage(game, user, `Submitted line guess. (${guess.toString()})`);
	}

	game.guesses[user.userName] = guess;
};

(commands.getCommand('gm') as Command).run = (socket: Socket, passport: any, user: User, game: ActiveGame, args: any) => {
	if (!game.private.seatedPlayers) {
		game.private.seatedPlayers = [];
		console.warn('seatedPlayers was undefined, setting to empty array, game:', JSON.stringify(game));
	}

	const { seatedPlayers } = game.private;

	if (!game.general.avalonSH) {
		sendMessage(game, user, 'Merlin guessing is only enabled in avalon SH games.');
		return;
	}

	const guess = parseInt(args[0], 10);

	if (!guess || guess < 1 || guess > seatedPlayers.length) {
		sendMessage(game, user, 'Invalid merlin guess.');
		return;
	}

	if (game.merlinGuesses[user.userName]) {
		sendMessage(game, user, `Updated merlin guess. (${guess})`);
	} else {
		sendMessage(game, user, `Submitted merlin guess. (${guess})`);
	}

	game.merlinGuesses[user.userName] = guess;
};

(commands.getCommand('pingmod') as Command).run = (socket: Socket, passport: any, user: User, game: ActiveGame, args: any) => {
	if (!game.lastModPing || Date.now() > game.lastModPing + 180000) {
		Account.find({ username: { $in: game.publicPlayersState.map((player) => player.userName) } }).then((accounts) => {
			const staffInGame = accounts
				.filter(
					(account) =>
						account.staffRole === 'altmod' ||
						account.staffRole === 'moderator' ||
						account.staffRole === 'editor' ||
						account.staffRole === 'admin' ||
						account.staffRole === 'trialmod'
				)
				.map(account => account.username);
			if (staffInGame.length !== 0) {
				sendMessage(
					game,
					user,
					`An account used by a moderator or a trial moderator is in this game. Please use the report function in this game and make sure to not out crucial information or just DM another moderator.`
				);
				game.lastModPing = Date.now(); // prevent overquerying
			} else {
				game.lastModPing = Date.now();
				sendMessage(game, user, 'Pinged a moderator successfully');
				makeReport(
					{
						player: passport.user,
						situation: `"${args[0]}".`,
						election: game.general.electionCount,
						title: game.general.name,
						uid: game.general.uid,
						gameType: game.general.casualGame ? 'Casual' : game.general.practiceGame ? 'Practice' : 'Ranked'
					},
					game,
					'ping'
				);
			}
		});
	} else {
		sendMessage(game, user, `You can't ping mods for another ${(game.lastModPing + 180000 - Date.now()) / 1000} seconds.`);
	}
};

(commands.getCommand('ping') as Command).run = (socket: Socket, passport: any, user: User, game: ActiveGame, args: any) => {
	if (!game.private.seatedPlayers) {
		game.private.seatedPlayers = [];
		console.warn('seatedPlayers was undefined, setting to empty array, game:', JSON.stringify(game));
	}

	const { seatedPlayers } = game.private;

	const player = game.publicPlayersState.find((player) => player.userName === passport.user);

	if (!player) {
		return;
	}

	const seat = parseInt(args[0]);

	if (seat <= game.publicPlayersState.length && (!player.pingTime || Date.now() - player.pingTime > 180000)) {
		try {
			const affectedPlayerIndex = seat - 1;
			const affectedSocketId = Array.from(io.sockets.sockets.keys()).find(
				socketId => {
					const s = io.sockets.sockets.get(socketId);

					if (!s) return false;

					const handshake = s.handshake as any;

					return handshake?.session?.passport &&
						handshake.session.passport.user === game.publicPlayersState[affectedPlayerIndex].userName
				}
			);

			const affectedSocket = affectedSocketId && io.sockets.sockets.get(affectedSocketId);

			player.pingTime = Date.now();

			if (!affectedSocket) return;

			affectedSocket
				.emit(
					'pingPlayer',
					game.general.blindMode || game.general.playerChats === 'disabled'
						? 'Secret Hitler IO: A player has pinged you.'
						: `Secret Hitler IO: Player ${user.userName} just pinged you.`
				);

			if (game.general.playerChats === 'disabled') {
				seatedPlayers
					.find((seatedPlayer: any) => seatedPlayer.userName === player.userName)
					.gameChats.push({
						timestamp: new Date(),
						gameChat: true,
						chat: [
							{
								text: game.general.blindMode
									? `{${affectedPlayerIndex + 1}}`
									: `${game.publicPlayersState[affectedPlayerIndex].userName} (${affectedPlayerIndex + 1})`,
								type: 'player'
							},
							{ text: ' has been successfully pinged.' }
						]
					});

				game.private.hiddenInfoChat?.push({
					timestamp: new Date(),
					gameChat: true,
					chat: [{ text: `${player.userName} has pinged ${game.publicPlayersState[affectedPlayerIndex].userName}.` }]
				});
			} else {
				if (!game.chats) {
					game.chats = [];
				}

				game.chats.push({
					gameChat: true,
					userName: passport.user,
					timestamp: new Date(),
					chat: [
						{
							text: game.general.blindMode
								? `A player has pinged player number ${affectedPlayerIndex + 1}.`
								: `${passport.user} has pinged ${game.publicPlayersState[affectedPlayerIndex].userName} (${affectedPlayerIndex + 1}).`
						}
					],
					previousSeasonAward: user.previousSeasonAward,
					uid: game.uid,
					inProgress: game.gameState.isStarted
				});
			}
		} catch (e) {
			console.log(e, 'caught exception in ping chat');
		}
	} else {
		sendMessage(game, user, 'Unable to ping that user right now');
	}
};

(commands.getCommand('forcerigdeck') as Command).run = (socket: Socket, passport: any, user: User, game: ActiveGame, args: any) => {
	const changedChat: any[] = [
		{
			text: 'A staff member has changed the deck to '
		}
	];

	for (let card of args[0]) {
		card = card.toUpperCase();
		if (card === 'R' || card === 'B') {
			changedChat.push({
				text: card,
				type: `${card === 'R' ? 'fascist' : 'liberal'}`
			});
		}
	}

	changedChat.push({
		text: '.'
	});

	if (!game.chats) {
		game.chats = [];
	}

	game.chats.push({
		gameChat: true,
		timestamp: new Date(),
		chat: changedChat
	});
};

(commands.getCommand('forcevote') as Command).run = (socket: Socket, passport: any, user: User, game: ActiveGame, args: any) => {
	if (!game.private.seatedPlayers) {
		game.private.seatedPlayers = [];
		console.warn('seatedPlayers was undefined, setting to empty array, game:', JSON.stringify(game));
	}

	const { seatedPlayers } = game.private;

	if (game.general.isRemade) {
		socket.emit('sendAlert', 'This game has been remade.');
		return;
	}

	if (game.gameState.phase !== 'voting') {
		return sendMessage(game, user, 'This command can only be used during voting.');
	}

	const { blindMode } = game.general;
	const replacementNames = game.general.replacementNames || [];

	const affectedPlayerIndex = parseInt(args[0]) - 1;
	const voteString = args[1].toLowerCase();
	if (game.private) {
		const affectedPlayer = seatedPlayers[affectedPlayerIndex];
		if (!affectedPlayer) {
			sendMessage(game, user, `There is no seat {${affectedPlayerIndex + 1}}.`);
			return;
		}
		const vote = ['ya', 'ja', 'jah', 'yes', 'true'].includes(voteString);

		if (affectedPlayer.voteStatus?.hasVoted) {
			sendMessage(
				game,
				user,
				`${affectedPlayer.userName} {${affectedPlayerIndex + 1}} has already voted.\nThey were voting: ${
					affectedPlayer.voteStatus?.didVoteYes ? 'ja' : 'nein'
				}\nYou have set them to vote: ${vote ? 'ja' : 'nein'}
				`
			);
		}

		if (!game.chats) {
			game.chats = [];
		}

		game.chats.push({
			gameChat: true,
			timestamp: new Date(),
			chat: [
				{
					text: 'A staff member has forced '
				},
				{
					text: blindMode
						? `${replacementNames[affectedPlayerIndex]} {${affectedPlayerIndex + 1}} `
						: `${affectedPlayer.userName} {${affectedPlayerIndex + 1}}`,
					type: 'player'
				},
				{
					text: ' to vote.'
				}
			]
		});

		const modOnlyChat = {
			timestamp: new Date(),
			gameChat: true,
			chat: [
				{
					text: `${passport.user}`,
					type: 'player'
				},
				{
					text: ' has forced '
				},
				{
					text: `${affectedPlayer.userName} {${affectedPlayerIndex + 1}}`,
					type: 'player'
				},
				{
					text: ' to vote '
				},
				{
					text: `${vote ? 'ja' : 'nein'}`,
					type: 'player'
				},
				{
					text: ', '
				},
				{
					text: `${affectedPlayer.userName}`,
					type: 'player'
				},
				{
					text: `${affectedPlayer.voteStatus?.hasVoted ? ' had originally voted ' : ' had not voted.'}`
				},
				{
					text: `${affectedPlayer.voteStatus?.hasVoted ? (affectedPlayer.voteStatus?.didVoteYes ? ' ja' : ' nein') : ''}`,
					type: 'player'
				}
			]
		};

		game.private.hiddenInfoChat?.push(modOnlyChat);

		selectVoting({ user: affectedPlayer.userName }, game, { vote }, undefined, true);
	}
};

(commands.getCommand('forceskip') as Command).run = (socket: Socket, passport: any, user: User, game: ActiveGame, args: any) => {
	const { blindMode } = game.general;
	const replacementNames = game.general.replacementNames || [];

	if (!game.private.seatedPlayers) {
		game.private.seatedPlayers = [];
		console.warn('seatedPlayers was undefined, setting to empty array, game:', JSON.stringify(game));
	}

	const { seatedPlayers } = game.private;

	if (game.general.isRemade) {
		socket.emit('sendAlert', 'This game has been remade.');
		return;
	}

	if (game.gameState.phase !== 'selectingChancellor' && game.gameState.phase !== 'voting') {
		return sendMessage(game, user, 'This command can only be used during elections.');
	}

	const affectedPlayerIndex = args[0] !== undefined ? parseInt(args[0]) - 1 : game.gameState.presidentIndex;
	const affectedPlayer = seatedPlayers[affectedPlayerIndex];

	if (!affectedPlayer) {
		sendMessage(game, user, `There is no seat ${affectedPlayerIndex + 1}.`);
		return;
	}

	if (affectedPlayerIndex !== game.gameState.presidentIndex) {
		sendMessage(game, user, `The player in seat ${affectedPlayerIndex + 1} is not president.`);
		return;
	}

	let chancellor = -1;
	const currentPlayers: boolean[] = [];
	game.general.livingPlayerCount = game.general.livingPlayerCount || game.general.playerCount as number; // TODO: fix this

	for (let i = 0; i < seatedPlayers.length; i++) {
		currentPlayers[i] = !(
			seatedPlayers[i].isDead ||
			(i === game.gameState.previousElectedGovernment[0] && game.general.livingPlayerCount > 5) ||
			i === game.gameState.previousElectedGovernment[1]
		);
	}
	currentPlayers[affectedPlayerIndex] = false;
	let counter = affectedPlayerIndex + 1;
	while (chancellor === -1) {
		if (counter >= currentPlayers.length) {
			counter = 0;
		}
		if (currentPlayers[counter]) {
			chancellor = counter;
		}
		counter++;
	}

	if (!game.chats) {
		game.chats = [];
	}

	game.chats.push({
		gameChat: true,
		timestamp: new Date(),
		chat: [
			{
				text: 'A staff member has force skipped the government with '
			},
			{
				text: blindMode ? `${replacementNames[affectedPlayerIndex]} {${affectedPlayerIndex + 1}} ` : `${affectedPlayer.userName} {${affectedPlayerIndex + 1}}`,
				type: 'player'
			},
			{
				text: ' as president.'
			}
		]
	});
	selectChancellor({ user: affectedPlayer.userName }, game, { chancellorIndex: chancellor }, undefined, true);
	setTimeout(() => {
		for (const p of seatedPlayers.filter((player: any) => !player.isDead)) {
			selectVoting({ user: p.userName }, game, { vote: false }, undefined, true);
		}
	}, 1000);
};

(commands.getCommand('forcepick') as Command).run = (socket: Socket, passport: any, user: User, game: ActiveGame, args: any) => {
	const { blindMode } = game.general;
	const replacementNames = game.general.replacementNames || [];

	if (!game.private.seatedPlayers) {
		game.private.seatedPlayers = [];
		console.warn('seatedPlayers was undefined, setting to empty array, game:', JSON.stringify(game));
	}

	const { seatedPlayers } = game.private;

	if (game.general.isRemade) {
		socket.emit('sendAlert', 'This game has been remade.');
		return;
	}

	if (game.gameState.phase !== 'selectingChancellor' && game.gameState.phase !== 'assassination') {
		return sendMessage(game, user, 'This command can only be used during the president selecting chancellor phase.');
	}

	const affectedPlayerNumber = args[0] !== undefined ? parseInt(args[0]) - 1 : game.gameState.presidentIndex;
	const chancellorPick = parseInt(args[1]);

	if (game && game.private) {
		const affectedPlayer = seatedPlayers[affectedPlayerNumber];
		const affectedChancellor = seatedPlayers[chancellorPick - 1];
		if (!affectedPlayer) {
			sendMessage(game, user, `There is no seat ${affectedPlayerNumber + 1}.`);
			return;
		}
		if (!affectedChancellor) {
			sendMessage(game, user, `There is no seat ${chancellorPick}.`);
			return;
		}

		if (game.gameState.phase === 'assassination') {
			if (affectedPlayer.role.cardName !== 'hitler') {
				sendMessage(game, user, `The player in seat ${affectedPlayerNumber + 1} is not hitler.`);
				return;
			}

			if (!game.chats) {
				game.chats = [];
			}

			game.chats.push({
				gameChat: true,
				timestamp: new Date(),
				chat: [
					{
						text: 'An AEM member has forced '
					},
					{
						text: `${affectedPlayer.userName} {${affectedPlayerNumber + 1}}`,
						type: 'player'
					},
					{
						text: ' to assassinate '
					},
					{
						text: `${affectedChancellor.userName} {${chancellorPick}}`,
						type: 'player'
					},
					{
						text: '.'
					}
				]
			});

			selectPlayerToAssassinate({ user: affectedPlayer.userName }, game, { playerIndex: chancellorPick - 1 });
			return;
		}

		if (affectedPlayerNumber !== game.gameState.presidentIndex) {
			sendMessage(game, user, `The player in seat ${affectedPlayerNumber + 1} is not president.`);
			return;
		}

		game.general.livingPlayerCount = game.general.livingPlayerCount || game.general.playerCount as number; // TODO: fix this

		if (
			game.publicPlayersState[chancellorPick - 1].isDead ||
			chancellorPick - 1 === affectedPlayerNumber ||
			chancellorPick - 1 === game.gameState.previousElectedGovernment[1] ||
			(chancellorPick - 1 === game.gameState.previousElectedGovernment[0] && game.general.livingPlayerCount > 5)
		) {
			sendMessage(game, user, `The player in seat ${chancellorPick} is not a valid chancellor. (Dead or TL)`);
			return;
		}
		
		if (!game.chats) {
			game.chats = [];
		}

		game.chats.push({
			gameChat: true,
			timestamp: new Date(),
			chat: [
				{
					text: 'A staff member has forced '
				},
				{
					text: blindMode
						? `${replacementNames[affectedPlayerNumber]} {${affectedPlayerNumber + 1}} `
						: `${affectedPlayer.userName} {${affectedPlayerNumber + 1}}`,
					type: 'player'
				},
				{
					text: ' to pick '
				},
				{
					text: blindMode ? `${replacementNames[chancellorPick - 1]} {${chancellorPick}} ` : `${affectedChancellor.userName} {${chancellorPick}}`,
					type: 'player'
				},
				{
					text: ' as chancellor.'
				}
			]
		});
		selectChancellor({ user: affectedPlayer.userName }, game, { chancellorIndex: chancellorPick - 1 }, undefined, true);
	}
};

(commands.getCommand('forceping') as Command).run = (socket: Socket, passport: any, user: User, game: ActiveGame, args: any) => {
	const { blindMode } = game.general;
	const replacementNames = game.general.replacementNames || [];
	
	if (!game.private.seatedPlayers) {
		game.private.seatedPlayers = [];
		console.warn('seatedPlayers was undefined, setting to empty array, game:', JSON.stringify(game));
	}

	const { seatedPlayers } = game.private;

	if (game.general.isRemade) {
		socket.emit('sendAlert', 'This game has been remade.');
		return;
	}

	const affectedPlayerNumber = parseInt(args[0]) - 1;
	const affectedPlayer = seatedPlayers[affectedPlayerNumber];
	if (!affectedPlayer) {
		sendMessage(game, user, `There is no seat ${affectedPlayerNumber + 1}.`);
		return;
	}
	
	if (!game.chats) {
		game.chats = [];
	}

	game.chats.push({
		gameChat: true,
		timestamp: new Date(),
		chat: [
			{
				text: 'A staff member has pinged '
			},
			{
				text: blindMode
					? `${replacementNames[affectedPlayerNumber]} {${affectedPlayerNumber + 1}} `
					: `${affectedPlayer.userName} {${affectedPlayerNumber + 1}}`,
				type: 'player'
			},
			{
				text: '.'
			}
		]
	});

	try {
		const affectedSocketId = Array.from(io.sockets.sockets.keys()).find(
			socketId => {
				const s = io.sockets.sockets.get(socketId);

				if (!s) return false;

				const handshake = s.handshake as any;

				return handshake?.session?.passport &&
					handshake.session.passport.user === game.publicPlayersState[affectedPlayerNumber].userName;
			}
		);

		const affectedSocket = affectedSocketId && io.sockets.sockets.get(affectedSocketId);

		if (!affectedSocket) {
			sendMessage(game, user, 'Unable to send ping.');
			return;
		}
		
		affectedSocket.emit('pingPlayer', 'Secret Hitler IO: A moderator has pinged you.');
	} catch (e) {
		console.log(e, 'caught exception in ping chat');
	}
};

(commands.getCommand('forcerigrole') as Command).run = (socket: Socket, passport: any, user: User, game: ActiveGame, args: any) => {
	if (game && game.private) {
		const seat = parseInt(args[0], 10);
		const role = (r => {
			if (['f', 'fas', 'fascist'].includes(r)) {
				return 'fascist';
			} else if (['l', 'lib', 'liberal'].includes(r)) {
				return 'liberal';
			} else if (['h', 'hit', 'hitler'].includes(r)) {
				return 'hitler';
			} else {
				return r;
			}
		})(args[1]);

		if (seat >= game.publicPlayersState.length + 1 || seat === 0) {
			sendMessage(game, user, `There is no seat ${seat}.`);
			return;
		}

		const changedChat: any[] = [
			{
				text: 'A staff member has changed the role of player '
			}
		];

		changedChat.push({
			text: `${game.publicPlayersState[seat - 1].userName} (${seat})`,
			type: 'player'
		});

		changedChat.push({
			text: ' to '
		});

		changedChat.push({
			text: role,
			type: role
		});

		changedChat.push({
			text: '.'
		});
		
		if (!game.chats) {
			game.chats = [];
		}

		game.chats.push({
			gameChat: true,
			timestamp: new Date(),
			chat: changedChat
		});
	}
};
