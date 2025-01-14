import https from 'https';

import * as chat from './user-events/chat.mjs';
import * as claim from './user-events/claim.mjs';
import * as createGame from './user-events/create-game.mjs';
import * as flappyHitler from './user-events/flappy-hitler.mjs';
import * as joinGame from './user-events/join-game.mjs';
import * as leaveGame from './user-events/leave-game.mjs';
import * as modDms from './user-events/mod-dms.mjs';
import * as modModals from './user-events/mod-modals.mjs';
import * as moderation from './user-events/moderation.mjs';
import * as playerNotes from './user-events/player-notes.mjs';
import * as playerReports from './user-events/player-reports.mjs';
import * as remakeGame from './user-events/remake-game.mjs';
import * as settings from './user-events/settings.mjs';
import * as util from './user-events/util.mjs';

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
