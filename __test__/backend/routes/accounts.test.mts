import { accounts } from '../../../routes/accounts.mts';

describe('accounts', () => {
	it('is a function', () => {
		expect(typeof accounts).toBe('function');
	});
});
