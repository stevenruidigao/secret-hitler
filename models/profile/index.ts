import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface IMatchData {
	events?: number;
	successes?: number;
}

export interface IRoleMatchData {
	liberal?: IMatchData;
	fascist?: IMatchData;
}

export interface IPlayerCountMatchData {
	liberal?: IMatchData;
	fascist?: IMatchData;
	5?: IRoleMatchData;
	6?: IRoleMatchData;
	7?: IRoleMatchData;
	8?: IRoleMatchData;
	9?: IRoleMatchData;
	10?: IRoleMatchData;
}

export interface IRecentGame {
	_id?: string;
	loyalty?: string;
	playerSize?: number;
	isWinner?: boolean;
	isRebalanced?: boolean;
	date?: Date;
}

export interface IProfile {
	_id?: string;
	username?: string;
	version?: string;
	created?: Date;
	customCardback?: string;
	bio?: string;
	lastConnectedIP?: string;
	stats?: {
		matches?: {
			legacyMatches?: IRoleMatchData;
			greyMatches?: IPlayerCountMatchData;
			rainbowMatches?: IPlayerCountMatchData;
			practiceMatches?: IRoleMatchData;
			silentMatches?: IRoleMatchData;
			emoteMatches?: IRoleMatchData;
			casualMatches?: IRoleMatchData;
			customMatches?: IRoleMatchData;
		};
		actions?: {
			voteAccuracy?: IMatchData;
			shotAccuracy?: IMatchData;
			legacyVoteAccuracy?: IMatchData;
			legacyShotAccuracy?: IMatchData;
		};
	};
	recentGames?: IRecentGame[];
}

const matchData = {
	events: { type: Number, default: 0 },
	successes: { type: Number, default: 0 }
};

const roleMatchData = {
	liberal: matchData,
	fascist: matchData
};

const profileSchema = new Schema<IProfile>({
	_id: String, // username
	username: String,
	version: String, // versioning for `recalculateProfiles`
	created: Date,
	customCardback: String,
	bio: String,
	lastConnectedIP: String,
	stats: {
		matches: {
			legacyMatches: roleMatchData, // pre-reset games
			greyMatches: {
				// ranked grey games
				liberal: matchData,
				fascist: matchData,
				5: roleMatchData,
				6: roleMatchData,
				7: roleMatchData,
				8: roleMatchData,
				9: roleMatchData,
				10: roleMatchData
			},
			rainbowMatches: {
				// ranked rainbow games
				liberal: matchData,
				fascist: matchData,
				5: roleMatchData,
				6: roleMatchData,
				7: roleMatchData,
				8: roleMatchData,
				9: roleMatchData,
				10: roleMatchData
			},
			practiceMatches: roleMatchData, // practice games
			silentMatches: roleMatchData, // silent games
			emoteMatches: roleMatchData, // emote-only games
			casualMatches: roleMatchData, // casual games
			customMatches: roleMatchData // custom (any settings) games
		},
		actions: {
			voteAccuracy: matchData,
			shotAccuracy: matchData,
			legacyVoteAccuracy: matchData,
			legacyShotAccuracy: matchData
		}
	},
	recentGames: {
		type: [
			{
				_id: String,
				loyalty: String,
				playerSize: Number,
				isWinner: Boolean,
				isRebalanced: Boolean,
				date: Date
			}
		],
		default: []
	}
});

export default mongoose.model<IProfile>('Profile', profileSchema);
