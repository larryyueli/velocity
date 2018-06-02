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

const analytics = require('./Backend/analytics.js');
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

    if (typeof (configObj.hostName) !== common_backend.variableTypes.STRING
        || typeof (configObj.httpPort) !== common_backend.variableTypes.NUMBER
        || typeof (configObj.httpsPort) !== common_backend.variableTypes.NUMBER
        || typeof (configObj.notificationsWSPort) !== common_backend.variableTypes.NUMBER
        || typeof (configObj.maxSessionAge) !== common_backend.variableTypes.NUMBER
        || typeof (configObj.db_host) !== common_backend.variableTypes.STRING
        || typeof (configObj.db_port) !== common_backend.variableTypes.NUMBER
        || typeof (configObj.db_name) !== common_backend.variableTypes.STRING
        || typeof (configObj.password) !== common_backend.variableTypes.STRING) {
        logger.error('Invalid configuration');
        process.exit(1);
    }

    config.hostName = configObj.hostName;
    config.httpPort = configObj.httpPort;
    config.httpsPort = configObj.httpsPort;
    config.notificationsWSPort = configObj.notificationsWSPort;
    config.maxSessionAge = configObj.maxSessionAge;
    config.db_host = configObj.db_host;
    config.db_port = configObj.db_port;
    config.db_name = configObj.db_name;
    config.password = configObj.password;

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

app.set('view engine', 'pug');
app.set('views', `${__dirname}/Templates`);

