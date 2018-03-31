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

"use strict";

const bodyParser = require('body-parser');
const express = require('express');
const expressSession = require('express-session');
const fileUpload = require('express-fileupload');
const forceSSL = require('express-force-ssl');
const fs = require('fs');
const helmet = require('helmet');
const http = require('http');
const https = require('https');
const i18n = require('i18n');
const mongoStore = require('connect-mongo')(expressSession);
const pug = require('pug');
const sass = require('node-sass');
const sassMiddleware = require('node-sass-middleware');
const ws = require('ws');

const api = require('./API/api-handler.js');
const common_api = require('./API/api-components/common-api.js');

const cfs = require('./Backend/customFileSystem.js');
const common_backend = require('./Backend/common.js');
const config = require('./Backend/config.js');
const db = require('./Backend/db.js');
const logger = require('./Backend/logger.js');
const notifications = require('./Backend/notifications.js');
const projects = require('./Backend/projects.js');
const settings = require('./Backend/settings.js');
const users = require('./Backend/users.js');

const app = express();

// read input parameters
process.argv.forEach(function (val, index, array) {
    if (val === 'DEBUG') {
        config.debugMode = true;
    }
});

// read the config file
const parseConfigData = function () {
    const config_data = fs.readFileSync(`${__dirname}/velocity.config`, 'utf8');

    const localDebugMode = config.debugMode;
    config.debugMode = true;

    if (!config_data) {
        logger.error('Failed to load configuration file');
        process.exit(1);
    }

    let configObj = {};
    try {
        configObj = JSON.parse(config_data);
    } catch (error) {
        logger.error(JSON.stringify(error));
        process.exit(1);
    }

    if (typeof (config.db_host) !== common_backend.variableTypes.STRING
        || typeof (parseInt(config.db_port)) !== common_backend.variableTypes.NUMBER
        || typeof (config.db_name) !== common_backend.variableTypes.STRING) {
        logger.error('Invalid configuration');
        process.exit(1);
    }

    config.db_host = configObj.db_host;
    config.db_port = parseInt(config.db_port);
    config.db_name = configObj.db_name;

    logger.info(`Configuration has been loaded successfully.`);
    config.debugMode = localDebugMode;
}
parseConfigData();

const mongoSessionStore = new mongoStore({
    url: `mongodb://${config.db_host}:${config.db_port}/${config.db_name}`,
    collection: 'sessions',
    ttl: config.maxSessionAge
});
const sessionParser = expressSession({
    secret: config.sessionSecret,
    store: mongoSessionStore,
    resave: config.sessionResave,
    saveUninitialized: config.saveUninitializedSession
});
const wsSessionInterceptor = function (info, callback) {
    sessionParser(info.req, {}, () => {
        mongoSessionStore.get(info.req.sessionID, (err, session) => {
            callback(!err); // TODO: verify session
        });
    });
}
const notificationsWS = new ws.Server({
    verifyClient: wsSessionInterceptor,
    port: config.notificationsWSPort
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

app.use('/sweetalert', express.static(`${__dirname}/node_modules/sweetalert/dist`));
app.use('/summernote', express.static(`${__dirname}/node_modules/summernote/dist`));
app.use('/jquery', express.static(`${__dirname}/node_modules/jquery/dist`));
app.use('/bootstrap', express.static(`${__dirname}/node_modules/bootstrap/dist`));
app.use('/materializecss', express.static(`${__dirname}/node_modules/materialize-css/dist`));
app.use('/animate', express.static(`${__dirname}/node_modules/animate.css/`));
app.use('/caretJs', express.static(`${__dirname}/node_modules/jquery.caret/dist`));
app.use('/atJs', express.static(`${__dirname}/node_modules/at.js/dist`));
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
app.use(fileUpload({
    limits: { fileSize: config.filesSizeLimit },
    safeFileNames: config.safeFileNames,
    preserveExtension: config.preserveFileExtension,
    abortOnLimit: config.abortOnExceedLimit
}));
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

    logger.info(`HTTP Server is listening on port :${config.httpPort}`);
    httpsServer.listen(config.httpsPort, function () {

        logger.info(`HTTPs Server is listening on port :${config.httpsPort}`);
        logger.info(`Velocity web app is listening on port: ${config.httpsPort}`);
        db.initialize(function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                process.exit(1);
            }

            logger.info('Connection to velocity database was successful.');
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

                    logger.info('Settings object has been fetched successfully.');
                    users.initialize(function (err, result) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            process.exit(1);
                        }

                        logger.info('Users list has been fetched successfully.');
                        projects.initialize(function (err, result) {
                            if (err) {
                                logger.error(JSON.stringify(err));
                                process.exit(1);
                            }

                            logger.info('Project instance has been built successfully.');
                            api.initialize(pug, notificationsWS, function (err, result) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    process.exit(1);
                                }

                                logger.info('API instance has been built successfully.');
                                logger.info(`Debug mode status: ${localDebugMode}`);
                                config.debugMode = localDebugMode;
                            });
                        });
                    });
                });
            });
        });
    });
});

/**
 * Log some information about the request
 */
