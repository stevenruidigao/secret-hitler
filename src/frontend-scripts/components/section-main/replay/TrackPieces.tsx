import React from 'react'; // eslint-disable-line

import { Map } from 'immutable';
import classnames from 'classnames';

import CardGroup from '../../reusable/CardGroup.tsx';
import { handToCards } from './replay-utils.tsx';

const ElectionTracker = ({ position }: { position: number }) => {
	const positionToClassName = Map([
		[0, 'zero'],
		[1, 'one'],
		[2, 'two'],
		[3, 'three'],
	]);
	const classes = classnames('election-tracker', positionToClassName.get(position));

	return <div className={classes} />;
};

const TrackPieces = ({ phase, track, electionTracker }: { phase: string; track: any; electionTracker: number }) => {
	const cards = handToCards(track);
	const redCards = cards.slice(0, track.reds);
	const blueCards = cards.slice(track.reds);
	const classes = classnames('track-pieces', {
		blurred: ['presidentLegislation', 'chancellorLegislation', 'policyPeek'].includes(phase),
	});

	return (
		<section className={classes}>
			<CardGroup className="enacted fascist-policies" cards={redCards} />
			<CardGroup className="enacted liberal-policies" cards={blueCards} />
			<ElectionTracker position={electionTracker} />
		</section>
	);
};

export default TrackPieces;
