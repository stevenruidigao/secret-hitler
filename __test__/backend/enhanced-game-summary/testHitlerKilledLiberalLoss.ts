import buildEnhancedGameSummary from '@/models/game-summary/buildEnhancedGameSummary.ts';
import { hitlerKilledLiberalLoss } from '../../mocks/index.ts';
// import { List, Range } from 'immutable';
// @ts-expect-error: no types for 'option'
import { some } from 'option';
// import matches from '../../matchers.ts';

export default () => {
	describe('hitler killed so liberals should win', () => {
		const game = buildEnhancedGameSummary(hitlerKilledLiberalLoss);
		const { turns } = game;

		it('liberals should be winning team', () => {
			expect(game.winningTeam).toBe('liberal');
			expect(game.isWinner('onebobby')).toEqual(some(true));
		});
	});
};
