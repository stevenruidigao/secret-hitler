import mongoose from 'mongoose';
// @ts-expect-error: no types for passport-local-mongoose
import passportLocalMongoose from 'passport-local-mongoose';

const { Schema } = mongoose;

export interface IStats {
	xp?: number;
	elo?: number;
	wins?: number;
	losses?: number;
	rainbowWins?: number;
	rainbowLosses?: number;
}

export interface IGameSettings {
	playerPronouns?: string;
	staff?: {
		disableVisibleElo?: boolean;
		disableVisibleXP?: boolean;
		disableStaffColor?: boolean;
		incognito?: boolean;
	};
	isRainbow?: boolean;
	newReport?: boolean;
	hasUnseenBadge?: boolean;
	customCardback?: {
		fileExtension?: string;
		saveTime?: string;
		uid?: string;
	};
	enableTimestamps?: boolean;
	enableRightSidebarInGame?: boolean;
	disablePlayerColorsInChat?: boolean;
	disablePlayerCardbacks?: boolean;
	disableHelpMessages?: boolean;
	disableHelpIcons?: boolean;
	disableConfetti?: boolean;
	disableCrowns?: boolean;
	disableSeasonal?: boolean;
	disableAggregations?: boolean;
	disableKillConfirmation?: boolean;
	soundStatus?: string;
	unbanTime?: Date;
	unTimeoutTime?: Date;
	fontSize?: number;
	fontFamily?: string;
	isPrivate?: boolean;
	privateToggleTime?: number;
	blacklist?: string[];
	tournyWins?: string[];
	hasChangedName?: boolean;
	previousSeasonAward?: string;
	specialTournamentStatus?: string;
	disableElo?: boolean;
	fullheight?: boolean;
	safeForWork?: boolean;
	keyboardShortcuts?: string;
	notifyForNewLobby?: boolean;
	gameFilters?: {
		unstarted?: boolean;
		inProgress?: boolean;
		completed?: boolean;
		pub?: boolean;
		priv?: boolean;
		custom?: boolean;
		casual?: boolean;
		timedMode?: boolean;
		standard?: boolean;
		rainbow?: boolean;
	};
	gameNotes?: {
		top?: number;
		left?: number;
		width?: number;
		height?: number;
	};
	playerNotes?: string[];
	ignoreIPBans?: boolean;
	truncatedSize?: number;
	claimCharacters?: string;
	claimButtons?: string;
}

export interface IWarning {
	text?: string;
	moderator?: string;
	time?: Date;
	acknowledged?: boolean;
}

export interface IFeedbackSubmission {
	time?: Date;
	text?: string;
}

export interface IBadge {
	id?: string;
	text?: string;
	title?: string;
	dateAwarded?: Date;
}

export interface IHistoricalElo {
	date?: Date;
	value?: number;
}

export interface IAccount {
	version?: number;
	username?: string;
	password?: string;
	isLocal?: boolean;
	staffRole?: string;
	isContributor?: boolean;
	dismissedSignupModal?: boolean;
	gameSettings?: IGameSettings;
	verification?: {
		email?: string;
	};
	signupIP?: string;
	lastConnectedIP?: string;
	lastConnected?: Date;
	ipHistory?: string[];
	verified?: boolean;
	isBanned?: boolean;
	isTimeout?: Date;
	touLastAgreed?: string;
	bio?: string;
	games?: string[];
	overall?: IStats;
	seasons?: Map<number, IStats>;
	previousDayElo?: number;
	previousDayXP?: number;
	created?: Date;
	isOnFire?: boolean;
	lastCompletedGame?: Date;
	lastVersionSeen?: string;
	isFixed?: boolean;
	hashUid?: string;
	discord?: {
		username?: string;
		discriminator?: string;
		mfa?: boolean;
		uid?: string;
	};
	github?: {
		username?: string;
		mfa?: boolean;
	};
	warnings?: IWarning[];
	feedbackSubmissions?: IFeedbackSubmission[];
	colors?: {
		primary?: string;
		secondary?: string;
		tertiary?: string;
		background?: string;
		text?: string;
	};
	eloPercentile?: {
		seasonal?: number;
		overall?: number;
	};
	isRainbowSeason?: boolean;
	isRainbowOverall?: boolean;
	dateRainbowOverall?: Date;
	badges?: IBadge[];
	maxElo?: number;
	pastElo?: IHistoricalElo[];
	isTournamentMod?: boolean;
}

