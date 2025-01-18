import { accounts } from '../../../routes/accounts.ts';

describe('accounts', () => {
	it('is a function', () => {
		expect(typeof accounts).toBe('function');
	});
});
