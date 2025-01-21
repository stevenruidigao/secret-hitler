import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import favicon from 'serve-favicon';
import socketSession from 'express-socket.io-session';
import passport from 'passport';
import mongoose from 'mongoose';
import compression from 'compression';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { Strategy as GithubStrategy } from 'passport-github2';
import session from 'express-session';
import helmet from 'helmet';

import connectMongoDBSession from 'connect-mongodb-session';
import redis from 'redis';
import connectRedis from 'connect-redis';

import routesIndex from './routes/index.ts';
import Account from './models/account.ts';
import { expandAndSimplify } from './routes/socket/ip-obf.ts';

let store;

if (process.env.NODE_ENV !== 'production') {
	const MongoDBStore = connectMongoDBSession(session);
	store = new MongoDBStore({
		uri: 'mongodb://localhost:27017/secret-hitler-app',
		collection: 'sessions',
	});
} else {
	const client = redis.createClient();
	const RedisStore = connectRedis(session);
	store = new RedisStore({
		host: '127.0.0.1',
		port: 6379,
		client: client,
		ttl: 2 * 604800, // 2 weeks
	});
}

// needs to be first
app.use((req, res, next) => {
	try {
		decodeURIComponent(req.path);
		next();
	} catch (e) {
		console.error(`Malformed URI: ${req.path}`);
		console.error(
			`IP data: ${req.headers['cf-connecting-ip']} | ${req.headers['x-real-ip']} | ${req.headers['X-Real-IP']} | ${req.headers['X-Forwarded-For']} | ${req.headers['x-forwarded-for']} | ${req.connection.remoteAddress}`,
		);
		res.status(500).send('An error occurred.');
	}
});

app.use((req: any, res, next) => {
	const IP: string =
		req.headers['cf-connecting-ip'] ||
		req.headers['x-real-ip'] ||
		req.headers['X-Real-IP'] ||
		req.headers['X-Forwarded-For'] ||
		req.headers['x-forwarded-for'] ||
		req.connection.remoteAddress ||
		'';
	if (IP.includes(',')) req.expandedIP = expandAndSimplify(IP.split(',')[0].trim());
	else req.expandedIP = expandAndSimplify(IP.trim());
	next();
});

app.set('views', `${import.meta.dirname}/views`);
app.set('view engine', 'pug');
app.locals.pretty = true;
app.use(compression() as any);
app.use(bodyParser.json({ limit: '10kb' })); // limit can be lower since this should not have a lot of data per request (helps protect against json expansion attacks I guess)
app.use(bodyParser.urlencoded({ extended: false, limit: '200kb' })); // limit needs to be decently high to account for cardback uploads
app.use(favicon(`${import.meta.dirname}/public/favicon.ico`) as any);
app.use(cookieParser());
app.use(express.static(`${import.meta.dirname}/public`, { maxAge: 86400000 * 28 }));
app.use(
	helmet.frameguard({
		action: 'deny',
	}),
);

// Opts out of Google's FLoC - https://plausible.io/blog/google-floc
app.use((req, res, next) => {
	res.set('Permissions-Policy', 'interest-cohort=()');
	next();
});

const sessionSettings = {
	secret: process.env.SECRETSESSIONKEY || 'hunter2',
	cookie: {
		maxAge: 1000 * 60 * 60 * 24 * 28, // 4 weeks
	},
	store,
	resave: true,
	saveUninitialized: true,
};

io.use(
	socketSession(session(sessionSettings), {
		autoSave: true,
	}),
);

app.use(session(sessionSettings) as any);
app.use(passport.initialize() as any);
app.use(passport.session());

passport.use(new LocalStrategy((Account as any).authenticate()));

if (process.env.DISCORDCLIENTID) {
	passport.use(
		new DiscordStrategy(
			{
				clientID: process.env.DISCORDCLIENTID,
				clientSecret: process.env.DISCORDCLIENTSECRET || '',
				callbackURL: '/discord/login-callback',
				scope: ['identify', 'email'],
			},
			(accessToken: string, refreshToken: string, profile: any, callback: Function) => {
				callback(profile);
			},
		),
	);

	passport.use(
		new GithubStrategy(
			{
				clientID: process.env.GITHUBCLIENTID || '',
				clientSecret: process.env.GITHUBCLIENTSECRET || '',
				callbackURL: '/github/login-callback',
			},
			(accessToken: string, refreshToken: string, profile: any, callback: Function) => {
				callback(profile);
			},
		),
	);
} else {
	console.error('WARN: No oauth client data in .env');
}

passport.serializeUser((Account as any).serializeUser());
passport.deserializeUser((Account as any).deserializeUser());

// mongoose.connect(`mongodb://localhost:27017/secret-hitler-app`, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect('mongodb://localhost:27017/secret-hitler-app');
// mongoose.set('useCreateIndex', true); // Default true now
// mongoose.set('useFindAndModify', false); // Default false now
mongoose.Promise = global.Promise;

routesIndex();
