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
const sass = require('node-sass');
const sassMiddleware = require('node-sass-middleware');
const session = require('express-session');

const common = require('./Backend/common.js');
const config = require('./Backend/config.js');
const db = require('./Backend/db.js');
const logger = require('./Backend/logger.js');
const settings = require('./Backend/settings.js');
const users = require('./Backend/users.js');

const app = express();

// File names to render
const loginPage = 'login';
const modeSelectorPage = 'modeSelector';
const pageNotFoundPage = 'pageNotFound';

// read input parameters
process.argv.forEach(function (val, index, array) {
    if (val === 'DEBUG') {
        config.debugMode = true;
    }
});

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
app.use(
    sassMiddleware({
        src: `${__dirname}/sass`,
        dest: `${__dirname}/UI/stylesheets`,
        prefix: '/stylesheets',
        debug: false, // TODO: remove before release
        outputStyle: 'compressed'
    })
);
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
    const localDebugMode = config.debugMode;
    config.debugMode = true;

    logger.info(`Velocity web app is listening on port ${config.port}`);
    db.initialize(function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            process.exit(1);
        }

        logger.info('Connection to velocity database successful.');
        settings.initialize(function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                process.exit(1);
            }

            logger.info('Settings object has been fetched successful.');
            config.debugMode = localDebugMode;
            logger.info(`Debug mode status: ${config.debugMode}`);
        });
    });
});

// <Requests Function> -----------------------------------------------
/**
 * verify active sessions
 *
 * @param {object} req req value of the session
 */
const isActiveSession = function (req) {
    return typeof (req.session) !== common.variableTypes.UNDEFINED
        && typeof (req.session.user) !== common.variableTypes.UNDEFINED;
}

/**
 * login path to create a session if the username and password are valid
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleLoginPath = function (req, res) {
    if (typeof (req.body.username) === common.variableTypes.UNDEFINED
        || typeof (req.body.password) === common.variableTypes.UNDEFINED) {
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
        return res.status(200).send('ok');
    });
}

/**
 * path to destroy the session if it exists
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleLogoutPath = function (req, res) {
    if (isActiveSession(req)) {
        logger.info(`User ${req.session.user.username} logged out.`);
        req.session.destroy();
    }

    return res.status(200).send('ok');
}

/**
 * path to get the me object
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleMePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(403).send(common.getError(2006));
    }

    return res.status(200).send(req.session.user);
}

/**
 * root path to redirect to the proper page based on session state
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleRootPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type === common.userTypes.MODE_SELECTOR) {
        return res.status(200).render(modeSelectorPage);
    }

    return res.status(200).send(`user type: ${req.session.user.type}`); // TO DO: replace with proper pages
}

/**
 * path to set the mode in the global settings
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleSelectModePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(403).send(common.getError(2006));
    }

    if (typeof (req.body.selectedMode) === common.variableTypes.UNDEFINED
        || parseInt(req.body.selectedMode) === common.variableTypes.UNDEFINED) {
        logger.error(JSON.stringify(common.getError(1000)));
        return res.status(400).send(common.getError(1000));
    }

    const selectedMode = parseInt(req.body.selectedMode);
    settings.updateModeType(selectedMode, function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(common.getError(1012));
        }

        var newType;
        if (selectedMode === common.modeTypes.CLASS) {
            newType = common.userTypes.PROFESSOR
        }

        if (selectedMode === common.modeTypes.COLLABORATORS) {
            newType = common.userTypes.COLLABORATOR
        }

        const updateObject = {
            _id: req.session.user._id,
            type: newType
        };

        users.updateUser(updateObject, function (err, result) {
            if (err) {
                logger.error(err);
                return res.status(500).send(err);
            }

            req.session.user.type = newType;
            return res.status(200).send('mode updated successfully');
        });
    });
}
// </Requests Function> -----------------------------------------------

// <Get Requests> ------------------------------------------------
app.get('/', handleRootPath);
app.get('/logout', handleLogoutPath);
app.get('/me', handleMePath);
// </Get Requests> -----------------------------------------------

// <Post Requests> -----------------------------------------------
app.post('/login', handleLoginPath);
app.post('/selectMode', handleSelectModePath);
// </Post Requests> -----------------------------------------------

// <Put Requests> ------------------------------------------------
// </Put Requests> -----------------------------------------------

// <Delete Requests> ------------------------------------------------
// </Delete Requests> -----------------------------------------------


/**
 * If request path does not match any of the above routes, then resolve to 404
 */
app.use(function (req, res, next) {
    return res.status(404).render(pageNotFoundPage);
});