import '../../matchers.ts';

// mock game tests
import testGenericGame from './testGenericGame.ts';
import testP5HitlerElected from './testP5HitlerElected.ts';
import testP7HitlerKilled from './testP7HitlerKilled.ts';
import testP7LiberalWin from './testP7LiberalWin.ts';

describe('profileDelta', () => {
	describe('it should work for', () => {
		testGenericGame();
		testP5HitlerElected();
		testP7HitlerKilled();
		testP7LiberalWin();
	});
});
