import React from 'react'; // eslint-disable-line
import { shallow } from 'enzyme';
import Game from './Game.tsx';

describe('Game', () => {
	it('should initialize correctly', () => {
		const component = shallow(<Game socket={{ on: () => {}, emit: () => {} }} />);

		expect(component).toHaveLength(1);
	});
});
