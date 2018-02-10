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
const settingsPage = 'settings/settings';
const usersPage = 'users/users';
const usersAddPage = 'users/users-add';
const usersEditPage = 'users/users-edit';
const usersImportCompletePage = 'users/users-import-complete';
const usersImportPage = 'users/users-import';

const projectsEntryComponent = pug.compileFile('Templates/projects/projects-entry.pug');
const projectsGroupEntryComponent = pug.compileFile('Templates/projects/projects-group-entry.pug');
const projectsGroupModalComponent = pug.compileFile('Templates/projects/projects-group-modal.pug');
const projectsGroupUserEntryComponent = pug.compileFile('Templates/projects/projects-group-user-entry.pug');
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

app.use('/summernote', express.static(`${__dirname}/node_modules/summernote/dist`));
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

        if (!settings.getAllSettings().active
            && userObject.type !== common.userTypes.PROFESSOR.value
            && userObject.type !== common.userTypes.COLLABORATOR_ADMIN.value) {
            logger.error(JSON.stringify(common.getError(3007)));
            return res.status(403).send(common.getError(3007));
        }

        var meObject = JSON.parse(JSON.stringify(userObject));
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
        user: req.session.user,
        userType: common.getValueInObjectByKey(req.session.user.type, 'value', 'text', common.userTypes),
        themes: common.colorThemes,
        languages: common.languages,
        canEditEmail: settings.getAllSettings().users.canEditEmail,
        canEditFirstAndLastName: settings.getAllSettings().users.canEditFirstAndLastName,
        canEditPassword: settings.getAllSettings().users.canEditPassword,
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

        const canEditEmail = settings.getAllSettings().users.canEditEmail;
        const canEditFirstAndLastName = settings.getAllSettings().users.canEditFirstAndLastName;
        const canEditPassword = settings.getAllSettings().users.canEditPassword;
        const updateNotificationEnabled = common.convertStringToBoolean(req.body.notificationEnabled);

        var updateObject = {};
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

        var newType;
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
        return res.status(403).render(pageNotFoundPage);
    }

    const fullUsersList = users.getFullUsersList();

    return res.status(200).render(usersPage, {
        user: req.session.user,
        isClassMode: settings.getAllSettings().mode === common.modeTypes.CLASS,
        isCollabMode: settings.getAllSettings().mode === common.modeTypes.COLLABORATORS
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
        return res.status(403).render(pageNotFoundPage);
    }

    const fullUsersList = users.getFullUsersList();

    return res.status(200).send({
        usersList: fullUsersList,
        usersEntryHTML: usersEntryComponent()
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
        return res.status(403).render(pageNotFoundPage);
    }

    return res.status(200).render(usersAddPage, {
        user: req.session.user,
        isClassMode: settings.getAllSettings().mode === common.modeTypes.CLASS,
        isCollabMode: settings.getAllSettings().mode === common.modeTypes.COLLABORATORS
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
        return res.status(403).render(pageNotFoundPage);
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

    users.addUser(newUser, function (err, userObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        return res.status(200).send('ok');

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
        return res.status(403).render(pageNotFoundPage);
    }

    const username = req.params.username;
    if (typeof (username) !== common.variableTypes.STRING) {
        logger.error(JSON.stringify(common.getError(1000)));
        return res.status(400).send(common.getError(1000));
    }

    users.getUserByUsername(username, function (err, foundUser) {
        if (err) {
            if (err.code === 2003) {
                return res.status(400).render(pageNotFoundPage);
            }

            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        return res.status(200).render(usersEditPage, {
            user: req.session.user,
            editUser: foundUser,
            isClassMode: settings.getAllSettings().mode === common.modeTypes.CLASS,
            isCollabMode: settings.getAllSettings().mode === common.modeTypes.COLLABORATORS,
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
        return res.status(403).render(pageNotFoundPage);
    }

    const oldUsername = req.body.oldUsername;
    users.getUserByUsername(oldUsername, function (err, userObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(400).send(err);
        }

        var newUser = {
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
        return res.status(403).render(pageNotFoundPage);
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
        return res.status(403).render(pageNotFoundPage);
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
        var importedList = [];
        csv2json().fromFile(fullFilePath).on('json', function (jsonObj) {
            var userObj = {};
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

            var added = 0;
            var failed = 0;
            var exist = 0;
            var total = 0;

            for (var i = 0; i < importedList.length; i++) {
                var inputUser = importedList[i];
                var userToAdd = {
                    fname: inputUser.fname,
                    lname: inputUser.lname,
                    username: inputUser.username,
                    email: inputUser.email,
                    password: inputUser.password,
                    type: settings.getAllSettings().mode === common.modeTypes.CLASS ?
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

                    if (total === importedList.length) {
                        return res.status(200).render(usersImportCompletePage, {
                            added: added,
                            failed: failed,
                            exist: exist,
                            total: total
                        });
                    }
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
        return res.status(403).render(pageNotFoundPage);
    }

    return res.status(200).render(settingsPage, {
        user: req.session.user,
        generalActive: settings.getAllSettings().active,
        canEditFirstAndLastName: settings.getAllSettings().users.canEditFirstAndLastName,
        canEditEmail: settings.getAllSettings().users.canEditEmail,
        canEditPassword: settings.getAllSettings().users.canEditPassword
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
        return res.status(403).render(pageNotFoundPage);
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
        return res.status(403).render(pageNotFoundPage);
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
        return res.status(403).render(pageNotFoundPage);
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

    projects.getProjectsListByUserId(req.session.user._id, function (err, projectsList) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        return res.status(200).send({
            projectsList: projectsList,
            projectsEntryHTML: projectsEntryComponent()
        });
    });
}

/**
 * path to get the projects unassigned users list entry
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectsGroupAssignPath = function (req, res) {
    if (!isActiveSession(req)) {
        return res.status(401).render(loginPage);
    }

    const projectId = req.query.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        const projectMembers = projectObj.members;
        const fullUserObjectsList = users.getFullUsersList();
        var usersList = [];
        for (var i = 0; i < fullUserObjectsList.length; i++){
            usersList.push(fullUserObjectsList[i]._id);
        }
        projects.getProjectTeams(projectId, function (err, teamsList) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            var unassignedList = common.getArrayDiff(usersList, projectMembers);
            var groupList = teamsList;
console.log(projectMembers); // TODO: remove
console.log(unassignedList); // TODO: remove
console.log(teamsList); // TODO: remove
            return res.status(200).send({
                unassignedList: [
                    {
                        fname: "student",
                        lname: "test1",
                        username: "stude1",
                        type: 3
                    },
                    {
                        fname: "student",
                        lname: "test1",
                        username: "stude1",
                        type: 4
                    },
                    {
                        fname: "student",
                        lname: "test1",
                        username: "stude1",
                        type: 2
                    },
                    {
                        fname: "student",
                        lname: "test1",
                        username: "stude1",
                        type: 4
                    }
                ],
                groupList: [
                    {
                        name: "group1",
                        members: [
                            {
                                fname: "student",
                                lname: "test1",
                                username: "stude1",
                                type: 2
                            },
                            {
                                fname: "student",
                                lname: "test1",
                                username: "stude1",
                                type: 3
                            },
                            {
                                fname: "student",
                                lname: "test1",
                                username: "stude1",
                                type: 4
                            },
                            {
                                fname: "student",
                                lname: "test1",
                                username: "stude1",
                                type: 3
                            }
                        ]
                    },
                    {
                        name: "group2",
                        members: [
                            {
                                fname: "student",
                                lname: "test1",
                                username: "stude1",
                                type: 2
                            },
                            {
                                fname: "student",
                                lname: "test1",
                                username: "stude1",
                                type: 3
                            },
                            {
                                fname: "student",
                                lname: "test1",
                                username: "stude1",
                                type: 4
                            },
                            {
                                fname: "student",
                                lname: "test1",
                                username: "stude1",
                                type: 3
                            }
                        ]
                    }
                ],
                groupUserHTML: projectsGroupUserEntryComponent(),
                groupHTML: projectsGroupEntryComponent(),
                groupModalHTML: projectsGroupModalComponent()
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
        return res.status(403).render(pageNotFoundPage);
    }

    const fullUsersList = users.getFullUsersList();

    return res.status(200).render(projectsAddPage, {
        user: req.session.user,
        isClassMode: settings.getAllSettings().mode === common.modeTypes.CLASS,
        isCollabMode: settings.getAllSettings().mode === common.modeTypes.COLLABORATORS
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
        return res.status(403).render(pageNotFoundPage);
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
        return res.status(403).render(pageNotFoundPage);
    }

    const projectId = req.params.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).render(pageNotFoundPage);
        }

        return res.status(200).render(projectPagePage, {
            user: req.session.user,
            title: projectObj.title,
            description: projectObj.description,
            isClassMode: settings.getAllSettings().mode === common.modeTypes.CLASS,
            isCollabMode: settings.getAllSettings().mode === common.modeTypes.COLLABORATORS
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

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common.userTypes.PROFESSOR.value) {
        return res.status(403).render(pageNotFoundPage);
    }

    const projectId = req.body.projectId;
    var newProject = {
        _id: req.body.projectId,
        title: req.body.title,
        description: req.body.description
    };
    projects.updateProject(newProject, function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(400).send(err);
        }

        return res.status(200).send('ok');
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

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common.userTypes.PROFESSOR.value) {
        return res.status(403).render(pageNotFoundPage);
    }

    const projectId = req.body.projectId;
    var newProject = {
        _id: req.body.projectId,
        status: common.projectStatus.ACTIVE.value
    };
    projects.updateProject(newProject, function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(400).send(err);
        }

        return res.status(200).send('ok');
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

    if (req.session.user.type !== common.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common.userTypes.PROFESSOR.value) {
        return res.status(403).render(pageNotFoundPage);
    }

    const projectId = req.body.projectId;
    var newProject = {
        _id: req.body.projectId,
        status: common.projectStatus.DELETED.value
    };
    projects.updateProject(newProject, function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(400).send(err);
        }

        return res.status(200).send('ok');
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
app.get('/projects', handleProjectsPath);
app.get('/projectsListComponent', handleProjectsListComponentPath);
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
app.post('/project/update', handleProjectUpdatePath);
app.post('/settings/reset', handleSettingsResetPath);
app.post('/settings/update', handleSettingsUpdatePath);
app.post('/users/update', handleUsersUpdatePath);
// </Post Requests> -----------------------------------------------

// <Put Requests> ------------------------------------------------
app.put('/projects/create', handleProjectsCreatePath);
app.put('/users/create', handleUsersCreatePath);
app.put('/users/import/file', handleUsersImportFilePath);
// </Put Requests> -----------------------------------------------

// <Delete Requests> ------------------------------------------------
app.delete('/logout', handleLogoutPath);
app.delete('/project/delete', handleProjectDeletePath);
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
}, 1000);
// </notificationsWS Requests> -----------------------------------------------

/**
 * If request path does not match any of the above routes, then resolve to 404
 */
app.use(function (req, res, next) {
    return res.status(404).render(pageNotFoundPage);
});
