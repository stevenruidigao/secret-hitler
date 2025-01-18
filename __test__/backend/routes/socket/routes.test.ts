import { socketRoutes } from '../../../../routes/socket/routes.ts';

describe('socketRoutes', () => {
	it('is a function', () => {
		expect(typeof socketRoutes).toBe('function');
	});
});
