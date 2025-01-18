import https from 'https';

import * as chat from './user-events/chat.ts';
import * as claim from './user-events/claim.ts';
import * as createGame from './user-events/create-game.ts';
import * as flappyHitler from './user-events/flappy-hitler.ts';
import * as joinGame from './user-events/join-game.ts';
import * as leaveGame from './user-events/leave-game.ts';
import * as modDms from './user-events/mod-dms.ts';
import * as modModals from './user-events/mod-modals.ts';
import * as moderation from './user-events/moderation.ts';
import * as playerNotes from './user-events/player-notes.ts';
import * as playerReports from './user-events/player-reports.ts';
import * as remakeGame from './user-events/remake-game.ts';
import * as settings from './user-events/settings.ts';
import * as util from './user-events/util.ts';

export default Object.assign(
	{},
	chat,
	claim,
	createGame,
	flappyHitler,
	joinGame,
	leaveGame,
	modDms,
	modModals,
	moderation,
	playerNotes,
	playerReports,
	remakeGame,
	settings,
	util
);

const crashReport = JSON.stringify({
	content: `${process.env.DISCORDADMINPING} the site just crashed or reset.`
});

const crashOptions = {
	hostname: 'discordapp.com',
	path: process.env.DISCORDCRASHURL,
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'Content-Length': Buffer.byteLength(crashReport)
	}
};

if (process.env.NODE_ENV === 'production') {
	const crashReq = https.request(crashOptions);

	crashReq.end(crashReport);
}
