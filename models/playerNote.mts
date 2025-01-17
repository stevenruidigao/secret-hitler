import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface IPlayerNote {
	userName?: string;
	notedUser?: string;
	note?: string;
}

const playerNote = new Schema<IPlayerNote>({
	userName: String,
	notedUser: String,
	note: String
});

export default mongoose.model<IPlayerNote>('PlayerNote', playerNote);
