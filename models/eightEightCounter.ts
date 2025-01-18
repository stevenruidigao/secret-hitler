import mongoose from 'mongoose';

const { Schema } = mongoose;

interface IEightEightCounter {
	username?: string;
	date?: Date;
}

const EightEightCounter = new Schema<IEightEightCounter>({
	username: String,
	date: Date,
});

export default mongoose.model<IEightEightCounter>('EightEightCounter', EightEightCounter);
