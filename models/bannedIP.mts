import mongoose from 'mongoose';

const { Schema } = mongoose;

export interface IBannedIP {
	bannedDate?: number;
	type?: string;
	ip: string;
	permanent?: boolean;
}

const BannedIP = new Schema<IBannedIP>({
	bannedDate: Date,
	type: String,
	ip: String,
	permanent: Boolean
});

export default mongoose.model<IBannedIP>('BannedIP', BannedIP);
