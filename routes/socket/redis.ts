import redis from 'redis';

export const globalSettingsClient = redis.createClient({
	db: 1,
});
