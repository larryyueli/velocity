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
const forceSSL = require('express-force-ssl');
const helmet = require('helmet');
const http = require('http');
const https = require('https');
const i18n = require('i18n');
const pug = require('pug');
const sass = require('node-sass');
const sassMiddleware = require('node-sass-middleware');
const session = require('express-session');
const ws = require('ws');

const cfs = require('./Backend/customFileSystem.js');
const common = require('./Backend/common.js');
const config = require('./Backend/config.js');
const db = require('./Backend/db.js');
const logger = require('./Backend/logger.js');
const settings = require('./Backend/settings.js');
const users = require('./Backend/users.js');

const app = express();
const sessionParser = session({
    secret: config.sessionSecret,
    resave: config.sessionResave,
    saveUninitialized: config.saveUninitializedSession,
    rolling: config.rollingSession,
    cookie: {
        secure: config.secureSessionCookie,
        maxAge: config.maxSessionAge
    }
});
const wsSessionInterceptor = function (info, callback) {
    sessionParser(info.req, {}, function () {
        callback(isActiveSession(info.req));
    });
}
const notificationsWS = new ws.Server({
    verifyClient: wsSessionInterceptor,
    port: config.notificationsWSPort
});

// File names to render
const loginPage = 'login';
const modeSelectorPage = 'modeSelector';
const pageNotFoundPage = 'pageNotFound';
const profilePage = 'profile';
const usersPage = 'users/users';
const usersAddPage = 'users/users-add';
const usersEditPage = 'users/users-edit';
const usersImportPage = 'users/users-import';

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
app.use(helmet());
app.use(express.static(`${__dirname}/UI`));
app.use(bodyParser.urlencoded({ extended: config.urlencoded }));
app.use(forceSSL);
app.use(sessionParser);
app.use(function (req, res, next) {
    res.locals.__ = res.__ = function () {
        return i18n.__.apply(req, arguments);
    };

    next();
});

// settings https server
const httpsServer = https.createServer(config.ssl_options, app);
const httpServer = http.createServer(function (req, res) {
    res.writeHead(301, { 'Location': `https://${config.hostName}:${config.httpsPort}` });
    res.end();
});

httpServer.listen(config.httpPort, function () {
    const localDebugMode = config.debugMode;
    config.debugMode = true;

    logger.info(`HTTP Server is listening on port :${config.httpPort}.`);
    httpsServer.listen(config.httpsPort, function () {
        logger.info(`HTTPs Server is listening on port :${config.httpsPort}.`);
        logger.info(`Velocity web app is listening on port ${config.httpsPort}`);
        db.initialize(function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                process.exit(1);
            }

            logger.info('Connection to velocity database successful.');
            cfs.initialize(function (err, result) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    process.exit(1);
                }

                logger.info('File System exists and seems ok');
                settings.initialize(function (err, result) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        process.exit(1);
                    }

                    logger.info('Settings object has been fetched successful.');
                    users.initialize(function (err, result) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            process.exit(1);
                        }

                        logger.info('Users list has been fetched successful.');
                        config.debugMode = localDebugMode;
                        logger.info(`Debug mode status: ${config.debugMode}`);
                    });
                });
            });
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
    if (isActiveSession(req)) {
        logger.info(`User ${req.session.user.username} logged out.`);
        req.session.destroy();
    }

    if (typeof (req.body.username) !== common.variableTypes.STRING
        || typeof (req.body.password) !== common.variableTypes.STRING) {
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

        if (!settings.getAllSettings().active
            && userObject.type !== common.userTypes.PROFESSOR
            && userObject.type !== common.userTypes.COLLABORATOR_ADMIN) {
            logger.error(JSON.stringify(common.getError(3007)));
            return res.status(403).send(common.getError(3007));
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
        return res.status(401).render(loginPage);
    }

    var meObject = JSON.parse(JSON.stringify(req.session.user));
    delete meObject._id;
    return res.status(200).send(meObject);
}

