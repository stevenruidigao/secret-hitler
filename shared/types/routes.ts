import { IStats } from '@/models/account.ts';

// TODO: find common with Player
export interface User {
	isPrivate: boolean;
	userName: string;
	playerPronouns?: string;
	customCardback?: {
		uid?: string;
		fileExtension?: string;
		saveTime?: string;
	};
	staffRole: string;
	staff?: {
		disableVisibleElo?: boolean;
		disableVisibleXP?: boolean;
		disableStaffColor?: boolean;
		incognito?: boolean;
	};
	isContributor: boolean;
	status: {
		type?: string;
		gameId?: string;
	};
	timeLastGameCreated?: number;
	lastMessage?: any;
	blacklist?: any[];
	overall: IStats;
	season: IStats;
	previousSeasonAward?: string;
	specialTournamentStatus?: string;
	tournyWins: any;
}
