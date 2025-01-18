import React from 'react'; // eslint-disable-line
import { connect } from 'react-redux';
import { createMockStore } from 'redux-test-utils';
import { shallowWithStore } from 'enzyme-redux';
import GameNotes from './GameNotes.tsx';

describe('Gamenotes', () => {
	let store: any;

	beforeEach(() => {
		store = createMockStore({});
	});

	it('should initialize correctly', () => {
		const mapStateToProps = (state: any) => ({
			state,
		});
		const ConnectedComponent = connect(mapStateToProps)(GameNotes);
		const component = shallowWithStore(<ConnectedComponent />, store);

		expect(component).toHaveLength(1);
	});
});
