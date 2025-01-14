import mongoose from 'mongoose';

const { Schema } = mongoose;

const playerReport = new Schema({
	date: Date,
	gameUid: String,
	reportedPlayer: String,
	reason: String,
	reportingPlayer: String,
	gameType: String,
	comment: String,
	isActive: Boolean
});

export default mongoose.model('PlayerReport', playerReport);
