import buildEnhancedGameSummary from '../../../models/game-summary/buildEnhancedGameSummary.mts';
import { mockGameSummary } from '../../mocks/index.mts';
import '../../matchers';

// mock game tests
import testGenericGame from './testGenericGame.mts';
import testP5HitlerElected from './testP5HitlerElected.mts';
import testP7HitlerKilled from './testP7HitlerKilled.mts';
import testP7LiberalWin from './testP7LiberalWin.mts';
import testVeto from './testVeto.mts';
import testVeto2 from './testVeto2.mts';
import testHitlerKilledLiberalLoss from './testHitlerKilledLiberalLoss.mts';

describe('build enhanced game summary', () => {
	const game = buildEnhancedGameSummary(mockGameSummary);

	it('should convert game summary to immutable collections and options', () => {
		const { summary, turns } = game;

		// general
		expect(summary).toBeTypeOf('object');
		expect(summary._id).toBeTypeOf('string');
		expect(summary.date).toBeInstanceOf(Date);
		expect(summary.players).toBeAList();

		const player = summary.players.first();

		expect(player).toBeTypeOf('object');
		expect(player.username).toBeTypeOf('string');
		expect(player.role).toBeTypeOf('string');

		// logs
		const logs = summary.logs;
		const log = logs.first();

		expect(logs).toBeAList();
		expect(log).toBeTypeOf('object');
		expect(log.presidentId).toBeTypeOf('number');
		expect(log.chancellorId).toBeTypeOf('number');
		expect(log.votes).toBeAList();
		expect(log.presidentHand).toBeAnOption();
		expect(log.presidentHand.value()).toBeTypeOf('object');
		expect(log.execution).toBeAnOption();

		// turns
		expect(turns).toBeAList();
		expect(turns.first()).toBeTypeOf('object');
	});

	describe('it should work for', () => {
		testGenericGame();
		testP5HitlerElected();
		testP7HitlerKilled();
		testP7LiberalWin();
		testVeto();
		testVeto2();
		testHitlerKilledLiberalLoss();
	});
});
