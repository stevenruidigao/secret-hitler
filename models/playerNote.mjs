import mongoose from 'mongoose';

const { Schema } = mongoose;

const playerNote = new Schema({
	userName: String,
	notedUser: String,
	note: String
});

export default mongoose.model('PlayerNote', playerNote);
