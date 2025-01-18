import React from 'react'; // eslint-disable-line
import { shallowWithStore } from 'enzyme-redux';
import { createMockStore } from 'redux-test-utils';
import GameChat from './GameChat';

describe('GameChat', () => {
	it('should initialize correctly', () => {
		const initialProps = {
			loadReplay: () => {},
			toggleNotes: () => {},
			updateUser: () => {},
			notesActive: false,
		};

		const store = createMockStore(initialProps);

		const component = shallowWithStore(<GameChat />, store);

		expect(component).toHaveLength(1);
	});
});
