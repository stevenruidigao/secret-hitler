import { List, Range } from 'immutable';
// @ts-expect-error: no types for 'option'
import { fromNullable, some, none } from 'option';
import buildReplay from '../../../src/frontend-scripts/replay/buildReplay.mts';
import buildEnhancedGameSummary from '../../../models/game-summary/buildEnhancedGameSummary.mts';
import { veto2 } from '../../mocks/index.mts';

export default () => {
	it('builds a replay without failing', () => {
		const game = buildEnhancedGameSummary(veto2);
		const replay = buildReplay(game);
		expect(true).toBe(true);
	});
};
