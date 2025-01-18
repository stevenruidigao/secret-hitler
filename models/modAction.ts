import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface IModAction {
	date?: Date;
	modUserName?: string;
	ip?: string;
	userActedOn?: string;
	modNotes?: string;
	actionTaken?: string;
}

const ModAction = new Schema<IModAction>({
	date: Date,
	modUserName: String,
	ip: String,
	userActedOn: String,
	modNotes: String,
	actionTaken: String
});

export default mongoose.model<IModAction>('ModAction', ModAction);
