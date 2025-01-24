import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface IGame {
	uid?: string;
	name?: string;
	flag?: string;
	date?: Date;
	playerChats?: string;
	playerCount?: number;
	winningPlayers?: any[];
	losingPlayers?: any[];
	winningTeam?: string;
	season?: number;
	isRainbow?: boolean;
	eloMinimum?: number;
	xpMinimum?: number;
	rebalance6p?: boolean;
	rebalance7p?: boolean;
	rebalance9p?: boolean;
	rerebalance9p?: boolean;
	rebalance9p2f?: boolean;
	isTournyFirstRound?: boolean;
	isTournySecondRound?: boolean;
	casualGame?: boolean;
	practiceGame?: boolean;
	customGame?: boolean;
	unlistedGame?: boolean;
	isVerifiedOnly?: boolean;
	chats?: any[];
	hiddenInfoChat?: any[];
	guesses?: Map<string, string>;
	merlinGuesses?: Map<string, number>;
	timedMode?: number;
	blindMode?: boolean;
	avalonSH?: {
		withPercival?: boolean;
	};
	noTopdecking?: number;
	completed?: boolean;
}

const Game = new Schema<IGame>({
	uid: String,
	name: String,
	flag: String,
	date: Date,
	playerChats: String, // silent vs emote vs regular
	playerCount: Number,
	winningPlayers: Array,
	losingPlayers: Array,
	winningTeam: String,
	season: Number,
	isRainbow: Boolean,
	eloMinimum: Number,
	xpMinimum: Number,
	rebalance6p: Boolean,
	rebalance7p: Boolean,
	rebalance9p: Boolean,
	rerebalance9p: Boolean,
	rebalance9p2f: Boolean,
	isTournyFirstRound: Boolean,
	isTournySecondRound: Boolean,
	casualGame: Boolean,
	practiceGame: Boolean,
	customGame: Boolean,
	unlistedGame: Boolean,
	isVerifiedOnly: Boolean,
	chats: Array,
	hiddenInfoChat: Array,
	guesses: {
		type: Map,
		of: String,
	},
	merlinGuesses: {
		type: Map,
		of: Number,
	},
	timedMode: Number, // timer length
	blindMode: Boolean,
	avalonSH: {
		withPercival: Boolean,
	},
	noTopdecking: Number,
	completed: Boolean,
});

export default mongoose.model<IGame>('Game', Game);
