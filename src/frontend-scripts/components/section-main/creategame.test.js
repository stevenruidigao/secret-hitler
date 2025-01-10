import React from 'react'; // eslint-disable-line
import { shallow } from 'enzyme';
import CreateGame from './CreateGame';

describe('Creategame', () => {
	it('should initialize correctly', () => {
		const component = shallow(<CreateGame userList={{ list: [] }} userInfo={{ gameSettings: {} }} />);

		expect(component).toHaveLength(1);
	});
});
