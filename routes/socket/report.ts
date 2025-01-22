import https from 'https';

import Account from '@/models/account.ts';
import type { ActiveGame } from '@/shared/types/game.ts';

import { newStaff } from './models.ts';

function sendReport(game: ActiveGame | undefined, report: { content: string }, data: { type: string }, type: string) {
	if (!game) return;

	if (!game.private.seatedPlayers) {
		console.warn('seatedPlayers was undefined, setting to empty array, game:', JSON.stringify(game));
		game.private.seatedPlayers = [];
	}

	const { seatedPlayers } = game.private;

	Account.find({ staffRole: { $exists: true } }).then((accounts) => {
		const staffUserNames = accounts
			.filter(
				(account) =>
					account.staffRole === 'altmod' ||
					account.staffRole === 'moderator' ||
					account.staffRole === 'editor' ||
					account.staffRole === 'admin' ||
					account.staffRole === 'trialmod',
			)
			.map((account) => account.username);
		const players = seatedPlayers.map((player: any) => player.userName);
		const isStaff = players.some(
			(n: string) =>
				staffUserNames.includes(n) ||
				newStaff.altmodUserNames.includes(n) ||
				newStaff.modUserNames.includes(n) ||
				newStaff.editorUserNames.includes(n) ||
				newStaff.trialmodUserNames.includes(n),
		);

		if (type !== 'reportdelayed' && type !== 'modchatdelayed') {
			if (isStaff) {
				if (!game.unsentReports) game.unsentReports = [];
				data.type = type;
				game.unsentReports[game.unsentReports.length] = data;
				return;
			}
		}

		if (process.env.NODE_ENV === 'production') {
			try {
				const jsonReport = JSON.stringify(report);
				const req = https.request({
					hostname: 'discordapp.com',
					path: process.env.DISCORDREPORTURL,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Content-Length': Buffer.byteLength(jsonReport),
					},
				});
				req.end(jsonReport);
			} catch (e) {
				console.log(e);
			}
		} else {
			const text = JSON.stringify(report);
			console.log(`${text}\n${game.general.uid}`);
		}
	});
}

