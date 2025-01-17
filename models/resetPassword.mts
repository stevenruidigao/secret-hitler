import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface IResetPassword {
	username?: string;
	token?: string;
	expirationDate?: Date;
}

const ResetPassword = new Schema<IResetPassword>({
	username: String,
	token: String,
	expirationDate: Date
});

export default mongoose.model<IResetPassword>('ResetPassword', ResetPassword);
