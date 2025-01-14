import debug from 'debug';
// @ts-expect-error: no types for option
import { fromNullable } from 'option';
import { List } from 'immutable';

import { objectContains } from '../../utils/index.mts';

import GameSummary from './index.mts';

const debugLogger = debug('game:summary');

export default class GameSummaryBuilder {
	_id: string;
	date: any;
	gameSetting: any;
	customGameSettings: any;
	players: any[];
	logs: List<any>;
	libElo: number;
	fasElo: number;

	constructor(uid: string, date: any, gameSetting: any, customGameSettings: any, players: any[], libElo: number, fasElo: number, logs = List()) {
		this._id = uid;
		this.date = date;
		this.gameSetting = gameSetting;
		this.customGameSettings = customGameSettings;
		this.players = players;
		this.logs = logs;
		this.libElo = libElo;
		this.fasElo = fasElo;

		debugLogger('%O', { uid, date, gameSetting, customGameSettings, players, libElo, fasElo, logs: logs.toArray() });
	}

	publish() {
		const { _id, date, gameSetting, customGameSettings, players, libElo, fasElo, logs } = this;
		return new GameSummary({ _id, date, gameSetting, customGameSettings, players, libElo, fasElo, logs: logs.toArray() });
	}

	// (update: Object, targetAttrs: (?) Object) => GameSummaryBuilder
	// targetAttrs used to attach claims to the correct log
	updateLog(update: any, _targetAttrs: any) {
		const { logs } = this;
		const targetAttrs = fromNullable(_targetAttrs);

		const targetIndex = targetAttrs.map((attrs: any) => logs.findLastIndex(log => objectContains(log, attrs))).valueOrElse(logs.size - 1);

		const nextTarget = Object.assign({}, logs.get(targetIndex), update);

		const nextLogs = logs
			.slice(0, targetIndex)
			.push(nextTarget)
			.concat(logs.slice(targetIndex + 1));

		return new GameSummaryBuilder(this._id, this.date, this.gameSetting, this.customGameSettings, this.players, this.libElo, this.fasElo, nextLogs);
	}

	nextTurn() {
		return new GameSummaryBuilder(this._id, this.date, this.gameSetting, this.customGameSettings, this.players, this.libElo, this.fasElo, this.logs.push({}));
	}
}
