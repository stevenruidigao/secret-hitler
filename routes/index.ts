import { Express, Request, Response } from 'express';
import passport from 'passport'; // eslint-disable-line no-unused-vars
import dayjs from 'dayjs';
import fetch from 'node-fetch';

import Account, { IAccount, IGameSettings } from '@/models/account.ts'; // eslint-disable-line no-unused-vars
import GameSummary from '@/models/game-summary/index.ts';
import Game from '@/models/game.ts';
import ModThread from '@/models/modThread.ts';
import Profile from '@/models/profile/index.ts';
import { getProfile } from '@/models/profile/utils.ts';

import { DEFAULT_THEME_COLORS, CURRENT_SEASON_NUMBER } from '@/src/frontend-scripts/constants.ts';
import savedTorIps from '@/utils/savedTorIPs.ts';
import version from '@/version.ts';

import { accounts } from './accounts.ts';
import { processImage } from './image-processor.ts';
import prodCacheBustToken from './prodCacheBustToken.ts';
import { checkBadgesAccount } from './socket/badges.ts';
import { expandAndSimplify, obfIP } from './socket/ip-obf.ts';
import { userList } from './socket/models.ts';
import { socketRoutes } from './socket/routes.ts';

const app: Express = global.app;

/**
 * @param {object} req - express request object.
 * @param {object} res - express response object.
 * @param {function} next - express middleware function
 * @return {function} returns next() if user is authenticated.
 */
const ensureAuthenticated = (req: Request, res: Response, next: any) => {
	if (req.isAuthenticated()) {
		return next();
	}

	res.redirect('/observe/');
};

