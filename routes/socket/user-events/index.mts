import { handleAddNewGameChat, handleNewGeneralChat } from './chat.mts';
import { handleAddNewClaim } from './claim.mts';
import { handleAddNewGame, handleUpdateWhitelist } from './create-game.mts';
import { handleFlappyEvent } from './flappy-hitler.mts';
import { updateSeatedUser } from './join-game.mts';
import { checkStartConditions, handleSocketDisconnect, handleUserLeaveGame } from './leave-game.mts';
import { handleAddNewModDMChat, handleCloseChat, handleOpenChat, handleUnsubscribeChat } from './mod-dms.mts';
import { handleGameFreeze, handleModPeekRemakes, handleModPeekVotes, handleSubscribeModChat } from './mod-modals.mts';
import { handleModerationAction } from './moderation.mts';
import { handleUpdatedPlayerNote } from './player-notes.mts';
import { handlePlayerReport, handlePlayerReportDismiss } from './player-reports.mts';
import { handleUpdatedRemakeGame } from './remake-game.mts';
import { handleUpdatedBio, handleUpdatedGameSettings, handleUpdatedTheme } from './settings.mts';
import { checkUserStatus, handleHasSeenNewPlayerModal } from './util.mts';

export default {
	handleAddNewGameChat,
	handleNewGeneralChat,
	handleAddNewClaim,
	handleAddNewGame,
	handleUpdateWhitelist,
	handleFlappyEvent,
	updateSeatedUser,
	checkStartConditions,
	handleSocketDisconnect,
	handleUserLeaveGame,
	handleAddNewModDMChat,
	handleCloseChat,
	handleOpenChat,
	handleUnsubscribeChat,
	handleGameFreeze,
	handleModPeekRemakes,
	handleModPeekVotes,
	handleSubscribeModChat,
	handleModerationAction,
	handleUpdatedPlayerNote,
	handlePlayerReport,
	handlePlayerReportDismiss,
	handleUpdatedRemakeGame,
	handleUpdatedBio,
	handleUpdatedGameSettings,
	handleUpdatedTheme,
	checkUserStatus,
	handleHasSeenNewPlayerModal
};
