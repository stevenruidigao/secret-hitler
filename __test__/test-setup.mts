import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { globalSettingsClient } from '../routes/socket/models.mts';

Enzyme.configure({ adapter: new Adapter() });

Object.defineProperty(window.document, 'getElementById', {
	value: () => ({ classList: {} })
});

afterAll(() => {
	globalSettingsClient.quit();
});
