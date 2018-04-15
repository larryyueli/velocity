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

const bcrypt = require('bcryptjs');

const common = require('./common.js');
const db = require('./db.js');

var cachedUsersList;

/**
 * initialize the users cached list
 *
 * @param {function} callback callback function
 */
const initialize = function (callback) {
    return updateCachedList(callback);
}

/**
 * fetch the latest users list from the database
 *
 * @param {function} callback callback function
 */
const updateCachedList = function (callback) {
    getLimitedUsersListSorted({}, { username: 1 }, 0, function (err, list) {
        if (err) {
            return callback(err, null)
        }

        cachedUsersList = list;
        return callback(null, 'ok');
    });
}

/**
 * Create USER, if the USER object is valid
 *
 * @param {object} user user object to add
 * @param {function} callback callback function
 */
const addUser = function (user, callback) {
    if (typeof (user.fname) !== common.variableTypes.STRING
        || typeof (user.lname) !== common.variableTypes.STRING
        || typeof (user.username) !== common.variableTypes.STRING
        || typeof (user.password) !== common.variableTypes.STRING
        || !common.isValueInObjectWithKeys(user.type, 'value', common.userTypes)
        || !common.isValueInObjectWithKeys(user.status, 'value', common.userStatus)
        || common.isEmptyString(user.username)
        || common.isEmptyString(user.lname)
        || common.isEmptyString(user.fname)
        || common.isEmptyString(user.password)) {
        return callback(common.getError(2000), null);
    }

    bcrypt.hash(user.password, 11, function (err, hash) {
        if (err) {
            return callback(common.getError(1002), null);
        }

        const currentDate = common.getDate();
        const currentISODate = common.getISODate();
        let userToAdd = {};

        userToAdd._id = common.getUUID();
        userToAdd.ctime = currentDate;
        userToAdd.mtime = currentDate;
        userToAdd.ictime = currentISODate;
        userToAdd.imtime = currentISODate;
        userToAdd.username = user.username.toLowerCase();
        userToAdd.fname = user.fname;
        userToAdd.lname = user.lname;
        userToAdd.email = user.email ? user.email : '';
        userToAdd.type = user.type;
        userToAdd.password = hash;
        userToAdd.status = user.status;
        userToAdd.picture = null;
        userToAdd.theme = common.colorThemes.DEFAULT;
        userToAdd.notificationEnabled = true;
        userToAdd.language = common.languages.English.value;
        userToAdd.canAccessUsers = (user.type === common.userTypes.PROFESSOR.value
            || user.type === common.userTypes.COLLABORATOR_ADMIN.value);
        userToAdd.canAccessSettings = (user.type === common.userTypes.PROFESSOR.value
            || user.type === common.userTypes.COLLABORATOR_ADMIN.value);
        userToAdd.canAccessGrades = (user.type === common.userTypes.PROFESSOR.value
            || user.type === common.userTypes.TA.value);
        userToAdd.canCreateProjects = (user.type === common.userTypes.PROFESSOR.value
            || user.type === common.userTypes.COLLABORATOR_ADMIN.value);

        db.addUser(userToAdd, function (err, obj) {
            if (err) {
                return callback(err, null);
            }

            updateCachedList(function (err, result) {
                if (err) {
                    return callback(err, null);
                }

                return callback(null, obj)
            });
        });
    });
}

/**
 * find a single user by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getUser = function (searchQuery, callback) {
    db.getUser(searchQuery, callback);
}

/**
 * get the full list of users from the users collection
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit
 * @param {function} callback callback function
 */
const getLimitedUsersListSorted = function (searchQuery, sortQuery, lim, callback) {
    db.getLimitedUsersListSorted(searchQuery, sortQuery, lim, callback);
}

/**
 * find a single user by its username
 *
 * @param {string} username username
 * @param {function} callback callback function
 */
const getUserByUsername = function (username, callback) {
    for (let i = 0; i < cachedUsersList.length; i++) {
        if (cachedUsersList[i].username === username) {
            return callback(null, cachedUsersList[i]);
        }
    }

    getUser({ username: username }, callback);
}

/**
 * find a single user by its id
 *
 * @param {string} id id
 * @param {function} callback callback function
 */
const getUserById = function (id, callback) {
    for (let i = 0; i < cachedUsersList.length; i++) {
        if (cachedUsersList[i]._id === id) {
            return callback(null, cachedUsersList[i]);
        }
    }

    getUser({ _id: id }, callback);
}

/**
 * verify if the user can login
 *
 * @param {string} username username
 * @param {string} password password
 * @param {function} callback callback function
 */
const login = function (username, password, callback) {
    if (typeof (username) !== common.variableTypes.STRING
        || typeof (password) !== common.variableTypes.STRING) {
        return callback(common.getError(2002), null);
    }

    getUserByUsername(username, function (err, userObj) {
        if (err) {
            return callback(err, null);
        }

        if (userObj.status !== common.userStatus.ACTIVE.value) {
            return callback(common.getError(2005), null);
        }

        bcrypt.compare(password, userObj.password, function (err, valid) {
            if (err) {
                return callback(common.getError(1005), null);
            }

            if (!valid) {
                return callback(common.getError(2004), null);
            }

            return callback(null, userObj);
        });
    });
}

