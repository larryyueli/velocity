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
const csv2json = require('csvtojson');
const express = require('express');
const fileUpload = require('express-fileupload');
const forceSSL = require('express-force-ssl');
const helmet = require('helmet');
const http = require('http');
const https = require('https');
const i18n = require('i18n');
const path = require('path');
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
const projects = require('./Backend/projects.js');
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
const projectsPage = 'projects/projects';
const projectPagePage = 'projects/project-page';
const projectsAddPage = 'projects/projects-add';
const projectTeamPage = 'projects/project-team';
const settingsPage = 'settings/settings';
const ticketCreationPage = 'tickets/tickets-entry';
const ticketModificationPage = 'tickets/tickets-edit';
const usersPage = 'users/users';
const usersAddPage = 'users/users-add';
const usersEditPage = 'users/users-edit';
const usersImportCompletePage = 'users/users-import-complete';
const usersImportPage = 'users/users-import';

const projectsEntryComponent = pug.compileFile('Templates/projects/projects-entry.pug');
const projectsGroupEntryComponent = pug.compileFile('Templates/projects/projects-group-entry.pug');
const projectsGroupModalComponent = pug.compileFile('Templates/projects/projects-group-modal.pug');
const projectsGroupModalEntryComponent = pug.compileFile('Templates/projects/projects-group-modal-entry.pug');
const projectsGroupUserEntryComponent = pug.compileFile('Templates/projects/projects-group-user-entry.pug');
const projectsUserEntryComponent = pug.compileFile('Templates/projects/projects-users-entry.pug');
const usersEntryComponent = pug.compileFile('Templates/users/users-entry.pug');

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
        req.session.destroy();
    }

    if (typeof (req.body.username) !== common.variableTypes.STRING
        || typeof (req.body.password) !== common.variableTypes.STRING) {
        logger.error(JSON.stringify(common.getError(2002)));
        return res.status(400).send(common.getError(2002));
    }

    const username = req.body.username.toLowerCase();
    const password = req.body.password;

    users.login(username, password, function (err, userObject) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(403).send(err);
        }

        if (!settings.isWebsiteActive()
            && userObject.type !== common.userTypes.PROFESSOR.value
            && userObject.type !== common.userTypes.COLLABORATOR_ADMIN.value) {
            logger.error(JSON.stringify(common.getError(3007)));
            return res.status(403).send(common.getError(3007));
        }

        let meObject = JSON.parse(JSON.stringify(userObject));
        delete meObject.password;
        req.session.user = meObject;

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

    let meObject = JSON.parse(JSON.stringify(req.session.user));
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
        user: req.session.user,
        userType: common.getValueInObjectByKey(req.session.user.type, 'value', 'text', common.userTypes),
        themes: common.colorThemes,
        languages: common.languages,
        canEditEmail: settings.isUsersAbleEditEmail(),
        canEditFirstAndLastName: settings.isUsersAbleEditFirstAndLastName(),
        canEditPassword: settings.isUsersAbleEditPassword(),
        notifications: [{ link: '/', type: 'account_circle', name: 'Hello, new notification', id: '22222' }]
    });
}

