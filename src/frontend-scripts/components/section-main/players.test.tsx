import React from 'react'; // eslint-disable-line
import { connect } from 'react-redux';
import { createMockStore } from 'redux-test-utils';
import { shallowWithStore } from 'enzyme-redux';
import Players from './Players.tsx';

describe('Players', () => {
	let store: any;

	beforeEach(() => {
		store = createMockStore({});
	});

	it('should initialize correctly', () => {
		const mapStateToProps = (state: any) => ({
			state,
		});
		const ConnectedComponent = connect(mapStateToProps)(Players);
		// const component = shallowWithStore(<ConnectedComponent />, store);
		const component = shallowWithStore(<ConnectedComponent store={store} />, store); // TODO: is this the right way to do this? see https://github.com/enzymejs/enzyme/issues/2176#issuecomment-532361526

		expect(component).toHaveLength(1);
	});
});
