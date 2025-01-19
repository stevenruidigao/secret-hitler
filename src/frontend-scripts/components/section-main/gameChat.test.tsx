import React from 'react'; // eslint-disable-line
import { shallowWithStore } from 'enzyme-redux';
import { createMockStore } from 'redux-test-utils';
import GameChat from './GameChat.tsx';

describe('GameChat', () => {
	it('should initialize correctly', () => {
		const initialProps = {
			loadReplay: () => {},
			toggleNotes: () => {},
			updateUser: () => {},
			notesActive: false,
		};

		const store = createMockStore(initialProps);

		// const component = shallowWithStore(<GameChat />, store);
		const component = shallowWithStore(<GameChat store={store} />, store); // TODO: is this the right way to do this? see https://github.com/enzymejs/enzyme/issues/2176#issuecomment-532361526

		expect(component).toHaveLength(1);
	});
});
