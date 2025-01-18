import debug from 'debug';
import { List } from 'immutable';

import { checkBadgesGamesPlayed } from '../../routes/socket/badges.ts';
import { profiles } from '../../routes/socket/models.ts';
import { flattenListOpts } from '../../utils/index.ts';

import Account from '../account.ts';

import Profile from './index.ts';

const debugLogger = debug('game:profile');

// handles all stat computation logic
export function profileDelta(username: string, game: any) {
	const { playerSize, isRebalanced, date, id } = game;
	const isWinner = game.isWinner(username).value();
	const loyalty = game.loyaltyOf(username).value();
	const isLiberal = loyalty === 'liberal';
	const isFascist = !isLiberal;
	const votes = game.hitlerZone
		.map((hz: any) =>
			flattenListOpts(game.votesOf(username).value().slice(hz)).filter(
				(v: any) => game.loyaltyOf(v.presidentId).value() === 'fascist' || game.roleOf(v.chancellorId).value() === 'hitler',
			),
		)
		.valueOrElse(List());
	const accurateVotes = votes.filterNot((v: any) => {
		const { presidentId, chancellorId, ja } = v;
		const presidentLoyalty = game.loyaltyOf(presidentId).value();
		const chancellorRole = game.roleOf(chancellorId).value();

		return ja && (presidentLoyalty === 'fascist' || chancellorRole === 'hitler');
	});
	const shots = game.shotsOf(username).value();
	const accurateShots = shots.filter((id: any) => game.loyaltyOf(id).value() === 'fascist');

	if (game.casualGame || game.practiceGame || (game.summary && game.summary.customGameSettings && game.summary.customGameSettings.enabled)) {
		return {
			stats: {
				matches: {
					allMatches: {
						events: 1,
						successes: isWinner ? 1 : 0,
					},
					liberal: {
						events: isLiberal ? 1 : 0,
						successes: isLiberal && isWinner ? 1 : 0,
					},
					fascist: {
						events: isFascist ? 1 : 0,
						successes: isFascist && isWinner ? 1 : 0,
					},
				},
				actions: {
					voteAccuracy: {
						events: 0,
						successes: 0,
					},
					shotAccuracy: {
						events: 0,
						successes: 0,
					},
				},
			},
			recentGames: {
				_id: id,
				loyalty,
				playerSize,
				isWinner,
				isRebalanced,
				date,
			},
		};
	}

	return {
		stats: {
			matches: {
				allMatches: {
					events: 1,
					successes: isWinner ? 1 : 0,
				},
				liberal: {
					events: isLiberal ? 1 : 0,
					successes: isLiberal && isWinner ? 1 : 0,
				},
				fascist: {
					events: isFascist ? 1 : 0,
					successes: isFascist && isWinner ? 1 : 0,
				},
			},
			actions: {
				voteAccuracy: {
					events: isLiberal ? votes.size : 0,
					successes: isLiberal ? accurateVotes.size : 0,
				},
				shotAccuracy: {
					events: isLiberal ? shots.size : 0,
					successes: isLiberal ? accurateShots.size : 0,
				},
			},
		},
		recentGames: {
			_id: id,
			loyalty,
			playerSize,
			isWinner,
			isRebalanced,
			date,
		},
	};
}

function profileDeltaWithMatchType(username: string, game: any, gameSummary: any) {
	const matchType =
		game.general.playerChats === 'emotes'
			? 'emoteMatches'
			: game.customGameSettings && game.customGameSettings.enabled
				? 'customMatches'
				: game.general.casualGame
					? 'casualMatches'
					: game.general.playerChats === 'disabled'
						? 'silentMatches'
						: game.general.practiceGame
							? 'practiceMatches'
							: game.general.private || game.general.unlistedGame
								? ''
								: game.general.rainbowgame
									? 'rainbowMatches'
									: 'greyMatches';
	let playerCountToLog = 0;

	if (matchType === 'greyMatches' || matchType === 'rainbowMatches') {
		playerCountToLog = game.general.playerCount;
	}

	return {
		delta: profileDelta(username, gameSummary),
		matchType,
		playerCountToLog,
	};
}

