import '../../matchers.mts';

// mock game tests
import testGenericGame from './testGenericGame.mts';
import testP5HitlerElected from './testP5HitlerElected.mts';
import testP7HitlerKilled from './testP7HitlerKilled.mts';
import testP7LiberalWin from './testP7LiberalWin.mts';

describe('profileDelta', () => {
	describe('it should work for', () => {
		testGenericGame();
		testP5HitlerElected();
		testP7HitlerKilled();
		testP7LiberalWin();
	});
});