app.use('/sweetalert', express.static(`${__dirname}/node_modules/sweetalert/dist`));
app.use('/summernote', express.static(`${__dirname}/node_modules/summernote/dist`));
app.use('/jquery', express.static(`${__dirname}/node_modules/jquery/dist`));
app.use('/bootstrap', express.static(`${__dirname}/node_modules/bootstrap/dist`));
app.use('/materializecss', express.static(`${__dirname}/node_modules/materialize-css/dist`));
app.use('/animate', express.static(`${__dirname}/node_modules/animate.css/`));
app.use('/caretJs', express.static(`${__dirname}/node_modules/jquery.caret/dist`));
app.use('/chart.js', express.static(`${__dirname}/node_modules/chart.js/dist`));
app.use('/atJs', express.static(`${__dirname}/node_modules/at.js/dist`));
app.use('/sparkline', express.static(`${__dirname}/node_modules/jquery-sparkline`));
app.use(
    sassMiddleware({
        src: `${__dirname}/sass`,
        dest: `${__dirname}/UI/stylesheets`,
        prefix: '/stylesheets',
        debug: false,
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
    i18n.configure({
        locales: config.languageOptions,
        defaultLocale: api.isActiveSession(req) ? req.session.user.language : config.defaultLanguage,
        directory: `${__dirname}/Locales`,
        objectNotation: true
    });

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
                            analytics.initialize(localDebugMode, function (err, result) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    process.exit(1);
                                }

                                logger.info('Analytics instance has been built successfully.');
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
});

/**
 * Log some information about the request
 */
app.use(function (req, res, next) {
    const sensitivePaths = [
        '/login',
        '/profile/update',
        '/users/update'
    ];

    const loggedUser = api.isActiveSession(req) ? JSON.stringify(req.session.user._id) : ' NO USER';
    const loggedRequestInfo = `QUERY:${JSON.stringify(req.query)} PARAMS:${JSON.stringify(req.params)} BODY:${JSON.stringify(req.body)}`;
    const loggedInfo = sensitivePaths.indexOf(req.url) == -1 ? loggedRequestInfo : '--- This Request Contains Sensitive User Information ---';
    logger.log(`${req.method}: ${req.url} SESSION._id:${loggedUser} ${loggedInfo}`);
    next();
});

// <Get Requests> ------------------------------------------------
app.get('/', api.handleRootPath);
app.get('/about', api.handleAboutPath);
app.get('/components/projectsAdminsList', api.handleProjectsAdminsListComponentPath);
app.get('/components/projectsGroupAssign', api.handleProjectsGroupAssignPath);
app.get('/components/projectsList', api.handleProjectsListComponentPath);
app.get('/components/team/backlog', api.handleProjectTeamBacklogPath);
app.get('/components/team/board', api.handleActiveSprintTicketsListComponentPath);
app.get('/components/team/issues', api.handleTicketsListComponentPath);
app.get('/components/team/management', api.handleTeamManagementComponentsPath);
app.get('/components/team/release', api.handleReleaseComponentsPath);
app.get('/components/team/sprint', api.handleSprintComponentsPath);
app.get('/components/team/tag', api.handleTagComponentsPath);
app.get('/components/teamsList', api.handleTeamsListComponentPath);
app.get('/components/ticket/edit/page', api.handleTicketEditPageComponentsPath);
app.get('/components/usersList', api.handleUsersListComponentPath);
app.get('/download/file', api.handleDownloadFilePath);
app.get('/feedback/admin', api.handleFeedbackAdminPath);
app.get('/lookup/ticket/by/displayId', api.handleLookupTicketByDisplayIdPath);
app.get('/me', api.handleMePath);
app.get('/profile', api.handleProfilePath);
app.get('/picture/:pictureId', api.handleProfilePicturePath);
app.get('/project/:projectId', api.handleProjectByIdPath);
app.get('/project/:projectId/team/:teamId', api.handleProjectTeamPath);
app.get('/project/:projectId/team/:teamId/release/:releaseId', api.handleReleasePagePath);
app.get('/project/:projectId/team/:teamId/search', api.handleProjectTeamSearchPath);
app.get('/project/:projectId/team/:teamId/sprint/:sprintId', api.handleSprintPagePath);
app.get('/project/:projectId/team/:teamId/tag/:tagId', api.handleTagPagePath);
app.get('/project/:projectId/team/:teamId/tickets/add', api.handleProjectTeamTicketsAddPath);
app.get('/project/:projectId/team/:teamId/ticket/:ticketId', api.handleProjectTeamTicketPath);
app.get('/project/admin/analytics', api.handleAdminAnalytics);
app.get('/project/team/analytics', api.handleProjectTeamAnalytics);
app.get('/project/team/members/list', api.handleProjectTeamMembersListPath);
app.get('/project/team/releases/list', api.handleReleasesListPath);
app.get('/project/team/sprints/list', api.handleSprintsListPath);
app.get('/project/team/tags/list', api.handleTagsListPath);
app.get('/projects', api.handleProjectsPath);
app.get('/projects/add', api.handleProjectsAddPath);
app.get('/projects/export', api.handleProjectsExportPath);
app.get('/projects/export/file', api.handleProjectsExportFilePath);
app.get('/projects/export/file/download', api.handleProjectsExportFileDownloadPath);
app.get('/projects/import', api.handleProjectsImportPath);
app.get('/settings', api.handleSettingsPath);
app.get('/users', api.handleUsersPath);
app.get('/users/add', api.handleUsersAddPath);
app.get('/users/edit/:username', api.handleUsersEditPath);
app.get('/users/export', api.handleUsersExportPath);
app.get('/users/export/file', api.handleUsersExportFilePath);
app.get('/users/export/file/download', api.handleUsersExportFileDownloadPath);
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
app.post('/releases/close', api.handleReleasesClosePath);
app.post('/settings/reset', api.handleSettingsResetPath);
app.post('/settings/update', api.handleSettingsUpdatePath);
app.post('/sprints/activate', api.handleSprintsActivatePath);
app.post('/sprints/close', api.handleSprintsClosePath);
app.post('/tickets/update', api.handleTicketsUpdatePath);
app.post('/tickets/state/update', api.handleTicketsUpdateStatePath);
app.post('/tickets/comment/edit', api.handleTicketsCommentEditPath);
app.post('/users/update', api.handleUsersUpdatePath);
// </Post Requests> -----------------------------------------------

// <Put Requests> ------------------------------------------------
app.put('/comment/create', api.handleTicketsCommentPath);
app.put('/feedback/create', api.handleFeedbackCreatePath);
app.put('/releases/create', api.handleReleasesCreatePath);
app.put('/projects/create', api.handleProjectCreatePath);
app.put('/projects/import/file', api.handleProjectsImportFilePath);
app.put('/sprints/create', api.handleSprintsCreatePath);
app.put('/tags/create', api.handleTagsCreatePath);
app.put('/tickets/create', api.handleTicketsCreatePath);
app.put('/upload/file', api.handleUploadFilePath);
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
app.delete('/releases/delete', api.handleReleasesDeletePath);
app.delete('/sprints/delete', api.handleSprintsDeletePath);
app.delete('/tags/delete', api.handleTagsDeletePath);
// </Delete Requests> -----------------------------------------------

/**
 * If request path does not match any of the above routes, then resolve to 404
 */
app.use(function (req, res, next) {
    return res.status(404).render(common_api.pugPages.pageNotFound);
});
