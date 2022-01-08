import AppComponent from './components/App.jsx';
import Generalchat from './components/section-right/Generalchat.jsx';
import Playerlist from './components/section-right/Playerlist.jsx';

import babelPolyfill from 'babel-polyfill'; // eslint-disable-line
import $ from 'jquery';
import React from 'react'; // eslint-disable-line no-unused-vars
import { render } from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { Provider } from 'react-redux';
import account from './account';
import shapp from './reducers/sh-app';
import socket from './socket';
import polyfills from '../../iso/polyfills.js';
import rootSaga from './sagas';
import chatanimation from './chatanimation';

// import React from 'react';
// import ReactDOM from 'react-dom';
import '../css/index.css';
import 'es6-promise/auto';
import { CommandRegistry } from '@lumino/commands';
import { Message } from '@lumino/messaging';

import { BoxPanel, CommandPalette, ContextMenu, DockPanel, Menu, MenuBar, TabBar, Widget } from '@lumino/widgets';

const commands = new CommandRegistry();

class ContentWidget extends Widget {
	createNode() {
		let node = document.createElement('div');
		let content = document.createElement('div');
		let input = document.createElement('input');
		input.placeholder = 'Placeholder...';
		content.appendChild(input);
		node.appendChild(content);
		return node;
	}

	constructor(name) {
		super();
		this.setFlag(Widget.Flag.DisallowLayout);
		this.addClass('content');
		this.addClass(name.toLowerCase());
		this.title.label = name;
		this.title.closable = false;
		this.title.caption = `Long description for: ${name}`;
	}

	get inputNode() {
		return this.node.getElementsByTagName('input')[0];
	}

	onActivateRequest(msg) {
		if (this.isAttached) {
			// this.inputNode.focus();
		}
	}
}

