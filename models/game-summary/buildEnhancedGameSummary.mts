/* eslint-disable spaced-comment */
import { Map, isIndexed, fromJS } from 'immutable';
// @ts-expect-error: no types for option
import { fromNullable, some, none } from 'option';
import buildTurns from './buildTurns.mts';

/*
 * Wraps a gameSummary to produce a more human-friendly representation.
 * Feel free to add to this as needed.
 * Refer to `/docs/enhanced-game-summary.md` for API documentation.
 */
export default function buildEnhancedGameSummary(_summary: any) {
	// convert Arrays to Lists and some values to Options
	const summary: any = fromJS(_summary, (key, value, path) => {
		const options = [
			'presidentHand',
			'chancellorHand',
			'enactedPolicy',
			'presidentClaim',
			'chancellorClaim',
			'presidentVeto',
			'chancellorVeto',
			'policyPeek',
			'policyPeekClaim',
			'investigatorId',
			'investigationId',
			'investigationClaim',
			'specialElection',
			'execution',
			'assassination'
		];

		return key === 'logs'
			? value
					.map((log: any) => {
						const logOptions = Map(
							options.map(o => {
								const optValue = log[o] !== undefined && log[o].size !== 0 && log[o].length !== 0 ? some(log[o]) : none;
								// filter out 0-length arrays/lists in addition to undefined values
								return [o, optValue];
							})
						).toObject();
						return Object.assign({}, log, logOptions);
					})
					.toList()
			: isIndexed(value)
			? value.toList()
			: value.toObject();
	});

	// String
	const id = summary._id;

	// Date
	const date = summary.date;

	// List[{ id: Int, username: String, role: String, loyalty: String }]
	const players = (() => {
		const roleToLoyalty = Map({
			liberal: 'liberal',
			percival: 'liberal',
			merlin: 'liberal',
			morgana: 'fascist',
			fascist: 'fascist',
			hitler: 'fascist'
		});

		return summary.players.map((p: any, i: number) => {
			return Object.assign({}, p, {
				id: i,
				loyalty: roleToLoyalty.get(p.role),
				icon: p.icon
			});
		});
	})();

	// List[Turn]
	const turns = buildTurns(summary.logs, players, summary.gameSetting);

	// Int
	const playerSize = players.size;

	// Boolean
	const isRebalanced =
		summary.gameSetting.rebalance6p || summary.gameSetting.rebalance7p || summary.gameSetting.rebalance9p || summary.gameSetting.rerebalance9p;

	const casualGame = summary.gameSetting.casualGame;
	const practiceGame = summary.gameSetting.practiceGame;
	const unlistedGame = summary.gameSetting.unlistedGame;

	// String
	const winningTeam = (() => {
		const lastTurn = turns.last();

		if (lastTurn.isMerlinShot) {
			return 'fascist';
		}

		if (summary.gameSetting.noTopdecking > 0 && lastTurn.isElectionTrackerMaxed) {
			return 'fascist';
		}

		if (lastTurn.isHitlerElected) {
			return 'fascist';
		} else if (lastTurn.isHitlerKilled) {
			return 'liberal';
		} else {
			if (!lastTurn.enactedPolicy) {
				console.log('no lastturn enacted policy @ buildenhancedgamesummary');
				return null;
			}
			return lastTurn.enactedPolicy.value();
		}
	})();

	// Option[Int]
	const hitlerZone = (() => {
		const i = turns.findIndex(t => t.beforeTrack.reds === 3);
		return i > -1 ? some(i) : none;
	})();

	// Option[Int]
	const indexOf = (id: any) => {
		return fromNullable(Number.isInteger(id) ? id : players.findIndex((p: any) => p.username === id));
	};

	// Option[Int]
	const playerOf = (id: any) => {
		return fromNullable(Number.isInteger(id) ? players.get(id) : players.find((p: any) => p.username === id));
	};

	// Option[String]
	const usernameOf = (id: any) => {
		return playerOf(id).map((p: any) => p.username);
	};

	// Option[String]
	const tagOf = (id: any) => {
		return playerOf(id).map((p: any) => `${p.username} [${p.id}]`);
	};

	// Option[String]
	const loyaltyOf = (id: any) => {
		return playerOf(id).map((p: any) => p.loyalty);
	};

	// Option[String]
	const roleOf = (id: any) => {
		return playerOf(id).map((p: any) => p.role);
	};

	// Option[List[Option[{ ja: Boolean, presidentId: Int, chancellorId: Int }]]]
	const votesOf = (username: any) => {
		return indexOf(username).map((i: any) =>
			turns
				.filter(t => t.votes.get(i))
				.map(t => {
					return t.votes.get(i).map((v: any) => ({
						ja: v,
						presidentId: t.presidentId,
						chancellorId: t.chancellorId
					}));
				})
		);
	};

	// Option[List[Int]]
	const shotsOf = (username: any) => {
		return indexOf(username).map((i: any) => turns.filter(t => t.presidentId === i && t.execution.isSome()).map(t => t.execution.value()));
	};

	// Option[Boolean]
	const isWinner = (username: any) => {
		return loyaltyOf(username).map((l: any) => l === winningTeam);
	};

	return {
		summary,
		id,
		date,
		players,
		turns,
		playerSize,
		hitlerZone,
		winningTeam,
		isRebalanced,
		casualGame,
		practiceGame,
		unlistedGame,
		usernameOf,
		tagOf,
		indexOf,
		loyaltyOf,
		roleOf,
		votesOf,
		shotsOf,
		isWinner
	};
}
