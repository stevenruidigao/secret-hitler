import '../../matchers.ts';
import testGenericGame from './testGenericGame.ts';
import testVeto from './testVeto.ts';
import testVeto2 from './testVeto2.ts';

describe('ReplayBuilder', () => {
	testGenericGame();
	testVeto();
	testVeto2();
});
