import { ActiveGame } from "../game/common.mts";
import { getRoomSockets } from "../util.mts";

export const handleFlappyEvent = (data: any, game: ActiveGame) => {
	if (!game || !io.sockets.adapter.rooms.get(game.general.uid)) {
		return;
	}
	const roomSockets = getRoomSockets(game.general.uid);
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
			liberalScore: 0,
			fascistScore: 0,
			pylonDensity: 1.3,
			flapDistance: 1,
			pylonOffset: 1.3,
			passedPylonCount: 0
		};

		game.general.status = 'FLAPPY HITLER: 0 - 0';
		io.sockets.in(game.general.uid).emit('gameUpdate', game);

		game.flappyState.pylonGenerator = setInterval(() => {
			const offset = Math.floor(Math.random() * 50 * game.flappyState.pylonOffset);
			const newData = {
				type: 'newPylon',
				pylonType: 'normal',
				offset
			};

			updateFlappyRoom(newData);
		}, 1500 * game.flappyState.pylonDensity)[Symbol.toPrimitive]();
	}

	if (data.type === 'collision') {
		game.flappyState[`${data.team}Score`]++;
		clearInterval(game.flappyState.pylonGenerator);
		// game.general.status = 'FLAPPY HITLER: x - x';
		// io.sockets.in(game.general.uid).emit('gameUpdate', game);
	}

	if (data.type === 'passedPylon') {
		game.flappyState.passedPylonCount++;
		game.general.status = `FLAPPY HITLER: ${game.flappyState.liberalScore} - ${game.flappyState.fascistScore} (${game.flappyState.passedPylonCount})`;

		io.sockets.in(game.general.uid).emit('gameUpdate', game);
	}
};
