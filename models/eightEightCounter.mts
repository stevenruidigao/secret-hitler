import mongoose from 'mongoose';

const { Schema } = mongoose;

const Eighteightcounter = new Schema({
	username: String,
	date: Date
});

export default mongoose.model('Eighteightcounter', Eighteightcounter);
