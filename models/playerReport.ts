import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface IPlayerReport {
	date?: Date;
	gameUid?: string;
	reportedPlayer?: string;
	reason?: string;
	reportingPlayer?: string;
	gameType?: string;
	comment?: string;
	isActive?: boolean;
}

const playerReport = new Schema<IPlayerReport>({
	date: Date,
	gameUid: String,
	reportedPlayer: String,
	reason: String,
	reportingPlayer: String,
	gameType: String,
	comment: String,
	isActive: Boolean
});

export default mongoose.model<IPlayerReport>('PlayerReport', playerReport);