/**
 * path to update the user profile
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProfileUpdatePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (!req.body.currentPassword || req.body.newPassword !== req.body.confirmPassword) {
        logger.error(JSON.stringify(common.getError(1000)));
        return res.status(400).send(common.getError(1000));
    }

    users.login(req.session.user.username, req.body.currentPassword, function (err, userObject) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        const canEditEmail = settings.isUsersAbleEditEmail();
        const canEditFirstAndLastName = settings.isUsersAbleEditFirstAndLastName();
        const canEditPassword = settings.isUsersAbleEditPassword();
        const updateNotificationEnabled = common.convertStringToBoolean(req.body.notificationEnabled);

        let updateObject = {};
        updateObject._id = req.session.user._id;
        updateObject.fname = (canEditFirstAndLastName && typeof (req.body.fname) === common.variableTypes.STRING) ? req.body.fname : req.session.user.fname;
        updateObject.lname = (canEditFirstAndLastName && typeof (req.body.lname) === common.variableTypes.STRING) ? req.body.lname : req.session.user.lname;
        updateObject.email = (canEditEmail && typeof (req.body.email) === common.variableTypes.STRING) ? req.body.email : req.session.user.email;
        updateObject.password = (canEditPassword && typeof (req.body.newPassword) === common.variableTypes.STRING) ? req.body.newPassword : null;
        updateObject.theme = req.body.theme || req.session.user.theme;
        updateObject.language = req.body.language || req.session.user.language;
        updateObject.notificationEnabled = typeof (updateNotificationEnabled) === common.variableTypes.BOOLEAN ?
            updateNotificationEnabled : req.session.user.notificationEnabled;

        users.updateUser(updateObject, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            req.session.user.fname = updateObject.fname;
            req.session.user.lname = updateObject.lname;
            req.session.user.theme = updateObject.theme;
            req.session.user.email = updateObject.email;
            req.session.user.language = updateObject.language;
            req.session.user.notificationEnabled = updateObject.notificationEnabled;

            return res.status(200).send('profile has been updated successfully');
        });
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

    if (req.session.user.type === common.userTypes.MODE_SELECTOR.value) {
        return res.status(200).render(modeSelectorPage);
    }

    return res.redirect('/projects');
}

/**
 * path to set the mode in the global settings
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleModeSelectPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type !== common.userTypes.MODE_SELECTOR.value) {
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

        let newType;
        if (parsedSelectedMode === common.modeTypes.CLASS) {
            newType = common.userTypes.PROFESSOR.value
        }

        if (parsedSelectedMode === common.modeTypes.COLLABORATORS) {
            newType = common.userTypes.COLLABORATOR_ADMIN.value
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

            users.getUserById(req.session.user._id, function (err, userObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                req.session.user = userObj;
                return res.status(200).send('mode updated successfully');
            });
        });
    });
}

/**
 * path to get the users page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleUsersPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common.getError(2022)));
        return res.status(404).render(pageNotFoundPage);
    }

    return res.status(200).render(usersPage, {
        user: req.session.user,
        isClassMode: settings.getModeType() === common.modeTypes.CLASS,
        isCollabMode: settings.getModeType() === common.modeTypes.COLLABORATORS
    });
}

/**
 * path to get the users list entry
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleUsersListComponentPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common.getError(2023)));
        return res.status(403).send(common.getError(2023));
    }

    const fullUsersList = users.getFullUsersList();

    return res.status(200).send({
        usersList: fullUsersList,
        usersEntryHTML: usersEntryComponent()
    });
}

/**
 * path to get the project admins and non projects admins list
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectsAdminsListComponentPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const projectId = req.query.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common.getError(2010)));
            return res.status(403).send(common.getError(2010));
        }

        const fullUserObjectsList = users.getActiveUsersList();
        const fullUsersList = common.convertJsonListToList('_id', fullUserObjectsList);
        const fullUsersListObject = common.convertListToJason('_id', fullUserObjectsList);

        let adminsList = projectObj.admins;
        let usersList = common.getArrayDiff(fullUsersList, adminsList);

        let resolvedAdminsList = [];
        let resolvedUsersList = [];

        for (let i = 0; i < adminsList.length; i++) {
            let innerUser = fullUsersListObject[adminsList[i]];
            if (innerUser) {
                resolvedAdminsList.push({
                    fname: innerUser.fname,
                    lname: innerUser.lname,
                    username: innerUser.username,
                    email: innerUser.email,
                    type: innerUser.type
                });
            }
        }

        for (let i = 0; i < usersList.length; i++) {
            let innerUser = fullUsersListObject[usersList[i]];
            if (innerUser) {
                resolvedUsersList.push({
                    fname: innerUser.fname,
                    lname: innerUser.lname,
                    username: innerUser.username,
                    email: innerUser.email,
                    type: innerUser.type
                });
            }
        }

        return res.status(200).send({
            projectAdmins: resolvedAdminsList,
            projectUsers: resolvedUsersList,
            usersEntryHTML: projectsUserEntryComponent()
        });
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

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common.getError(2024)));
        return res.status(404).render(pageNotFoundPage);
    }

    return res.status(200).render(usersAddPage, {
        user: req.session.user,
        isClassMode: settings.getModeType() === common.modeTypes.CLASS,
        isCollabMode: settings.getModeType() === common.modeTypes.COLLABORATORS
    });
}

/**
 * root path to create a user
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleUsersCreatePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common.getError(2025)));
        return res.status(403).send(common.getError(2025));
    }

    const newUser = {
        fname: req.body.fname,
        lname: req.body.lname,
        username: req.body.username,
        password: req.body.password,
        type: parseInt(req.body.type),
        status: common.userStatus.ACTIVE.value,
        email: req.body.email
    };

    users.addUser(newUser, function (err, userObjAdded) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        cfs.mkdir(common.cfsTree.USERS, userObjAdded._id, common.cfsPermission.OWNER, function (err, userObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            return res.status(200).send('ok');
        });
    });
}

/**
 * root path to request access
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleUsersRequestAccessPath = function (req, res) {
    if (typeof (req.body.password) === common.variableTypes.STRING
        && typeof (req.body.confirmPassword) === common.variableTypes.STRING
        && req.body.password !== req.body.confirmPassword) {
        logger.error(JSON.stringify(common.getError(2011)));
        return res.status(400).send(common.getError(2011));
    }

    if (settings.getModeType() === common.modeTypes.UNKNOWN) {
        logger.error(JSON.stringify(common.getError(1010)));
        return res.status(500).send(common.getError(1010));
    }

    const newUser = {
        fname: req.body.fname,
        lname: req.body.lname,
        username: req.body.username,
        password: req.body.password,
        type: settings.getModeType() === common.modeTypes.CLASS ?
            common.userTypes.STUDENT.value :
            common.userTypes.COLLABORATOR.value,
        status: common.userStatus.PENDING.value,
        email: req.body.email
    };


    users.addUser(newUser, function (err, userObjAdded) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        cfs.mkdir(common.cfsTree.USERS, userObjAdded._id, common.cfsPermission.OWNER, function (err, userObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            return res.status(200).send('ok');
        });
    });
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

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common.getError(2026)));
        return res.status(404).render(pageNotFoundPage);
    }

    const username = req.params.username;
    if (typeof (username) !== common.variableTypes.STRING) {
        logger.error(JSON.stringify(common.getError(1000)));
        return res.status(400).send(common.getError(1000));
    }

    users.getUserByUsername(username, function (err, foundUser) {
        if (err) {
            if (err.code === 2003) {
                logger.error(JSON.stringify(common.getError(2003)));
                return res.status(404).render(pageNotFoundPage);
            }

            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        return res.status(200).render(usersEditPage, {
            user: req.session.user,
            editUser: foundUser,
            isClassMode: settings.getModeType() === common.modeTypes.CLASS,
            isCollabMode: settings.getModeType() === common.modeTypes.COLLABORATORS,
            commonUserTypes: common.userTypes,
            commonUserStatus: common.userStatus
        });
    });
}

/**
 * path to update a user
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleUsersUpdatePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common.getError(2027)));
        return res.status(403).send(common.getError(2027));
    }

    const oldUsername = req.body.oldUsername;
    users.getUserByUsername(oldUsername, function (err, userObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(400).send(err);
        }

        let newUser = {
            _id: userObj._id,
            fname: req.body.fname,
            lname: req.body.lname,
            password: req.body.password,
            type: parseInt(req.body.type),
            status: parseInt(req.body.status),
            email: req.body.email
        };

        if (req.body.username !== oldUsername) {
            newUser[username] = req.body.username;
        }

        users.updateUser(newUser, function (err, userObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            return res.status(200).send('ok');

        });
    });
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

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common.getError(2028)));
        return res.status(404).render(pageNotFoundPage);
    }

    return res.status(200).render(usersImportPage, {
        user: req.session.user,
    });
}

/**
 * path to import users from a file
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleUsersImportFilePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common.getError(2029)));
        return res.status(403).send(common.getError(2029));
    }

    const validFileExtensions = ['text/csv', 'application/vnd.ms-excel'];
    const uploadedFile = req.files.usersImpotFile;
    if (!uploadedFile || validFileExtensions.indexOf(uploadedFile.mimetype) === -1) {
        logger.error(JSON.stringify(common.getError(2009)));
        return res.status(400).send(common.getError(2009));
    }

    const fileName = common.getUUID();
    const fileExtension = uploadedFile.mimetype.split('/')[1];
    const fileObject = {
        fileName: fileName,
        filePath: `${common.cfsTree.USERS}/${req.session.user._id}`,
        fileExtension: fileExtension,
        fileData: uploadedFile.data,
        filePermissions: common.cfsPermission.OWNER,
        fileCreator: req.session.user._id
    };

    cfs.writeFile(fileObject, function (err, fileObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        const fullFilePath = path.resolve(`${fileObject.filePath}/${fileObject.fileName}.${fileObject.fileExtension}`);
        let importedList = [];
        csv2json().fromFile(fullFilePath).on('json', function (jsonObj) {
            let userObj = {};
            userObj['username'] = jsonObj['Username'];
            userObj['password'] = jsonObj['Password'];
            userObj['fname'] = jsonObj['First Name'];
            userObj['lname'] = jsonObj['Last Name'];
            userObj['email'] = jsonObj['Email'];
            importedList.push(userObj);
        }).on('done', function (err) {
            if (err) {
                logger.error(JSON.stringify(common.getError(1009)));
                return res.status(500).send(common.getError(1009));
            }

            let added = 0;
            let failed = 0;
            let exist = 0;
            let total = 0;
            let processedDirs = 0;

            for (let i = 0; i < importedList.length; i++) {
                let inputUser = importedList[i];
                let userToAdd = {
                    fname: inputUser.fname,
                    lname: inputUser.lname,
                    username: inputUser.username,
                    email: inputUser.email,
                    password: inputUser.password,
                    type: settings.getModeType() === common.modeTypes.CLASS ?
                        common.userTypes.STUDENT.value : common.userTypes.COLLABORATOR.value,
                    status: common.userStatus.ACTIVE.value
                };
                users.addUser(userToAdd, function (err, userObj) {
                    total++;

                    if (err) {
                        if (err.code === 2001) {
                            exist++;
                        } else {
                            failed++;
                        }

                        logger.error(JSON.stringify(err));
                    } else {
                        added++;
                    }

                    cfs.mkdir(common.cfsTree.USERS, userObj._id, common.cfsPermission.OWNER, function (err, userObj) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                        }

                        processedDirs++;

                        if (total === importedList.length && processedDirs === importedList.length) {
                            return res.status(200).render(usersImportCompletePage, {
                                added: added,
                                failed: failed,
                                exist: exist,
                                total: total
                            });
                        }
                    });
                });
            }
        });
    });
}

/**
 * path to fetch the users profile picture
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleprofilePicturePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const pictureId = req.params.pictureId;
    if (pictureId === 'null') {
        const defaultImagePath = `${__dirname}/UI/img/account_circle.png`;
        return res.sendFile(defaultImagePath, function (err) {
            if (err) {
                logger.error(JSON.stringify(err));
            }
        });
    }

    cfs.fileExists(pictureId, function (err, fileObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(400).send(err);
        }

        if (fileObj.permission !== common.cfsPermission.PUBLIC) {
            logger.error(JSON.stringify(common.getError(4010)));
            return res.status(403).send(common.getError(4010));
        }

        const validImageExtensions = ['jpeg', 'png'];
        if (validImageExtensions.indexOf(fileObj.extension) === -1) {
            logger.error(JSON.stringify(common.getError(2008)));
            return res.status(400).send(common.getError(2008));
        }

        return res.sendFile(path.resolve(fileObj.path), function (err) {
            if (err) {
                logger.error(JSON.stringify(err));
            }
        });
    });
}

/**
 * path to udpate the users profile picture
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleUpdateProfilePicturePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const validImageExtensions = ['image/jpeg', 'image/png'];
    const uploadedFile = req.files.userpicture;
    if (!uploadedFile || validImageExtensions.indexOf(uploadedFile.mimetype) === -1) {
        logger.error(JSON.stringify(common.getError(2008)));
        return res.status(400).send(common.getError(2008));
    }

    const fileName = common.getUUID();
    const fileExtension = uploadedFile.mimetype.split('/')[1];
    const fileObject = {
        fileName: fileName,
        filePath: `${common.cfsTree.USERS}/${req.session.user._id}`,
        fileExtension: fileExtension,
        fileData: uploadedFile.data,
        filePermissions: common.cfsPermission.PUBLIC,
        fileCreator: req.session.user._id
    };

    cfs.writeFile(fileObject, function (err, fileObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        users.updateUser({ _id: req.session.user._id, picture: fileName }, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            req.session.user.picture = fileName;
            return res.status(200).send(fileName);
        });
    });
}

/**
 * path to get the settings page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleSettingsPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common.getError(2030)));
        return res.status(404).render(pageNotFoundPage);
    }

    return res.status(200).render(settingsPage, {
        user: req.session.user,
        generalActive: settings.isWebsiteActive(),
        canEditFirstAndLastName: settings.isUsersAbleEditFirstAndLastName(),
        canEditEmail: settings.isUsersAbleEditEmail(),
        canEditPassword: settings.isUsersAbleEditPassword()
    });
}

/**
 * path to reset the settings object
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleSettingsResetPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common.getError(2031)));
        return res.status(403).send(common.getError(2031));
    }

    settings.resetAllSettings(function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        return res.status(200).send('ok');
    });
}

/**
 * path to update the settings object
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleSettingsUpdatePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common.getError(2032)));
        return res.status(403).send(common.getError(2032));
    }

    const updateObject = {
        active: common.convertStringToBoolean(req.body.active),
        canEditEmail: common.convertStringToBoolean(req.body.canEditEmail),
        canEditFirstAndLastName: common.convertStringToBoolean(req.body.canEditFirstAndLastName),
        canEditPassword: common.convertStringToBoolean(req.body.canEditPassword)
    };

    settings.updateAllSettings(updateObject, function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        return res.status(200).send('ok');
    });
}

/**
 * path to get the projects page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectsPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type === common.userTypes.MODE_SELECTOR.value) {
        logger.error(JSON.stringify(common.getError(2033)));
        return res.status(404).render(pageNotFoundPage);
    }

    return res.status(200).render(projectsPage, {
        user: req.session.user
    });
}

/**
 * path to get the projects list entry
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectsListComponentPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type === common.userTypes.MODE_SELECTOR.value) {
        logger.error(JSON.stringify(common.getError(2034)));
        return res.status(403).send(common.getError(2034));
    }

    projects.getProjectsListByUserId(req.session.user._id, function (err, projectsList) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        let addDraft = function () {
            projects.getDraftProjectsInUserSelectionType(function (err, draftProjectsList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                let joinedLists = common.joinLists(projectsList, draftProjectsList);
                return res.status(200).send({
                    projectsList: joinedLists,
                    projectsEntryHTML: projectsEntryComponent()
                });
            });
        }

        if (req.session.user.type === common.userTypes.STUDENT.value) {
            addDraft();
        } else {
            return res.status(200).send({
                projectsList: projectsList,
                projectsEntryHTML: projectsEntryComponent()
            });
        }
    });
}

/**
 * path to get the projects user groups list entry
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectsGroupAssignPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type === common.userTypes.MODE_SELECTOR.value) {
        logger.error(JSON.stringify(common.getError(2034)));
        return res.status(403).send(common.getError(2034));
    }

    const projectId = req.query.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        let userIsAdmin = projectObj.admins.indexOf(req.session.user._id) !== -1;
        let userIsMember = projectObj.members.indexOf(req.session.user._id) !== -1;

        if (projectObj.status === common.projectStatus.ACTIVE.value && !userIsMember) {
            logger.error(JSON.stringify(common.getError(2034)));
            return res.status(403).send(common.getError(2034));
        }

        if (projectObj.status === common.projectStatus.DRAFT.value
            && !userIsAdmin
            && projectObj.teamSelectionType !== common.teamSelectionTypes.USER.value) {
            logger.error(JSON.stringify(common.getError(2034)));
            return res.status(403).send(common.getError(2034));
        }

        if (projectObj.status === common.projectStatus.CLOSED.value && !userIsMember) {
            logger.error(JSON.stringify(common.getError(2034)));
            return res.status(403).send(common.getError(2034));
        }

        if (projectObj.status === common.projectStatus.DELETED.value) {
            logger.error(JSON.stringify(common.getError(2034)));
            return res.status(403).send(common.getError(2034));
        }

        projects.getProjectTeams(projectId, function (err, teamsList) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            let projectMembers = [];
            for (let i = 0; i < teamsList.length; i++) {
                projectMembers = common.joinSets(projectMembers, teamsList[i].members);
            }

            const fullUserObjectsList = users.getActiveUsersList();
            const fullUsersListObject = common.convertListToJason('_id', fullUserObjectsList);
            const usersList = common.convertJsonListToList('_id', fullUserObjectsList);

            let unassignedList = common.getArrayDiff(usersList, projectMembers);
            let unassignedObjectsList = [];

            for (let i = 0; i < unassignedList.length; i++) {
                let innerUser = fullUsersListObject[unassignedList[i]];
                if (innerUser) {
                    unassignedObjectsList.push({
                        fname: innerUser.fname,
                        lname: innerUser.lname,
                        username: innerUser.username,
                        type: innerUser.type
                    });
                }
            }

            let resolvedTeamsList = [];
            for (let i = 0; i < teamsList.length; i++) {
                let teamObject = teamsList[i];
                let teamMembers = [];
                for (let j = 0; j < teamObject.members.length; j++) {
                    let teamUser = fullUsersListObject[teamObject['members'][j]];
                    if (teamUser) {
                        teamMembers.push({
                            fname: teamUser.fname,
                            lname: teamUser.lname,
                            username: teamUser.username,
                            type: teamUser.type
                        });
                    }
                }
                resolvedTeamsList.push({
                    name: teamObject.name,
                    members: teamMembers
                });
            }

            return res.status(200).send({
                unassignedList: unassignedObjectsList,
                groupList: resolvedTeamsList,
                groupSize: projectObj.teamSize,
                groupSelectionType: projectObj.teamSelectionType,
                groupPrefix: projectObj.teamPrefix,
                groupUserHTML: projectsGroupUserEntryComponent(),
                groupHTML: projectsGroupEntryComponent(),
                groupModalHTML: projectsGroupModalComponent(),
                groupModalEntryHTML: projectsGroupModalEntryComponent(),
                isProjectAdmin: projectObj.admins.indexOf(req.session.user._id) !== -1,
                isClassMode: settings.getModeType() === common.modeTypes.CLASS,
                isCollabMode: settings.getModeType() === common.modeTypes.COLLABORATORS
            });
        });
    });
}

/**
 * path to get the projects add page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectsAddPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common.getError(2035)));
        return res.status(404).render(pageNotFoundPage);
    }

    return res.status(200).render(projectsAddPage, {
        user: req.session.user,
        isClassMode: settings.getModeType() === common.modeTypes.CLASS,
        isCollabMode: settings.getModeType() === common.modeTypes.COLLABORATORS
    });
}

/**
 * root path to create a project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectsCreatePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common.getError(2036)));
        return res.status(403).send(common.getError(2036));
    }

    const newProject = {
        title: req.body.title,
        description: req.body.description,
        status: common.projectStatus.DRAFT.value,
        admins: [req.session.user._id]
    };

    projects.addProject(newProject, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        return res.status(200).send(projectObj._id);
    });
}

/**
 * path to get a project page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectByIdPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type === common.userTypes.MODE_SELECTOR.value) {
        logger.error(JSON.stringify(common.getError(2038)));
        return res.status(404).render(pageNotFoundPage);
    }

    const projectId = req.params.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(pageNotFoundPage);
        }

        let userIsAdmin = projectObj.admins.indexOf(req.session.user._id) !== -1;
        let userIsMember = projectObj.members.indexOf(req.session.user._id) !== -1;

        if (projectObj.status === common.projectStatus.ACTIVE.value && !userIsMember) {
            logger.error(JSON.stringify(common.getError(2038)));
            return res.status(404).render(pageNotFoundPage);
        }

        if (projectObj.status === common.projectStatus.ACTIVE.value && !userIsAdmin) {
            return projects.getTeamByUserId(projectId, req.session.user._id, function (err, teamObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).send(err);
                }

                return res.redirect(`/project/${projectId}/team/${teamObj._id}`);
            });
        }

        if (projectObj.status === common.projectStatus.DRAFT.value
            && !userIsAdmin
            && projectObj.teamSelectionType !== common.teamSelectionTypes.USER.value) {
            logger.error(JSON.stringify(common.getError(2038)));
            return res.status(404).render(pageNotFoundPage);
        }

        if (projectObj.status === common.projectStatus.CLOSED.value && !userIsMember) {
            logger.error(JSON.stringify(common.getError(2038)));
            return res.status(404).render(pageNotFoundPage);
        }

        if (projectObj.status === common.projectStatus.DELETED.value) {
            logger.error(JSON.stringify(common.getError(2038)));
            return res.status(404).render(pageNotFoundPage);
        }

        return res.status(200).render(projectPagePage, {
            user: req.session.user,
            title: projectObj.title,
            isProjectAdmin: projectObj.admins.indexOf(req.session.user._id) !== -1,
            description: projectObj.description,
            isClassMode: settings.getModeType() === common.modeTypes.CLASS,
            isCollabMode: settings.getModeType() === common.modeTypes.COLLABORATORS
        });
    });
}

/**
 * path to update a project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectUpdatePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common.getError(2037)));
            return res.status(403).send(common.getError(2037));
        }

        if (projectObj.status !== common.projectStatus.ACTIVE.value
            && projectObj.status !== common.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common.getError(2042)));
            return res.status(400).send(common.getError(2042));
        }

        let newProject = {
            title: req.body.title,
            description: req.body.description
        };
        projects.updateProject(req.body.projectId, newProject, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(400).send(err);
            }

            return res.status(200).send('ok');
        });
    });
}

/**
 * path to update a project's teams
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamsUpdatePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common.getError(2039)));
            return res.status(403).send(common.getError(2039));
        }

        if (projectObj.status !== common.projectStatus.ACTIVE.value
            && projectObj.status !== common.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common.getError(2042)));
            return res.status(400).send(common.getError(2042));
        }

        let inputTeamsList = req.body.teamsList;
        if (!Array.isArray(inputTeamsList)) {
            try {
                inputTeamsList = JSON.parse(inputTeamsList);
            }
            catch (err) {
                logger.error(common.getError(1011));
                inputTeamsList = [];
            }
        }

        projects.getProjectTeams(projectId, function (err, projectTeamsList) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            let projectTeamsListofNames = common.convertJsonListToList('name', projectTeamsList);
            let inputTeamsListofNames = common.convertJsonListToList('name', inputTeamsList);
            let teamsListofNamesToDelete = common.getArrayDiff(projectTeamsListofNames, inputTeamsListofNames);
            let teamsObj = common.convertListToJason('name', projectTeamsList);

            let updateTeams = function () {
                const fullUserObjectsList = users.getActiveUsersList();
                const fullUsersListObject = common.convertListToJason('username', fullUserObjectsList);

                let resolvedTeamsList = [];
                for (let i = 0; i < inputTeamsList.length; i++) {
                    let team = inputTeamsList[i];
                    let members = [];
                    if (team.members) {
                        for (let j = 0; j < team.members.length; j++) {
                            let username = team['members'][j]['username'];
                            if (fullUsersListObject[username]) {
                                members.push(fullUsersListObject[username]._id);
                            }
                        }
                    }
                    resolvedTeamsList.push({
                        name: team.name,
                        members: members
                    });
                }

                let updateTeamsCounter = 0;
                if (updateTeamsCounter === resolvedTeamsList.length) {
                    return res.status(200).send('ok');
                }
                for (let i = 0; i < resolvedTeamsList.length; i++) {
                    let team = resolvedTeamsList[i];
                    projects.getTeamInProjectByName(projectId, team.name, function (err, teamObj) {
                        if (err) {
                            if (err.code === 6004) {
                                projects.addTeamToProject(projectId, team, function (err, result) {
                                    if (err) {
                                        logger.error(JSON.stringify(err));
                                    }

                                    updateTeamsCounter++;
                                    if (updateTeamsCounter === resolvedTeamsList.length) {
                                        if (projectObj.status === common.projectStatus.ACTIVE.value) {
                                            updateActiveTeam();
                                        } else {
                                            return res.status(200).send('ok');
                                        }
                                    }
                                });
                            } else {
                                logger.error(JSON.stringify(err));
                            }
                        }

                        if (teamObj) {
                            projects.updateTeamInProject(teamObj._id, projectId, team, function (err, result) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                }

                                updateTeamsCounter++;
                                if (updateTeamsCounter === resolvedTeamsList.length) {
                                    if (projectObj.status === common.projectStatus.ACTIVE.value) {
                                        updateActiveTeam();
                                    } else {
                                        return res.status(200).send('ok');
                                    }
                                }
                            });
                        }
                    });
                }
            }

            let updateActiveTeam = function () {
                projects.getProjectTeams(projectId, function (err, teamsList) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    let members = projectObj.admins;
                    for (let i = 0; i < teamsList.length; i++) {
                        members = common.joinSets(members, teamsList[i].members);
                    }

                    let newProject = {
                        status: common.projectStatus.ACTIVE.value,
                        members: members
                    };
                    projects.updateProject(req.body.projectId, newProject, function (err, result) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            return res.status(400).send(err);
                        }

                        return res.status(200).send('ok');
                    });
                });
            }

            let completedDeletedTeams = 0;
            if (completedDeletedTeams === teamsListofNamesToDelete.length) {
                updateTeams();
            } else {
                for (let i = 0; i < teamsListofNamesToDelete.length; i++) {
                    let deleteTeamName = teamsListofNamesToDelete[i];
                    if (teamsObj[deleteTeamName]) {
                        let teamToDeleteUpdate = teamsObj[deleteTeamName];
                        teamToDeleteUpdate.status = common.teamStatus.DISABLED.value;
                        projects.updateTeamInProject(teamToDeleteUpdate._id, projectId, teamToDeleteUpdate, function (err, result) {
                            if (err) {
                                logger.error(JSON.stringify(err));
                            }

                            completedDeletedTeams++;
                            if (completedDeletedTeams === teamsListofNamesToDelete.length) {
                                updateTeams();
                            }
                        });
                    }
                }
            }
        });
    });
}

/**
 * path to update a project's admins
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectAdminsUpdatePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common.getError(2037)));
            return res.status(403).send(common.getError(2037));
        }

        if (projectObj.status !== common.projectStatus.ACTIVE.value
            && projectObj.status !== common.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common.getError(2042)));
            return res.status(400).send(common.getError(2042));
        }

        const inputAdminsList = req.body.adminsList;
        if (!Array.isArray(inputAdminsList)) {
            try {
                inputAdminsList = JSON.parse(inputAdminsList);
            }
            catch (err) {
                logger.error(common.getError(1011));
                inputAdminsList = [];
            }
        }

        const projectAdminsListofNames = common.convertJsonListToList('username', inputAdminsList);
        const fullUserObjectsList = users.getActiveUsersList();
        const fullUsersListObject = common.convertListToJason('username', fullUserObjectsList);

        let newAdminsList = [];
        for (let i = 0; i < projectAdminsListofNames.length; i++) {
            let adminObj = fullUsersListObject[projectAdminsListofNames[i]];
            if (adminObj) {
                newAdminsList.push(adminObj._id);
            }
        }

        const newProject = {
            admins: newAdminsList
        };
        projects.updateProject(projectId, newProject, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            return res.status(200).send('ok');
        });
    });
}

/**
 * path to activate a project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectActivatePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common.getError(2041)));
            return res.status(403).send(common.getError(2041));
        }

        if (projectObj.status !== common.projectStatus.ACTIVE.value
            && projectObj.status !== common.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common.getError(2042)));
            return res.status(400).send(common.getError(2042));
        }

        projects.getProjectTeams(projectId, function (err, teamsList) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            let members = projectObj.admins;
            for (let i = 0; i < teamsList.length; i++) {
                members = common.joinSets(members, teamsList[i].members);
            }

            let newProject = {
                status: common.projectStatus.ACTIVE.value,
                members: members
            };
            projects.updateProject(req.body.projectId, newProject, function (err, result) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(400).send(err);
                }

                return res.status(200).send('ok');
            });
        });
    });
}

/**
 * path to delete a project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectDeletePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common.getError(2040)));
            return res.status(403).send(common.getError(2040));
        }

        let newProject = {
            status: common.projectStatus.DELETED.value
        };
        projects.updateProject(req.body.projectId, newProject, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(400).send(err);
            }

            return res.status(200).send('ok');
        });
    });
}

/**
 * path to update a project teams configuration
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamsConfigPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (settings.getModeType() !== common.modeTypes.CLASS) {
        logger.error(JSON.stringify(common.getError(1000)));
        return res.status(400).send(common.getError(1000));
    }

    if (req.session.user.type !== common.userTypes.PROFESSOR.value
        && req.session.user.type !== common.userTypes.TA.value
        && req.session.user.type !== common.userTypes.STUDENT.value) {
        logger.error(JSON.stringify(common.getError(1000)));
        return res.status(403).send(common.getError(1000));
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common.getError(2037)));
            return res.status(403).send(common.getError(2037));
        }

        if (projectObj.status !== common.projectStatus.ACTIVE.value
            && projectObj.status !== common.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common.getError(2042)));
            return res.status(400).send(common.getError(2042));
        }

        let newProject = {
            teamSize: parseInt(req.body.groupSize),
            teamSelectionType: parseInt(req.body.groupSelectType),
            teamPrefix: req.body.groupPrefix
        };
        projects.updateProject(projectId, newProject, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(400).send(err);
            }

            return res.status(200).send('ok');
        });
    });
}

/**
 * path to update a student's team in a  project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamsUpdateMePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    if (req.session.user.type !== common.userTypes.STUDENT.value) {
        logger.error(JSON.stringify(common.getError(1000)));
        return res.status(400).send(common.getError(1000));
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.status === common.projectStatus.ACTIVE.value) {
            logger.error(JSON.stringify(common.getError(2012)));
            return res.status(403).send(common.getError(2012));
        }

        if (projectObj.status === common.projectStatus.CLOSED.value) {
            logger.error(JSON.stringify(common.getError(2013)));
            return res.status(403).send(common.getError(2013));
        }

        if (projectObj.status !== common.projectStatus.DRAFT.value
            && projectObj.teamSelectionType !== common.teamSelectionTypes.USER.value) {
            logger.error(JSON.stringify(common.getError(2014)));
            return res.status(403).send(common.getError(2014));
        }

        projects.getTeamByUserId(projectId, req.session.user._id, function (err, teamObj) {
            if (err) {
                if (err.code !== 6004) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }
            }

            const teamNotExist = (err && err.code === 6004);
            const addAction = req.body.action === 'add';
            const removeAction = req.body.action === 'remove';
            const teamName = req.body.teamName;

            if (!addAction && !removeAction) {
                logger.error(JSON.stringify(common.getError(2015)));
                return res.status(400).send(common.getError(2015));
            }

            if (addAction) {
                if (teamObj) {
                    logger.error(JSON.stringify(common.getError(2016)));
                    return res.status(400).send(common.getError(2016));
                }

                projects.getTeamInProjectByName(projectId, teamName, function (err, teamObjFound) {
                    if (err) {
                        if (err.code === 6004) {
                            const newTeam = {
                                name: teamName,
                                projectId: projectId,
                                members: [req.session.user._id]
                            };
                            projects.addTeamToProject(projectId, newTeam, function (err, result) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                return res.status(200).send('ok');
                            });
                        } else {
                            logger.error(JSON.stringify(err));
                            return res.status(400).send(err);
                        }
                    }

                    if (teamObjFound) {
                        if (projectObj.teamSize < teamObjFound.members.length + 1) {
                            logger.error(JSON.stringify(common.getError(2020)));
                            return res.status(400).send(common.getError(2020));
                        }

                        teamObjFound.members.push(req.session.user._id);
                        const updatedTeam = {
                            projectId: projectId,
                            members: teamObjFound.members
                        };
                        projects.updateTeamInProject(teamObjFound._id, projectId, updatedTeam, function (err, result) {
                            if (err) {
                                logger.error(JSON.stringify(err));
                                return res.status(500).send(err);
                            }

                            return res.status(200).send('ok');
                        });
                    }
                });
            }

            if (removeAction) {
                if (teamNotExist) {
                    logger.error(JSON.stringify(common.getError(2017)));
                    return res.status(400).send(common.getError(2017));
                }

                if (teamObj.name !== teamName) {
                    logger.error(JSON.stringify(common.getError(2021)));
                    return res.status(400).send(common.getError(2021));
                }

                teamObj.members.splice(teamObj.members.indexOf(req.session.user._id), 1);

                let updatedTeam = {
                    projectId: projectId,
                    members: teamObj.members,
                    status: teamObj.members.length === 0 ? common.teamStatus.DISABLED.value : common.teamStatus.ACTIVE.value
                };

                projects.updateTeamInProject(teamObj._id, projectId, updatedTeam, function (err, result) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    return res.status(200).send('ok');
                });
            }
        });
    });
}

/**
 * root path to create a ticket
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleTicketsCreatePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const assignee = req.body.assignee;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common.getError(2018)));
            return res.status(400).send(common.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common.getError(2019)));
                return res.status(400).send(common.getError(2019));
            }

            users.getUserByUsername(assignee, function (err, assigneeObj) {
                if (err && err.code !== 2003) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                let newTicket = {
                    projectId: req.body.projectId,
                    teamId: req.body.teamId,
                    title: req.body.title,
                    description: req.body.description,
                    type: parseInt(req.body.type),
                    state: parseInt(req.body.state),
                    points: parseInt(req.body.points),
                    priority: parseInt(req.body.priority),
                    reporter: req.session.user._id
                };

                if (assigneeObj) {
                    if (projectObj.members.indexOf(assigneeObj._id) === -1) {
                        logger.error(JSON.stringify(common.getError(2018)));
                        return res.status(400).send(common.getError(2018));
                    }

                    if (settings.getModeType() === common.modeTypes.CLASS
                        && teamObj.members.indexOf(assigneeObj._id) === -1) {
                        logger.error(JSON.stringify(common.getError(2019)));
                        return res.status(400).send(common.getError(2019));
                    }

                    newTicket.assignee = assigneeObj._id;
                }

                projects.addTicketToTeam(newTicket, function (err, result) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    return res.status(200).send('ok');
                });
            });
        });
    });
}


/**
 * root path to update a ticket
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleTicketsUpdatePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const ticketId = req.body.ticketId;
    const assignee = req.body.assignee;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common.getError(2018)));
            return res.status(400).send(common.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common.getError(2019)));
                return res.status(400).send(common.getError(2019));
            }

            projects.getTicketById(projectId, teamId, ticketId, function (err, ticketObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                users.getUserByUsername(assignee, function (err, assigneeObj) {
                    if (err && err.code !== 2003) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    let newType = parseInt(req.body.type);
                    let newState = parseInt(req.body.state);
                    let newPoints = parseInt(req.body.points);
                    let newPriority = parseInt(req.body.priority);

                    let updatedTicket = {
                        title: req.body.title,
                        description: req.body.description,
                        type: newType,
                        state: newState,
                        points: newPoints,
                        priority: newPoints
                    };

                    if (common.isValueInObjectWithKeys(newState, 'value', common.ticketStates)
                        && ticketObj.state !== newState) {
                        updatedTicket.stateHistoryEntry = {
                            actor: req.session.user._id,
                            from: ticketObj.state,
                            to: newState,
                            ctime: common.getDate()
                        };
                    }

                    if (assigneeObj) {
                        if (projectObj.members.indexOf(assigneeObj._id) === -1) {
                            logger.error(JSON.stringify(common.getError(2018)));
                            return res.status(400).send(common.getError(2018));
                        }

                        if (settings.getModeType() === common.modeTypes.CLASS
                            && teamObj.members.indexOf(assigneeObj._id) === -1) {
                            logger.error(JSON.stringify(common.getError(2019)));
                            return res.status(400).send(common.getError(2019));
                        }

                        updatedTicket.assignee = assigneeObj._id;

                        if (ticketObj.assignee !== assigneeObj._id) {
                            updatedTicket.assigneeHistoryEntry = {
                                actor: req.session.user._id,
                                from: ticketObj.assignee,
                                to: assigneeObj._id,
                                ctime: common.getDate()
                            };
                        }
                    }

                    projects.updateTicket(ticketId, teamId, projectId, updatedTicket, function (err, result) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            return res.status(500).send(err);
                        }

                        return res.status(200).send('ok');
                    });
                });
            });
        });
    });
}

/**
 * root path to render the team's project page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const projectId = req.params.projectId;
    const teamId = req.params.teamId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(pageNotFoundPage);
        }

        if (projectObj.status !== common.projectStatus.ACTIVE.value
            && projectObj.status !== common.projectStatus.CLOSED.value) {
            logger.error(JSON.stringify(common.getError(2044)));
            return res.status(404).render(pageNotFoundPage);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common.getError(2018)));
            return res.status(404).render(pageNotFoundPage);
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(404).render(pageNotFoundPage);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common.getError(2019)));
                return res.status(404).render(pageNotFoundPage);
            }

            projects.getTicketsByTeamId(projectId, teamId, function (err, ticketsObjList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(pageNotFoundPage);
                }

                return res.status(200).render(projectTeamPage, {
                    user: req.session.user,
                    projectId: projectId,
                    teamId: teamId,
                    ticketsList: ticketsObjList
                });
            });
        });
    });
}

/**
 * root path to render the team's project tickets add page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamTicketsAddPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const projectId = req.params.projectId;
    const teamId = req.params.teamId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(pageNotFoundPage);
        }

        if (projectObj.status !== common.projectStatus.ACTIVE.value) {
            logger.error(JSON.stringify(common.getError(2043)));
            return res.status(404).render(pageNotFoundPage);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common.getError(2018)));
            return res.status(404).render(pageNotFoundPage);
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(404).render(pageNotFoundPage);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common.getError(2019)));
                return res.status(404).render(pageNotFoundPage);
            }

            const reporter = `${req.session.user.fname} ${req.session.user.lname}`;
            const assignee = common.noAssignee;

            return res.status(200).render(ticketCreationPage, {
                user: req.session.user,
                projectId: projectId,
                teamId: teamId,
                reporter: reporter,
                assignee: assignee
            });
        });
    });
}

/**
 * root path to render the team's project tickets modify page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamTicketPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const projectId = req.params.projectId;
    const teamId = req.params.teamId;
    const ticketId = req.params.ticketId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(pageNotFoundPage);
        }

        if (projectObj.status !== common.projectStatus.ACTIVE.value
            && projectObj.status !== common.projectStatus.CLOSED.value) {
            logger.error(JSON.stringify(common.getError(2044)));
            return res.status(404).render(pageNotFoundPage);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common.getError(2018)));
            return res.status(404).render(pageNotFoundPage);
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(404).render(pageNotFoundPage);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common.getError(2019)));
                return res.status(404).render(pageNotFoundPage);
            }

            projects.getTicketById(projectId, teamId, ticketId, function (err, ticketObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(pageNotFoundPage);
                }

                projects.getCommentsByTicketId(projectId, teamId, ticketId, function (err, commentsList) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(404).render(pageNotFoundPage);
                    }

                    const usersList = common.convertListToJason('_id', users.getActiveUsersList());

                    let assignee = common.noAssignee;
                    let resolvedAssignee = usersList[ticketObj.assignee];
                    if (resolvedAssignee) {
                        assignee = `${resolvedAssignee.fname} ${resolvedAssignee.lname}`
                    }

                    let reporter = common.noReporter;
                    let resolvedReporter = usersList[ticketObj.reporter];
                    if (resolvedReporter) {
                        reporter = `${resolvedReporter.fname} ${resolvedReporter.lname}`
                    }

                    for (let i = 0; i < commentsList.length; i++) {
                        let comment = commentsList[i];
                        let resolvedUserFromComment = usersList[comment.userId];
                        if (resolvedUserFromComment) {
                            commentsList[i]['username'] = `${resolvedUserFromComment.fname} ${resolvedUserFromComment.lname}`;
                            commentsList[i]['picture'] = resolvedUserFromComment.picture;
                        }
                    }

                    return res.status(200).render(ticketModificationPage, {
                        user: req.session.user,
                        projectId: projectId,
                        teamId: teamId,
                        reporter: reporter,
                        assignee: assignee,
                        ticket: ticketObj,
                        comments: commentsList,
                        resolveState: (state) => {
                            return common.getValueInObjectByKey(state, 'value', 'text', common.ticketStates);
                        },
                        resolveUsername: (userId) => {
                            return usersList[userId] ? `${usersList[userId].fname} ${usersList[userId].lname}` : common.noAssignee;
                        }
                    });
                });
            });
        });
    });
}

/**
 * root path for commenting on a ticket
 * 
 * @param {object} req req object
 * @param {object} res res object
 */
const handleTicketsCommentPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const ticketId = req.body.ticketId;
    const comment = req.body.comment;

    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common.getError(2018)));
            return res.status(400).send(common.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common.getError(2019)));
                return res.status(400).send(common.getError(2019));
            }

            projects.getTicketById(projectId, teamId, ticketId, function (err, ticketObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                const newComment = {
                    projectId: projectId,
                    teamId: teamId,
                    ticketId: ticketId,
                    userId: req.session.user._id,
                    content: req.body.content
                };

                projects.addCommentToTicket(newComment, function (err, result) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    return res.status(200).send('ok');
                });
            });
        });
    });
}

/**
 * root path to delete a comment
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleCommentDeletePath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const ticketId = req.body.ticketId;
    const commentId = req.body.commentId;

    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common.getError(2018)));
            return res.status(400).send(common.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common.getError(2019)));
                return res.status(400).send(common.getError(2019));
            }

            projects.getTicketById(projectId, teamId, ticketId, function (err, ticketObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                projects.getCommentById(projectId, teamId, ticketId, commentId, function (err, commentObj) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    if (commentObj.userId !== req.session.user._id) {
                        logger.error(JSON.stringify(common.getError(2018)));
                        return res.status(400).send(common.getError(2018));
                    }

                    let updatedComment = { status: common.commentStatus.DELETED.value };
                    projects.updateComment(commentId, ticketId, teamId, projectId, updatedComment, function (err, result) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            return res.status(500).send(err);
                        }

                        return res.status(200).send('ok');
                    });
                });
            });
        });
    });
}

/**
 * root path to edit a comment
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleTicketsCommentEditPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const ticketId = req.body.ticketId;
    const commentId = req.body.commentId;

    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common.getError(2018)));
            return res.status(400).send(common.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common.getError(2019)));
                return res.status(400).send(common.getError(2019));
            }

            projects.getTicketById(projectId, teamId, ticketId, function (err, ticketObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                projects.getCommentById(projectId, teamId, ticketId, commentId, function (err, commentObj) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    if (commentObj.userId !== req.session.user._id) {
                        logger.error(JSON.stringify(common.getError(2018)));
                        return res.status(400).send(common.getError(2018));
                    }

                    let updatedComment = { content: req.body.content };
                    projects.updateComment(commentId, ticketId, teamId, projectId, updatedComment, function (err, result) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            return res.status(500).send(err);
                        }

                        return res.status(200).send('ok');
                    });
                });
            });
        });
    });
}

/**
 * root path to get the list of team members
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamMembersListPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const projectId = req.query.projectId;
    const teamId = req.query.teamId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common.getError(2018)));
            return res.status(400).send(common.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (settings.getModeType() === common.modeTypes.CLASS
                && projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common.getError(2019)));
                return res.status(400).send(common.getError(2019));
            }

            const usersObj = common.convertListToJason('_id', users.getActiveUsersList());
            let listToResolve = [];
            let usersList = [];

            if (settings.getModeType() === common.modeTypes.CLASS) {
                listToResolve = teamObj.members;
            }

            if (settings.getModeType() === common.modeTypes.COLLABORATORS) {
                listToResolve = projectObj.members;
            }

            for (let i = 0; i < listToResolve.length; i++) {
                let memberId = listToResolve[i];
                let memberObj = usersObj[memberId];
                if (memberObj) {
                    usersList.push({
                        username: memberObj.username,
                        fname: memberObj.fname,
                        lname: memberObj.lname
                    });
                }
            }

            return res.status(200).send(usersList);
        });
    });
}
// </Requests Function> -----------------------------------------------

/**
 * Log some information about the request
 */
