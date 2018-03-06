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

const path = require('path');

const common_api = require('./api-components/common-api.js');
const notifications_api = require('./api-components/notifications-api.js');

const cfs = require('../Backend/customFileSystem.js');
const common_backend = require('../Backend/common.js');
const config = require('../Backend/config.js');
const logger = require('../Backend/logger.js');
const projects = require('../Backend/projects.js');
const settings = require('../Backend/settings.js');
const users = require('../Backend/users.js');

// <Requests Function> -----------------------------------------------
/**
 * initialize the api components
 *
 * @param {object} pug pug object/instance
 * @param {object} notificationsWS notifications web secket instance
 * @param {function} callback callback function
 */
const initialize = function (pug, notificationsWS, callback) {
    common_api.pugComponents.ticketEntryComponent = pug.compileFile('Templates/tickets/ticket-entry.pug');
    common_api.pugComponents.projectsEntryComponent = pug.compileFile('Templates/projects/projects-entry.pug');
    common_api.pugComponents.projectsGroupEntryComponent = pug.compileFile('Templates/projects/projects-group-entry.pug');
    common_api.pugComponents.projectsGroupModalComponent = pug.compileFile('Templates/projects/projects-group-modal.pug');
    common_api.pugComponents.projectsGroupModalEntryComponent = pug.compileFile('Templates/projects/projects-group-modal-entry.pug');
    common_api.pugComponents.projectsGroupUserEntryComponent = pug.compileFile('Templates/projects/projects-group-user-entry.pug');
    common_api.pugComponents.projectsUserEntryComponent = pug.compileFile('Templates/projects/projects-users-entry.pug');
    common_api.pugComponents.usersEntryComponent = pug.compileFile('Templates/users/users-entry.pug');

    notifications_api.initialize(notificationsWS);

    return callback(null, 'ok');
}