app.use(function (req, res, next) {
    logger.log(`${req.method}: ${req.url} SESSION._id:${api.isActiveSession(req) ? JSON.stringify(req.session.user._id) : ' NO USER'} QUERY:${JSON.stringify(req.query)} PARAMS:${JSON.stringify(req.params)} BODY:${JSON.stringify(req.body)}`);
    next();
});

// <Get Requests> ------------------------------------------------
app.get('/', api.handleRootPath);
app.get('/components/projectsAdminsList', api.handleProjectsAdminsListComponentPath);
app.get('/components/projectsList', api.handleProjectsListComponentPath);
app.get('/components/team/backlog', api.handleProjectTeamBacklogPath);
app.get('/components/team/board', api.handleActiveSprintTicketsListComponentPath);
app.get('/components/team/issues', api.handleTicketsListComponentPath);
app.get('/components/team/management', api.handleTeamManagementComponentsPath);
app.get('/components/teamsList', api.handleTeamsListComponentPath);
app.get('/components/ticket/edit/page', api.handleTicketEditPageComponentsPath);
app.get('/lookup/ticket/by/displayId', api.handleLookupTicketByDisplayIdPath);
app.get('/me', api.handleMePath);
app.get('/profile', api.handleProfilePath);
app.get('/picture/:pictureId', api.handleProfilePicturePath);
app.get('/project/:projectId', api.handleProjectByIdPath);
app.get('/project/:projectId/team/:teamId', api.handleProjectTeamPath);
app.get('/project/:projectId/team/:teamId/search', api.handleProjectTeamSearchPath);
app.get('/project/:projectId/team/:teamId/tickets/add', api.handleProjectTeamTicketsAddPath);
app.get('/project/:projectId/team/:teamId/ticket/:ticketId', api.handleProjectTeamTicketPath);
app.get('/project/team/members/list', api.handleProjectTeamMembersListPath);
app.get('/project/team/releases/list', api.handleReleasesListPath);
app.get('/project/team/sprints/list', api.handleSprintsListPath);
app.get('/project/team/tags/list', api.handleTagsListPath);
app.get('/projects', api.handleProjectsPath);
app.get('/projectsGroupAssign', api.handleProjectsGroupAssignPath);
app.get('/projects/add', api.handleProjectsAddPath);
app.get('/settings', api.handleSettingsPath);
app.get('/users', api.handleUsersPath);
app.get('/usersListComponent', api.handleUsersListComponentPath);
app.get('/users/add', api.handleUsersAddPath);
app.get('/users/edit/:username', api.handleUsersEditPath);
app.get('/users/import', api.handleUsersImportPath);
// </Get Requests> -----------------------------------------------

// <Post Requests> -----------------------------------------------
app.post('/login', api.handleLoginPath);
app.post('/mode/select', api.handleModeSelectPath);
app.post('/profile/update', api.handleProfileUpdatePath);
app.post('/profile/update/picture', api.handleUpdateProfilePicturePath);
app.post('/project/activate', api.handleProjectActivatePath);
app.post('/project/admins/update', api.handleProjectAdminsUpdatePath);
app.post('/project/close', api.handleProjectClosePath);
app.post('/project/teams/update/boardType/me', api.handleProjectBoardTypeMePath);
app.post('/project/teams/update', api.handleProjectTeamsUpdatePath);
app.post('/project/teams/update/me', api.handleProjectTeamsUpdateMePath);
app.post('/project/teams/config', api.handleProjectTeamsConfigPath);
app.post('/project/update', api.handleProjectUpdatePath);
app.post('/project/update/active', api.handleProjectActiveUpdatePath);
app.post('/tickets/update', api.handleTicketsUpdatePath);
app.post('/tickets/comment/edit', api.handleTicketsCommentEditPath);
app.post('/settings/reset', api.handleSettingsResetPath);
app.post('/settings/update', api.handleSettingsUpdatePath);
app.post('/sprints/close', api.handleSprintsClosePath);
app.post('/users/update', api.handleUsersUpdatePath);
// </Post Requests> -----------------------------------------------

// <Put Requests> ------------------------------------------------
app.put('/comment/create', api.handleTicketsCommentPath);
app.put('/releases/create', api.handleReleasesCreatePath);
app.put('/projects/create', api.handleProjectCreatePath);
app.put('/sprints/create', api.handleSprintsCreatePath);
app.put('/tags/create', api.handleTagsCreatePath);
app.put('/tickets/create', api.handleTicketsCreatePath);
app.put('/users/create', api.handleUsersCreatePath);
app.put('/users/import/file', api.handleUsersImportFilePath);
app.put('/users/request/access', api.handleUsersRequestAccessPath);
// </Put Requests> -----------------------------------------------

// <Delete Requests> ------------------------------------------------
app.delete('/comment/delete', api.handleCommentDeletePath);
app.delete('/logout', api.handleLogoutPath);
app.delete('/project/delete', api.handleProjectDeletePath);
app.delete('/notification/delete', api.handleNotificationDeletePath);
app.delete('/notifications/delete/all', api.handleDeleteAllNotificationsPath);
app.delete('/sprints/delete', api.handleSprintsDeletePath);
// </Delete Requests> -----------------------------------------------

/**
 * If request path does not match any of the above routes, then resolve to 404
 */
app.use(function (req, res, next) {
    return res.status(404).render(common_api.pugPages.pageNotFound);
});