/**
 * update the user information
 *
 * @param {object} updateParams modify parameters
 * @param {function} callback callback function
 */
const updateUser = function (updateParams, callback) {
    let searchQuery = {};
    let updateQuery = {};
    updateQuery.$set = {};

    if (typeof (updateParams._id) === common.variableTypes.STRING) {
        searchQuery = { _id: updateParams._id };
    }

    if (common.isEmptyObject(searchQuery)) {
        return callback(common.getError(2007), null);
    }

    if (typeof (updateParams.fname) === common.variableTypes.STRING
        && !common.isEmptyString(updateParams.fname)) {
        updateQuery.$set.fname = updateParams.fname;
    }

    if (typeof (updateParams.lname) === common.variableTypes.STRING
        && !common.isEmptyString(updateParams.lname)) {
        updateQuery.$set.lname = updateParams.lname;
    }

    if (typeof (updateParams.username) === common.variableTypes.STRING
        && !common.isEmptyString(updateParams.username)) {
        updateQuery.$set.username = updateParams.username;
        searchQuery = { $and: [{ _id: updateParams._id }, { username: { $ne: updateParams.username } }] };
    }

    if (typeof (updateParams.email) === common.variableTypes.STRING) {
        updateQuery.$set.email = updateParams.email;
    }

    if (typeof (updateParams.picture) === common.variableTypes.STRING) {
        updateQuery.$set.picture = updateParams.picture;
    }

    if (typeof (updateParams.password) === common.variableTypes.STRING
        && !common.isEmptyString(updateParams.password)) {
        updateQuery.$set.password = updateParams.password;
    }

    if (common.isValueInObjectWithKeys(updateParams.language, 'value', common.languages)) {
        updateQuery.$set.language = updateParams.language;
    }

    if (common.isValueInObjectWithKeys(updateParams.status, 'value', common.userStatus)) {
        updateQuery.$set.status = updateParams.status;
    }

    if (typeof (updateParams.notificationEnabled) === common.variableTypes.BOOLEAN) {
        updateQuery.$set.notificationEnabled = updateParams.notificationEnabled;
    }

    if (common.isValueInObject(updateParams.theme, common.colorThemes)) {
        updateQuery.$set.theme = updateParams.theme;
    }

    if (common.isValueInObjectWithKeys(updateParams.type, 'value', common.userTypes)) {
        updateQuery.$set.type = updateParams.type;
        updateQuery.$set.canAccessUsers = (updateParams.type === common.userTypes.PROFESSOR.value
            || updateParams.type === common.userTypes.COLLABORATOR_ADMIN.value);
        updateQuery.$set.canAccessSettings = (updateParams.type === common.userTypes.PROFESSOR.value
            || updateParams.type === common.userTypes.COLLABORATOR_ADMIN.value);
        updateQuery.$set.canAccessGrades = (updateParams.type === common.userTypes.PROFESSOR.value
            || updateParams.type === common.userTypes.TA.value);
        updateQuery.$set.canCreateProjects = (updateParams.type === common.userTypes.PROFESSOR.value
            || updateParams.type === common.userTypes.COLLABORATOR_ADMIN.value);
    }

    if (common.isEmptyObject(updateQuery.$set)) {
        delete updateQuery.$set;
    }

    if (common.isEmptyObject(updateQuery)) {
        return callback(common.getError(2007), null);
    }

    updateQuery.$set.mtime = common.getDate();
    updateQuery.$set.imtime = common.getISODate();

    const updateFun = function () {
        db.updateUser(searchQuery, updateQuery, function (err, result) {
            if (err) {
                return callback(err, null);
            }

            updateCachedList(function (err, res) {
                if (err) {
                    return callback(err, null);
                }

                return callback(null, result);
            });
        });
    }

    if (typeof (updateParams.password) === common.variableTypes.STRING) {
        bcrypt.hash(updateParams.password, 11, function (err, hash) {
            if (err) {
                return callback(common.getError(1002), null);
            }

            updateQuery.$set.password = hash;
            return updateFun();
        });
    } else {
        return updateFun();
    }
}

/**
 * get the full users list (cached)
 *
 * @return {array} full users list
 */
const getFullUsersList = function () {
    return cachedUsersList;
}

/**
 * get the active users list (cached)
 *
 * @return {array} full users list
 */
const getActiveUsersList = function () {
    let activeUserList = [];
    for (let i = 0; i < cachedUsersList.length; i++) {
        if (cachedUsersList[i].status === common.userStatus.ACTIVE.value) {
            activeUserList.push(cachedUsersList[i]);
        }
    }
    return activeUserList;
}

// <exports> -----------------------------------
exports.addUser = addUser;
exports.getActiveUsersList = getActiveUsersList;
exports.getFullUsersList = getFullUsersList;
exports.getUser = getUser;
exports.getUserById = getUserById;
exports.getUserByUsername = getUserByUsername;
exports.initialize = initialize;
exports.login = login;
exports.updateUser = updateUser;
// </exports> ----------------------------------