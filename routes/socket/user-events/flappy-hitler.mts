import { Server } from 'socket.io';

import type { ActiveGame } from '../game.d.ts';
import { getRoomSockets } from '../util.mts';

const io: Server = global.io;

export const handleFlappyEvent = (data: any, game: ActiveGame) => {
	if (!game || !io.sockets.adapter.rooms.get(game.general.uid)) {
		return;
	}
	const roomSockets = getRoomSockets(game);
	const updateFlappyRoom = (newData: any) => {
		roomSockets.forEach(sock => {
			if (sock) {
				sock.emit('flappyUpdate', newData);
			}
		});
	};

	updateFlappyRoom(data);

	if (data.type === 'startFlappy') {
		game.flappyState = {
			controllingLibUser: '',
			controllingFascistUser: '',
			score: {
				liberal: 0,
				fascist: 0
			},
			pylonDensity: 1.3,
			flapDistance: 1,
			pylonOffset: 1.3,
			passedPylonCount: 0
		};

		game.general.status = 'FLAPPY HITLER: 0 - 0';
		io.sockets.in(game.general.uid).emit('gameUpdate', game);

		game.flappyState.pylonGenerator = setInterval(() => {
			if (!game.flappyState) {
				game.flappyState = {
					controllingLibUser: '',
					controllingFascistUser: '',
					score: {
						liberal: 0,
						fascist: 0
					},
					pylonDensity: 1.3,
					flapDistance: 1,
					pylonOffset: 1.3,
					passedPylonCount: 0
				};
			}

			const offset = Math.floor(Math.random() * 50 * game.flappyState.pylonOffset);
			const newData = {
				type: 'newPylon',
				pylonType: 'normal',
				offset
			};

			updateFlappyRoom(newData);
		}, 1500 * game.flappyState.pylonDensity)[Symbol.toPrimitive]();
	}

	if (!game.flappyState) {
		game.flappyState = {
			controllingLibUser: '',
			controllingFascistUser: '',
			score: {
				liberal: 0,
				fascist: 0
			},
			pylonDensity: 1.3,
			flapDistance: 1,
			pylonOffset: 1.3,
			passedPylonCount: 0
		};
	}

	if (data.type === 'collision') {
		game.flappyState.score[data.team]++;
		clearInterval(game.flappyState?.pylonGenerator);
		// game.general.status = 'FLAPPY HITLER: x - x';
		// io.sockets.in(game.general.uid).emit('gameUpdate', game);
	}

	if (data.type === 'passedPylon') {
		game.flappyState.passedPylonCount++;
		game.general.status = `FLAPPY HITLER: ${game.flappyState.score.liberal} - ${game.flappyState.score.fascist} (${game.flappyState.passedPylonCount})`;

		io.sockets.in(game.general.uid).emit('gameUpdate', game);
	}
};
