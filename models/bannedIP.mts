import mongoose from 'mongoose';

const { Schema } = mongoose;

const BannedIP = new Schema({
	bannedDate: Date,
	type: String,
	ip: String,
	permanent: Boolean
});

export default mongoose.model('BannedIP', BannedIP);
