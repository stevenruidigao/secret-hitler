import React from 'react';

import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ReactCustomScrollbars from 'react-custom-scrollbars';

import { PLAYER_COLORS } from '@/shared/constants.ts';

import { loadReplay, updateUser } from '../../../actions/actions.ts';
import { processEmotes } from '../../../emotes.tsx';

const Scrollbars = ReactCustomScrollbars as any; // TODO: why? I hate this

const mapDispatchToProps = (dispatch: (data: any) => any) => ({
	loadReplay: (summary: any) => dispatch(loadReplay(summary)),
	updateUser: (userInfo: any) => dispatch(updateUser(userInfo)),
});

class ReplayGamechat extends React.Component {
	static propTypes: any;

	props: any;
	scrollbar: any;

	state: any = {
		showFullChat: false,
		showPlayerChat: true,
		showGameChat: true,
		showObserverChat: true,
	};

	componentDidUpdate() {
		this.scrollChats();
	}

	handleChatScrolled = () => {
		const bar = this.scrollbar;
		const scrolledFromBottom = bar.getValues().scrollHeight - (bar.getValues().scrollTop + bar.getValues().clientHeight - 1);

		if (this.state.lock && scrolledFromBottom < 20) {
			this.setState({ lock: false });
			this.scrollbar.scrollToBottom();
		} else if (!this.state.lock && scrolledFromBottom >= 20) {
			this.setState({ lock: true });
		}
	};

	scrollChats() {
		if (!this.state.lock) {
			this.scrollbar.scrollToBottom();
		}
	}

	handleChatFilterClick = (e: any) => {
		const filter = e.currentTarget.getAttribute('data-filter');
		switch (filter) {
			case 'Player':
				this.setState({ showPlayerChat: !this.state.showPlayerChat });
				break;
			case 'Game':
				this.setState({ showGameChat: !this.state.showGameChat });
				break;
			case 'Spectator':
				this.setState({ showObserverChat: !this.state.showObserverChat });
				break;
			case 'History':
				this.setState({ showFullChat: !this.state.showFullChat });
				break;
			default:
				console.log(`Unknown filter: ${filter}`);
		}
	};

	handleTimestamps(timestamp: number | string | Date) {
		const { userInfo } = this.props;

		if (userInfo && userInfo.userName && userInfo.gameSettings && userInfo.gameSettings.enableTimestamps) {
			const hours = `0${new Date(timestamp).getHours()}`.slice(-2);
			const minutes = `0${new Date(timestamp).getMinutes()}`.slice(-2);
			const seconds = `0${new Date(timestamp).getSeconds()}`.slice(-2);

			return <span className="chat-timestamp">{`${hours}:${minutes}:${seconds} `}</span>;
		}
	}

	getClassesFromType = (type: string) => {
		if (type === 'player') {
			return 'chat-player';
		} else {
			return `chat-role--${type}`;
		}
	};

	parseClaim = (claim: string) => {
		const { userInfo } = this.props;

		const mode = (userInfo && userInfo.gameSettings && userInfo.gameSettings.claimCharacters) || 'legacy';
		let liberalChar = 'L';
		let fascistChar = 'F';
		if (mode === 'legacy') {
			liberalChar = 'B';
			fascistChar = 'R';
		} else if (mode === 'full') {
			liberalChar = 'liberal';
			fascistChar = 'fascist';
		}
		const claims = Array.from(claim);
		const elements = claims.map((claimChar, index) => {
			const isLiberal = claimChar === 'b';

			return (
				<span key={`claim${index}`}>
					<span className={this.getClassesFromType(isLiberal ? 'liberal' : 'fascist')}>{isLiberal ? liberalChar : fascistChar}</span>
					{mode === 'full' && index < claims.length - 1 ? <span>, </span> : <React.Fragment />}
				</span>
			);
		});
		return elements;
	};

