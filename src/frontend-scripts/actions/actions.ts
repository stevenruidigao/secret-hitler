export const UPDATE_USER = 'UPDATE_USER';

export function updateUser(user: any) {
	return {
		type: UPDATE_USER,
		user
	};
}

export const UPDATE_MIDSECTION = 'UPDATE_MIDSECTION';

export function updateMidsection(midSection: any) {
	return {
		type: UPDATE_MIDSECTION,
		midSection
	};
}

export const TOGGLE_NOTES = 'TOGGLE_NOTES';

export function toggleNotes(notesShown: boolean) {
	return {
		type: TOGGLE_NOTES,
		notesShown
	};
}

export const TOGGLE_PLAYER_NOTES = 'TOGGLE_PLAYER_NOTES';

export function togglePlayerNotes(playerName: string) {
	return {
		type: TOGGLE_PLAYER_NOTES,
		playerName
	};
}

export const UPDATE_GAMELIST = 'UPDATE_GAMELIST';

export function updateGameList(gameList: any) {
	return {
		type: UPDATE_GAMELIST,
		gameList
	};
}

export const UPDATE_GAMEINFO = 'UPDATE_GAMEINFO';

export function updateGameInfo(gameInfo: any) {
	return {
		type: UPDATE_GAMEINFO,
		gameInfo
	};
}

export const UPDATE_USERLIST = 'UPDATE_USERLIST';

export function updateUserList(userList: any) {
	return {
		type: UPDATE_USERLIST,
		userList
	};
}

export const UPDATE_GENERALCHATS = 'UPDATE_GENERALCHATS';

export function updateGeneralChats(info: any) {
	return {
		type: UPDATE_GENERALCHATS,
		info
	};
}

export const updateActiveStats = (activeStat: any) => ({
	type: 'UPDATE_ACTIVE_STATS',
	activeStat
});

export function updateVersion(version: string) {
	return {
		type: 'UPDATE_VERSION',
		version
	};
}

export function viewPatchNotes() {
	return { type: 'VIEW_PATCH_NOTES' };
}

export const fetchProfile = (username: string) => ({
	type: 'FETCH_PROFILE',
	username
});

export const loadReplay = (summary: any) => ({
	type: 'LOAD_REPLAY',
	summary
});

export const fetchReplay = (gameId: string) => ({
	type: 'FETCH_REPLAY',
	gameId
});
