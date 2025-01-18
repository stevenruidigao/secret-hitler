import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface IModThread {
	_id?: string;
	username?: string;
	aemMember?: string;
	startDate?: Date;
	endDate?: Date;
	messages?: {
		content?: string;
		type?: string;
		author?: string;
		staffRole?: string;
		date?: Date;
	}[];
}

const ModThread = new Schema<IModThread>({
	_id: String, // game-name style id
	username: String, // username of the player
	aemMember: String, // aem member speaking to the player
	startDate: Date, // start date of the convo
	endDate: Date, // end date of the convo
	messages: Array, // { content: String, type: String, author: String, staffRole: String, date: Date }
});

export default mongoose.model<IModThread>('ModThread', ModThread);
