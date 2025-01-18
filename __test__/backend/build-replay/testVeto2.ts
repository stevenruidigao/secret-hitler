import { List, Range } from 'immutable';
// @ts-expect-error: no types for 'option'
import { fromNullable, some, none } from 'option';
import buildReplay from '../../../src/frontend-scripts/replay/buildReplay.ts';
import buildEnhancedGameSummary from '../../../models/game-summary/buildEnhancedGameSummary.ts';
import { veto2 } from '../../mocks/index.ts';

export default () => {
	it('builds a replay without failing', () => {
		const game = buildEnhancedGameSummary(veto2);
		const replay = buildReplay(game);
		expect(true).toBe(true);
	});
};