/**
 * path to get the profile page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProfilePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    return res.status(200).render(profilePage, {
        user: req.session.user
    });
}

/**
 * path to update the user profile
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleUpdateProfilePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    var updateObject = {};
    updateObject._id = req.session.user._id;
    updateObject.fname = req.body.fname || req.session.user.fname;
    updateObject.lname = req.body.lname || req.session.user.lname;
    updateObject.username = req.body.username || req.session.user.username;
    updateObject.email = req.body.email || req.session.user.email;
    updateObject.theme = req.body.theme || req.session.user.theme;
    updateObject.notificationEnabled = common.convertStringToBoolean(req.body.notificationEnabled)
        || req.session.user.notificationEnabled;

    users.updateUser(updateObject, function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        req.session.user.fname = updateObject.fname;
        req.session.user.lname = updateObject.lname;
        req.session.user.username = updateObject.username;
        req.session.user.theme = updateObject.theme;
        req.session.user.email = updateObject.email;
        req.session.user.notificationEnabled = updateObject.notificationEnabled;

        return res.status(200).send('profile has been updated successfully');
    });
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
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type !== common.userTypes.MODE_SELECTOR) {
        return res.status(400).send(common.getError(1000));
    }

    const parsedSelectedMode = parseInt(req.body.selectedMode);
    if (!common.isValueInObject(parsedSelectedMode, common.modeTypes)) {
        logger.error(JSON.stringify(common.getError(3006)));
        return res.status(400).send(common.getError(3006));
    }

    settings.updateModeType(parsedSelectedMode, function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        var newType;
        if (parsedSelectedMode === common.modeTypes.CLASS) {
            newType = common.userTypes.PROFESSOR
        }

        if (parsedSelectedMode === common.modeTypes.COLLABORATORS) {
            newType = common.userTypes.COLLABORATOR_ADMIN
        }

        const updateObject = {
            _id: req.session.user._id,
            type: newType
        };

        users.updateUser(updateObject, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            req.session.user.type = newType;
            return res.status(200).send('mode updated successfully');
        });
    });
}

/**
 * path to get the users list
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleUsersPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const fullUsersList = users.getFullUsersList();
    var modeSelectorsList = [];
    var collaboratorAdminsList = [];
    var collaboratorsList = [];
    var professorsList = [];
    var TAsList = [];
    var studentsList = [];
    var disabledUsersList = [];
    var pendingUsersList = [];
    var unknownUsers = [];

    for (var i = 0; i < fullUsersList.length; i++) {
        var user = fullUsersList[i];
        switch (user.status) {
            case common.userStatus.DISABLED:
                disabledUsersList.push(user);
                break;
            case common.userStatus.PENDING:
                pendingUsersList.push(user);
                break;
            case common.userStatus.ACTIVE:
                switch (user.type) {
                    case common.userTypes.COLLABORATOR_ADMIN:
                        collaboratorAdminsList.push(user);
                        break;
                    case common.userTypes.COLLABORATOR:
                        collaboratorsList.push(user);
                        break;
                    case common.userTypes.PROFESSOR:
                        professorsList.push(user);
                        break;
                    case common.userTypes.TA:
                        TAsList.push(user);
                        break;
                    case common.userTypes.STUDENT:
                        studentsList.push(user);
                        break;
                    default:
                        unknownUsers.push(user);
                        break;
                }
                break;
            default:
                unknownUsers.push(user);
                break;
        }

    }

    return res.status(200).render(usersPage, {
        user: req.session.user,
        collaboratorAdminsList: collaboratorAdminsList,
        collaboratorsList: collaboratorsList,
        professorsList: professorsList,
        TAsList: TAsList,
        studentsList: studentsList,
        pendingUsersList: pendingUsersList,
        disabledUsersList: disabledUsersList
    });
}

/**
 * root path to get the users creation form
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleUsersAddPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN
        && req.session.user.type !== common.userTypes.PROFESSOR) {
        return res.status(403).render(pageNotFoundPage);
    }

    return res.status(200).render(usersAddPage);
}

/**
 * root path to get the users edit form
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleUsersEditPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN
        && req.session.user.type !== common.userTypes.PROFESSOR) {
        return res.status(403).render(pageNotFoundPage);
    }

    return res.status(200).render(usersEditPage);
}

/**
 * root path to get the users import form
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleUsersImportPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN
        && req.session.user.type !== common.userTypes.PROFESSOR) {
        return res.status(403).render(pageNotFoundPage);
    }

    return res.status(200).render(usersImportPage);
}
// </Requests Function> -----------------------------------------------

// <Get Requests> ------------------------------------------------
app.get('/', handleRootPath);
app.get('/me', handleMePath);
app.get('/profile', handleProfilePath);
app.get('/users', handleUsersPath);
app.get('/users/add', handleUsersAddPath);
app.get('/users/edit/:username', handleUsersEditPath);
app.get('/users/import', handleUsersImportPath);
// </Get Requests> -----------------------------------------------

// <Post Requests> -----------------------------------------------
app.post('/login', handleLoginPath);
app.post('/selectMode', handleSelectModePath);
app.post('/updateProfile', handleUpdateProfilePath);
// </Post Requests> -----------------------------------------------

// <Put Requests> ------------------------------------------------
// </Put Requests> -----------------------------------------------

// <Delete Requests> ------------------------------------------------
app.delete('/logout', handleLogoutPath);
// </Delete Requests> -----------------------------------------------

// <notificationsWS Requests> ------------------------------------------------
notificationsWS.on('connection', function (client, req) {
    client.on('message', function (message) {
    });
    client.send('ws ok');
});
setInterval(function () {
    for (var client of notificationsWS.clients) {
        client.send('ws ok');
    }
}, 60000);
// </notificationsWS Requests> -----------------------------------------------

/**
 * If request path does not match any of the above routes, then resolve to 404
 */
app.use(function (req, res, next) {
    return res.status(404).render(pageNotFoundPage);
});