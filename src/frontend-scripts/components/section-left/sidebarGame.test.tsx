import React from 'react'; // eslint-disable-line
import { shallow } from 'enzyme';

import SidebarGame from './SidebarGame.tsx';

describe('SidebarGame', () => {
	it('should initialize correctly', () => {
		const component = shallow(<SidebarGame game={{ userNames: [] }} socket={undefined} />); // TODO: check, used to be `socket ={{}}`

		expect(component).toHaveLength(1);
	});
});
