import buildEnhancedGameSummary from '@/models/game-summary/buildEnhancedGameSummary.ts';
import { veto2 } from '../../mocks/index.ts';
// import { List, Range } from 'immutable';
// @ts-expect-error: no types for 'option'
import { some, none } from 'option';
import '../../matchers.ts';

export default () => {
	describe('Veto top deck', () => {
		const game = buildEnhancedGameSummary(veto2);
		const { turns } = game;

		it('should have attempted veto on turn 5', () => {
			const turn = turns.get(5);
			expect(turn.isVeto).toBe(true);
			expect(turn.chancellorVeto).toEqual(some(true));
			expect(turn.presidentVeto).toEqual(some(false));
			expect(turn.isVetoSuccessful).toBe(false);
			expect(turn.enactedPolicy).toEqual(some('liberal'));
		});

		it('should have rejected veto on turn 6', () => {
			const turn = turns.get(6);
			expect(turn.isVeto).toBe(true);
			expect(turn.chancellorVeto).toEqual(some(false));
			expect(turn.isVetoSuccessful).toBe(false);
			expect(turn.presidentVeto).toEqual(none);
		});

		it('should have successful veto on turn 9', () => {
			const turn = turns.get(9);
			expect(turn.isVeto).toBe(true);
			expect(turn.chancellorVeto).toEqual(some(true));
			expect(turn.presidentVeto).toEqual(some(true));
			expect(turn.isVetoSuccessful).toBe(true);
		});
	});
};