// username: String, game: enhancedGameSummary, options: { version: String, cache: Boolean }
function updateProfile(username: string, game: any, gameSummary: any, options: any = {}) {
	const { version, cache } = options;
	const { delta, matchType, playerCountToLog } = profileDeltaWithMatchType(username, game, gameSummary);

	let $inc;

	if (!matchType) {
		$inc = {};
	} else {
		$inc = {
			// [`stats.matches.${matchType}.events`]: delta.stats.matches.allMatches.events,
			// [`stats.matches.${matchType}.successes`]: delta.stats.matches.allMatches.successes,

			[`stats.matches.${matchType}.liberal.events`]: delta.stats.matches.liberal.events,
			[`stats.matches.${matchType}.liberal.successes`]: delta.stats.matches.liberal.successes,

			[`stats.matches.${matchType}.fascist.events`]: delta.stats.matches.fascist.events,
			[`stats.matches.${matchType}.fascist.successes`]: delta.stats.matches.fascist.successes,

			'stats.actions.voteAccuracy.events': delta.stats.actions.voteAccuracy.events,
			'stats.actions.voteAccuracy.successes': delta.stats.actions.voteAccuracy.successes,

			'stats.actions.shotAccuracy.events': delta.stats.actions.shotAccuracy.events,
			'stats.actions.shotAccuracy.successes': delta.stats.actions.shotAccuracy.successes,
		};

		if (playerCountToLog !== 0) {
			$inc[`stats.matches.${matchType}.${playerCountToLog}.liberal.events`] = delta.stats.matches.liberal.events;
			$inc[`stats.matches.${matchType}.${playerCountToLog}.liberal.successes`] = delta.stats.matches.liberal.successes;
			$inc[`stats.matches.${matchType}.${playerCountToLog}.fascist.events`] = delta.stats.matches.fascist.events;
			$inc[`stats.matches.${matchType}.${playerCountToLog}.fascist.successes`] = delta.stats.matches.fascist.successes;
		}
	}

	return (
		Profile.findByIdAndUpdate(
			username,
			{
				$inc,
				$push: {
					recentGames: {
						$each: [delta.recentGames],
						$position: 0,
						$slice: 10,
					},
				},
			},
			{
				new: true,
				upsert: true,
			},
		)
			.exec()
			// drop the document when recalculating profiles
			.then((profile: any) => {
				if (!profile) {
					return null;
				} else if (version && profile.version !== version) {
					return profile
						.update({ version }, { overwrite: true })
						.exec()
						.then(() => updateProfile(username, game, gameSummary, options));
				} else {
					return profile;
				}
			})
			// fetch account creation date when profile is first added
			.then((profile: any) => {
				if (!profile) {
					return null;
				} else if (!profile.created) {
					return Account.findOne({ username: profile._id })
						.exec()
						.then((account: any) => {
							if (account) {
								profile.created = account.created;
								return profile.save();
							} else return null;
						});
				} else {
					return profile;
				}
			})
			.then((profile: any) => {
				if (!profile) return null;
				Account.findOne({ username }).then((account: any) => {
					checkBadgesGamesPlayed(
						account,
						profile.stats.matches.greyMatches.liberal.events +
							profile.stats.matches.greyMatches.fascist.events +
							profile.stats.matches.rainbowMatches.liberal.events +
							profile.stats.matches.rainbowMatches.fascist.events +
							profile.stats.matches.practiceMatches.liberal.events +
							profile.stats.matches.practiceMatches.fascist.events +
							profile.stats.matches.silentMatches.liberal.events +
							profile.stats.matches.silentMatches.fascist.events,
						profile.stats.matches.greyMatches.liberal.successes +
							profile.stats.matches.greyMatches.fascist.successes +
							profile.stats.matches.rainbowMatches.liberal.successes +
							profile.stats.matches.rainbowMatches.fascist.successes +
							profile.stats.matches.practiceMatches.liberal.successes +
							profile.stats.matches.practiceMatches.fascist.successes +
							profile.stats.matches.silentMatches.liberal.successes +
							profile.stats.matches.silentMatches.fascist.successes,
						profile.stats.matches.customMatches.liberal.events + profile.stats.matches.customMatches.fascist.events,
						profile.stats.matches.silentMatches.liberal.events + profile.stats.matches.silentMatches.fascist.events,
						profile.stats.matches.emoteMatches.liberal.events + profile.stats.matches.emoteMatches.fascist.events,
						gameSummary.id,
					);
					account.save();
				});
			})
			.then((profile: any) => {
				if (!profile) return null;
				else if (cache) return profiles.push(profile);
				else return profile;
			})
			.catch((err: Error) => debugLogger(err))
	);
}

// game: enhancedGameSummary, options: { version: String, cache: Boolean }
export function updateProfiles(game: any, gameSummary: any, options = {}) {
	debugLogger('Updating profiles for: %s', gameSummary.id);

	return Promise.all(gameSummary.players.map((p: any) => p.username).map((username: string) => updateProfile(username, game, gameSummary, options)));
}

// side effect: caches profile
export function getProfile(username: string) {
	return Profile.findById(username).exec();
}
