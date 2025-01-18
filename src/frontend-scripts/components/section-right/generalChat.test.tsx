import React from 'react'; // eslint-disable-line
import { shallow } from 'enzyme';
import GeneralChat from './GeneralChat';

describe('GeneralChat', () => {
	it('should initialize correctly', () => {
		const initialState = {
			lock: false,
			badWord: [null, null],
			textLastChanged: 0,
			textChangeTimer: -1,
			chatValue: '',
			emoteHelperSelectedIndex: 0,
			emoteHelperElements: ['ja', 'nein', 'blobsweat', 'wethink', 'limes'],
			emoteColonIndex: -1,
			excludedColonIndices: [],
			genchat: true,
			modDMs: null,
		};

		const component = shallow(<GeneralChat />);

		expect(component.state()).toEqual(initialState);
	});
});
