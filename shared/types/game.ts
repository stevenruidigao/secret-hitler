export type Policy = 'fascist' | 'liberal';
export type Hand = { reds: number; blues: number } & Policy[];

// TODO: find common with User
export interface PublicPlayer {
	userName: string;
	customCardback?: {
		fileExtension?: string;
		saveTime?: string;
		uid?: string;
	};
	previousSeasonAward: string;
	connected: boolean;
	isRemakeVoting?: boolean;
	pingTime?: number;
	cardStatus: {
		cardDisplayed?: boolean;
		cardFront?: string;
		cardBack: any;
		isFlipped?: boolean;
	};
	governmentStatus?: string;
	previousGovernmentStatus?: string;
	isLoader?: boolean;
	isDead?: boolean;
	notificationStatus?: string;
	isConfetti?: boolean;
	leftGame?: boolean;
	nameStatus?: string;
	tournyWins?: any;
	specialTournamentStatus?: string;
	isPrivate?: boolean;
}

export interface Player extends PublicPlayer {
	staff?: any;
	claim?: any;
	role?: any;
	playersState: Player[];
	gameChats: any[];
	wonGame?: boolean;
	wasInvestigated?: boolean;
	voteStatus?: any;
	policyNotification?: boolean;
	cardFlingerState?: CardFlingerState[];
}

export type CardFlingerState = {
	position?: string;
	action?: string;
	notificationStatus?: string;
	cardStatus: {
		isFlipped: boolean;
		cardFront: string;
		cardBack: string;
	};
	discard?: boolean;
};

export type ActiveGame = {
	uid?: string;
	general: {
		uid: string;
		name: string;
		flag?: string;
		type?: number;
		private: boolean | string;
		status?: string;
		maxPlayersCount: number;
		minPlayersCount: number;
		excludedPlayerCount: number[];
		eloMinimum?: number;
		xpMinimum?: number;
		practiceGame: boolean;
		casualGame: boolean;
		unlistedGame: boolean;
		rainbowgame: boolean;
		blindMode: boolean;
		timedMode: number;
		experiencedMode: boolean;
		privateOnly?: boolean;
		isVerifiedOnly: boolean;
		avalonSH: any;
		disableGamechat: boolean;
		noTopdecking: number;
		rebalance6p: boolean;
		rebalance7p: boolean;
		rebalance9p2f: boolean;
		rerebalance9p?: boolean;
		disableObserver: boolean;
		disableObserverLobby: boolean;
		flappyMode?: boolean;
		flappyOnlyMode?: boolean;
		tournyInfo?: any;
		isTourny: boolean;
		//
		playerCount?: number;
		isRemade: boolean;
		livingPlayerCount?: number;
		electionCount: number;
		replacementNames?: string[];
		whitelistedPlayers: string[];
		timeStarted?: number;
		playerChats: string | any[];
		isRecorded?: boolean;
		timeCreated?: Date;
		chatReplTime: number[];
		isRemaking?: boolean;
		timeAbandoned?: Date | null;
		lastModPing: number;
		remakeCount?: number;
		modDeleteDelay?: number;
		privateAnonymousRemakes: any;
		date?: any;
		isRainbow?: any;
	};
	private: Partial<{
		lock: any;
		gameCreatorName: string;
		seatedPlayers: Player[];
		privatePassword: string;
		reports: any;
		policies: string[];
		unSeatedGameChats: any[];
		hiddenInfoChat: any[];
		summary: any;
		timerId: any;
		invIndex: number;
		replayGameChats: any[];
		currentElectionPolicies: any[];
		currentChancellorOptions: any[];
		voteSpamData: any;
		reportCounts: Record<string, any>;
		hiddenInfoSubscriptions: any[];
		hiddenInfoShouldNotify: boolean;
		commandChats: Record<string, any[]>;
		gameCreatorBlacklist: any[];
		remakeTimer: any;
		gameFrozen: boolean;
		votesPeeked: boolean;
		remakeVotesPeeked: boolean;
		_chancellorPlayerName: string;
	}>;
	gameState: {
		isStarted?: boolean;
		isCompleted?: string;
		timeCompleted?: number;
		isGameFrozen?: number;
		timedModeEnabled?: boolean;
		isTracksFlipped?: boolean;
		phase?: string;
		undrawnPolicyCount: number;
		discardedPolicyCount: number;
		presidentIndex: number;
		pendingChancellorIndex?: number | null;
		previousElectedGovernment: number[];
		specialElectionFormerPresidentIndex?: number;
		clickActionInfo?: any[];
		audioCue?: string;
		isVetoEnabled?: boolean;
		cancellStart?: boolean;
	};
	trackState: {
		consecutiveTopdecks?: number;
		electionTrackerCount: number;
		enactedPolicies: any[];
		policyCount: {
			liberal: number;
			fascist: number;
		};
		isHidden?: boolean;
		isBlurred?: boolean;
	};
	publicPlayersState: PublicPlayer[];
	playersState: Player[];
	flappyState?: {
		controllingLibUser: string;
		controllingFascistUser: string;
		flapDistance: number;
		pylonGenerator?: any;
		pylonDensity: number;
		pylonOffset: number;
		passedPylonCount: number;
		score: Record<string, number>;
	};
	cardFlingerState: CardFlingerState[];
	timeCreated?: number;
	customGameSettings: {
		enabled: boolean;
		fascistCount: number;
		hitKnowsFas: boolean;
		fasCanShootHit: boolean;
		hitlerZone: number;
		vetoZone: number;
		powers: any[];
		trackState: {
			lib: number;
			fas: number;
		};
		deckState: {
			lib: number;
			fas: number;
		};
	};
	chats?: any[];
	guesses?: Record<string, any>;
	merlinGuesses: Record<string, any>;
	lastModPing?: number;
	electionCount?: number;
	remakeData?: any[];
	unsentReports?: any[];
	summary?: any;
	summarySaved?: boolean;
};
