import { mapOpt1 } from '@/utils/index.ts';

export default function toGameInfo(snapshot: any) {
	const gameState = {
		isTracksFlipped: true,
		undrawnPolicyCount: snapshot.deckSize,
	};

	const general = {
		playerCount: snapshot.players.size,
		experiencedMode: false,
	};

	const cardFlingerState: any[] = [];

	const publicPlayersState = snapshot.players
		.map((p: any, i: number) => {
			const maybe = (predicate: boolean, field: string, value: any) => (predicate ? { [field]: value } : {});

			const isSpecialElection = Number.isInteger(snapshot.specialElection);

			const maybePresident = maybe(
				(!isSpecialElection && snapshot.presidentId === i) || (isSpecialElection && snapshot.specialElection === i),
				'governmentStatus',
				'isPresident',
			);

			const maybeChancellor = maybe(!isSpecialElection && snapshot.chancellorId === i, 'governmentStatus', 'isChancellor');

			const cardStatus = (() => {
				const f = (cardDisplayed: boolean, isFlipped: boolean, cardFront: string, cardBack: any) => ({
					cardDisplayed,
					isFlipped,
					cardFront,
					cardBack,
				});

				const blank = f(false, false, '', {});

				if (snapshot.gameOver) {
					return f(true, true, '', {
						cardName: p.role,
						icon: p.icon,
					});
				}

				switch (snapshot.phase) {
					case 'election':
						return f(true, true, 'ballot', {
							cardName: snapshot.votes
								.get(i)
								.map((x: boolean) => (x ? 'ja' : 'nein'))
								.valueOrElse(null),
						});
					case 'investigation':
						const isInvTarget = i === snapshot.investigationId;

						return f(isInvTarget, isInvTarget, 'role', {
							cardName: isInvTarget && 'membership-' + p.loyalty,
						});
					case 'veto':
						const vetoCard = (vote: boolean) => f(true, true, 'ballot', { cardName: vote ? 'ja' : 'nein' });

						if (i === snapshot.chancellorId) {
							return vetoCard(snapshot.chancellorVeto);
						} else if (i === snapshot.presidentId) {
							return mapOpt1(vetoCard)(snapshot.presidentVeto).valueOrElse(blank);
						} else {
							return blank;
						}
					case 'assassination':
						if (i === snapshot.assassination) {
							return f(true, true, '', {
								cardName: p.role,
								icon: p.icon,
							});
						}

						return blank;
					default:
						return blank;
				}
			})();

			const base = {
				isDead: p.isDead,
				userName: p.username,
				nameStatus: p.role,
				connected: true,
				cardStatus,
			};

			return Object.assign({}, base, maybePresident, maybeChancellor);
		})
		.toArray();

	const trackState = {
		policyCount: {
			fascist: snapshot.track.reds,
			liberal: snapshot.track.blues,
		},
		enactedPolicies: [],
		isBlurred: ['presidentLegislation', 'chancellorLegislation', 'policyPeek'].includes(snapshot.phase),
		isHidden: true,
	};
	return {
		gameState,
		publicPlayersState,
		trackState,
		general,
		cardFlingerState,
	};
}
