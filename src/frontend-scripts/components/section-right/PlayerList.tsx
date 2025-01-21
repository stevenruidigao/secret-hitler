import React, { createRef } from 'react';
import { connect } from 'react-redux';
import $ from 'jquery';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Modal from 'semantic-ui-modal';
import ReactCustomScrollbars from 'react-custom-scrollbars';

import { getNumberWithOrdinal, PLAYER_COLORS } from '@/shared/constants.ts';
import { userInBlacklist } from '@/utils/index.ts';

import { fetchProfile } from '../../actions/actions.ts';
import PreviousSeasonAward from '../reusable/PreviousSeasonAward.tsx';
import UserPopup from '../reusable/UserPopup.tsx';
import UserStatus from '../reusable/UserStatus.tsx';

const Scrollbars = ReactCustomScrollbars as any; // TODO: why????

$.fn.modal = Modal;

const mapStateToProps = ({ midSection }: any) => ({ midSection });

const mapDispatchToProps = (dispatch: (data: any) => any) => ({
	fetchProfile: (username: string) => dispatch(fetchProfile(username)),
	fetchReplay: (gameId: string) => {
		dispatch({ type: 'FETCH_REPLAY', gameId });
	},
});

const mergeProps = (stateProps: any, dispatchProps: any, ownProps: any) => {
	const isUserClickable = stateProps.midSection !== 'game' && stateProps.midSection !== 'replay';

	return Object.assign({}, ownProps, dispatchProps, { isUserClickable });
};

class PlayerList extends React.Component {
	static defaultProps: any;
	static propTypes: any;
	props: any;
	state: any = {
		userListFilter: 'all',
		expandInfo: {
			AEM: true,
			cont: true,
			exp: true,
			inexp: false,
			priv: false,
		},
	};

	clickInfoIcon = () => {
		$('.playerlistinfo').modal('setting', 'transition', 'scale').modal('show');
	};

	// routeToGame(gameId: string) {
	// 	// window.location = `#/table/${gameId}`;
	// 	window.location.href = `#/table/${gameId}`; // TODO: check; old above
	// }

	alphabetical(sort?: any) {
		return (a: any, b: any) => (a.userName.toLowerCase() > b.userName.toLowerCase() ? 1 : -1);
	}

	winRate(sort: (a: any, b: any) => any) {
		const { gameSettings } = this.props.userInfo;
		const w =
			gameSettings && gameSettings.disableSeasonal
				? this.state.userListFilter === 'all'
					? 'wins'
					: 'rainbowWins'
				: this.state.userListFilter === 'all'
					? 'winsSeason'
					: 'rainbowWinsSeason';
		const l =
			gameSettings && gameSettings.disableSeasonal
				? this.state.userListFilter === 'all'
					? 'losses'
					: 'rainbowLosses'
				: this.state.userListFilter === 'all'
					? 'lossesSeason'
					: 'rainbowLossesSeason';

		return (a: any, b: any) => {
			const awr = a[w] / a[l];
			const bwr = b[w] / b[l];
			if (awr !== bwr) {
				return awr < bwr ? 1 : -1;
			} else {
				return sort(a, b);
			}
		};
	}

	sortByElo(sort: (a: any, b: any) => any) {
		const { gameSettings } = this.props.userInfo;
		const elo = gameSettings && gameSettings.disableSeasonal ? 'eloOverall' : 'eloSeason';
		// const w =
		// 	gameSettings && gameSettings.disableSeasonal
		// 		? this.state.userListFilter === 'all'
		// 			? 'wins'
		// 			: 'rainbowWins'
		// 		: this.state.userListFilter === 'all'
		// 		? 'winsSeason'
		// 		: 'rainbowWinsSeason';
		// const l =
		// 	gameSettings && gameSettings.disableSeasonal
		// 		? this.state.userListFilter === 'all'
		// 			? 'losses'
		// 			: 'rainbowLosses'
		// 		: this.state.userListFilter === 'all'
		// 		? 'lossesSeason'
		// 		: 'rainbowLossesSeason';

		return (a: any, b: any) => {
			const e1 = (gameSettings && gameSettings.disableSeasonal ? a.isRainbowOverall : a.isRainbowSeason) && a[elo] ? a[elo] : 0;
			const e2 = (gameSettings && gameSettings.disableSeasonal ? b.isRainbowOverall : b.isRainbowSeason) && b[elo] ? b[elo] : 0;
			if (e1 !== e2) {
				return e1 < e2 ? 1 : -1;
			} else {
				return sort(a, b);
			}
		};
	}

