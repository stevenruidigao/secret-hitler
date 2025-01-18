import { makeReport } from '@/routes/socket/report.ts';

describe('util', () => {
	it('has a makeReport function', () => {
		expect(typeof makeReport).toBe('function');
	});
});
