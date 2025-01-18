/** @type {import('jest').Config} */
const config = {
	projects: [
		{
			displayName: 'backend',
			testMatch: ['<rootDir>/__test__/backend/**/*.test.(m|)(t|j)s'],
			transform: {
				'^.+\\.m?(t|j)sx?$': 'babel-jest',
			},
			// coverageProvider: 'v8',
			testEnvironment: 'node',
			// setupFilesAfterEnv: [
			//     '<rootDir>/__test__/test-setup.ts'
			// ],
			moduleNameMapper: {
				'\\.(css|scss)$': '<rootDir>/__test__/mocks/styleMock.ts',
			},
		},
		{
			displayName: 'frontend-scripts',
			testMatch: ['<rootDir>/src/frontend-scripts/**/*.test.(m|)(t|j)s(x|)'],
			transform: {
				'^.+\\.m?(t|j)sx?$': 'babel-jest',
			},
			// coverageProvider: 'v8',
			testEnvironment: 'jsdom',
			setupFilesAfterEnv: ['<rootDir>/__test__/test-setup.ts'],
			moduleNameMapper: {
				'\\.(css|scss)$': '<rootDir>/__test__/mocks/styleMock.ts',
			},
		},
	],
};

export default config;