	renderFilterIcons() {
		const filterClick = (filter: any) => {
			this.setState({
				userListFilter: this.state.userListFilter === 'all' ? 'rainbow' : 'all',
			});
		};

		return (
			<span className="filter-container" title="Click this to toggle the userlist filter between regular and rainbow games">
				<span className={this.state.userListFilter} onClick={filterClick} />
			</span>
		);
	}

	renderModerationButton() {
		const { userInfo } = this.props;

		if (Object.keys(userInfo).length && Boolean(userInfo.staffRole && userInfo.staffRole !== 'altmod' && userInfo.staffRole !== 'veteran')) {
			return (
				<a href="#/moderation">
					<i className="fire icon mod-button" />
				</a>
			);
		}
	}

	renderPlayerReportButton() {
		const { userInfo } = this.props;

		if (Object.keys(userInfo).length && Boolean(userInfo.staffRole && userInfo.staffRole !== 'altmod' && userInfo.staffRole !== 'veteran')) {
			let classes = 'comment icon report-button';

			const reportClick = () => {
				if (userInfo.gameSettings.newReport) {
					this.props.socket.emit('playerReportDismiss');
				}

				window.location.hash = '#/playerreports';
			};

			if (userInfo.gameSettings && userInfo.gameSettings.newReport) {
				classes += ' active';
			}

			return (
				<a href="#/playerreports" onClick={reportClick}>
					<i className={classes} />
				</a>
			);
		}
	}

	renderSignupsButton() {
		const { userInfo } = this.props;

		if (
			Object.keys(userInfo).length &&
			Boolean(userInfo.staffRole && userInfo.staffRole !== 'altmod' && userInfo.staffRole !== 'trialmod' && userInfo.staffRole !== 'veteran')
		) {
			const classes = 'sign-in icon';

			return (
				<a href="#/signups">
					<i className={classes} style={{ color: 'teal', fontSize: '20px' }} />
				</a>
			);
		}
	}

