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
const i18n = require("i18n");
const pug = require('pug');
const session = require('express-session');

const config = require(`${__dirname}/Backend/config.js`);
const db = require(`${__dirname}/Backend/db.js`);
const logger = require(`${__dirname}/Backend/logger.js`);

const app = express();

// File names to render
const loginPage = 'login';

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
    if (verifyActiveSession()) {
        return res.redirect('home');
    }

    return res.status(401).render(loginPage);
});

const verifyActiveSession = function () {
    return req.session !== 'undefined' && req.session.user !== 'undefined';
}