export const makeReport = (data: any, game?: ActiveGame, type = 'report') => {
	const { player, seat, role, election, situation, uid, gameType, homepage } = data;

	if (game && !game.private?.seatedPlayers) {
		game.private.seatedPlayers = [];
		console.warn('seatedPlayers was undefined, setting to empty array, game:', JSON.stringify(game));
	}

	const seatedPlayers = (game && game.private?.seatedPlayers) || [];

	if (!homepage) {
		// No Auto-Reports, or Mod Pings from Custom, Unlisted, or Private Games
		if (!game || game.customGameSettings.enabled || game.general.unlistedGame || game.general.private) return;
		// No Auto-Reports from Casual games
		if (game.general.casualGame && (type === 'report' || type === 'reportdelayed')) return;
	}

	let report: any;

	if (game && (type === 'report' || type === 'modchat')) {
		game.private.hiddenInfoShouldNotify = false;
	}

	if (type === 'ping') {
		const httpEscapedSituation = situation.replace(/( |^)(https?:\/\/\S+)( |$)/gm, '$1<$2>$3');

		report = JSON.stringify({
			content: `<@&${process.env.DISCORDMODID}>\n__**Player**__: ${player} ${
				homepage
					? `(from homepage)\n__**Message**__: ${httpEscapedSituation}\n`
					: `\n__**Message**__: ${httpEscapedSituation}\n__**Election #**__: ${election}\n__**Game Type**__: ${gameType}\n**<https://secrethitler.io/game/#/table/${uid}>**`
			}`,
			username: '@Mod Ping',
			allowed_mentions: { roles: [process.env.DISCORDMODID] },
			avatar_url: 'https://cdn.discordapp.com/emojis/612042360318328842.png?v=1',
		});

		if (process.env.NODE_ENV === 'production') {
			try {
				const req = https.request({
					hostname: 'discordapp.com',
					path: process.env.DISCORDREPORTURL,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Content-Length': Buffer.byteLength(report),
					},
				});
				req.end(report);
			} catch (e) {
				console.log(e);
			}
		} else {
			console.log(report);
		}
		return;
	}

	if (game && (type === 'report' || type === 'reportdelayed')) {
		const upperRole = role[0].toUpperCase() + role.substr(1);
		const isDelayed = type === 'reportdelayed' ? ' - **Staff DELAYED**' : '';
		let throwerIP: string;
		const otherPlayers: any[] = [];

		report = {
			content: `<@&${process.env.DISCORDMODID}>${isDelayed}\n__**Player**__: ${player} {${seat}}\n__**Role**__: ${upperRole}\n__**Situation**__: ${situation}\n__**Election #**__: ${election}\n__**Game Type**__: ${gameType}`,
			username: 'Auto Report',
			allowed_mentions: { roles: [process.env.DISCORDMODID] },
			avatar_url: 'https://cdn.discordapp.com/emojis/230161421336313857.png?v=1',
		};

		game.publicPlayersState.map((state) => {
			if (state.userName !== player) {
				otherPlayers.push(state.userName);
			}
		});

		// Account.findOne({ username: player }, (err: Error, account: IAccount) => {
		// 	if (err) console.log(err, 'err finding user');

		Account.findOne({ username: player })
			.then((account) => {
				if (account) data.ip = account.lastConnectedIP || account.signupIP;
				throwerIP = data.ip;

				const matches: Record<string | number, any> = {};
				Account.find({ username: { $in: otherPlayers } })
					.then((accounts) => {
						accounts.forEach((account) => {
							let ip = '';
							if (account) ip = account.lastConnectedIP || account.signupIP || ip;

							const seat = seatedPlayers.findIndex((elem: any) => elem.userName === account.username);
							if (ip === throwerIP) {
								matches[seat] = `${account.username} {${seat + 1}}`;
							} else if (
								ip.includes('.') && // Ensure both IPs are IPv4
								throwerIP.includes('.') &&
								ip.split('.').splice(0, 3).join('.') === // Splice off last block
									throwerIP.split('.').splice(0, 3).join('.') // to determine if the IPs are a 3-block match
							) {
								matches[seat] = `${account.username} {${seat + 1}} (3-block)`;
							} else if (
								ip.includes(':') && // Ensure both IPs are IPv6
								throwerIP.includes(':') &&
								ip.split(':').splice(0, 4).join(':') === // Splice off first four blocks to check if they match
									throwerIP.split(':').splice(0, 4).join(':') // to determine if the IPs are a 4-block match
							) {
								matches[seat] = `${account.username} {${seat + 1}} (4-block IPv6)`;
							}
						});
					})
					.then(() => {
						const sortedSeats = Object.keys(matches).sort();
						if (sortedSeats.length > 0) {
							const sortedMatches: any[] = [];

							for (const seat of sortedSeats) {
								sortedMatches.push(matches[seat]);
							}

							report.content += `\n__**Matching IPs**__: ${sortedMatches.join(', ')}`;
						}
						report.content += `\n**<https://secrethitler.io/game/#/table/${uid}>**`;
						sendReport(game, report, data, type);
					});
			})
			.catch((err) => {
				console.log(err, 'err finding user');
			});
	}

	if (type === 'modchat' || type === 'modchatdelayed') {
		const isDelayed = type === 'modchatdelayed' ? ' - **Staff DELAYED**' : '';
		report = {
			content: `<@&${process.env.DISCORDMODID}>${isDelayed}\n__**Member**__: ${player} \n__**Situation**__: ${situation}\n__**Election #**__: ${election}\n__**Game Type**__: ${gameType}\n**<https://secrethitler.io/game/#/table/${uid}>**`,
			username: 'Mod Chat',
			allowed_mentions: { roles: [process.env.DISCORDMODID] },
			avatar_url: 'https://cdn.discordapp.com/emojis/230161421311148043.png?v=1',
		};
		sendReport(game, report, data, type);
	}
};