	renderPlayerlist() {
		if (Object.keys(this.props.userList).length) {
			const { list } = this.props.userList;
			const { userInfo } = this.props;
			const { expandInfo } = this.state;
			const { gameSettings } = userInfo;

			const period = gameSettings && gameSettings.disableSeasonal ? 'overall' : 'season';

			const winType = this.state.userListFilter === 'all' ? 'wins' : 'rainbowWins';

			const lossType = this.state.userListFilter === 'all' ? 'losses' : 'rainbowLosses';

			const elo = !(gameSettings && gameSettings.disableElo) ? period : null;

			const isStaff = Boolean(
				Object.keys(userInfo).length &&
					userInfo.staffRole &&
					userInfo.staffRole !== 'trialmod' &&
					userInfo.staffRole !== 'altmod' &&
					userInfo.staffRole !== 'veteran',
			);
			const visible = list.filter(
				(user: any) =>
					(this.state.userListFilter === 'all' || (gameSettings && gameSettings.disableSeasonal ? user.isRainbowOverall : user.isRainbowSeason)) &&
					(!user.isPrivate || isStaff),
			);
			const admins = visible.filter((user: any) => user.staffRole === 'admin').sort(this.alphabetical());
			const aem = [...admins];
			const editors = visible.filter((user: any) => user.staffRole === 'editor').sort(this.alphabetical());
			aem.push(...editors);
			const moderators = visible.filter((user: any) => user.staffRole === 'moderator').sort(this.alphabetical());
			aem.push(...moderators);
			const nonStaff = visible.filter((user: any) => !aem.includes(user));
			const contributors = nonStaff.filter((user: any) => user.isContributor).sort(this.alphabetical());

			const privateUser = nonStaff.filter((user: any) => !contributors.includes(user) && user.isPrivate);
			const experienced = elo
				? nonStaff
						.filter(
							(user: any) =>
								!contributors.includes(user) &&
								!privateUser.includes(user) &&
								(gameSettings && gameSettings.disableSeasonal ? user.isRainbowOverall : user.isRainbowSeason),
						)
						.sort(this.sortByElo(this.alphabetical()))
				: nonStaff
						.filter(
							(user: any) =>
								!contributors.includes(user) &&
								!privateUser.includes(user) &&
								(gameSettings && gameSettings.disableSeasonal ? user.isRainbowOverall : user.isRainbowSeason),
						)
						.sort(this.winRate(this.alphabetical()));

			const inexperienced = nonStaff
				.filter((user: any) => !contributors.includes(user) && !experienced.includes(user) && !user.isPrivate)
				.sort(this.alphabetical());

			const makeUser = (user: any, i: number) => {
				const popperRef = createRef<HTMLSpanElement>();

				const percent = ((user[period][winType] / (user[period][winType] + user[period][lossType])) * 100).toFixed(0);
				const percentDisplay = user[period][winType] + user[period][lossType] > 9 ? `${percent}%` : '';

				// const disableIfUnclickable = (f: any) => {
				// 	if (this.props.isUserClickable) {
				// 		return f;
				// 	}

				// 	return () => null;
				// };

				const userClasses =
					(gameSettings && gameSettings.disableSeasonal ? user.isRainbowOverall : user.isRainbowSeason) ||
					Boolean(user.staffRole && user.staffRole.length) ||
					user.isContributor
						? classnames(
								PLAYER_COLORS(user, !(gameSettings && gameSettings.disableSeasonal), 'username', gameSettings && gameSettings.disableElo),
								{ blacklisted: gameSettings && userInBlacklist(user.userName, gameSettings.blacklist) },
								{ unclickable: !this.props.isUserClickable },
								{ clickable: this.props.isUserClickable },
							)
						: classnames({ blacklisted: gameSettings && userInBlacklist(user.userName, gameSettings.blacklist) }, 'username');

				// TODO: partially duplicated in Profile.tsx
				const renderStatus = () => {
					return <UserStatus user={user} fetchReplay={this.props.fetchReplay} isUserClickable={this.props.isUserClickable} />;
				};

				// const renderCrowns = () =>
				// 	user.tournyWins
				// 		.filter(winTime => time - winTime < 10800000)
				// 		.map(crown => <span key={crown} title="This player has recently won a tournament." className="crown-icon" />);

				return (
					<div key={user.userName} className="user-container">
						<div className="userlist-username">
							{renderStatus()}
							{(() => {
								const userAdminRole =
									user.staff && user.staff.incognito
										? 'Incognito'
										: user.staffRole === 'admin'
											? 'Admin'
											: user.staffRole === 'editor'
												? 'Editor'
												: user.staffRole === 'moderator'
													? 'Moderator'
													: user.isContributor
														? 'Contributor'
														: null;
								const staffRolePrefixes = { Admin: '(A) 📛', Editor: '(E) 🔰', Moderator: '(M) 🌀', Incognito: '(I) 🚫' };
								if (userAdminRole) {
									const prefix = userAdminRole !== 'Contributor' ? staffRolePrefixes[userAdminRole] : null;

									return (
										<UserPopup socket={this.props.socket} userName={user.userName} position="bottom center">
											<span className={userClasses} translate="no">
												{prefix}
												{` ${user.userName}`}
											</span>
										</UserPopup>
									);
								} else {
									return (
										<UserPopup socket={this.props.socket} userName={user.userName}>
											<span className={userClasses} ref={popperRef} translate="no">
												{user.userName}
											</span>
										</UserPopup>
									);
								}
							})()}
						</div>
						<div className="userlist-stats-container">
							{/* {!(gameSettings && Object.keys(gameSettings).length && gameSettings.disableCrowns) && user.tournyWins && renderCrowns()} */}
							{!(gameSettings && Object.keys(gameSettings).length && gameSettings.disableCrowns) && user.previousSeasonAward && (
								<PreviousSeasonAward type={user.previousSeasonAward} />
							)}
							{!(gameSettings && Object.keys(gameSettings).length && gameSettings.disableCrowns) &&
								user.specialTournamentStatus &&
								user.specialTournamentStatus.slice(1) === 'captain' && (
									<span
										title={`This player a Captain of the winning team of the ${getNumberWithOrdinal(user.specialTournamentStatus[0])} Official Tournament.`}
										className="crown-captain-icon"
									/>
								)}
							{!(gameSettings && Object.keys(gameSettings).length && gameSettings.disableCrowns) &&
								user.specialTournamentStatus &&
								user.specialTournamentStatus.slice(1) === 'tourney' && (
									<span
										title={`This player was part of the winning team of the ${getNumberWithOrdinal(user.specialTournamentStatus[0])} Official Tournament.`}
										className="crown-icon"
									/>
								)}
							{user.staffRole !== 'admin' &&
								!(user.staff && user.staff.disableVisibleElo) &&
								(() => {
									return elo ? (
										<span className="userlist-stats">{user[period].elo ? user[period].elo : 1600}</span>
									) : (
										<span>
											(<span className="userlist-stats">{user[period][winType] ? user[period][winType] : '0'}</span> /{' '}
											<span className="userlist-stats">{user[period][lossType] ? user[period][lossType] : '0'}</span>){' '}
											<span className="userlist-stats"> {percentDisplay}</span>
										</span>
									);
								})()}
						</div>
					</div>
				);
			};

			const toggleGroup = (cat: string) => {
				const { expandInfo } = this.state;

				expandInfo[cat] = !expandInfo[cat];
				this.setState({ expandInfo });
			};
			return (
				<div>
					<span onClick={() => toggleGroup('AEM')} style={{ cursor: 'pointer' }}>
						<i className={`caret ${expandInfo.AEM ? 'down' : 'right'} icon`} />
						<span style={{ userSelect: 'none' }}>Staff: {aem.length}</span>
					</span>
					<div>{expandInfo.AEM && aem.map(makeUser)}</div>
					<span onClick={() => toggleGroup('cont')} style={{ cursor: 'pointer' }}>
						<i className={`caret ${expandInfo.cont ? 'down' : 'right'} icon`} />
						<span style={{ userSelect: 'none' }}>Contributors: {contributors.length}</span>
					</span>
					<div>{expandInfo.cont && contributors.map(makeUser)}</div>
					<span onClick={() => toggleGroup('exp')} style={{ cursor: 'pointer' }}>
						<i className={`caret ${expandInfo.exp ? 'down' : 'right'} icon`} />
						<span style={{ userSelect: 'none' }}>Experienced: {experienced.length}</span>
					</span>
					<div>{expandInfo.exp && experienced.map(makeUser)}</div>
					<span onClick={() => toggleGroup('inexp')} style={{ cursor: 'pointer' }}>
						<i className={`caret ${expandInfo.inexp ? 'down' : 'right'} icon`} />
						<span style={{ userSelect: 'none' }}>Inexperienced: {inexperienced.length}</span>
					</span>
					<div>{expandInfo.inexp && inexperienced.map(makeUser)}</div>
					{isStaff && (
						<div>
							<span onClick={() => toggleGroup('priv')} style={{ cursor: 'pointer' }}>
								<i className={`caret ${expandInfo.priv ? 'down' : 'right'} icon`} />
								<span style={{ userSelect: 'none' }}>Private: {privateUser.length}</span>
							</span>
							<div>{expandInfo.priv && privateUser.map(makeUser)}</div>
						</div>
					)}
				</div>
			);
		}
	}

