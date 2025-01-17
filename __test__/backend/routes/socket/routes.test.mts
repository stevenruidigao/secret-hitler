import { socketRoutes } from '../../../../routes/socket/routes.mts';

describe('socketRoutes', () => {
	it('is a function', () => {
		expect(typeof socketRoutes).toBe('function');
	});
});