app.use(function (req, res, next) {
    logger.log(`${req.method}: ${req.url} SESSION._id:${isActiveSession(req) ? JSON.stringify(req.session.user._id) : ' NO USER'} QUERY:${JSON.stringify(req.query)} PARAMS:${JSON.stringify(req.params)} BODY:${JSON.stringify(req.body)}`);
    next();
});

// <Get Requests> ------------------------------------------------
app.get('/', handleRootPath);
app.get('/me', handleMePath);
app.get('/profile', handleProfilePath);
app.get('/profilePicture/:pictureId', handleprofilePicturePath);
app.get('/project/:projectId', handleProjectByIdPath);
app.get('/project/:projectId/team/:teamId', handleProjectTeamPath);
app.get('/project/:projectId/team/:teamId/tickets/add', handleProjectTeamTicketsAddPath);
app.get('/project/:projectId/team/:teamId/ticket/:ticketId', handleProjectTeamTicketPath);
app.get('/project/team/members/list', handleProjectTeamMembersListPath);
app.get('/projects', handleProjectsPath);
app.get('/projectsListComponent', handleProjectsListComponentPath);
app.get('/projectsAdminsListComponent', handleProjectsAdminsListComponentPath);
app.get('/projectsGroupAssign', handleProjectsGroupAssignPath);
app.get('/projects/add', handleProjectsAddPath);
app.get('/settings', handleSettingsPath);
app.get('/users', handleUsersPath);
app.get('/usersListComponent', handleUsersListComponentPath);
app.get('/users/add', handleUsersAddPath);
app.get('/users/edit/:username', handleUsersEditPath);
app.get('/users/import', handleUsersImportPath);
// </Get Requests> -----------------------------------------------