	processChats() {
		const { gameInfo, userInfo, userList } = this.props;
		const { gameSettings } = userInfo;
		const seatedUserNames = gameInfo.publicPlayersState ? gameInfo.publicPlayersState.map((player: any) => player.userName) : [];
		const { showFullChat, showPlayerChat, showGameChat, showObserverChat } = this.state;
		const compareChatStrings = (a: any, b: any) => {
			const stringA = typeof a.chat === 'string' ? a.chat : a.chat.map((object: any) => object.text).join('');
			const stringB = typeof b.chat === 'string' ? b.chat : b.chat.map((object: any) => object.text).join('');

			return stringA > stringB ? 1 : -1;
		};
		const time = new Date().getTime();
		/**
		 * @param {array} tournyWins - array of tournywins in epoch ms numbers (date.getTime())
		 * @return {jsx}
		 */
		const renderCrowns = (tournyWins: any[]) => {
			return tournyWins
				.filter((winTime) => time - winTime < 10800000)
				.map((crown) => <span key={crown} title="This player has recently won a tournament." className="crown-icon" />);
		};

		const renderPreviousSeasonAward = (type: string) => {
			switch (type) {
				case 'bronze':
					return <span title="This player was in the 3rd tier of ranks in the previous season" className="season-award bronze" />;
				case 'silver':
					return <span title="This player was in the 2nd tier of ranks in the previous season" className="season-award silver" />;
				case 'gold':
					return <span title="This player was in the top tier of ranks in the previous season" className="season-award gold" />;
				case 'gold1':
					return <span title="This player was the #1 ranked player of the previous season" className="season-award gold1" />;
				case 'gold2':
					return <span title="This player was 2nd highest player of the previous season" className="season-award gold2" />;
				case 'gold3':
					return <span title="This player was 3rd highest player of the previous season" className="season-award gold3" />;
				case 'gold4':
					return <span title="This player was 4th highest player of the previous season" className="season-award gold4" />;
				case 'gold5':
					return <span title="This player was 5th highest player of the previous season" className="season-award gold5" />;
			}
		};

		if (gameInfo && gameInfo.chats) {
			let list = gameInfo.chats
				.sort((a: any, b: any) => (a.timestamp === b.timestamp ? compareChatStrings(a, b) : new Date(a.timestamp).valueOf() - new Date(b.timestamp).valueOf()))
				.filter(
					(chat: any) =>
						chat.isBroadcast ||
						(showPlayerChat && !chat.gameChat && !chat.isClaim && seatedUserNames.includes(chat.userName)) ||
						(showGameChat && (chat.gameChat || chat.isClaim)) ||
						(showObserverChat && !chat.gameChat && !seatedUserNames.includes(chat.userName)) ||
						(!seatedUserNames.includes(chat.userName) &&
							chat.staffRole &&
							chat.staffRole !== '' &&
							chat.staffRole !== 'trialmod' &&
							chat.staffRole !== 'altmod' &&
							chat.staffRole !== 'veteran'),
				);
			if (!showFullChat) list = list.slice(-250);
			return list.reduce((acc: any, chat: any, i: number) => {
				const playerListPlayer = Object.keys(userList).length ? userList.list.find((player: any) => player.userName === chat.userName) : undefined;
				const isMod =
					playerListPlayer &&
					playerListPlayer.staffRole &&
					playerListPlayer.staffRole !== '' &&
					playerListPlayer.staffRole !== 'trialmod' &&
					playerListPlayer.staffRole !== 'altmod' &&
					playerListPlayer.staffRole !== 'veteran';
				const chatContents = processEmotes(chat.chat, isMod, this.props.allEmotes);
				const isSeated = seatedUserNames.includes(chat.userName);
				const isGreenText = chatContents && chatContents[0] ? /^>/i.test(chatContents[0]) : false;
				acc.push(
					chat.gameChat ? (
						<div className={chat.chat[1] && chat.chat[1].type ? `item game-chat ${chat.chat[1].type}` : 'item game-chat'} key={i}>
							{this.handleTimestamps(chat.timestamp)}
							<span className="game-chat">
								{chatContents.map((chatSegment: any, index: number) => {
									if (chatSegment.type) {
										const classes = this.getClassesFromType(chatSegment.type);

										return (
											<span key={index} className={classes}>
												{chatSegment.text}
											</span>
										);
									}

									return chatSegment.text;
								})}
							</span>
						</div>
					) : chat.isRemainingPolicies ? (
						<div className={'item game-chat'} key={i}>
							{this.handleTimestamps(chat.timestamp)}
							<span className="game-chat">
								{chatContents &&
									chatContents.length &&
									chatContents.map((chatSegment: any, index: number) => {
										if (chatSegment.type) {
											return (
												<span key={index} className={this.getClassesFromType(chatSegment.type)}>
													{chatSegment.text}
												</span>
											);
										} else if (chatSegment.policies) {
											return <span key={index}>{this.parseClaim(chatSegment.policies)}</span>;
										}
										return chatSegment.text;
									})}
							</span>
						</div>
					) : chat.isClaim ? (
						<div className="item claim-item" key={i}>
							{this.handleTimestamps(chat.timestamp)}
							<span className="claim-chat">
								{chatContents &&
									chatContents.length &&
									chatContents.map((chatSegment: any, index: number) => {
										if (chatSegment.type) {
											return (
												<span key={index} className={this.getClassesFromType(chatSegment.type)}>
													{chatSegment.text}
												</span>
											);
										} else if (chatSegment.claim) {
											return <span key={index}>{this.parseClaim(chatSegment.claim)}</span>;
										}
										return chatSegment.text;
									})}
							</span>
						</div>
					) : chat.isBroadcast ? (
						<div className="item" key={i}>
							<span className="chat-user broadcast">
								{this.handleTimestamps(chat.timestamp)} {`${chat.userName}: `}{' '}
							</span>
							<span className="broadcast-chat">{processEmotes(chat.chat, true, this.props.allEmotes)}</span>
						</div>
					) : (
						<div className="item" key={i}>
							{this.handleTimestamps(chat.timestamp)}
							{!(gameSettings && Object.keys(gameSettings).length && gameSettings.disableCrowns) && chat.tournyWins && renderCrowns(chat.tournyWins)}
							{!(gameSettings && Object.keys(gameSettings).length && gameSettings.disableCrowns) &&
								chat.previousSeasonAward &&
								renderPreviousSeasonAward(chat.previousSeasonAward)}
							<span
								className={
									chat.staffRole === 'moderator' && chat.userName === 'Incognito'
										? 'chat-user moderatorcolor'
										: !playerListPlayer || (gameSettings && gameSettings.disablePlayerColorsInChat)
											? isMod && !isSeated
												? PLAYER_COLORS(playerListPlayer, !(gameSettings && gameSettings.disableSeasonal), 'chat-user')
												: 'chat-user'
											: PLAYER_COLORS(playerListPlayer, !(gameSettings && gameSettings.disableSeasonal), 'chat-user')
								}
							>
								{isSeated ? (
									''
								) : chat.staffRole === 'moderator' ? (
									<span data-tooltip="Moderator" data-inverted>
										<span className="moderatorcolor">(Mod) 🌀</span>
									</span>
								) : chat.staffRole === 'editor' ? (
									<span data-tooltip="Editor" data-inverted>
										<span
											className={
												!playerListPlayer || (gameSettings && gameSettings.disablePlayerColorsInChat)
													? isMod && !isSeated
														? PLAYER_COLORS(playerListPlayer, !(gameSettings && gameSettings.disableSeasonal), 'chat-user')
														: 'chat-user'
													: PLAYER_COLORS(playerListPlayer, !(gameSettings && gameSettings.disableSeasonal), 'chat-user')
											}
										>
											(Editor) 🔰
										</span>
									</span>
								) : chat.staffRole === 'admin' ? (
									<span data-tooltip="Admin" data-inverted>
										<span className="admincolor">(Admin) 📛</span>
									</span>
								) : (
									<span className="observer-chat">(Observer) </span>
								)}
								{isSeated
									? `${chat.userName} {${gameInfo.publicPlayersState.findIndex((publicPlayer: any) => publicPlayer.userName === chat.userName) + 1}}`
									: chat.userName}
								{': '}
							</span>
							<span className={isGreenText ? 'greentext' : ''}>{chatContents}</span>{' '}
						</div>
					),
				);

				return acc;
			}, []);
		}
	}

