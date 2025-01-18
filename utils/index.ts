/* eslint-disable spaced-comment */
// @ts-expect-error: no types for 'option'
import { none } from 'option';
import { Range, List } from 'immutable';

/**************************
 * IMMUTABLES AND OPTIONS *
 ***************************/

// (opt: Option[A], predicate: A => Boolean) => Option[A]
export const filterOpt = (opt: any, predicate: any) => {
	return opt.flatMap((o: any) => (predicate(o) ? opt : none));
};

// (xs: List[Option[A]]) => List[A]
export const flattenListOpts = (xs: any) => xs.filter((x: any) => x.isSome()).map((x: any) => x.value());

// (xs: List[A], opt: Option[A]) => List[A]
export const pushOpt = (xs: any, opt: any) => {
	return xs.concat(opt.map((x: any) => List([x])).valueOrElse(List()));
};

// (x: A) => B => (x: Option[A]) => Option[B]
export const mapOpt1 = (f: any) => {
	return (x: any) => x.map((xx: any) => f(xx));
};

// (x: A, y: B) => C => (x: Option[A], y: Option[B]) => Option[C]
export const mapOpt2 = (f: any) => {
	return (x: any, y: any) => x.flatMap((xx: any) => y.map((yy: any) => f(xx, yy)));
};

/*****************
 * GAME ENTITIES *
 *****************/

/*
 * ALIASES:
 *
 * Hand: Array [ Policy ]
 * Policy: String ('fascist' | 'liberal')
 */

// (handX: Hand, handY: Hand) => Hand
export const handDiff = (handX: any, handY: any) => {
	if (handX.hasOwnProperty('reds') && handX.hasOwnProperty('blues')) {
		// check for legacy format of hands
		if (handY.hasOwnProperty('reds') && handY.hasOwnProperty('blues')) {
			return {
				reds: handX.reds - handY.reds,
				blues: handX.blues - handY.blues,
			};
		}

		const currentValue = { reds: handX.reds, blues: handX.blues };

		if (handY.hasOwnProperty('size')) {
			for (const elem of handY) {
				currentValue[elem === 'fascist' ? 'reds' : 'blues']--;
			}
		} else {
			currentValue[handY === 'fascist' ? 'reds' : 'blues']--;
		}

		return currentValue;
	}

	const handXClone = handX.toArray();

	if (!handY.hasOwnProperty('size')) {
		handY = [handY];
	}

	for (const elem of handY) {
		handXClone.splice(handXClone.indexOf(elem), 1);
	}
	return handXClone;
};

// expects hand to contain only a single card
// (hand: Hand) => Policy
export const handToPolicy = (hand: any) => {
	if (hand.hasOwnProperty('reds') && hand.hasOwnProperty('blues')) {
		if (hand.reds > 0 && hand.blues > 0) {
			throw new Error('Expected hand to contain only a single card');
		}
		return hand.reds > 0 ? 'fascist' : 'liberal';
	}

	return hand[0];
};

// consistently ordered 'fascist' first, followed by 'liberal'
// (hand: Hand) => List[Policy]
export const handToPolicies = (hand: any) => {
	if (hand.hasOwnProperty('reds') && hand.hasOwnProperty('blues')) {
		const toPolicies = (count: number, type: any) => {
			return Range(0, count)
				.map((i) => type)
				.toList();
		};

		const reds = toPolicies(hand.reds, 'fascist');
		const blues = toPolicies(hand.blues, 'liberal');

		return reds.concat(blues).toList();
	}

	return hand;
};

// (policy: Policy) => Hand
export const policyToHand = (policy: any) => {
	// return policy === 'fascist' ? { reds: 1, blues: 0 } : { reds: 0, blues: 1 };
	return policy;
};

const isComma = (index: number, list: any, userInfo: any) => {
	const mode = (userInfo && userInfo.gameSettings && userInfo.gameSettings.claimCharacters) || 'short';
	if (mode === 'full') {
		return index < list.size - 1;
	}
	return false;
};

// (policy: Policy) => String ('R' | 'B')
export const policyToString = (policy: any, userInfo: any) => {
	const mode = (userInfo && userInfo.gameSettings && userInfo.gameSettings.claimCharacters) || 'short';
	let liberalChar = 'L';
	let fascistChar = 'F';
	if (mode === 'legacy') {
		liberalChar = 'B';
		fascistChar = 'R';
	} else if (mode === 'full') {
		liberalChar = 'liberal';
		fascistChar = 'fascist';
	}

	return policy === 'fascist' ? fascistChar : liberalChar;
};

export const text = (type: any, text: any, space?: any, comma?: any) => ({ type, text, space, comma });

// (hand: Hand) => String ('R*B*')
export const handToText = (hand: any, userInfo: any) => {
	if (handToPolicies(hand).size === 0) {
		return [];
	}

	return handToPolicies(hand)
		.map((policy: any, index: number, list: any) => text(policy, policyToString(policy, userInfo), false, isComma(index, list, userInfo)))
		.concat(text('normal', ''))
		.toArray();
};

/********
 * MISC *
 ********/

// (s: String) => String
export const capitalize = (s: string) => {
	return s.charAt(0).toUpperCase() + s.slice(1);
};

// (target: Object, subset: Object) => Boolean
// compares attributes with strict equality
export const objectContains = (target: any, subset: any) => {
	return Object.keys(subset).reduce((acc, key) => acc && target[key] === subset[key], true);
};

export const getBlacklistIndex = (userName: string, blacklist?: any[]) => {
	if (typeof blacklist === 'undefined') {
		return -1;
	}
	for (let i = 0; i < blacklist.length; i++) {
		if (blacklist[i]['userName'] === userName) {
			return i;
		}
	}
	return -1;
};

export const userInBlacklist = (userName: string, blacklist?: any[]) => {
	if (typeof blacklist === 'undefined') {
		return false;
	}
	for (let i = 0; i < blacklist.length; i++) {
		if (blacklist[i]['userName'] === userName) {
			return true;
		}
	}
	return false;
};
