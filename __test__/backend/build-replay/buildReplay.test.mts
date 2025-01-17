import '../../matchers.mts';
import testGenericGame from './testGenericGame.mts';
import testVeto from './testVeto.mts';
import testVeto2 from './testVeto2.mts';

describe('ReplayBuilder', () => {
	testGenericGame();
	testVeto();
	testVeto2();
});
