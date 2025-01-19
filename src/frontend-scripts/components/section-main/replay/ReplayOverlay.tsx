import React from 'react'; // eslint-disable-line

import classnames from 'classnames';
import { List } from 'immutable';
// @ts-expect-error: no types for 'option'
import { some, none } from 'option';

import CardGroup from '../../reusable/CardGroup.tsx';
import { handToCards } from './replay-utils.tsx';

const Legislation = ({
	type,
	handTitle,
	claimTitle,
	hand,
	discard,
	claim,
	hideHand,
}: {
	type: string;
	handTitle: string;
	claimTitle: string;
	hand: any;
	discard: any;
	claim: any;
	hideHand: boolean;
}) => (
	<div className={classnames(type, 'legislation')} style={{ top: '50px' }}>
		{!hideHand && <CardGroup className="hand card-group" title={handTitle} cards={handToCards(hand, discard.valueOrElse(null))} />}
		<CardGroup className="claim card-group" title={claimTitle} cards={claim.map((c: any) => handToCards(c)).valueOrElse(List())} />
	</div>
);

const PresidentLegislation = ({ hand, discard, claim, hideHand }: { hand: any; discard: any; claim: any; hideHand: boolean }) => (
	<Legislation
		type="president"
		handTitle={'President Hand'}
		claimTitle={'President Claim'}
		hand={hand}
		discard={some(discard)}
		claim={claim}
		hideHand={hideHand}
	/>
);

const ChancellorLegislation = ({ hand, discard, claim, hideHand }: { hand: any; discard: any; claim: any; hideHand: boolean }) => (
	<Legislation
		type="chancellor"
		handTitle={'Chancellor Hand'}
		claimTitle={'Chancellor Claim'}
		hand={hand}
		discard={discard}
		claim={claim}
		hideHand={hideHand}
	/>
);

const PolicyPeek = ({ peek, claim, hideHand }: { peek: any; claim: any; hideHand: boolean }) => (
	<Legislation type="policy-peek" handTitle={'Policy Peek'} claimTitle={'Claim'} hand={peek} claim={claim} discard={none} hideHand={hideHand} />
);

const ReplayOverlay = ({ snapshot, hideHand }: { snapshot: any; hideHand: boolean }) => {
	const overlay = (() => {
		switch (snapshot.phase) {
			case 'presidentLegislation':
				return <PresidentLegislation hand={snapshot.presidentHand} discard={snapshot.presidentDiscard} claim={snapshot.presidentClaim} hideHand={hideHand} />;
			case 'chancellorLegislation':
				return (
					<ChancellorLegislation hand={snapshot.chancellorHand} discard={snapshot.chancellorDiscard} claim={snapshot.chancellorClaim} hideHand={hideHand} />
				);
			case 'policyPeek':
				return <PolicyPeek peek={snapshot.policyPeek} claim={snapshot.policyPeekClaim} hideHand={hideHand} />;
			default:
				return null;
		}
	})();

	return <section className="replay-overlay">{overlay}</section>;
};

export default ReplayOverlay;
