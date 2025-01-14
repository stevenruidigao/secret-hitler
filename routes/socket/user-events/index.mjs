import { handleAddNewGameChat, handleNewGeneralChat } from './chat.mjs';
import { handleAddNewClaim } from './claim.mjs';
import { handleAddNewGame, handleUpdateWhitelist } from './create-game.mjs';
import { handleFlappyEvent } from './flappy-hitler.mjs';
import { updateSeatedUser } from './join-game.mjs';
import { checkStartConditions, handleSocketDisconnect, handleUserLeaveGame } from './leave-game.mjs';
import { handleAddNewModDMChat, handleCloseChat, handleOpenChat, handleUnsubscribeChat } from './mod-dms.mjs';
import { handleGameFreeze, handleModPeekRemakes, handleModPeekVotes, handleSubscribeModChat } from './mod-modals.mjs';
import { handleModerationAction } from './moderation.mjs';
import { handleUpdatedPlayerNote } from './player-notes.mjs';
import { handlePlayerReport, handlePlayerReportDismiss } from './player-reports.mjs';
import { handleUpdatedRemakeGame } from './remake-game.mjs';
import { handleUpdatedBio, handleUpdatedGameSettings, handleUpdatedTheme } from './settings.mjs';
import { checkUserStatus, handleHasSeenNewPlayerModal } from './util.mjs';

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
