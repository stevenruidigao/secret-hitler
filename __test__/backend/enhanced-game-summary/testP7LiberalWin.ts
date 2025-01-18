import buildEnhancedGameSummary from '@/models/game-summary/buildEnhancedGameSummary.ts';
import { p7LiberalWin } from '../../mocks/index.ts';
// import { List, Range } from 'immutable';
// @-ts-expect-error: no types for 'option'
// import { some, none } from 'option';
import '../../matchers.ts';

export default () => {
	describe('Liberal win: 7p', () => {
		const game = buildEnhancedGameSummary(p7LiberalWin);
		const { turns } = game;

		it('last turn should have hitler elected', () => {
			expect(turns.last().isGameEndingPolicyEnacted).toBe(true);
			expect(game.winningTeam).toBe('liberal');
		});
	});
};
