import fs from 'fs';

import redis from 'redis';
import { promisify } from 'util';

import Account from '../../models/account.mts';
import BannedIP from '../../models/bannedIP.mts';
import ModAction from '../../models/modAction.mts';

import { CURRENT_SEASON_NUMBER } from '../../src/frontend-scripts/constants.mts';
import version from '../../version.mts';

import { ActiveGame } from './game/common.mts';
import { doesIPMatchCIDR } from './ip-obf.mts';

const emotes: Record<string, string> = {};

fs.readdirSync('public/images/emotes', { withFileTypes: true }).forEach(file => {
	if (file.name.endsWith('.png')) {
		const emoteName = file.name.substring(0, file.name.length - 4);
		emotes[`:${emoteName}:`] = `/images/emotes/${file.name}?v=${version.number}`;
	}
});

export const globalSettingsClient = redis.createClient({
	db: 1
});

const getGlobalSetting = promisify(globalSettingsClient.get).bind(globalSettingsClient);
const setGlobalSetting = promisify(globalSettingsClient.set).bind(globalSettingsClient);

const globalSettingsCache: Record<string, any> = {}; // READ ONLY variables that are cloned from redis (they will be reset every game GC when the settings are cloned from redis)
const settingsToReplicate = [
	'private-chat-truncate' // type: integer
];

export const cloneSettingsFromRedis = async () => {
	for (const setting of settingsToReplicate) {
		globalSettingsCache[setting] = JSON.parse(await getGlobalSetting(setting) || '{}');
	}
};

export const getLastGenchatModPingAsync = async () => {
	return JSON.parse(await getGlobalSetting('genchat-mod-ping') || '{}');
};
export const setLastGenchatModPingAsync = async (date: any) => {
	await setGlobalSetting('genchat-mod-ping', JSON.stringify(date));
};
export const getPrivateChatTruncate = async () => {
	return globalSettingsCache['private-chat-truncate'];
};

export const emoteList = emotes;

export const games: any = {};
export const userList: any[] = [];
export const generalChats: {
	sticky: string,
	list: any[]
} = {
	sticky: '',
	list: []
};
export const modDMs: any = {
	// player username => full object
};
export const accountCreationDisabled = { status: false };
export const bypassVPNCheck = { status: false };
export const ipbansNotEnforced = { status: false };
export const gameCreationDisabled = { status: false };
export const limitNewPlayers = { status: false };
export const newStaff: Record<string, string[]> = {
	modUserNames: [],
	editorUserNames: [],
	altmodUserNames: [],
	trialmodUserNames: [],
	contributorUserNames: []
};

export const staffList: Record<string, string> = {};

export const getStaffList = () => {
	Account.find({ staffRole: { $exists: true } }).then((accounts: any) => {
		accounts.forEach((user: any) => (staffList[user.username] = user.staffRole));
	});
};

getStaffList();

export const getPowerFromRole = (role: string) => {
	if (role === 'admin') return 3;
	if (role === 'editor') return 2;
	if (role === 'moderator') return 1;
	if (role === 'altmod') return 0; // Report AEM delays will check for >= 0
	if (role === 'trialmod') return 0;
	if (role === 'contributor') return -1;
	return -1;
};

export const getPowerFromName = (name: string) => {
	if (newStaff.editorUserNames.includes(name)) return getPowerFromRole('editor');
	if (newStaff.modUserNames.includes(name)) return getPowerFromRole('moderator');
	if (newStaff.altmodUserNames.includes(name)) return getPowerFromRole('altmod');
	if (newStaff.trialmodUserNames.includes(name)) return getPowerFromRole('trialmod');
	if (newStaff.contributorUserNames.includes(name)) return getPowerFromRole('contributor');

	const user: any = userList.find((user: any) => user.userName === name);
	if (user) return getPowerFromRole(user.staffRole);
	else if (staffList[name]) return getPowerFromRole(staffList[name]);
	else return -1;
};

export const getPowerFromUser = (user: any) => {
	if (newStaff.editorUserNames.includes(user.userName)) return getPowerFromRole('editor');
	if (newStaff.modUserNames.includes(user.userName)) return getPowerFromRole('moderator');
	if (newStaff.altmodUserNames.includes(user.userName)) return getPowerFromRole('altmod');
	if (newStaff.trialmodUserNames.includes(user.userName)) return getPowerFromRole('trialmod');
	if (newStaff.contributorUserNames.includes(user.userName)) return getPowerFromRole('contributor');
	return getPowerFromRole(user.staffRole);
};

// set of profiles, no duplicate usernames
/**
 * @return // todo
 */
