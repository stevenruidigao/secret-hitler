import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface ISignups {
	date?: Date;
	userName?: string;
	ip?: string;
	type?: string;
	email?: string;
	unobfuscatedIP?: string;
	oauthID?: string;
}

const Signups = new Schema<ISignups>({
	date: Date,
	userName: String,
	ip: String,
	type: String,
	email: String,
	unobfuscatedIP: String,
	oauthID: String
});

export default mongoose.model<ISignups>('Signups', Signups);
