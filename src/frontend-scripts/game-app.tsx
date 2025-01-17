'use strict';

// @ts-expect-error: no types
import babelPolyfill from 'babel-polyfill'; // eslint-disable-line
import $ from 'jquery';
import React from 'react'; // eslint-disable-line no-unused-vars
import { render } from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { Provider } from 'react-redux';
// @ts-expect-error: no types
import AppComponent from './components/App.jsx';
// @ts-expect-error: no types
import account from './account.js';
// @ts-expect-error: no types
import shapp from './reducers/sh-app.js';
// @ts-expect-error: no types
import polyfills from '../../iso/polyfills.js';
// @ts-expect-error: no types
import rootSaga from './sagas.js';
// @ts-expect-error: no types
import chatanimation from './chatanimation.js';

document.addEventListener('DOMContentLoaded', () => {
	const container = document.getElementById('game-container');

	account();
	chatanimation();
	polyfills();

	if (container) {
		const sagaMiddleware = createSagaMiddleware();
		const store = createStore(shapp, applyMiddleware(sagaMiddleware));
		sagaMiddleware.run(rootSaga);
		render(
			<Provider store={store}>
				<AppComponent />
			</Provider>,
			container
		);
	}

	$(document).keydown((e: JQuery.KeyDownEvent) => {
		// uhhh idk tbh
		if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
		if (e.ctrlKey && [65, 83].includes(e.keyCode)) {
			e.preventDefault();
		}
	});
});