	renderLegacyPlayerlist() {
		if (Object.keys(this.props.userList).length) {
			const { list } = this.props.userList;
			const { userInfo } = this.props;
			const { gameSettings } = userInfo;

			const period = gameSettings && gameSettings.disableSeasonal ? 'overall' : 'season';

			const winType = this.state.userListFilter === 'all' ? 'wins' : 'rainbowWins';

			const lossType = this.state.userListFilter === 'all' ? 'losses' : 'rainbowLosses';

			const elo = !(gameSettings && gameSettings.disableElo) ? period : null;
			const isStaff = Boolean(
				Object.keys(userInfo).length &&
					userInfo.staffRole &&
					userInfo.staffRole !== 'trialmod' &&
					userInfo.staffRole !== 'altmod' &&
					userInfo.staffRole !== 'veteran',
			);
			const visible = list.filter(
				(user: any) =>
					(this.state.userListFilter === 'all' || (gameSettings && gameSettings.disableSeasonal ? user.isRainbowOverall : user.isRainbowSeason)) &&
					(!user.isPrivate || isStaff),
			);
			const admins = visible.filter((user: any) => user.staffRole === 'admin').sort(this.alphabetical());
			const aem = [...admins];
			const editors = visible.filter((user: any) => user.staffRole === 'editor').sort(this.alphabetical());
			aem.push(...editors);
			const moderators = visible.filter((user: any) => user.staffRole === 'moderator').sort(this.alphabetical());
			aem.push(...moderators);
			const contributors = visible.filter((user: any) => !aem.includes(user) && user.isContributor).sort(this.alphabetical());
			aem.push(...contributors);

			const experienced = elo
				? visible
						.filter((user: any) => !aem.includes(user) && (gameSettings && gameSettings.disableSeasonal ? user.isRainbowOverall : user.isRainbowSeason))
						.sort(this.sortByElo(this.alphabetical()))
				: visible
						.filter((user: any) => !aem.includes(user) && (gameSettings && gameSettings.disableSeasonal ? user.isRainbowOverall : user.isRainbowSeason))
						.sort(this.winRate(this.alphabetical()));

			const inexperienced = visible.filter((user: any) => !aem.includes(user) && !experienced.includes(user)).sort(this.alphabetical());

			return [...aem, ...experienced, ...inexperienced].map((user, i) => {
				const popperRef = createRef<HTMLSpanElement>();
				const percent = ((user[period][winType] / (user[period][winType] + user[period][lossType])) * 100).toFixed(0);
				const percentDisplay = user[period][winType] + user[period][lossType] > 9 ? `${percent}%` : '';

				// const disableIfUnclickable = (f: any) => {
				// 	if (this.props.isUserClickable) {
				// 		return f;
				// 	}

				// 	return () => null;
				// };

				const userClasses =
					(gameSettings && gameSettings.disableSeasonal ? user.isRainbowOverall : user.isRainbowSeason) ||
					Boolean(user.staffRole && user.staffRole.length) ||
					user.isContributor
						? classnames(
								PLAYER_COLORS(user, !(gameSettings && gameSettings.disableSeasonal), 'username', gameSettings && gameSettings.disableElo),
								{ blacklisted: gameSettings && userInBlacklist(user.userName, gameSettings.blacklist) },
								{ unclickable: !this.props.isUserClickable },
								{ clickable: this.props.isUserClickable },
							)
						: classnames({ blacklisted: gameSettings && userInBlacklist(user.userName, gameSettings.blacklist) }, 'username');

				// TODO: partially duplicated in Profile.tsx
				const renderStatus = () => {
					return <UserStatus user={user} fetchReplay={this.props.fetchReplay} isUserClickable={this.props.isUserClickable} />;
				};

				// const renderCrowns = () =>
				// 	user.tournyWins
				// 		.filter(winTime => time - winTime < 10800000)
				// 		.map(crown => <span key={crown} title="This player has recently won a tournament." className="crown-icon" />);

				return (
					<div key={user.userName} className="user-container">
						<div className="userlist-username">
							{/* {!(gameSettings && Object.keys(gameSettings).length && gameSettings.disableCrowns) && user.tournyWins && renderCrowns()} */}
							{!(gameSettings && Object.keys(gameSettings).length && gameSettings.disableCrowns) && user.previousSeasonAward && (
								<PreviousSeasonAward type={user.previousSeasonAward} />
							)}
							{!(gameSettings && Object.keys(gameSettings).length && gameSettings.disableCrowns) &&
								user.specialTournamentStatus &&
								user.specialTournamentStatus.slice(1) === 'captain' && (
									<span
										title={`This player a Captain of the winning team of the ${getNumberWithOrdinal(user.specialTournamentStatus[0])} Official Tournament.`}
										className="crown-captain-icon"
									/>
								)}
							{!(gameSettings && Object.keys(gameSettings).length && gameSettings.disableCrowns) &&
								user.specialTournamentStatus &&
								user.specialTournamentStatus.slice(1) === 'tourney' && (
									<span
										title={`This player was part of the winning team of the ${getNumberWithOrdinal(user.specialTournamentStatus[0])} Official Tournament.`}
										className="crown-icon"
									/>
								)}
							{(() => {
								const userAdminRole =
									user.staff && user.staff.incognito
										? 'Incognito'
										: user.staffRole === 'admin'
											? 'Admin'
											: user.staffRole === 'editor'
												? 'Editor'
												: user.staffRole === 'moderator'
													? 'Moderator'
													: user.isContributor
														? 'Contributor'
														: null;

								const staffRolePrefixes = { Admin: '(A) 📛', Editor: '(E) 🔰', Moderator: '(M) 🌀', Incognito: '(I) 🚫' };
								if (userAdminRole) {
									const prefix = userAdminRole !== 'Contributor' ? staffRolePrefixes[userAdminRole] : null;

									return (
										<UserPopup socket={this.props.socket} userName={user.userName}>
											<span className={userClasses} translate="no">
												{prefix}
												{` ${user.userName}`}
											</span>
										</UserPopup>
									);
								} else {
									return (
										<UserPopup socket={this.props.socket} userName={user.userName}>
											<span className={userClasses} ref={popperRef} translate="no">
												{user.isPrivate ? 'P - ' : ''}
												{user.userName}
											</span>
										</UserPopup>
									);
								}
							})()}
							{renderStatus()}
						</div>
						{user.staffRole !== 'admin' &&
							!(user.staff && user.staff.disableVisibleElo) &&
							(() => {
								return elo ? (
									<div className="userlist-stats-container">
										<span className="userlist-stats">{user[period].elo ? user[period].elo : 1600}</span>
									</div>
								) : (
									<div className="userlist-stats-container">
										(<span className="userlist-stats">{user[period][winType] ? user[period][winType] : '0'}</span> /{' '}
										<span className="userlist-stats">{user[period][lossType] ? user[period][lossType] : '0'}</span>){' '}
										<span className="userlist-stats"> {percentDisplay}</span>
									</div>
								);
							})()}
					</div>
				);
			});
		}
	}