export const profiles = (() => {
	const profiles: any[] = [];
	const MAX_SIZE = 100;
	const get = (username: string) => profiles.find(p => p._id === username);
	const remove = (username: string) => {
		const i = profiles.findIndex(p => p._id === username);
		if (i > -1) return profiles.splice(i, 1)[0];
	};
	const push = (profile: any) => {
		if (!profile) return profile;
		remove(profile._id);
		profiles.unshift(profile);
		profiles.splice(MAX_SIZE);
		return profile;
	};

	return { get, push };
})();

export const formattedUserList = (isAEM: boolean) => {
	const prune = (value: any) => {
		// Converts things like zero and null to undefined to remove it from the sent data.
		return value ? value : undefined;
	};

	return userList
		.map((user: any) => ({
			userName: user.userName,
			playerPronouns: user.playerPronouns,
			isPrivate: prune(user.isPrivate),

			// Tournaments are disabled, no point sending this.
			// tournyWins: user.tournyWins,

			// Blacklists are sent in the sendUserGameSettings event.
			// blacklist: user.blacklist,
			customCardback: user.customCardback,
			overall: user.overall,
			isRainbowOverall: user.isRainbowOverall,
			isRainbowSeason: user.isRainbowSeason,
			status: user.status && user.status.type && user.status.type != 'none' ? user.status : undefined,
			season: user.seasons ? user.seasons.get(CURRENT_SEASON_NUMBER.toString()) : {},
			previousSeasonAward: user.previousSeasonAward,
			specialTournamentStatus: user.specialTournamentStatus,
			timeLastGameCreated: user.timeLastGameCreated,
			staffRole: prune(user.staffRole),
			staff: user.staff,
			isContributor: prune(user.isContributor)
			// oldData: user
		}))
		.filter(user => isAEM || !(user.staff && user.staff.incognito));
};

export const userListEmitter = {
	state: 0,
	send: false,
	timer: setInterval(() => {
		// 0.01s delay per user (1s per 100), always delay
		if (!userListEmitter.send) {
			userListEmitter.state = userList.length / 10;
			return;
		}
		if (userListEmitter.state > 0) userListEmitter.state--;
		else {
			const staffUserList = Object.keys(staffList).filter(
				name => staffList[name] === 'trialmod' || staffList[name] === 'moderator' || staffList[name] === 'editor' || staffList[name] === 'admin'
			);
			const staffSocketIds = Array.from(io.sockets.sockets.keys()).filter(id => {
				const socket = io.sockets.sockets.get(id);
				const handshake = socket?.handshake as any;

				return staffUserList.includes(handshake.session?.passport?.user)
			});
			const nonStaffSocketIds = Array.from(io.sockets.sockets.keys()).filter(id => !staffSocketIds.includes(id));

			userListEmitter.send = false;

			// Send to staff
			staffSocketIds.forEach(id => {
				const socket = io.sockets.sockets.get(id);
				if (typeof socket === 'undefined') return;
				
				socket.emit('userList', { list: formattedUserList(true) });
			});

			// Send to non-staff
			nonStaffSocketIds.forEach(id => {
				const socket = io.sockets.sockets.get(id);
				if (typeof socket === 'undefined') return;

				socket.emit('userList', { list: formattedUserList(false) });
			});
		}
	}, 100)
};

export const formattedGameList = () => {
	return Object.keys(games).map(gameName => ({
		name: games[gameName].general.name,
		flag: games[gameName].general.flag,
		userNames: games[gameName].publicPlayersState.map((val: any) => val.userName),
		customCardback: games[gameName].publicPlayersState.map((val: any) => val.customCardback),
		gameStatus: games[gameName].gameState.isCompleted
			? games[gameName].gameState.isCompleted
			: games[gameName].gameState.isTracksFlipped
			? 'isStarted'
			: 'notStarted',
		seatedCount: games[gameName].publicPlayersState.length,
		gameCreatorName: games[gameName].private.gameCreatorName,
		minPlayersCount: games[gameName].general.minPlayersCount,
		maxPlayersCount: games[gameName].general.maxPlayersCount || games[gameName].general.minPlayersCount,
		excludedPlayerCount: games[gameName].general.excludedPlayerCount,
		casualGame: games[gameName].general.casualGame || undefined,
		practiceGame: games[gameName].general.practiceGame || undefined,
		eloMinimum: games[gameName].general.eloMinimum || undefined,
		xpMinimum: games[gameName].general.xpMinimum || undefined,
		isVerifiedOnly: games[gameName].general.isVerifiedOnly || undefined,
		isTourny: games[gameName].general.isTourny || undefined,
		timedMode: games[gameName].general.timedMode || undefined,
		flappyMode: games[gameName].general.flappyMode || undefined,
		flappyOnlyMode: games[gameName].general.flappyOnlyMode || undefined,
		tournyStatus: (() => {
			if (games[gameName].general.isTourny) {
				if (games[gameName].general.tournyInfo.queuedPlayers && games[gameName].general.tournyInfo.queuedPlayers.length) {
					return {
						queuedPlayers: games[gameName].general.tournyInfo.queuedPlayers.length
					};
				}
			}
			return undefined;
		})(),
		experiencedMode: games[gameName].general.experiencedMode || undefined,
		playerChats: games[gameName].general.playerChats || undefined,
		disableGamechat: games[gameName].general.disableGamechat || undefined,
		blindMode: games[gameName].general.blindMode || undefined,
		enactedLiberalPolicyCount: games[gameName].trackState.liberalPolicyCount,
		enactedFascistPolicyCount: games[gameName].trackState.fascistPolicyCount,
		electionCount: games[gameName].general.electionCount,
		rebalance6p: games[gameName].general.rebalance6p || undefined,
		rebalance7p: games[gameName].general.rebalance7p || undefined,
		rebalance9p2f: games[gameName].general.rebalance9p2f || undefined,
		privateOnly: games[gameName].general.privateOnly || undefined,
		private: games[gameName].general.private || undefined,
		uid: games[gameName].general.uid,
		rainbowgame: games[gameName].general.rainbowgame || undefined,
		isCustomGame: games[gameName].customGameSettings.enabled,
		isUnlisted: games[gameName].general.unlistedGame || undefined,
		avalonSH: games[gameName].general.avalonSH || undefined,
		noTopdecking: games[gameName].general.noTopdecking || undefined
	}));
};

