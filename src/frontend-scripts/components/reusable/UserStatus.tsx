import React from 'react';
import classnames from 'classnames';

export function routeToGame(gameId: string) {
	// window.location = `#/table/${gameId}`;
	window.location.href = `#/table/${gameId}`; // TODO: check; old above
}

export default function UserStatus({ user, fetchReplay, isUserClickable = true }: { user: any; fetchReplay: Function; isUserClickable?: boolean }) {
	if (!user) {
		return <></>;
	}

	const status = user.status;

	function disableIfUnclickable(func: Function) {
		if (isUserClickable) {
			return func;
		}

		return () => null;
	}

	if (!status || status.type === 'none') {
		return <></>;
	}

	const iconClasses = classnames(
		'status',
		{ unclickable: !isUserClickable },
		{ clickable: isUserClickable },
		{ search: status.type === 'observing' },
		{ fav: status.type === 'playing' },
		{ rainbow: status.type === 'rainbow' },
		{ record: status.type === 'replay' },
		{ private: status.type === 'private' },
		'icon',
	);

	const title: any = {
		playing: 'This player is playing in a standard game.',
		observing: 'This player is observing a game.',
		rainbow: 'This player is playing in a experienced-player-only game.',
		replay: 'This player is watching a replay.',
		private: 'This player is playing in a private game.',
	};

	const onClick: any = {
		playing: routeToGame,
		observing: routeToGame,
		rainbow: routeToGame,
		replay: fetchReplay,
		private: routeToGame,
	};

	return <i title={title[status.type]} className={iconClasses} onClick={disableIfUnclickable(onClick[status.type]).bind({}, status.gameId)} />;
}
