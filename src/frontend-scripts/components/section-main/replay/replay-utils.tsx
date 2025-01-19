import React from 'react'; // eslint-disable-line
// @ts-expect-error: no types for 'option'
import { fromNullable } from 'option';

import { handToPolicies } from '@/utils/index.ts';
import Card from '../../reusable/Card.tsx';

export const handToCards = (hand: any, _discard: any) => {
	const discard = fromNullable(_discard);

	const policies = handToPolicies(hand);
	const discardIndex = discard.map((d: any) => policies.findLastIndex((p: any) => p === d)).valueOrElse(-1);

	return policies.map((policy: any, i: number) => (i === discardIndex ? <Card key={i} type={policy} icon={'huge red ban'} /> : <Card key={i} type={policy} />));
};
