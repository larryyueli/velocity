/*
Copyright (C) 2018
Developed at University of Toronto

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const bodyParser = require('body-parser');
const express = require('express');
const i18n = require('i18n');
const pug = require('pug');
const session = require('express-session');

const common = require('./Backend/common.js');
const config = require('./Backend/config.js');
const db = require('./Backend/db.js');
const logger = require('./Backend/logger.js');
const users = require('./Backend/users.js');

const app = express();

// File names to render
const loginPage = 'login';
const modeSelectorPage = 'modeSelector';

// Setting up i18n library
i18n.configure({
    locales: config.languageOptions,
    defaultLocale: config.defaultLanguage,
    directory: `${__dirname}/Locales`,
    objectNotation: true
});

app.set('view engine', 'pug');
app.set('views', `${__dirname}/Templates`);

app.use('/jquery', express.static(`${__dirname}/node_modules/jquery/dist`));
app.use('/bootstrap', express.static(`${__dirname}/node_modules/bootstrap/dist`));
app.use('/materializecss', express.static(`${__dirname}/node_modules/materialize-css/dist`));
app.use('/animate', express.static(`${__dirname}/node_modules/animate.css/`));
app.use(express.static(`${__dirname}/UI`));
app.use(bodyParser.urlencoded({ extended: config.urlencoded }));

app.use(session({
    secret: config.sessionSecret,
    resave: config.sessionResave,
    saveUninitialized: config.saveUninitializedSession,
    rolling: config.rollingSession,
    cookie: {
        secure: config.secureSessionCookie,
        maxAge: config.maxSessionAge
    }
}));

app.use(function (req, res, next) {
    res.locals.__ = res.__ = function () {
        return i18n.__.apply(req, arguments);
    };

    next();
});

app.listen(config.port, function () {
    logger.info(`app is listening on port ${config.port}`);

    db.initialize(function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            process.exit(1);
        }

        logger.info('Connection to Quizzard database successful.');
    });
});

app.get('/', function (req, res) {
    if (verifyActiveSession(req)) {
        if (req.session.user.type === common.userTypes.MODE_SELECTOR) {
            return res.status(200).render(modeSelectorPage);
        }
        return res.status(200).send('hello world');
    }

    return res.status(401).render(loginPage);
});

app.post('/login', function (req, res) {
    if (typeof (req.body.username) === 'undefined'
        || typeof (req.body.password) === 'undefined') {
        logger.error(JSON.stringify(common.getError(2002)));
        return res.status(400).send(common.getError(2002));
    }

    const username = req.body.username.toLowerCase();
    const password = req.body.password;
    logger.info(`Login request by user: ${username}`);

    users.login(username, password, function (err, userObject) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(403).send(err);
        }

        logger.info(`User: ${username} logged in`);
        req.session.user = userObject;
        return res.status(200).send('success');
    });
});

const verifyActiveSession = function (req) {
    return typeof (req.session) !== 'undefined'
        && typeof (req.session.user) !== 'undefined';
}