function main() {
	console.log(window.socket);

	commands.addCommand('example:cut', {
		label: 'Cut',
		mnemonic: 1,
		iconClass: 'fa fa-cut',
		execute: () => {
			console.log('Cut');
		}
	});

	commands.addCommand('example:copy', {
		label: 'Copy File',
		mnemonic: 0,
		iconClass: 'fa fa-copy',
		execute: () => {
			console.log('Copy');
		}
	});

	commands.addCommand('example:paste', {
		label: 'Paste',
		mnemonic: 0,
		iconClass: 'fa fa-paste',
		execute: () => {
			console.log('Paste');
		}
	});

	commands.addCommand('example:new-tab', {
		label: 'New Tab',
		mnemonic: 0,
		caption: 'Open a new tab',
		execute: () => {
			console.log('New Tab');
		}
	});

	commands.addCommand('example:close-tab', {
		label: 'Close Tab',
		mnemonic: 2,
		caption: 'Close the current tab',
		execute: () => {
			console.log('Close Tab');
		}
	});

	commands.addCommand('example:save-on-exit', {
		label: 'Save on Exit',
		mnemonic: 0,
		caption: 'Toggle the save on exit flag',
		execute: () => {
			console.log('Save on Exit');
		}
	});

	commands.addCommand('example:open-task-manager', {
		label: 'Task Manager',
		mnemonic: 5,
		isEnabled: () => false,
		execute: () => {}
	});

	commands.addCommand('example:close', {
		label: 'Close',
		mnemonic: 0,
		iconClass: 'fa fa-close',
		execute: () => {
			console.log('Close');
		}
	});

	commands.addCommand('example:one', {
		label: 'One',
		execute: () => {
			console.log('One');
		}
	});

	commands.addCommand('example:two', {
		label: 'Two',
		execute: () => {
			console.log('Two');
		}
	});

	commands.addCommand('example:three', {
		label: 'Three',
		execute: () => {
			console.log('Three');
		}
	});

	commands.addCommand('example:four', {
		label: 'Four',
		execute: () => {
			console.log('Four');
		}
	});

	commands.addCommand('example:black', {
		label: 'Black',
		execute: () => {
			console.log('Black');
		}
	});

	commands.addCommand('example:clear-cell', {
		label: 'Clear Cell',
		execute: () => {
			console.log('Clear Cell');
		}
	});

	commands.addCommand('example:cut-cells', {
		label: 'Cut Cell(s)',
		execute: () => {
			console.log('Cut Cell(s)');
		}
	});

	commands.addCommand('example:run-cell', {
		label: 'Run Cell',
		execute: () => {
			console.log('Run Cell');
		}
	});

	commands.addCommand('example:cell-test', {
		label: 'Cell Test',
		execute: () => {
			console.log('Cell Test');
		}
	});

	commands.addCommand('notebook:new', {
		label: 'New Notebook',
		execute: () => {
			console.log('New Notebook');
		}
	});

	commands.addKeyBinding({
		keys: ['Accel X'],
		selector: 'body',
		command: 'example:cut'
	});

	commands.addKeyBinding({
		keys: ['Accel C'],
		selector: 'body',
		command: 'example:copy'
	});

	commands.addKeyBinding({
		keys: ['Accel V'],
		selector: 'body',
		command: 'example:paste'
	});

	commands.addKeyBinding({
		keys: ['Accel J', 'Accel J'],
		selector: 'body',
		command: 'example:new-tab'
	});

	commands.addKeyBinding({
		keys: ['Accel M'],
		selector: 'body',
		command: 'example:open-task-manager'
	});

	let contextMenu = new ContextMenu({ commands });

	document.addEventListener('contextmenu', event => {
		if (contextMenu.open(event)) {
			event.preventDefault();
		}
	});

	contextMenu.addItem({ command: 'example:cut', selector: '.content' });
	contextMenu.addItem({ command: 'example:copy', selector: '.content' });
	contextMenu.addItem({ command: 'example:paste', selector: '.content' });

	contextMenu.addItem({
		command: 'example:one',
		selector: '.lm-CommandPalette'
	});
	contextMenu.addItem({
		command: 'example:two',
		selector: '.lm-CommandPalette'
	});
	contextMenu.addItem({
		command: 'example:three',
		selector: '.lm-CommandPalette'
	});
	contextMenu.addItem({
		command: 'example:four',
		selector: '.lm-CommandPalette'
	});
	contextMenu.addItem({
		command: 'example:black',
		selector: '.lm-CommandPalette'
	});

	contextMenu.addItem({
		command: 'notebook:new',
		selector: '.lm-CommandPalette-input'
	});
	contextMenu.addItem({
		command: 'example:save-on-exit',
		selector: '.lm-CommandPalette-input'
	});
	contextMenu.addItem({
		command: 'example:open-task-manager',
		selector: '.lm-CommandPalette-input'
	});
	contextMenu.addItem({
		type: 'separator',
		selector: '.lm-CommandPalette-input'
	});

	document.addEventListener('keydown', event => {
		commands.processKeydownEvent(event);
	});

	let r1 = new ContentWidget('Red');
	let chat = new ContentWidget('Chat');
	let g1 = new ContentWidget('Green');
	let y1 = new ContentWidget('Yellow');

	let playerlist = new ContentWidget('PlayerList');
	let b2 = new ContentWidget('Blue');
	let react = new ContentWidget('React');
	// let g2 = new ContentWidget('Green');
	// let y2 = new ContentWidget('Yellow');

	chat.title.closable = true;
	playerlist.title.closable = true;

	let dock = new DockPanel();
	dock.addWidget(react);
	dock.addWidget(chat, { mode: 'split-right', ref: react });
	// dock.addWidget(y1, { mode: 'split-bottom', ref: chat });
	// dock.addWidget(g1, { mode: 'split-left', ref: y1 });
	dock.addWidget(playerlist, { mode: 'tab-after', ref: chat });
	// dock.addWidget(b2, { mode: 'split-right', ref: y1 });
	// dock.addWidget(r1, { mode: 'tab-after', ref: react });
	dock.id = 'dock';

	dock.addRequested.connect((sender, arg) => {
		let w = new ContentWidget('Green');
		sender.addWidget(w, { ref: arg.titles[0].owner });
	});

	let savedLayouts = [];

	commands.addCommand('example:add-button', {
		label: 'Toggle add button',
		mnemonic: 0,
		caption: 'Toggle add Button',
		execute: () => {
			dock.addButtonEnabled = !dock.addButtonEnabled;
			console.log('Toggle add button');
		}
	});

	contextMenu.addItem({ command: 'example:add-button', selector: '.content' });

	commands.addCommand('save-dock-layout', {
		label: 'Save Layout',
		caption: 'Save the current dock layout',
		execute: () => {
			savedLayouts.push(dock.saveLayout());
			/*palette.addItem({
				command: 'restore-dock-layout',
				category: 'Dock Layout',
				args: { index: savedLayouts.length - 1 }
			});*/
		}
	});

	commands.addCommand('restore-dock-layout', {
		label: args => {
			return `Restore Layout ${args.index}`;
		},
		execute: args => {
			dock.restoreLayout(savedLayouts[args.index]);
		}
	});

	BoxPanel.setStretch(dock, 1);

	let main = new BoxPanel({ direction: 'left-to-right', spacing: 0 });
	main.id = 'main';
	main.addWidget(dock);

	window.onresize = () => {
		main.update();
	};

	Widget.attach(main, document.body);
	// main.style.height = '100%';
	// dock.style.height = '100%';

	const sagaMiddleware = createSagaMiddleware();
	const store = createStore(shapp, applyMiddleware(sagaMiddleware));
	sagaMiddleware.run(rootSaga);

	render(
		<Provider store={store}>
			<AppComponent socket={socket} />
		</Provider>,
		react.node
	);

	const { classList } = document.getElementById('game-container');
	var info = {};

	if (classList.length) {
		const username = classList[0].split('username-')[1];
		console.log(username);
		info = {
			userName: username,
			verified: window.verified,
			staffRole: window.staffRole,
			hasNotDismissedSignupModal: window.hasNotDismissedSignupModal,
			isTournamentMod: window.isTournamentMod
		};
		console.log('**************************', info);
	}

	var chats = { chats: [] };
	var list = { list: [] };
	var emotes = {};

	socket.emit('updateUserStatus');
	socket.emit('getUserGameSettings');
	socket.emit('sendUser', info);
	socket.emit('upgrade');
	socket.on('userList', userList => {
		list = userList;
		console.log('?????????????????????', userList, list);
		const now = new Date();
		const since = now - this.lastReconnectAttempt;
		if (since > 1000 * 5) {
			this.lastReconnectAttempt = now;
			if (info && info.userName) {
				if (!userList.list.map(user => user.userName).includes(info.userName)) {
					console.log('Detected own user not in list, attempting to reconnect...');
					socket.emit('getUserGameSettings');
				}
			}
		}
	});

	socket.on('connect', () => {
		console.log('Socket connected.');
	});

	socket.on('fetchUser', () => {
		this.socket.emit('sendUser', info);
	});

	console.log('!!!!!!!!!!!!!!!!!!!!', list);

	socket.on('generalChats', generalChats => {
		chats = generalChats;
	});

	socket.on('emoteList', allEmotes => {
		emotes = allEmotes;
	});

	account();
	chatanimation();
	polyfills();

	console.log('__________', list);

	setTimeout(() => {
		render(
			<Provider store={store}>
				<Generalchat gameInfo={{}} socket={socket} generalChats={chats} userInfo={info} userList={list} allEmotes={emotes} />
			</Provider>,
			chat.node
		);

		render(
			<Provider store={store}>
				<Playerlist userInfo={info} userList={list} socket={socket} />
			</Provider>,
			playerlist.node
		);
	}, 2000);
}

window.socket = socket;
window.onload = main;
