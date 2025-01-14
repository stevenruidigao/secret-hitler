import mongoose from 'mongoose';

const { Schema } = mongoose;

const VerifyAccount = new Schema({
	username: String,
	token: String,
	expirationDate: Date
});

export default mongoose.model('VerifyAccount', VerifyAccount);