export default () => {
	/**
	 * @param {object} req - express request object.
	 * @param {object} res - express response object.
	 * @param {string} pageName - name of the pug page to render
	 * @param {string} varName - name of the pug variable to insert.
	 */
	const renderPage = (req: any, res: Response, pageName: string, varName: string) => {
		const renderObj: Record<string, any> = {};

		renderObj[varName] = true;

		if (req.user) {
			renderObj.username = req.user.username;
		}

		if (process.env.NODE_ENV === 'production') {
			renderObj.prodCacheBustToken = prodCacheBustToken;
		}

		res.render(pageName, renderObj);
	};

	fetch('https://check.torproject.org/cgi-bin/TorBulkExitList.py?ip=1.1.1.1')
		.then((res) => res.text())
		.then((text) => {
			const gatheredTorIps = text.split('\n').slice(3);

			accounts(gatheredTorIps);
		})
		.catch((e) => {
			console.log('error in getting tor ips', e);
			accounts(savedTorIps);
			console.log('Using Cached TOR IPs');
		});

	socketRoutes();

	app.get('/', (req, res) => {
		renderPage(req, res, 'page-home', 'home');
	});

	app.post('/', (req, res) => {
		renderPage(req, res, 'page-home', 'home');
	});

	app.get('/rules', (req, res) => {
		renderPage(req, res, 'page-rules', 'rules');
	});

	app.get('/changelog', (req, res) => {
		renderPage(req, res, 'page-changelog', 'changelog');
	});

	app.get('/how-to-play', (req, res) => {
		renderPage(req, res, 'page-howtoplay', 'howtoplay');
	});

	app.get('/stats', (req, res) => {
		renderPage(req, res, 'page-stats', 'stats');
	});

	app.get('/stats-season', (req, res) => {
		renderPage(req, res, 'page-stats-season', 'stats-season');
	});

	app.get('/about', (req, res) => {
		renderPage(req, res, 'page-about', 'about');
	});

	app.get('/tou', (req, res) => {
		renderPage(req, res, 'page-tou', 'tou');
	});

	app.get('/polls', (req, res) => {
		renderPage(req, res, 'page-polls', 'polls');
	});

	app.get('/player-profiles', (req, res) => {
		renderPage(req, res, 'page-player-profiles', 'playerProfiles');
	});

	app.get('/game', ensureAuthenticated, (req, res) => {
		res.redirect('/game/');
	});

	const getHSLcolors = (hsl: string) => [
		parseInt(hsl.split(',')[0].split('hsl(')[1], 10),
		parseInt(hsl.split(',')[1].trim().split('%')[0], 10),
		parseInt(hsl.split(',')[2].trim().split('%)')[0], 10),
	];

	app.get('/game/', ensureAuthenticated, (req: any, res) => {
		const { username } = req.user;

		if (req.user.isBanned) {
			res.redirect('/logout');
		} else {
			let ip = req.expandedIP;

			try {
				ip = expandAndSimplify(ip);
			} catch (e) {
				console.log(e);
			}

			Profile.findOne({ _id: username })
				.then((profile: any) => {
					if (profile) {
						profile.lastConnectedIP = ip; // why?
						profile.save();
					}
				})
				.catch((err: Error) => {
					console.log(err, 'profile find err');
				});

			Account.findOne({ username }, (err: Error, account: IAccount) => {
				if (err) {
					console.log(err);
					return;
				}

				checkBadgesAccount(account);

				let blacklist: string[] = [];
				let gameSettingsWithoutBlacklist: IGameSettings | unknown = {};

				if (account.gameSettings) {
					blacklist = account.gameSettings.blacklist || blacklist;
					const gameSettings = (account.gameSettings.toObject as Function)();

					if (gameSettings.blacklist) {
						delete gameSettings.blacklist;
					}

					gameSettingsWithoutBlacklist = gameSettings;
				}

				const backgroundColor = account?.theme?.backgroundColor || DEFAULT_THEME_COLORS.baseBackgroundColor;
				const textColor = account?.theme?.textColor || DEFAULT_THEME_COLORS.baseTextColor;
				const [backgroundHue, backgroundSaturation, backgroundLightness] = getHSLcolors(backgroundColor);
				const [textHue, textSaturation, textLightness] = getHSLcolors(textColor);

				const gameObj: Record<string, any> = {
					game: true,
					staffRole: account.staffRole || '',
					isContributor: account.isContributor || false,
					isTournamentMod: account.isTournamentMod || false,
					verified: req.user.verified,
					dismissedSignupModal: account.dismissedSignupModal,
					username,
					gameSettings: gameSettingsWithoutBlacklist,
					blacklist,
					primaryColor: account?.theme?.primaryColor || DEFAULT_THEME_COLORS.primaryColor,
					secondaryColor: account?.theme?.secondaryColor || DEFAULT_THEME_COLORS.secondaryColor,
					tertiaryColor: account?.theme?.tertiaryColor || DEFAULT_THEME_COLORS.tertiaryColor,
					backgroundColor,
					secondaryBackgroundColor: `hsl(${backgroundHue}, ${backgroundSaturation}%, ${
						backgroundLightness > 50 ? backgroundLightness - 7 : backgroundLightness + 7
					}%)`,
					tertiaryBackgroundColor: `hsl(${backgroundHue}, ${backgroundSaturation}%, ${
						backgroundLightness > 50 ? backgroundLightness - 14 : backgroundLightness + 14
					}%)`,
					textColor,
					secondaryTextColor: `hsl(${textHue}, ${textSaturation}%, ${textLightness > 50 ? textLightness - 7 : textLightness + 7}%)`,
					tertiaryTextColor: `hsl(${textHue}, ${textSaturation}%, ${textLightness > 50 ? textLightness - 14 : textLightness + 14}%)`,
				};

				if (process.env.NODE_ENV === 'production') {
					gameObj.prodCacheBustToken = prodCacheBustToken;
				}

				account.lastConnectedIP = ip;
				account.lastConnected = new Date();

				if (
					(account.ipHistory && account.ipHistory.length === 0) ||
					(account.ipHistory && account.ipHistory.length > 0 && account.ipHistory[account.ipHistory.length - 1].ip !== ip)
				) {
					account.ipHistory.push({
						date: new Date(),
						ip: ip,
					});
				}

				(account.save as Function)(() => {
					res.render('game', gameObj);
				});
			});
		}
	});

	app.get('/observe', (req, res) => {
		res.redirect('/observe/');
	});

	app.get('/logout', (req: any, res) => {
		if (req.user) {
			req.session.destroy();
			req.logout();
		}
		res.redirect('/observe/');
	});

	app.get('/observe/', (req, res) => {
		if (req.user) {
			res.redirect('/game/');
			return;
		}

		const backgroundColor = DEFAULT_THEME_COLORS.baseBackgroundColor;
		const textColor = DEFAULT_THEME_COLORS.baseTextColor;
		const [backgroundHue, backgroundSaturation, backgroundLightness] = getHSLcolors(backgroundColor);
		const [textHue, textSaturation, textLightness] = getHSLcolors(textColor);

		const secondaryBackgroundColor = `hsl(${backgroundHue}, ${backgroundSaturation}%, ${
			backgroundLightness > 50 ? backgroundLightness - 5 : backgroundLightness + 5
		}%)`;
		const tertiaryBackgroundColor = `hsl(${backgroundHue}, ${backgroundSaturation}%, ${
			backgroundLightness > 50 ? backgroundLightness - 10 : backgroundLightness + 10
		}%)`;
		const secondaryTextColor = `hsl(${textHue}, ${textSaturation}%, ${textLightness > 50 ? textLightness - 7 : textLightness + 7}%)`;
		const tertiaryTextColor = `hsl(${textHue}, ${textSaturation}%, ${textLightness > 50 ? textLightness - 14 : textLightness + 14}%)`;

		const gameObj: Record<string, any> = {
			game: true,
			primaryColor: DEFAULT_THEME_COLORS.primaryColor,
			secondaryColor: DEFAULT_THEME_COLORS.secondaryColor,
			tertiaryColor: DEFAULT_THEME_COLORS.tertiaryColor,
			backgroundColor,
			secondaryBackgroundColor,
			tertiaryBackgroundColor,
			textColor,
			secondaryTextColor,
			tertiaryTextColor,
		};

		if (process.env.NODE_ENV === 'production') {
			gameObj.prodCacheBustToken = prodCacheBustToken;
		}

		res.render('game', gameObj);
	});

	app.get('/profile', (req: any, res) => {
		const authedUser = req.session && req.session.passport && req.session.passport.user;
		const username = req.query.username;

		Account.findOne({ username }, (err: any, account: IAccount) => {
			if (err) {
				return new Error(err);
			}

			if (!account) {
				res.status(404).send('Profile not found');
				return;
			}

			getProfile(username).then((profile: any) => {
				let _profile;

				if (profile) {
					_profile = profile.toObject();
				} else {
					const noData = {
						events: 0,
						successes: 0,
					};

					const noTeamData = {
						fascist: noData,
						liberal: noData,
					};

					const noPlayerNumberData = {
						5: noTeamData,
						6: noTeamData,
						7: noTeamData,
						8: noTeamData,
						9: noTeamData,
						10: noTeamData,
						fascist: noData,
						liberal: noData,
					};

					_profile = {
						_id: username,
						recentGames: [],
						stats: {
							actions: {
								legacyShotAccuracy: noData,
								legacyVoteAccuracy: noData,
								shotAccuracy: noData,
								voteAccuracy: noData,
							},
							matches: {
								allMatches: noData,
								casualMatches: noTeamData,
								emoteMatches: noTeamData,
								fascist: noData,
								greyMatches: noPlayerNumberData,
								legacyMatches: noData,
								liberal: noData,
								practiceMatches: noTeamData,
								rainbowMatches: noPlayerNumberData,
								silentMatches: noTeamData,
							},
						},
					};
				}

				_profile.created = dayjs(account.created).format('MM/DD/YYYY');
				_profile.customCardback = account?.gameSettings?.customCardback;
				_profile.bio = account.bio;
				_profile.lastConnected = account.lastConnected ? dayjs(account.lastConnected).format('MM/DD/YYYY') : '';
				_profile.badges = account.badges || [];
				_profile.eloPercentile = Object.keys(account?.eloPercentile || {}).length ? account.eloPercentile : undefined;
				_profile.maxElo = account?.gameSettings?.staff?.disableVisibleElo ? undefined : Math.round(account?.maxElo || 1600);
				_profile.pastElo = account?.gameSettings?.staff?.disableVisibleElo
					? undefined
					: (account.pastElo as any).toObject().length
						? (account.pastElo as any).toObject()
						: [{ date: new Date(), value: Math.round(account?.overall?.elo || 1600) }];

				_profile.overall = account.overall;

				const defaultSeason = {
					wins: 0,
					losses: 0,
					rainbowWins: 0,
					rainbowLosses: 0,
					elo: 1600,
					xp: 0,
				};

				_profile.season = account.seasons ? account.seasons.get(CURRENT_SEASON_NUMBER.toString()) || defaultSeason : defaultSeason;

				if (account.staffRole) {
					if (account?.gameSettings?.staff && account.gameSettings.staff.disableVisibleElo) {
						delete _profile.overall.elo;
						delete _profile.season.elo;
					}

					if (account?.gameSettings?.staff && account.gameSettings.staff.disableVisibleXP) {
						delete _profile.overall.xp;
						delete _profile.season.xp;
					}
				}

				_profile.isRainbowOverall = account.isRainbowOverall;
				_profile.isRainbowSeason = account.isRainbowSeason;
				_profile.staffRole = account.staffRole;
				_profile.staff = {};
				_profile.staff.disableVisibleXP = account?.gameSettings?.staff && account.gameSettings.staff.disableVisibleXP;
				_profile.staff.disableVisibleElo = account?.gameSettings?.staff && account.gameSettings.staff.disableVisibleElo;
				_profile.playerPronouns = account?.gameSettings?.playerPronouns || '';

				Account.findOne({ username: authedUser }).then((acc) => {
					if (acc && account.username === acc.username) {
						if (!acc.gameSettings) {
							acc.gameSettings = {};
						}

						acc.gameSettings.hasUnseenBadge = false;
						acc.save();
					}

					if (
						acc &&
						acc.staffRole &&
						(acc.staffRole === 'trialmod' || acc.staffRole === 'moderator' || acc.staffRole === 'editor' || acc.staffRole === 'admin')
					) {
						try {
							_profile.lastConnectedIP = '-' + obfIP(account.lastConnectedIP);
						} catch (e) {
							_profile.lastConnectedIP = "Couldn't find IP";
							console.log(e);
						}

						try {
							_profile.signupIP = '-' + obfIP(account.signupIP);
						} catch (e) {
							_profile.signupIP = "Couldn't find IP";
							console.log(e);
						}

						_profile.lastConnected = dayjs(account.lastConnected).format('MM/DD/YYYY h:mm');
						_profile.created = dayjs(account.created).format('MM/DD/YYYY h:mm');

						if (acc.staffRole !== 'trialmod') {
							_profile.blacklist = account?.gameSettings?.blacklist;
						}
					} else {
						_profile.lastConnectedIP = undefined;
						_profile.signupIP = undefined;

						if (account?.gameSettings?.isPrivate) {
							// They are private and lastConnectedIP is set to undefined (ie. requester is not AEM)
							res.status(404).send('Profile not found');
							return;
						}
					}

					res.json(_profile);
				});
			});
		});
	});

	app.get('/gameSummary', (req, res) => {
		const id = req.query.id;

		GameSummary.findById(id)
			.lean()
			.exec()
			.then((gs: any) => {
				if (!gs) {
					res.status(404).send('Game summary not found');
				} else {
					res.json(gs);
				}
			})
			.catch((err: Error) => console.debug(err)); // TODO: is this an error? used to be `.catch((err: Error) => debug(err));`
	});

	app.get('/modThread', (req: any, res) => {
		const id = req.query.id;

		if (!req.session.passport) {
			return;
		}

		const username = req.session.passport.user;

		const mangle = (chat: string) => chat.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

		Account.findOne({ username }).then((account) => {
			if (
				account &&
				(account.staffRole === 'moderator' || account.staffRole === 'editor' || account.staffRole === 'admin' || account.staffRole === 'trialmod')
			) {
				ModThread.findById(id)
					.lean()
					.exec()
					.then((dm: any) => {
						if (!dm) {
							res.status(404).send('Mod thread not found');
						} else {
							const chatLog: string[] = [];

							for (const message of dm.messages) {
								chatLog.push(
									`${message.userName}${message.userName ? (message.type === 'leave' || message.type === 'join' ? ' ' : ': ') : ''}${mangle(message.chat)}`,
								);
							}

							res.send(chatLog.join('<br>'));
						}
					})
					.catch((err: Error) => console.debug(err));
			} else {
				res.status(401).send('You cannot access this resource. Ensure you are logged in.');
			}
		});
	});

	app.get('/gameJSON', (req: any, res) => {
		const id = req.query.id;

		if (!req.session.passport) {
			return;
		}

		const username = req.session.passport.user;

		Account.findOne({ username }).then((account) => {
			if (
				account &&
				(account.staffRole === 'moderator' || account.staffRole === 'editor' || account.staffRole === 'admin' || account.staffRole === 'trialmod')
			) {
				Game.findOne({ uid: id })
					.lean()
					.exec()
					.then((game) => {
						if (!game) {
							res.status(404).send('Game not found');
						} else {
							res.header('Content-Type', 'application/json');
							res.send(game);
						}
					})
					.catch((err: Error) => console.debug(err));
			} else {
				res.status(401).send('You cannot access this resource. Ensure you are logged in.');
			}
		});
	});

	app.get('/online-playercount', (req, res) => {
		res.json({
			count: userList.length,
		});
	});

	app.get('/viewPatchNotes', ensureAuthenticated, (req: any, res) => {
		Account.updateOne({ username: req.user.username }, { lastVersionSeen: version.number }, null, (err: any) => {
			res.sendStatus(err ? 404 : 202);
		});
	});

	app.post('/upload-cardback', ensureAuthenticated, (req: any, res) => {
		try {
			if (!req.session.passport) {
				return;
			}

			const { image } = req.body;
			const raw = image.split(',')[1];
			const username = req.session.passport.user;

			Account.findOne({ username })
				.then((account) => {
					if (!account || !account.isRainbowOverall) {
						res.json({
							message: 'You need to be rainbow to upload a cardback.',
						});

						return;
					}

					if (!account.gameSettings) {
						account.gameSettings = {};
					}

					account.gameSettings.customCardback = account.gameSettings.customCardback || {};

					if (
						account.gameSettings.customCardback.saveTime &&
						new Date(account.gameSettings.customCardback.saveTime) &&
						Date.now() - new Date(account.gameSettings.customCardback.saveTime).getTime() < 30000
					) {
						res.json({
							message: 'You can only change your cardback once every 30 seconds.',
						});
					} else {
						processImage(username, raw, (resp: any, err: Error) => {
							res.json({ message: (err ? err.message : '') || resp });
						});
					}
				})
				.catch((err) => {
					console.log(err, 'account err in cardbacks');
				});
		} catch (err) {
			console.log(err, 'upload cardback crash error');
		}
	});
};