/**
 * login path to create a session if the username and password are valid
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleLoginPath = function (req, res) {
    if (common_api.isActiveSession(req)) {
        req.session.destroy();
    }

    if (typeof (req.body.username) !== common_backend.variableTypes.STRING
        || typeof (req.body.password) !== common_backend.variableTypes.STRING) {
        logger.error(JSON.stringify(common_backend.getError(2002)));
        return res.status(400).send(common_backend.getError(2002));
    }

    const username = req.body.username.toLowerCase();
    const password = req.body.password;

    users.login(username, password, function (err, userObject) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(403).send(err);
        }

        if (!settings.isWebsiteActive()
            && userObject.type !== common_backend.userTypes.PROFESSOR.value
            && userObject.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value) {
            logger.error(JSON.stringify(common_backend.getError(3007)));
            return res.status(403).send(common_backend.getError(3007));
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
    if (common_api.isActiveSession(req)) {
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    return res.status(200).render(common_api.pugPages.profile, {
        user: req.session.user,
        userType: common_backend.getValueInObjectByKey(req.session.user.type, 'value', 'text', common_backend.userTypes),
        themes: common_backend.colorThemes,
        languages: common_backend.languages,
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (!req.body.currentPassword || req.body.newPassword !== req.body.confirmPassword) {
        logger.error(JSON.stringify(common_backend.getError(1000)));
        return res.status(400).send(common_backend.getError(1000));
    }

    users.login(req.session.user.username, req.body.currentPassword, function (err, userObject) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        const canEditEmail = settings.isUsersAbleEditEmail();
        const canEditFirstAndLastName = settings.isUsersAbleEditFirstAndLastName();
        const canEditPassword = settings.isUsersAbleEditPassword();
        const updateNotificationEnabled = common_backend.convertStringToBoolean(req.body.notificationEnabled);

        let updateObject = {};
        updateObject._id = req.session.user._id;
        updateObject.fname = (canEditFirstAndLastName && typeof (req.body.fname) === common_backend.variableTypes.STRING) ? req.body.fname : req.session.user.fname;
        updateObject.lname = (canEditFirstAndLastName && typeof (req.body.lname) === common_backend.variableTypes.STRING) ? req.body.lname : req.session.user.lname;
        updateObject.email = (canEditEmail && typeof (req.body.email) === common_backend.variableTypes.STRING) ? req.body.email : req.session.user.email;
        updateObject.password = (canEditPassword && typeof (req.body.newPassword) === common_backend.variableTypes.STRING) ? req.body.newPassword : null;
        updateObject.theme = req.body.theme || req.session.user.theme;
        updateObject.language = req.body.language || req.session.user.language;
        updateObject.notificationEnabled = typeof (updateNotificationEnabled) === common_backend.variableTypes.BOOLEAN ?
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type === common_backend.userTypes.MODE_SELECTOR.value) {
        return res.status(200).render(common_api.pugPages.modeSelector);
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.MODE_SELECTOR.value) {
        return res.status(400).send(common_backend.getError(1000));
    }

    const parsedSelectedMode = parseInt(req.body.selectedMode);
    if (!common_backend.isValueInObject(parsedSelectedMode, common_backend.modeTypes)) {
        logger.error(JSON.stringify(common_backend.getError(3006)));
        return res.status(400).send(common_backend.getError(3006));
    }

    settings.updateModeType(parsedSelectedMode, function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        let newType;
        if (parsedSelectedMode === common_backend.modeTypes.CLASS) {
            newType = common_backend.userTypes.PROFESSOR.value
        }

        if (parsedSelectedMode === common_backend.modeTypes.COLLABORATORS) {
            newType = common_backend.userTypes.COLLABORATOR_ADMIN.value
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2022)));
        return res.status(404).render(common_api.pugPages.pageNotFound);
    }

    return res.status(200).render(common_api.pugPages.users, {
        user: req.session.user,
        isClassMode: settings.getModeType() === common_backend.modeTypes.CLASS,
        isCollabMode: settings.getModeType() === common_backend.modeTypes.COLLABORATORS
    });
}

/**
 * path to get the users list entry
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleUsersListComponentPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2023)));
        return res.status(403).send(common_backend.getError(2023));
    }

    const fullUsersList = users.getFullUsersList();

    return res.status(200).send({
        usersList: fullUsersList,
        usersEntryHTML: common_api.pugComponents.usersEntryComponent()
    });
}

/**
 * path to get the project admins and non projects admins list
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectsAdminsListComponentPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.query.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2010)));
            return res.status(403).send(common_backend.getError(2010));
        }

        const fullUserObjectsList = users.getActiveUsersList();
        const fullUsersList = common_backend.convertJsonListToList('_id', fullUserObjectsList);
        const fullUsersListObject = common_backend.convertListToJason('_id', fullUserObjectsList);

        let adminsList = projectObj.admins;
        let usersList = common_backend.getArrayDiff(fullUsersList, adminsList);

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
            usersEntryHTML: common_api.pugComponents.projectsUserEntryComponent()
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2024)));
        return res.status(404).render(common_api.pugPages.pageNotFound);
    }

    return res.status(200).render(common_api.pugPages.usersAdd, {
        user: req.session.user,
        isClassMode: settings.getModeType() === common_backend.modeTypes.CLASS,
        isCollabMode: settings.getModeType() === common_backend.modeTypes.COLLABORATORS
    });
}

/**
 * root path to create a user
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleUsersCreatePath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2025)));
        return res.status(403).send(common_backend.getError(2025));
    }

    const newUser = {
        fname: req.body.fname,
        lname: req.body.lname,
        username: req.body.username,
        password: req.body.password,
        type: parseInt(req.body.type),
        status: common_backend.userStatus.ACTIVE.value,
        email: req.body.email
    };

    users.addUser(newUser, function (err, userObjAdded) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        cfs.mkdir(common_backend.cfsTree.USERS, userObjAdded._id, common_backend.cfsPermission.OWNER, function (err, userObj) {
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
    if (typeof (req.body.password) === common_backend.variableTypes.STRING
        && typeof (req.body.confirmPassword) === common_backend.variableTypes.STRING
        && req.body.password !== req.body.confirmPassword) {
        logger.error(JSON.stringify(common_backend.getError(2011)));
        return res.status(400).send(common_backend.getError(2011));
    }

    if (settings.getModeType() === common_backend.modeTypes.UNKNOWN) {
        logger.error(JSON.stringify(common_backend.getError(1010)));
        return res.status(500).send(common_backend.getError(1010));
    }

    const newUser = {
        fname: req.body.fname,
        lname: req.body.lname,
        username: req.body.username,
        password: req.body.password,
        type: settings.getModeType() === common_backend.modeTypes.CLASS ?
            common_backend.userTypes.STUDENT.value :
            common_backend.userTypes.COLLABORATOR.value,
        status: common_backend.userStatus.PENDING.value,
        email: req.body.email
    };


    users.addUser(newUser, function (err, userObjAdded) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        cfs.mkdir(common_backend.cfsTree.USERS, userObjAdded._id, common_backend.cfsPermission.OWNER, function (err, userObj) {
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2026)));
        return res.status(404).render(common_api.pugPages.pageNotFound);
    }

    const username = req.params.username;
    if (typeof (username) !== common_backend.variableTypes.STRING) {
        logger.error(JSON.stringify(common_backend.getError(1000)));
        return res.status(400).send(common_backend.getError(1000));
    }

    users.getUserByUsername(username, function (err, foundUser) {
        if (err) {
            if (err.code === 2003) {
                logger.error(JSON.stringify(common_backend.getError(2003)));
                return res.status(404).render(common_api.pugPages.pageNotFound);
            }

            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        return res.status(200).render(common_api.pugPages.usersEdit, {
            user: req.session.user,
            editUser: foundUser,
            isClassMode: settings.getModeType() === common_backend.modeTypes.CLASS,
            isCollabMode: settings.getModeType() === common_backend.modeTypes.COLLABORATORS,
            commonUserTypes: common_backend.userTypes,
            commonUserStatus: common_backend.userStatus
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2027)));
        return res.status(403).send(common_backend.getError(2027));
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2028)));
        return res.status(404).render(common_api.pugPages.pageNotFound);
    }

    return res.status(200).render(common_api.pugPages.usersImport, {
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2029)));
        return res.status(403).send(common_backend.getError(2029));
    }

    const validFileExtensions = ['text/csv', 'application/vnd.ms-excel'];
    const uploadedFile = req.files.usersImpotFile;
    if (!uploadedFile || validFileExtensions.indexOf(uploadedFile.mimetype) === -1) {
        logger.error(JSON.stringify(common_backend.getError(2009)));
        return res.status(400).send(common_backend.getError(2009));
    }

    const fileName = common_backend.getUUID();
    const fileExtension = uploadedFile.mimetype.split('/')[1];
    const fileObject = {
        fileName: fileName,
        filePath: `${common_backend.cfsTree.USERS}/${req.session.user._id}`,
        fileExtension: fileExtension,
        fileData: uploadedFile.data,
        filePermissions: common_backend.cfsPermission.OWNER,
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
                logger.error(JSON.stringify(common_backend.getError(1009)));
                return res.status(500).send(common_backend.getError(1009));
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
                    type: settings.getModeType() === common_backend.modeTypes.CLASS ?
                        common_backend.userTypes.STUDENT.value : common_backend.userTypes.COLLABORATOR.value,
                    status: common_backend.userStatus.ACTIVE.value
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

                    cfs.mkdir(common_backend.cfsTree.USERS, userObj._id, common_backend.cfsPermission.OWNER, function (err, userObj) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                        }

                        processedDirs++;

                        if (total === importedList.length && processedDirs === importedList.length) {
                            return res.status(200).render(common_api.pugPages.usersImportComplete, {
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const defaultImagePath = `${__dirname}/../UI/img/account_circle.png`;
    const pictureId = req.params.pictureId;
    if (pictureId === 'null') {
        return res.sendFile(path.resolve(defaultImagePath), function (err) {
            if (err) {
                logger.error(JSON.stringify(err));
            }
        });
    }

    cfs.fileExists(pictureId, function (err, fileObj) {
        let imagePath = fileObj ? fileObj.path : defaultImagePath;

        if (err) {
            logger.error(JSON.stringify(err));
        }

        if (fileObj.permission !== common_backend.cfsPermission.PUBLIC) {
            logger.error(JSON.stringify(common_backend.getError(4010)));
            imagePath = defaultImagePath;
        }

        const validImageExtensions = ['jpeg', 'png'];
        if (validImageExtensions.indexOf(fileObj.extension) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2008)));
            imagePath = defaultImagePath;
        }

        return res.sendFile(path.resolve(imagePath), function (err) {
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const validImageExtensions = ['image/jpeg', 'image/png'];
    const uploadedFile = req.files.userpicture;
    if (!uploadedFile || validImageExtensions.indexOf(uploadedFile.mimetype) === -1) {
        logger.error(JSON.stringify(common_backend.getError(2008)));
        return res.status(400).send(common_backend.getError(2008));
    }

    const fileName = common_backend.getUUID();
    const fileExtension = uploadedFile.mimetype.split('/')[1];
    const fileObject = {
        fileName: fileName,
        filePath: `${common_backend.cfsTree.USERS}/${req.session.user._id}`,
        fileExtension: fileExtension,
        fileData: uploadedFile.data,
        filePermissions: common_backend.cfsPermission.PUBLIC,
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2030)));
        return res.status(404).render(common_api.pugPages.pageNotFound);
    }

    return res.status(200).render(common_api.pugPages.settings, {
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2031)));
        return res.status(403).send(common_backend.getError(2031));
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2032)));
        return res.status(403).send(common_backend.getError(2032));
    }

    const updateObject = {
        active: common_backend.convertStringToBoolean(req.body.active),
        canEditEmail: common_backend.convertStringToBoolean(req.body.canEditEmail),
        canEditFirstAndLastName: common_backend.convertStringToBoolean(req.body.canEditFirstAndLastName),
        canEditPassword: common_backend.convertStringToBoolean(req.body.canEditPassword)
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type === common_backend.userTypes.MODE_SELECTOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2033)));
        return res.status(404).render(common_api.pugPages.pageNotFound);
    }

    return res.status(200).render(common_api.pugPages.projects, {
        user: req.session.user
    });
}

/**
 * path to get the tickets list component
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleTicketsListComponentPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.query.projectId;
    const teamId = req.query.teamId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            projects.getTicketsByTeamId(projectId, teamId, function (err, ticketsObjList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                return res.status(200).send({
                    ticketEntryHTML: common_api.pugComponents.ticketEntryComponent(),
                    ticketsList: ticketsObjList
                });
            });
        });
    });
}

/**
 * path to get the projects list entry
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectsListComponentPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type === common_backend.userTypes.MODE_SELECTOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2034)));
        return res.status(403).send(common_backend.getError(2034));
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

                let joinedLists = common_backend.joinLists(projectsList, draftProjectsList);
                return res.status(200).send({
                    projectsList: joinedLists,
                    projectsEntryHTML: common_api.pugComponents.projectsEntryComponent()
                });
            });
        }

        if (req.session.user.type === common_backend.userTypes.STUDENT.value) {
            addDraft();
        } else {
            return res.status(200).send({
                projectsList: projectsList,
                projectsEntryHTML: common_api.pugComponents.projectsEntryComponent()
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type === common_backend.userTypes.MODE_SELECTOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2034)));
        return res.status(403).send(common_backend.getError(2034));
    }

    const projectId = req.query.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        let userIsAdmin = projectObj.admins.indexOf(req.session.user._id) !== -1;
        let userIsMember = projectObj.members.indexOf(req.session.user._id) !== -1;

        if (projectObj.status === common_backend.projectStatus.ACTIVE.value && !userIsMember) {
            logger.error(JSON.stringify(common_backend.getError(2034)));
            return res.status(403).send(common_backend.getError(2034));
        }

        if (projectObj.status === common_backend.projectStatus.DRAFT.value
            && !userIsAdmin
            && projectObj.teamSelectionType !== common_backend.teamSelectionTypes.USER.value) {
            logger.error(JSON.stringify(common_backend.getError(2034)));
            return res.status(403).send(common_backend.getError(2034));
        }

        if (projectObj.status === common_backend.projectStatus.CLOSED.value && !userIsMember) {
            logger.error(JSON.stringify(common_backend.getError(2034)));
            return res.status(403).send(common_backend.getError(2034));
        }

        if (projectObj.status === common_backend.projectStatus.DELETED.value) {
            logger.error(JSON.stringify(common_backend.getError(2034)));
            return res.status(403).send(common_backend.getError(2034));
        }

        projects.getProjectTeams(projectId, function (err, teamsList) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            let projectMembers = [];
            for (let i = 0; i < teamsList.length; i++) {
                projectMembers = common_backend.joinSets(projectMembers, teamsList[i].members);
            }

            const fullUserObjectsList = users.getActiveUsersList();
            const fullUsersListObject = common_backend.convertListToJason('_id', fullUserObjectsList);
            const usersList = common_backend.convertJsonListToList('_id', fullUserObjectsList);

            let unassignedList = common_backend.getArrayDiff(usersList, projectMembers);
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
                groupUserHTML: common_api.pugComponents.projectsGroupUserEntryComponent(),
                groupHTML: common_api.pugComponents.projectsGroupEntryComponent(),
                groupModalHTML: common_api.pugComponents.projectsGroupModalComponent(),
                groupModalEntryHTML: common_api.pugComponents.projectsGroupModalEntryComponent(),
                isProjectAdmin: projectObj.admins.indexOf(req.session.user._id) !== -1,
                isClassMode: settings.getModeType() === common_backend.modeTypes.CLASS,
                isCollabMode: settings.getModeType() === common_backend.modeTypes.COLLABORATORS
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2035)));
        return res.status(404).render(common_api.pugPages.pageNotFound);
    }

    return res.status(200).render(common_api.pugPages.projectsAdd, {
        user: req.session.user,
        isClassMode: settings.getModeType() === common_backend.modeTypes.CLASS,
        isCollabMode: settings.getModeType() === common_backend.modeTypes.COLLABORATORS
    });
}

/**
 * root path to create a project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectsCreatePath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2036)));
        return res.status(403).send(common_backend.getError(2036));
    }

    const newProject = {
        title: req.body.title,
        description: req.body.description,
        status: common_backend.projectStatus.DRAFT.value,
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type === common_backend.userTypes.MODE_SELECTOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2038)));
        return res.status(404).render(common_api.pugPages.pageNotFound);
    }

    const projectId = req.params.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        let userIsAdmin = projectObj.admins.indexOf(req.session.user._id) !== -1;
        let userIsMember = projectObj.members.indexOf(req.session.user._id) !== -1;

        if (projectObj.status === common_backend.projectStatus.ACTIVE.value && !userIsMember) {
            logger.error(JSON.stringify(common_backend.getError(2038)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.status === common_backend.projectStatus.ACTIVE.value && !userIsAdmin) {
            return projects.getTeamByUserId(projectId, req.session.user._id, function (err, teamObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).send(err);
                }

                return res.redirect(`/project/${projectId}/team/${teamObj._id}`);
            });
        }

        if (projectObj.status === common_backend.projectStatus.DRAFT.value
            && !userIsAdmin
            && projectObj.teamSelectionType !== common_backend.teamSelectionTypes.USER.value) {
            logger.error(JSON.stringify(common_backend.getError(2038)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.status === common_backend.projectStatus.CLOSED.value && !userIsMember) {
            logger.error(JSON.stringify(common_backend.getError(2038)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.status === common_backend.projectStatus.DELETED.value) {
            logger.error(JSON.stringify(common_backend.getError(2038)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        return res.status(200).render(common_api.pugPages.projectPage, {
            user: req.session.user,
            title: projectObj.title,
            isProjectAdmin: projectObj.admins.indexOf(req.session.user._id) !== -1,
            description: projectObj.description,
            isClassMode: settings.getModeType() === common_backend.modeTypes.CLASS,
            isCollabMode: settings.getModeType() === common_backend.modeTypes.COLLABORATORS
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2037)));
            return res.status(403).send(common_backend.getError(2037));
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value
            && projectObj.status !== common_backend.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common_backend.getError(2042)));
            return res.status(400).send(common_backend.getError(2042));
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2039)));
            return res.status(403).send(common_backend.getError(2039));
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value
            && projectObj.status !== common_backend.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common_backend.getError(2042)));
            return res.status(400).send(common_backend.getError(2042));
        }

        let inputTeamsList = req.body.teamsList;
        if (!Array.isArray(inputTeamsList)) {
            try {
                inputTeamsList = JSON.parse(inputTeamsList);
            }
            catch (err) {
                logger.error(common_backend.getError(1011));
                inputTeamsList = [];
            }
        }

        projects.getProjectTeams(projectId, function (err, projectTeamsList) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            let projectTeamsListofNames = common_backend.convertJsonListToList('name', projectTeamsList);
            let inputTeamsListofNames = common_backend.convertJsonListToList('name', inputTeamsList);
            let teamsListofNamesToDelete = common_backend.getArrayDiff(projectTeamsListofNames, inputTeamsListofNames);
            let teamsObj = common_backend.convertListToJason('name', projectTeamsList);

            let updateTeams = function () {
                const fullUserObjectsList = users.getActiveUsersList();
                const fullUsersListObject = common_backend.convertListToJason('username', fullUserObjectsList);

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
                                        if (projectObj.status === common_backend.projectStatus.ACTIVE.value) {
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
                                    if (projectObj.status === common_backend.projectStatus.ACTIVE.value) {
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
                        members = common_backend.joinSets(members, teamsList[i].members);
                    }

                    let newProject = {
                        status: common_backend.projectStatus.ACTIVE.value,
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
                        teamToDeleteUpdate.status = common_backend.teamStatus.DISABLED.value;
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2037)));
            return res.status(403).send(common_backend.getError(2037));
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value
            && projectObj.status !== common_backend.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common_backend.getError(2042)));
            return res.status(400).send(common_backend.getError(2042));
        }

        const inputAdminsList = req.body.adminsList;
        if (!Array.isArray(inputAdminsList)) {
            try {
                inputAdminsList = JSON.parse(inputAdminsList);
            }
            catch (err) {
                logger.error(common_backend.getError(1011));
                inputAdminsList = [];
            }
        }

        const projectAdminsListofNames = common_backend.convertJsonListToList('username', inputAdminsList);
        const fullUserObjectsList = users.getActiveUsersList();
        const fullUsersListObject = common_backend.convertListToJason('username', fullUserObjectsList);

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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2041)));
            return res.status(403).send(common_backend.getError(2041));
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value
            && projectObj.status !== common_backend.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common_backend.getError(2042)));
            return res.status(400).send(common_backend.getError(2042));
        }

        projects.getProjectTeams(projectId, function (err, teamsList) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            let members = projectObj.admins;
            for (let i = 0; i < teamsList.length; i++) {
                members = common_backend.joinSets(members, teamsList[i].members);
            }

            let newProject = {
                status: common_backend.projectStatus.ACTIVE.value,
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2040)));
            return res.status(403).send(common_backend.getError(2040));
        }

        let newProject = {
            status: common_backend.projectStatus.DELETED.value
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (settings.getModeType() !== common_backend.modeTypes.CLASS) {
        logger.error(JSON.stringify(common_backend.getError(1000)));
        return res.status(400).send(common_backend.getError(1000));
    }

    if (req.session.user.type !== common_backend.userTypes.PROFESSOR.value
        && req.session.user.type !== common_backend.userTypes.TA.value
        && req.session.user.type !== common_backend.userTypes.STUDENT.value) {
        logger.error(JSON.stringify(common_backend.getError(1000)));
        return res.status(403).send(common_backend.getError(1000));
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2037)));
            return res.status(403).send(common_backend.getError(2037));
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value
            && projectObj.status !== common_backend.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common_backend.getError(2042)));
            return res.status(400).send(common_backend.getError(2042));
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.STUDENT.value) {
        logger.error(JSON.stringify(common_backend.getError(1000)));
        return res.status(400).send(common_backend.getError(1000));
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.status === common_backend.projectStatus.ACTIVE.value) {
            logger.error(JSON.stringify(common_backend.getError(2012)));
            return res.status(403).send(common_backend.getError(2012));
        }

        if (projectObj.status === common_backend.projectStatus.CLOSED.value) {
            logger.error(JSON.stringify(common_backend.getError(2013)));
            return res.status(403).send(common_backend.getError(2013));
        }

        if (projectObj.status !== common_backend.projectStatus.DRAFT.value
            && projectObj.teamSelectionType !== common_backend.teamSelectionTypes.USER.value) {
            logger.error(JSON.stringify(common_backend.getError(2014)));
            return res.status(403).send(common_backend.getError(2014));
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
                logger.error(JSON.stringify(common_backend.getError(2015)));
                return res.status(400).send(common_backend.getError(2015));
            }

            if (addAction) {
                if (teamObj) {
                    logger.error(JSON.stringify(common_backend.getError(2016)));
                    return res.status(400).send(common_backend.getError(2016));
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
                            logger.error(JSON.stringify(common_backend.getError(2020)));
                            return res.status(400).send(common_backend.getError(2020));
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
                    logger.error(JSON.stringify(common_backend.getError(2017)));
                    return res.status(400).send(common_backend.getError(2017));
                }

                if (teamObj.name !== teamName) {
                    logger.error(JSON.stringify(common_backend.getError(2021)));
                    return res.status(400).send(common_backend.getError(2021));
                }

                teamObj.members.splice(teamObj.members.indexOf(req.session.user._id), 1);

                let updatedTeam = {
                    projectId: projectId,
                    members: teamObj.members,
                    status: teamObj.members.length === 0 ? common_backend.teamStatus.DISABLED.value : common_backend.teamStatus.ACTIVE.value
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
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
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
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
                        logger.error(JSON.stringify(common_backend.getError(2018)));
                        return res.status(400).send(common_backend.getError(2018));
                    }

                    if (settings.getModeType() === common_backend.modeTypes.CLASS
                        && teamObj.members.indexOf(assigneeObj._id) === -1) {
                        logger.error(JSON.stringify(common_backend.getError(2019)));
                        return res.status(400).send(common_backend.getError(2019));
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
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
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
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

                    if (common_backend.isValueInObjectWithKeys(newState, 'value', common_backend.ticketStates)
                        && ticketObj.state !== newState) {
                        updatedTicket.stateHistoryEntry = {
                            actor: req.session.user._id,
                            from: ticketObj.state,
                            to: newState,
                            ctime: common_backend.getDate()
                        };
                    }

                    if (assigneeObj) {
                        if (projectObj.members.indexOf(assigneeObj._id) === -1) {
                            logger.error(JSON.stringify(common_backend.getError(2018)));
                            return res.status(400).send(common_backend.getError(2018));
                        }

                        if (settings.getModeType() === common_backend.modeTypes.CLASS
                            && teamObj.members.indexOf(assigneeObj._id) === -1) {
                            logger.error(JSON.stringify(common_backend.getError(2019)));
                            return res.status(400).send(common_backend.getError(2019));
                        }

                        updatedTicket.assignee = assigneeObj._id;

                        if (ticketObj.assignee !== assigneeObj._id) {
                            updatedTicket.assigneeHistoryEntry = {
                                actor: req.session.user._id,
                                from: ticketObj.assignee,
                                to: assigneeObj._id,
                                ctime: common_backend.getDate()
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.params.projectId;
    const teamId = req.params.teamId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value
            && projectObj.status !== common_backend.projectStatus.CLOSED.value) {
            logger.error(JSON.stringify(common_backend.getError(2044)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(404).render(common_api.pugPages.pageNotFound);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(404).render(common_api.pugPages.pageNotFound);
            }

            projects.getTicketsByTeamId(projectId, teamId, function (err, ticketsObjList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                return res.status(200).render(common_api.pugPages.projectTeam, {
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.params.projectId;
    const teamId = req.params.teamId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value) {
            logger.error(JSON.stringify(common_backend.getError(2043)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(404).render(common_api.pugPages.pageNotFound);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(404).render(common_api.pugPages.pageNotFound);
            }

            const reporter = `${req.session.user.fname} ${req.session.user.lname}`;
            const assignee = common_backend.noAssignee;

            return res.status(200).render(common_api.pugPages.ticketCreation, {
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.params.projectId;
    const teamId = req.params.teamId;
    const ticketId = req.params.ticketId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value
            && projectObj.status !== common_backend.projectStatus.CLOSED.value) {
            logger.error(JSON.stringify(common_backend.getError(2044)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(404).render(common_api.pugPages.pageNotFound);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(404).render(common_api.pugPages.pageNotFound);
            }

            projects.getTicketsByTeamId(projectId, teamId, function (err, ticketsList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                let ticketObj = null;
                for (let i = 0; i < ticketsList.length; i++) {
                    if (ticketsList[i]._id === ticketId) {
                        ticketObj = ticketsList[i];
                        break;
                    }
                }

                if (!ticketObj) {
                    logger.error(JSON.stringify(common_backend.getError(7004)));
                    return res.status(400).send(common_backend.getError(7004));
                }

                projects.getCommentsByTicketId(projectId, teamId, ticketId, function (err, commentsList) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(404).render(common_api.pugPages.pageNotFound);
                    }

                    const usersIdObj = common_backend.convertListToJason('_id', users.getActiveUsersList());
                    const ticketsIdObj = common_backend.convertListToJason('_id', ticketsList);

                    let assignee = common_backend.noAssignee;
                    let resolvedAssignee = usersIdObj[ticketObj.assignee];
                    if (resolvedAssignee) {
                        assignee = `${resolvedAssignee.fname} ${resolvedAssignee.lname}`
                    }

                    let reporter = common_backend.noReporter;
                    let resolvedReporter = usersIdObj[ticketObj.reporter];
                    if (resolvedReporter) {
                        reporter = `${resolvedReporter.fname} ${resolvedReporter.lname}`
                    }

                    for (let i = 0; i < commentsList.length; i++) {
                        let comment = commentsList[i];
                        let resolvedUserFromComment = usersIdObj[comment.userId];
                        if (resolvedUserFromComment) {
                            commentsList[i]['username'] = `${resolvedUserFromComment.fname} ${resolvedUserFromComment.lname}`;
                            commentsList[i]['picture'] = resolvedUserFromComment.picture;
                        }
                    }

                    return res.status(200).render(common_api.pugPages.ticketModification, {
                        user: req.session.user,
                        projectId: projectId,
                        teamId: teamId,
                        reporter: reporter,
                        assignee: assignee,
                        ticket: ticketObj,
                        comments: commentsList,
                        resolveState: (state) => {
                            return common_backend.getValueInObjectByKey(state, 'value', 'text', common_backend.ticketStates);
                        },
                        resolveUsername: (userId) => {
                            return usersIdObj[userId] ? `${usersIdObj[userId].fname} ${usersIdObj[userId].lname}` : common_backend.noAssignee;
                        },
                        resolveCommentContent: (content) => {
                            let splitContent = content.split(' ');
                            let resolvedContent = '';

                            for (let i = 0; i < splitContent.length; i++) {
                                let phrase = splitContent[i];
                                let firstChar = phrase.charAt(0);
                                switch (firstChar) {
                                    case '@':
                                        let userId = phrase.slice(1);
                                        let user = usersIdObj[userId];
                                        if (user) {
                                            resolvedContent += `<b>@${user.username}</b> `;
                                        } else {
                                            resolvedContent += `@UNKNOWN `;
                                        }
                                        break;
                                    case '#':
                                        let ticketId = phrase.slice(1);
                                        let ticket = ticketsIdObj[ticketId];
                                        if (ticket) {
                                            resolvedContent += `<a href='/project/${ticket.projectId}/team/${ticket.teamId}/ticket/${ticket._id}'>#${ticket.displayId} </a>`;
                                        } else {
                                            resolvedContent += `#UNKNOWN `;
                                        }
                                        break;
                                    default:
                                        resolvedContent += `${phrase} `;
                                        break;
                                }
                            }

                            return resolvedContent.trim();
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const ticketId = req.body.ticketId;

    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            projects.getTicketsByTeamId(projectId, teamId, function (err, ticketsList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                let ticketObj = null;
                for (let i = 0; i < ticketsList.length; i++) {
                    if (ticketsList[i]._id === ticketId) {
                        ticketObj = ticketsList[i];
                    }
                }

                if (!ticketObj) {
                    logger.error(JSON.stringify(common_backend.getError(7004)));
                    return res.status(400).send(common_backend.getError(7004));
                }

                const ticketsDisplayIdObj = common_backend.convertListToJason('displayId', ticketsList);
                const userNamesObj = common_backend.convertListToJason('username', users.getActiveUsersList());

                const content = req.body.content;
                let splitContent = content.split(' ');
                let resolvedContent = '';

                for (let i = 0; i < splitContent.length; i++) {
                    let phrase = splitContent[i];
                    let firstChar = phrase.charAt(0);
                    switch (firstChar) {
                        case '@':
                            let username = phrase.slice(1);
                            let user = userNamesObj[username];
                            if (user) {
                                resolvedContent += `@${user._id} `;
                            } else {
                                resolvedContent += `@UNKNOWN `;
                            }
                            break;
                        case '#':
                            let ticketDisplayId = phrase.slice(1);
                            let ticket = ticketsDisplayIdObj[ticketDisplayId];
                            if (ticket) {
                                resolvedContent += `#${ticket._id} `;
                            } else {
                                resolvedContent += `#UNKNOWN `;
                            }
                            break;
                        default:
                            resolvedContent += `${phrase} `;
                            break;
                    }
                }

                resolvedContent = resolvedContent.trim();

                const newComment = {
                    projectId: projectId,
                    teamId: teamId,
                    ticketId: ticketId,
                    userId: req.session.user._id,
                    content: resolvedContent
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
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
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
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
                        logger.error(JSON.stringify(common_backend.getError(2018)));
                        return res.status(400).send(common_backend.getError(2018));
                    }

                    let updatedComment = { status: common_backend.commentStatus.DELETED.value };
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
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
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
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
                        logger.error(JSON.stringify(common_backend.getError(2018)));
                        return res.status(400).send(common_backend.getError(2018));
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
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.query.projectId;
    const teamId = req.query.teamId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (settings.getModeType() === common_backend.modeTypes.CLASS
                && projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            const usersObj = common_backend.convertListToJason('_id', users.getActiveUsersList());
            let listToResolve = [];
            let usersList = [];

            if (settings.getModeType() === common_backend.modeTypes.CLASS) {
                listToResolve = teamObj.members;
            }

            if (settings.getModeType() === common_backend.modeTypes.COLLABORATORS) {
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

exports.initialize = initialize;

// <common_backend Requests> ------------------------------------------------
exports.isActiveSession = common_api.isActiveSession;
// </common_backend Requests> -----------------------------------------------

// <Get Requests> ------------------------------------------------
exports.handleRootPath = handleRootPath;
exports.handleMePath = handleMePath;
exports.handleProfilePath = handleProfilePath;
exports.handleprofilePicturePath = handleprofilePicturePath;
exports.handleProjectByIdPath = handleProjectByIdPath;
exports.handleProjectTeamPath = handleProjectTeamPath;
exports.handleProjectTeamTicketsAddPath = handleProjectTeamTicketsAddPath;
exports.handleProjectTeamTicketPath = handleProjectTeamTicketPath;
exports.handleProjectTeamMembersListPath = handleProjectTeamMembersListPath;
exports.handleProjectsPath = handleProjectsPath;
exports.handleProjectsListComponentPath = handleProjectsListComponentPath;
exports.handleTicketsListComponentPath = handleTicketsListComponentPath;
exports.handleProjectsAdminsListComponentPath = handleProjectsAdminsListComponentPath;
exports.handleProjectsGroupAssignPath = handleProjectsGroupAssignPath;
exports.handleProjectsAddPath = handleProjectsAddPath;
exports.handleSettingsPath = handleSettingsPath;
exports.handleUsersPath = handleUsersPath;
exports.handleUsersListComponentPath = handleUsersListComponentPath;
exports.handleUsersAddPath = handleUsersAddPath;
exports.handleUsersEditPath = handleUsersEditPath;
exports.handleUsersImportPath = handleUsersImportPath;
// </Get Requests> -----------------------------------------------

// <Post Requests> -----------------------------------------------
exports.handleLoginPath = handleLoginPath;
exports.handleModeSelectPath = handleModeSelectPath;
exports.handleProfileUpdatePath = handleProfileUpdatePath;
exports.handleUpdateProfilePicturePath = handleUpdateProfilePicturePath;
exports.handleProjectActivatePath = handleProjectActivatePath;
exports.handleProjectAdminsUpdatePath = handleProjectAdminsUpdatePath;
exports.handleProjectTeamsUpdatePath = handleProjectTeamsUpdatePath;
exports.handleProjectTeamsUpdateMePath = handleProjectTeamsUpdateMePath;
exports.handleProjectTeamsConfigPath = handleProjectTeamsConfigPath;
exports.handleProjectUpdatePath = handleProjectUpdatePath;
exports.handleTicketsUpdatePath = handleTicketsUpdatePath;
exports.handleTicketsCommentEditPath = handleTicketsCommentEditPath;
exports.handleSettingsResetPath = handleSettingsResetPath;
exports.handleSettingsUpdatePath = handleSettingsUpdatePath;
exports.handleUsersUpdatePath = handleUsersUpdatePath;
// </Post Requests> -----------------------------------------------

// <Put Requests> ------------------------------------------------
exports.handleProjectsCreatePath = handleProjectsCreatePath;
exports.handleTicketsCreatePath = handleTicketsCreatePath;
exports.handleTicketsCommentPath = handleTicketsCommentPath;
exports.handleUsersCreatePath = handleUsersCreatePath;
exports.handleUsersImportFilePath = handleUsersImportFilePath;
exports.handleUsersRequestAccessPath = handleUsersRequestAccessPath;
// </Put Requests> -----------------------------------------------

// <Delete Requests> ------------------------------------------------
exports.handleLogoutPath = handleLogoutPath;
exports.handleProjectDeletePath = handleProjectDeletePath;
exports.handleCommentDeletePath = handleCommentDeletePath;
// </Delete Requests> -----------------------------------------------

// <Notifications Requests> ------------------------------------------------
exports.handleNotificationsConnection = notifications_api.handleNotificationsConnection;
// </Notifications Requests> -----------------------------------------------