	render() {
		const { userInfo, gameInfo } = this.props;
		const { showPlayerChat, showGameChat, showObserverChat, showFullChat } = this.state;

		return (
			<section className="gamechat">
				<section className="ui pointing menu">
					<a className={'item'} onClick={this.handleChatFilterClick} data-filter="Player" style={{ marginLeft: '5px' }}>
						<i
							className={`large comment icon${showPlayerChat ? ' alternate' : ''}`}
							title={showPlayerChat ? 'Hide player chats' : 'Show player chats'}
							style={{ color: showPlayerChat ? '#4169e1' : 'indianred' }}
						/>
					</a>
					<a className={'item'} onClick={this.handleChatFilterClick} data-filter="Game">
						<i
							className={`large circle icon${showGameChat ? ' info' : ''}`}
							title={showGameChat ? 'Hide game chats' : 'Show game chats'}
							style={{ color: showGameChat ? '#4169e1' : 'indianred' }}
						/>
					</a>
					{gameInfo.general && !gameInfo.general.disableObserver && (
						<a className={'item'} onClick={this.handleChatFilterClick} data-filter="Spectator">
							<i
								className={`large eye icon${!showObserverChat ? ' slash' : ''}`}
								title={showObserverChat ? 'Hide observer chats' : 'Show observer chats'}
								style={{ color: showObserverChat ? '#4169e1' : 'indianred' }}
							/>
						</a>
					)}
					<a className={'item'} onClick={this.handleChatFilterClick} data-filter="History">
						<i
							className={`large file icon${showFullChat ? ' alternate' : ''}`}
							title={showFullChat ? 'Truncate chats to 250 lines' : 'Show entire history (might lag in longer games)'}
							style={{ color: showFullChat ? '#4169e1' : 'indianred' }}
						/>
					</a>
				</section>
				<section
					style={{
						fontSize: userInfo.gameSettings && userInfo.gameSettings.fontSize ? `${userInfo.gameSettings.fontSize}px` : '16px',
					}}
					className={this.state.claim ? 'segment chats blurred' : 'segment chats'}
				>
					<Scrollbars
						ref={(c: any) => {
							this.scrollbar = c;
						}}
						onScroll={this.handleChatScrolled}
						renderThumbVertical={(props: any) => <div {...props} className="thumb-vertical" />}
					>
						<div className="ui list" style={{ color: 'var(--theme-text-1)' }}>
							{this.processChats()}
						</div>
					</Scrollbars>
				</section>
			</section>
		);
	}
}

ReplayGamechat.propTypes = {
	userInfo: PropTypes.object,
	gameInfo: PropTypes.object,
	userList: PropTypes.object,
	allEmotes: PropTypes.object,
};

const GamechatContainer = (props: any) => <ReplayGamechat {...props} />;

export default connect(mapDispatchToProps)(GamechatContainer);
