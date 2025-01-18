/*
 * Represents a human-readable game. Feel free to add more convenience methods.
 * Refer to `/docs/enhanced-game-summary.md` for API documentation.
 */

export default class EnhancedGameSummary {
	summary: any;
	id: string;
	date: any;
	players: any[];
	logs: any[];
	playerSize: number;
	hitlerIndex: number;
	numberOfTurns: number;
	lastTurn: any;
	hitlerZone: number;

	constructor(summary: any) {
		// from summary
		this.summary = summary;
		this.id = summary._id;
		this.date = summary.date;
		this.players = summary.players;
		this.logs = summary.logs;

		// derived
		this.playerSize = this.players.length;

		this.hitlerIndex = this.players.findIndex((p) => p.role === 'hitler');

		this.numberOfTurns = this.logs.length;

		this.lastTurn = this.logs.slice(-1)[0];

		this.hitlerZone = (() => {
			const step = (turn: any, reds: number) => {
				const log = this.logs[turn],
					enactedPolicy = log && log.enactedPolicy;

				if (!log) {
					return -1;
				} else if (reds === 3) {
					return turn;
				} else if (enactedPolicy === 'fascist') {
					return step(turn + 1, reds + 1);
				} else {
					return step(turn + 1, reds);
				}
			};

			return step(0, 0);
		})();

		// bind own methods
		this._isId = this._isId.bind(this);
		this.playerOf = this.playerOf.bind(this);
		this.indexOf = this.indexOf.bind(this);
		this.loyaltyOf = this.loyaltyOf.bind(this);
	}

	_isId(identifier: any) {
		return Number.isInteger(identifier);
	}

	playerOf(identifier: any) {
		if (this._isId(identifier)) {
			return this.players[identifier];
		} else {
			return this.players.find((p) => p.username === identifier);
		}
	}

	indexOf(identifier: any) {
		if (this._isId(identifier)) {
			return identifier;
		} else {
			return this.players.findIndex((p) => p.username === identifier);
		}
	}

	isWinner(identifier: any) {
		if (this.lastTurn.execution === this.hitlerIndex) {
			return this.loyaltyOf(identifier) === 'liberal';
		} else if (this.lastTurn.chancellorId === this.hitlerIndex && this.lastTurn.votes.filter((v: any) => v).length > this.playerSize / 2) {
			return this.loyaltyOf(identifier) === 'fascist';
		} else {
			return this.loyaltyOf(identifier) === this.lastTurn.enactedPolicy;
		}
	}

	// different from `roleOf()`
	loyaltyOf(identifier: any) {
		const player = this.playerOf(identifier);

		if (player.role.team === 'fascist') {
			return 'fascist';
		} else {
			return 'liberal';
		}
	}

	// different from `loyaltyOf()`
	roleOf(identifier: any) {
		const player = this.playerOf(identifier);
		return player.role;
	}

	votesOf(identifier: any) {
		const playerIndex = this.indexOf(identifier);

		return this.logs.map((log) => {
			const { presidentId, chancellorId, votes } = log;

			return {
				presidentId,
				chancellorId,
				vote: votes[playerIndex],
			};
		});
	}

	shotsOf(identifier: any) {
		const playerIndex = this.indexOf(identifier);

		return this.logs.filter((log) => log.presidentId === playerIndex && Number.isInteger(log.execution)).map((log) => log.execution);
	}
}
