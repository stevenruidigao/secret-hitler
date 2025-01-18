import mongoose from 'mongoose';

const { Schema } = mongoose;

interface IVerifyAccount {
	username?: string;
	token?: string;
	expirationDate?: Date;
}

const VerifyAccount = new Schema<IVerifyAccount>({
	username: String,
	token: String,
	expirationDate: Date,
});

export default mongoose.model<IVerifyAccount>('VerifyAccount', VerifyAccount);
