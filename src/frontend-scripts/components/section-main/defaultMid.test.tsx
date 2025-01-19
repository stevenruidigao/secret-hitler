import React from 'react'; // eslint-disable-line
import { connect } from 'react-redux';
import { createMockStore } from 'redux-test-utils';
import { shallowWithStore } from 'enzyme-redux';
import DefaultMid from './DefaultMid.tsx';

describe('DefaultMid', () => {
	let store: any;

	beforeEach(() => {
		store = createMockStore({});
	});

	it('should initialize correctly', () => {
		const mapStateToProps = (state: any) => ({
			state,
		});
		const ConnectedComponent = connect(mapStateToProps)(DefaultMid);
		// const component = shallowWithStore(<ConnectedComponent />, store);
		const component = shallowWithStore(<ConnectedComponent store={store} />, store); // TODO: check - https://github.com/enzymejs/enzyme/issues/2176#issuecomment-532361526

		expect(component).toHaveLength(1);
	});
});