export const gameListEmitter = {
	state: 0,
	send: false,
	timer: setInterval(() => {
		// 3 second delay, instant send
		if (gameListEmitter.state > 0) gameListEmitter.state--;
		else {
			if (!gameListEmitter.send) return;
			gameListEmitter.send = false;
			io.sockets.emit('gameList', formattedGameList());
			gameListEmitter.state = 30;
		}
	}, 100)
};

export const AEM = Account.find({ staffRole: { $exists: true, $ne: 'veteran' } });

const bypassKeys: string[] = [];

export const verifyBypass = (key: string) => {
	return bypassKeys.indexOf(key) >= 0;
};

export const consumeBypass = (key: string, user: any, ip: string) => {
	const idx = bypassKeys.indexOf(key);
	if (idx >= 0) {
		bypassKeys.splice(idx, 1);
		new ModAction({
			date: new Date(),
			modUserName: '',
			userActedOn: user,
			modNotes: `Bypass key used: ${key}`,
			ip: ip,
			actionTaken: 'bypassKeyUsed'
		}).save();
	}
};

export const createNewBypass = () => {
	let key;
	do {
		key = `${Math.random()
			.toString(36)
			.substring(2)}${Math.random()
			.toString(36)
			.substring(2)}`.trim();
	} while (bypassKeys.indexOf(key) >= 0);
	bypassKeys.push(key);
	return key;
};

// There's a mountain of "new" type bans.
const unbanTime = new Date().valueOf() - 64800000;

BannedIP.deleteMany({ type: 'new', bannedDate: { $lte: unbanTime }, permanent: { $ne: true } }, (err: any) => {
	if (err) throw err;
});

const banLength: Record<string, number> = {
	small: 18 * 60 * 60 * 1000, // 18 hours
	new: 18 * 60 * 60 * 1000, // 18 hours
	tiny: 1 * 60 * 60 * 1000, // 1 hour
	big: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const testIP = (IP: any, callback: any) => {
	if (!IP) callback('Bad IP!');
	else if (ipbansNotEnforced.status) callback(null);
	else {
		BannedIP.find({}, (err, allIPs: any[]) => {
			if (err) callback(err);
			else {
				const ips: any[] = [];

				for (const potentialMatch of allIPs) {
					if (potentialMatch.ip == IP || doesIPMatchCIDR(potentialMatch.ip, IP)) {
						// using == because that's equivalent to mongo's { ip : IP } afaik
						ips.push(potentialMatch);
					}
				}

				let date = -1; // TODO: fix
				let unbannedTime;

				for (const ipban of ips) {
					if (ipban.permanent) {
						callback(ipban.type, new Date(0), true);
						return;
					}
				}

				// if we have no permanent ip bans, check by longest
				const ip = ips.sort((a: any, b: any) => b.bannedDate - a.bannedDate)[0];

				if (ip) {
					date = Date.now();
					unbannedTime = ip.bannedDate.getTime() + (banLength[ip.type] || banLength.big);
				}

				if (ip && unbannedTime > date) {
					if (process.env.NODE_ENV === 'production' || process.env.IPBANSINDEV) {
						callback(ip.type, unbannedTime, false);
					} else {
						console.log(`IP ban ignored: ${IP} = ${ip.type}`);
						callback(null);
					}
				} else {
					callback(null);
				}
			}
		});
	}
};
