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

const common_api = require('./common-api.js');

const cfs = require('../../Backend/customFileSystem.js');
const common_backend = require('../../Backend/common.js');
const logger = require('../../Backend/logger.js');
const settings = require('../../Backend/settings.js');
const users = require('../../Backend/users.js');

/**
 * login path to create a session if the username and password are valid
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const login = function (req, res) {
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
const logout = function (req, res) {
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
const me = function (req, res) {
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
const renderProfilePage = function (req, res) {
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
 * path to fetch the users profile picture
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const getProfilePicture = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const defaultImagePath = `${__dirname}/../../UI/img/account_circle.png`;
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
 * path to update the user profile
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const updateProfile = function (req, res) {
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
 * path to udpate the users profile picture
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const updateProfilePicture = function (req, res) {
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

// <exports> ------------------------------------------------
exports.getProfilePicture = getProfilePicture;
exports.login = login;
exports.logout = logout;
exports.me = me;
exports.renderProfilePage = renderProfilePage;
exports.updateProfile = updateProfile;
exports.updateProfilePicture = updateProfilePicture;
// </exports> -----------------------------------------------