/*
 * Minimal representation of a game. Schema is likely final and should not be changed without good reason.
 * Use GameSummaryBuilder as a convenience tool to gradually build up this object.
 * Once you fetch this from the database, wrap it in an EnhancedGameSummary for a more human-friendly representation.
 * see: `./GameSummaryBuilder, ./EnhancedGameSummary`
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface IGameSummary {
	_id: string;
	date: number;
	gameSetting: {
		rebalance6p: boolean;
		rebalance7p: boolean;
		rebalance9p: boolean;
		rerebalance9p: boolean;
		casualGame: boolean;
		practiceGame: boolean;
		unlistedGame: boolean;
		avalonSH?: {
			type: {
				withPercival: boolean;
			};
		};
		noTopdecking: number;
	};
	players: {
		username: string;
		role: string;
		icon: number;
		hashUid: string;
	}[];
	libElo: {
		overall: number;
		season: number;
	};
	fasElo: {
		overall: number;
		season: number;
	};
	logs: {
		// election
		presidentId: number;
		chancellorId: number;
		votes: boolean[];

		// policy enaction
		presidentHand: ('fascist' | 'liberal')[];
		chancellorHand: string[];
		enactedPolicy: string;

		presidentClaim: string[];
		chancellorClaim: string[];

		presidentVeto: boolean;
		chancellorVeto: boolean;

		// actions
		policyPeek: string[];
		policyPeekClaim: string[];
		investigatorId: number;
		investigationId: number;
		investigationClaim: string;
		specialElection: number;
		execution: number;
		assassination: number;

		// other metadata
		deckState: ('fascist' | 'liberal')[]
	}[];
	customGameSettings: {
		enabled: boolean;
		powers: (string | null)[];
		hitlerZone: number;
		vetoZone: number;
		fascistCount: number;
		hitKnowsFas: boolean;
		deckState: {
			lib: number;
			fas: number;
		};
		trackState: {
			lib: number;
			fas: number;
		};
	};
}


const gameSummary = new Schema<IGameSummary>({
	_id: String,
	date: Date,
	gameSetting: {
		rebalance6p: Boolean,
		rebalance7p: Boolean,
		rebalance9p: Boolean,
		rerebalance9p: Boolean,
		casualGame: Boolean,
		practiceGame: Boolean,
		unlistedGame: Boolean,
		avalonSH: {
			type: {
				withPercival: Boolean
			},
			default: null
		},
		noTopdecking: Number
	},
	players: [
		{
			username: String,
			role: String,
			icon: Number,
			hashUid: String
		}
	],
	libElo: {
		overall: Number,
		season: Number
	},
	fasElo: {
		overall: Number,
		season: Number
	},
	logs: [
		{
			// election
			presidentId: Number,
			chancellorId: Number,
			votes: Array, // [Boolean]

			// policy enaction
			presidentHand: Array, // [String] eg. [ "fascist", "liberal", "fascist" ]
			chancellorHand: Array, // [String]
			enactedPolicy: String,

			presidentClaim: Array, // [String]
			chancellorClaim: Array, // [String]

			presidentVeto: Boolean,
			chancellorVeto: Boolean,

			// actions
			policyPeek: Array, // [String]
			policyPeekClaim: Array, // [String]
			investigatorId: Number,
			investigationId: Number,
			investigationClaim: String,
			specialElection: Number,
			execution: Number,
			assassination: Number,

			// other metadata
			deckState: Array // [String], eg. [ "fascist", "liberal", "fascist", "fascist", "liberal" ]
		}
	],
	customGameSettings: {
		enabled: Boolean,
		powers: Array, // [power x5, string or null]
		hitlerZone: Number,
		vetoZone: Number,
		fascistCount: Number,
		hitKnowsFas: Boolean,
		deckState: {
			lib: Number,
			fas: Number
		},
		trackState: {
			lib: Number,
			fas: Number
		}
	}
});

export default mongoose.model<IGameSummary>('GameSummary', gameSummary);
