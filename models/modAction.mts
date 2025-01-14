import mongoose from 'mongoose';

const { Schema } = mongoose;

const ModAction = new Schema({
	date: Date,
	modUserName: String,
	ip: String,
	userActedOn: String,
	modNotes: String,
	actionTaken: String
});

export default mongoose.model('ModAction', ModAction);
