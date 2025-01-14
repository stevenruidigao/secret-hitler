import mongoose from 'mongoose';

const { Schema } = mongoose;

const Signups = new Schema({
	date: Date,
	userName: String,
	ip: String,
	type: String,
	email: String,
	unobfuscatedIP: String,
	oauthID: String
});

export default mongoose.model('Signups', Signups);
