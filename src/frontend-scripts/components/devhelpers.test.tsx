import React from 'react'; // eslint-disable-line
import { shallow } from 'enzyme';
import DevHelpers from './DevHelpers.tsx';

describe('DevHelpers', () => {
	it('should initialize correctly', () => {
		const component = shallow(<DevHelpers />);

		expect(component).toHaveLength(1);
	});
});
