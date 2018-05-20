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

const csv2json = require('csvtojson');
const json2csv = require('json2csv').Parser;
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
            return res.status(400).send(err);
        }

        if (!settings.isWebsiteActive()
            && userObject.type !== common_backend.userTypes.PROFESSOR.value
            && userObject.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value) {
            logger.error(JSON.stringify(common_backend.getError(3007)));
            return res.status(400).send(common_backend.getError(3007));
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
        notifications: []
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

        const validImageExtensions = common_backend.fileExtensions.IMAGES;
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
        fileId: fileName,
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
 * root path to get the users creation form
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const renderUsersAddPage = function (req, res) {
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
const createUser = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2025)));
        return res.status(400).send(common_backend.getError(2025));
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
const requestAccess = function (req, res) {
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
const renderUsersEditPage = function (req, res) {
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
const editUser = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2027)));
        return res.status(400).send(common_backend.getError(2027));
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
const renderUsersImportPage = function (req, res) {
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
 * root path to get the users export form
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const renderUsersExportPage = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2055)));
        return res.status(404).render(common_api.pugPages.pageNotFound);
    }

    return res.status(200).render(common_api.pugPages.usersExport, {
        user: req.session.user,
    });
}

/**
 * path to import users from a file
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const importUsersFile = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2029)));
        return res.status(400).send(common_backend.getError(2029));
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
        fileId: fileName,
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

            if (importedList.length === 0) {
                return res.status(200).render(common_api.pugPages.usersImportComplete, {
                    added: added,
                    failed: failed,
                    exist: exist,
                    total: total
                });
            } else {
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

                        if (userObj) {
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
                        } else {
                            processedDirs++;

                            if (total === importedList.length && processedDirs === importedList.length) {
                                return res.status(200).render(common_api.pugPages.usersImportComplete, {
                                    added: added,
                                    failed: failed,
                                    exist: exist,
                                    total: total
                                });
                            }
                        }
                    });
                }
            }
        });
    });
}

/**
 * path to export users from a file
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const exportUsersFile = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2055)));
        return res.status(400).send(common_backend.getError(2055));
    }

    const fields = [{
        label: 'Username',
        value: 'username'
    }, {
        label: 'First Name',
        value: 'fname'
    }, {
        label: 'Last Name',
        value: 'lname'
    }, {
        label: 'Email',
        value: 'email'
    }];
    const usersList = users.getFullUsersList();
    const json2csvParser = new json2csv({ fields });
    const csvData = json2csvParser.parse(usersList);
    const fileName = common_backend.getUUID();
    const fileObject = {
        fileId: fileName,
        fileName: fileName,
        filePath: `${common_backend.cfsTree.USERS}/${req.session.user._id}`,
        fileExtension: 'csv',
        fileData: csvData,
        filePermissions: common_backend.cfsPermission.OWNER,
        fileCreator: req.session.user._id
    };

    cfs.writeFile(fileObject, function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        return res.status(200).render(common_api.pugPages.usersExportComplete, {
            fileName: fileName
        });
    });
}

/**
 * path to download the export users file
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const exportUsersFileDownload = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2055)));
        return res.status(400).send(common_backend.getError(2055));
    }

    const fileId = req.query.fileId;
    cfs.fileExists(fileId, function (err, fileObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (fileObj.permission !== common_backend.cfsPermission.OWNER
            || fileObj.creator !== req.session.user._id) {
            logger.error(JSON.stringify(common_backend.getError(2056)));
            return res.status(400).send(common_backend.getError(2056));
        }

        return res.download(fileObj.path, 'Exported Users List.csv', function (err) {
            if (err) {
                logger.error(JSON.stringify(err));
            }
        });
    });
}

/**
 * path to get the users page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const renderAdminsUsersPage = function (req, res) {
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
const adminUsersListComponent = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2023)));
        return res.status(400).send(common_backend.getError(2023));
    }

    const fullUsersList = users.getFullUsersList();

    return res.status(200).send({
        usersList: fullUsersList,
        usersEntryHTML: common_api.pugComponents.usersEntryComponent()
    });
}

// <exports> ------------------------------------------------
exports.adminUsersListComponent = adminUsersListComponent;
exports.createUser = createUser;
exports.editUser = editUser;
exports.exportUsersFile = exportUsersFile;
exports.exportUsersFileDownload = exportUsersFileDownload;
exports.getProfilePicture = getProfilePicture;
exports.importUsersFile = importUsersFile;
exports.login = login;
exports.logout = logout;
exports.me = me;
exports.renderAdminsUsersPage = renderAdminsUsersPage;
exports.renderProfilePage = renderProfilePage;
exports.renderUsersAddPage = renderUsersAddPage;
exports.renderUsersEditPage = renderUsersEditPage;
exports.renderUsersExportPage = renderUsersExportPage;
exports.renderUsersImportPage = renderUsersImportPage;
exports.requestAccess = requestAccess;
exports.updateProfile = updateProfile;
exports.updateProfilePicture = updateProfilePicture;
// </exports> -----------------------------------------------