// <Post Requests> -----------------------------------------------
app.post('/login', handleLoginPath);
app.post('/mode/select', handleModeSelectPath);
app.post('/profile/update', handleProfileUpdatePath);
app.post('/profile/update/picture', handleUpdateProfilePicturePath);
app.post('/project/activate', handleProjectActivatePath);
app.post('/project/admins/update', handleProjectAdminsUpdatePath);
app.post('/project/teams/update', handleProjectTeamsUpdatePath);
app.post('/project/teams/update/me', handleProjectTeamsUpdateMePath);
app.post('/project/teams/config', handleProjectTeamsConfigPath);
app.post('/project/update', handleProjectUpdatePath);
app.post('/tickets/update', handleTicketsUpdatePath);
app.post('/tickets/comment/edit', handleTicketsCommentEditPath);
app.post('/settings/reset', handleSettingsResetPath);
app.post('/settings/update', handleSettingsUpdatePath);
app.post('/users/update', handleUsersUpdatePath);
// </Post Requests> -----------------------------------------------

// <Put Requests> ------------------------------------------------
app.put('/projects/create', handleProjectsCreatePath);
app.put('/tickets/create', handleTicketsCreatePath);
app.put('/tickets/comment', handleTicketsCommentPath);
app.put('/users/create', handleUsersCreatePath);
app.put('/users/import/file', handleUsersImportFilePath);
app.put('/users/request/access', handleUsersRequestAccessPath);
// </Put Requests> -----------------------------------------------

// <Delete Requests> ------------------------------------------------
app.delete('/logout', handleLogoutPath);
app.delete('/project/delete', handleProjectDeletePath);
app.delete('/comment/delete', handleCommentDeletePath);
// </Delete Requests> -----------------------------------------------

// <notificationsWS Requests> ------------------------------------------------
notificationsWS.on('connection', function (client, req) {
    client.on('message', function (message) {
    });
    client.send('ws ok');
});
setInterval(function () {
    for (let client of notificationsWS.clients) {
        client.send('ws ok');
    }
}, 1000);
// </notificationsWS Requests> -----------------------------------------------

/**
 * If request path does not match any of the above routes, then resolve to 404
 */
app.use(function (req, res, next) {
    return res.status(404).render(pageNotFoundPage);
});
