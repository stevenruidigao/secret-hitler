import https from 'https';

import chat from './user-events/chat.mjs';
import claim from './user-events/claim.mjs';
import createGame from './user-events/create-game.mjs';
import flappyHitler from './user-events/flappy-hitler.mjs';
import joinGame from './user-events/join-game.mjs';
import leaveGame from './user-events/leave-game.mjs';
import modDms from './user-events/mod-dms.mjs';
import modModals from './user-events/mod-modals.mjs';
import moderation from './user-events/moderation.mjs';
import playerNotes from './user-events/player-notes.mjs';
import playerReports from './user-events/player-reports.mjs';
import remakeGame from './user-events/remake-game.mjs';
import settings from './user-events/settings.mjs';
import util from './user-events/util.mjs';

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