const Stats = new Schema<IStats>({
	xp: { type: Number, default: 0 },
	elo: { type: Number, default: 1600 },
	wins: { type: Number, default: 0 },
	losses: { type: Number, default: 0 },
	rainbowWins: { type: Number, default: 0 },
	rainbowLosses: { type: Number, default: 0 }
});

const Account = new Schema<IAccount>({
	version: Number,
	username: { type: String, required: true, unique: true },
	password: String,
	isLocal: Boolean,
	staffRole: String,
	isContributor: Boolean,
	dismissedSignupModal: Boolean,
	gameSettings: {
		playerPronouns: String,
		staff: {
			disableVisibleElo: Boolean,
			disableVisibleXP: Boolean,
			disableStaffColor: Boolean,
			incognito: Boolean
		},
		isRainbow: Boolean,
		newReport: Boolean,
		hasUnseenBadge: Boolean,
		customCardback: {
			fileExtension: String, // always 'png'
			saveTime: String,
			uid: String
		},
		enableTimestamps: Boolean,
		enableRightSidebarInGame: Boolean,
		disablePlayerColorsInChat: Boolean,
		disablePlayerCardbacks: Boolean,
		disableHelpMessages: Boolean,
		disableHelpIcons: Boolean,
		disableConfetti: Boolean,
		disableCrowns: Boolean,
		disableSeasonal: Boolean,
		disableAggregations: Boolean,
		disableKillConfirmation: Boolean,
		soundStatus: String,
		unbanTime: Date,
		unTimeoutTime: Date,
		fontSize: Number,
		fontFamily: String,
		isPrivate: Boolean,
		privateToggleTime: Number,
		blacklist: Array,
		tournyWins: Array,
		hasChangedName: Boolean,
		previousSeasonAward: String,
		specialTournamentStatus: String,
		disableElo: Boolean,
		fullheight: Boolean,
		safeForWork: Boolean,
		keyboardShortcuts: String,
		notifyForNewLobby: Boolean,
		gameFilters: {
			unstarted: Boolean,
			inProgress: Boolean,
			completed: Boolean,
			pub: Boolean,
			priv: Boolean,
			custom: Boolean,
			casual: Boolean,
			timedMode: Boolean,
			standard: Boolean,
			rainbow: Boolean
		},
		gameNotes: {
			top: Number,
			left: Number,
			width: Number,
			height: Number
		},
		playerNotes: Array,
		ignoreIPBans: Boolean,
		truncatedSize: Number,
		claimCharacters: String,
		claimButtons: String
	},
	verification: {
		email: String
	},
	signupIP: String,
	lastConnectedIP: String,
	lastConnected: Date,
	ipHistory: Array,
	verified: Boolean,
	isBanned: Boolean,
	isTimeout: Date,
	touLastAgreed: String,
	bio: String,
	games: Array,
	overall: Stats,
	seasons: { type: Map, of: Stats, default: {} },
	previousDayElo: Number,
	previousDayXP: Number,
	created: Date,
	isOnFire: Boolean,
	lastCompletedGame: Date,
	lastVersionSeen: String,
	isFixed: Boolean,
	hashUid: String,
	discord: {
		username: String,
		discriminator: String,
		mfa: Boolean,
		uid: String
	},
	github: {
		username: String,
		mfa: Boolean
	},
	warnings: Array, // { text: String, moderator: String, time: Date, acknowledged: Boolean },
	feedbackSubmissions: Array, // { time: Date, text: String }
	colors: {
		primary: String,
		secondary: String,
		tertiary: String,
		background: String,
		text: String
	},
	eloPercentile: {
		seasonal: Number,
		overall: Number
	},
	isRainbowSeason: Boolean,
	isRainbowOverall: Boolean,
	dateRainbowOverall: Date,
	badges: [{ id: String, text: String, title: String, dateAwarded: Date }],
	maxElo: { type: Number, default: 1600 },
	pastElo: [{ date: Date, value: Number }],
	isTournamentMod: Boolean
});

Account.plugin(passportLocalMongoose);

export default mongoose.model<IAccount>('Account', Account);