	render() {
		const { userInfo } = this.props;
		const adminGradientData: any = { A: 'godhemzelve', d: 'moira', m: 'vig', i: 'admin', n: 'godhemzelve', s: 'vig' };

		return (
			<section className="playerlist">
				<div className="playerlist-header">
					<span className="header-name-container">
						<h3 className="ui header">Lobby</h3>
						{!(Boolean(Object.keys(userInfo).length) && Boolean(userInfo.staffRole && userInfo.staffRole !== 'altmod' && userInfo.staffRole !== 'veteran')) && (
							<i className="info circle icon" onClick={this.clickInfoIcon} title="Click to get information about player colors" />
						)}
					</span>
					{this.renderFilterIcons()}
					{this.renderModerationButton()}
					{this.renderPlayerReportButton()}
					{this.renderSignupsButton()}
					<div className="ui basic modal playerlistinfo">
						<div className="header">Lobby and player color info:</div>
						<p>
							Players in the lobby, general chat, and game chat are grey/white until they reach 50 Experience Points (XP). After that, they are known as
							"rainbow players" because their color changes based on their stats. Rainbow players have access to play in special rainbow player only games.
						</p>
						<p>
							The color of a rainbow player depends on their ELO, a type of matchmaking rating. The spectrum of colors goes from deep green as lowest ELO to
							deep indigo as highest ELO, passing through yellow, orange, pink, and purple on its way.
						</p>
						<p>
							Additionally, <span className="admin">Administrators</span> have an <strong>(A) 📛</strong> before their name and are always at the top of the
							list, their color dictates which facet of the site they oversee. The owner of the site has a <span className="admin">red name</span>, the head of
							the moderation team has a <span className="moira">pink name</span>, and the head of the development team has a{' '}
							<span className="vig">purple name</span>.
							<br />
							<span className="moderatorcolor">Moderators</span>, placed at the top below the{' '}
							{Object.keys(adminGradientData).map((data) => (
								<span className={adminGradientData[data]} key={data}>
									{data}
								</span>
							))}
							, have a <span className="moderatorcolor">blue color</span> with a <span className="moderatorcolor">(M) 🌀</span> before their name.
							<br />
							Staff <span className="veteran">Veterans</span> are retired senior moderators, and are given a <span className="veteran">teal</span> color.
							<br />
							Lastly, <span className="contributor">Contributors</span> get a <span className="contributor">special color</span> as well! Contribute code to
							this open source project!.
						</p>
						Click{' '}
						<a href="#/colors" onClick={() => $('.playerlistinfo').modal('setting', 'transition', 'scale').modal('hide')}>
							here
						</a>{' '}
						to view a detailed list of all the colors used for usernames on site.
					</div>
					{Object.keys(this.props.userList).length && (
						<span>
							<span>{this.props.userList.list.length}</span>
							<i className="large user icon" title="Number of players logged in" />
						</span>
					)}
				</div>
				<Scrollbars renderThumbVertical={(props: any) => <div {...props} className="thumb-vertical" />}>
					<div className="playerlist-body">
						{this.props.userInfo.gameSettings && this.props.userInfo.gameSettings.disableAggregations ? this.renderLegacyPlayerlist() : this.renderPlayerlist()}
					</div>
				</Scrollbars>
			</section>
		);
	}
}

PlayerList.defaultProps = {
	userInfo: {},
	userList: { list: [] },
	socket: {},
};

PlayerList.propTypes = {
	userInfo: PropTypes.object,
	userList: PropTypes.object,
	socket: PropTypes.object,
	isUserClickable: PropTypes.bool,
	fetchReplay: PropTypes.func,
};

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(PlayerList);
