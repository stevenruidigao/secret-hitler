import { secureGame, rateEloGame, sendInProgressGameUpdate } from '../../../../routes/socket/util.mts';

describe('util', () => {
	it('has a secureGame function', () => {
		expect(typeof secureGame).toBe('function');
	});

	it('has a rateEloGame function', () => {
		expect(typeof rateEloGame).toBe('function');
	});

	it('has a sendInProgressGameUpdate function', () => {
		expect(typeof sendInProgressGameUpdate).toBe('function');
	});
});
