'use strict';

import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import debug from 'debug';
import { Server } from 'socket.io';

declare global {
	var app: express.Express;
	var io: Server;
}

dotenv.config();

const port = (() => {
	const val = process.env.PORT || '8080';
	const port = parseInt(val, 10);

	if (isNaN(port)) {
		return val;
	}

	if (port >= 0) {
		return port;
	}

	return false;
})();

global.app = express();

const debugLogger = debug('app:server');
const httpServer = http.createServer(app);

global.io = new Server(httpServer);

app.set('port', port);
app.set('strict routing', true);
httpServer.listen(port);

function onError(error: NodeJS.ErrnoException) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

	switch (error.code) {
		case 'EACCES':
			console.error(bind + ' requires elevated privileges');
			process.exit(1);
			break;
		case 'EADDRINUSE':
			console.error(bind + ' is already in use');
			process.exit(1);
			break;
		default:
			throw error;
	}
}

function onListening() {
	const addr = httpServer.address();
	const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr?.port;
	debugLogger('Listening on ' + bind);
	console.log('Listening on ' + bind);
	import('../app.mts');
}

httpServer.on('error', onError);
httpServer.on('listening', onListening);
