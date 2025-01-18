import { Socket } from 'socket.io';

import Account, { IGameSettings, ITheme } from '../../../models/account.ts';
import { CURRENT_SEASON_NUMBER } from '../../../src/frontend-scripts/constants.ts';

import { userList } from '../models.ts';
import { sendUserList } from '../user-requests.ts';

/**
 * @param {object} socket - user socket reference.
 * @param {object} passport - socket authentication.
 * @param {object} data - from socket emit.
 */
export const handleUpdatedTheme = (socket: Socket, passport: any, data: ITheme) => {
	const fields: (keyof ITheme)[] = ['primaryColor', 'secondaryColor', 'tertiaryColor', 'backgroundColor', 'textColor'];

	Account.findOne({ username: passport && passport.user }).then((account) => {
		if (!account) {
			return;
		}

		if (!account.theme) {
			account.theme = {};
		}

		for (const field of fields) {
			if (data[field]) account.theme[field] = data[field];
		}

		account.save();
	});
};

/**
 * @param {object} socket - socket reference.
 * @param {object} passport - socket authentication.
 * @param {object} data - from socket emit.
 */
export const handleUpdatedGameSettings = (socket: Socket, passport: any, data: any) => {
	// Authentication Assured in routes.ts

	Account.findOne({ username: passport.user })
		.then((account) => {
			if (!account) return;

			if (!account.gameSettings) {
				account.gameSettings = {};
			}

			const currentPrivate = account.gameSettings.isPrivate;
			const userIdx = userList.findIndex(user => user.userName === passport.user);
			const aem = account.staffRole && (account.staffRole === 'moderator' || account.staffRole === 'editor' || account.staffRole === 'admin');
			const veteran = account.staffRole && account.staffRole === 'veteran';
			const user = userList.find(u => u.userName === passport.user);

			for (const setting in data) {
				if (setting == 'blacklist') {
					const blacklist = data[setting].slice(-30);
					if (
						typeof blacklist === 'object' &&
						typeof blacklist.length === 'number' &&
						blacklist.length <= 30 &&
						blacklist.every(
							(entry: any) =>
								typeof entry === 'object' && typeof entry.userName === 'string' && typeof entry.reason === 'string' && typeof entry.timestamp === 'number'
						)
					) {
						account.gameSettings.blacklist = blacklist;
						if (user) user.blacklist = blacklist;
					}
				}

				const allowedSettings: (keyof IGameSettings)[] = [
					'enableTimestamps',
					'enableRightSidebarInGame',
					'disablePlayerColorsInChat',
					'disablePlayerCardbacks',
					'disableHelpMessages',
					'disableHelpIcons',
					'disableConfetti',
					'disableCrowns',
					'disableSeasonal',
					'disableAggregations',
					'disableKillConfirmation',
					'soundStatus',
					'fontSize',
					'fontFamily',
					'isPrivate',
					'disableElo',
					'fullheight',
					'safeForWork',
					'keyboardShortcuts',
					'notifyForNewLobby',
					'gameFilters',
					'gameNotes',
					'playerNotes',
					'truncatedSize',
					'claimCharacters',
					'claimButtons'
				];

				if ((allowedSettings as string[]).includes(setting) || (setting === 'staff' && (aem || veteran))) {
					account.gameSettings[setting as keyof IGameSettings] = data[setting];
				}

				if (setting === 'staff' && aem) {
					const userListInfo: any = {
						userName: passport.user,
						playerPronouns: account.gameSettings.playerPronouns,
						staffRole: account.staffRole || '',
						isContributor: account.isContributor || false,
						staff: account.gameSettings.staff,
						isRainbowOverall: account.isRainbowOverall,
						isRainbowSeason: account.isRainbowSeason,
						isPrivate: account.gameSettings.isPrivate,
						tournyWins: account.gameSettings.tournyWins,
						blacklist: account.gameSettings.blacklist,
						customCardback: account.gameSettings.customCardback,
						previousSeasonAward: account.gameSettings.previousSeasonAward,
						specialTournamentStatus: account.gameSettings.specialTournamentStatus,
						overall: account.overall,
						status: {
							type: 'none',
							gameId: null
						}
					};

					userListInfo.season = account.seasons ? account.seasons.get(CURRENT_SEASON_NUMBER.toString()) : {};
					if (userIdx !== -1) userList.splice(userIdx, 1);
					userList.push(userListInfo);
					sendUserList();
				}

				if (setting === 'playerPronouns' && ['he/him/his', 'she/her/hers', 'they/them/theirs', 'Any Pronouns', ''].includes(data[setting])) {
					account.gameSettings.playerPronouns = data[setting];
					if (user) user.playerPronouns = data[setting];
				}
			}

			if (
				((data.isPrivate && !currentPrivate) || (!data.isPrivate && currentPrivate)) &&
				(!account.gameSettings.privateToggleTime || account.gameSettings.privateToggleTime < Date.now() - 64800000)
			) {
				account.gameSettings.privateToggleTime = Date.now();
				account.save(() => {
					socket.emit('manualDisconnection');
				});
			} else {
				account.gameSettings.isPrivate = currentPrivate;
				account.save(() => {
					socket.emit('gameSettings', account.gameSettings);
					sendUserList();
				});
			}
		})
		.catch((err: Error) => {
			console.log(err);
		});
};

/**
 * @param {object} socket - user socket reference.
 * @param {object} passport - socket authentication.
 * @param {object} data - from socket emit.
 */
export const handleUpdatedBio = (socket: Socket, passport: any, data: any) => {
	// Authentication Assured in routes.ts
	if (typeof data !== 'string') return; // otherwise the server will crash if you forge the request
	Account.findOne({ username: passport.user }).then((account) => {
		if (!account) return;

		account.bio = data;
		account.save();
	});
};
