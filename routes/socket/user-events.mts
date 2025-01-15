import https from 'https';

import * as chat from './user-events/chat.mts';
import * as claim from './user-events/claim.mts';
import * as createGame from './user-events/create-game.mts';
import * as flappyHitler from './user-events/flappy-hitler.mts';
import * as joinGame from './user-events/join-game.mts';
import * as leaveGame from './user-events/leave-game.mts';
import * as modDms from './user-events/mod-dms.mts';
import * as modModals from './user-events/mod-modals.mts';
import * as moderation from './user-events/moderation.mts';
import * as playerNotes from './user-events/player-notes.mts';
import * as playerReports from './user-events/player-reports.mts';
import * as remakeGame from './user-events/remake-game.mts';
import * as settings from './user-events/settings.mts';
import * as util from './user-events/util.mts';

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
