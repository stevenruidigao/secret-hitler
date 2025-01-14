import mongoose from 'mongoose';

const { Schema } = mongoose;

const ResetPassword = new Schema({
	username: String,
	token: String,
	expirationDate: Date
});

export default mongoose.model('ResetPassword', ResetPassword);
