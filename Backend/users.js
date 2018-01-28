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
        || typeof (user.type) !== common.variableTypes.NUMBER) {
        return callback(common.getError(2000), null);
    }

    bcrypt.hash(user.password, 11, function (err, hash) {
        if (err) {
            return callback(common.getError(1002), null);
        }

        const currentDate = common.getDate();
        var userToAdd = {};

        userToAdd._id = common.getUUID();
        userToAdd.username = user.username.toLowerCase();
        userToAdd.fname = user.fname;
        userToAdd.lname = user.lname;
        userToAdd.ctime = currentDate;
        userToAdd.atime = currentDate;
        userToAdd.mtime = currentDate;
        userToAdd.email = user.email ? user.email : '';
        userToAdd.type = user.type;
        userToAdd.password = hash;
        userToAdd.active = true;
        userToAdd.picture = null;
        userToAdd.theme = common.colorThemes.DEFAULT;
        userToAdd.notificationEnabled = true;
        userToAdd.canAccessUsers = (user.type === common.userTypes.PROFESSOR
            || user.type === common.userTypes.COLLABORATOR_ADMIN);
        userToAdd.canAccessSettings = (user.type === common.userTypes.PROFESSOR
            || user.type === common.userTypes.COLLABORATOR_ADMIN);
        userToAdd.canAccessGrades = (user.type === common.userTypes.PROFESSOR
            || user.type === common.userTypes.TA);

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
    for (var user in cachedUsersList) {
        if (user.username === username) {
            return callback(null, user);
        }
    }

    getUser({ username: username }, callback);
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

        if (!userObj.active) {
            return callback(common.getError(2005), null);
        }

        bcrypt.compare(password, userObj.password, function (err, valid) {
            if (err) {
                return callback(common.getError(1005), null);
            }

            if (!valid) {
                return callback(common.getError(2004), null);
            }

            delete userObj.password;
            return callback(null, userObj);
        });
    });
}

/**
 * update the user information
 *
 * @param {object} newUser user object to add
 * @param {function} callback callback function
 */
const updateUser = function (newUser, callback) {
    var searchQuery = {};
    var updateQuery = {};
    updateQuery.$set = {};

    if (typeof (newUser._id) === common.variableTypes.STRING) {
        searchQuery = { _id: newUser._id };
    }

    if (common.isEmptyObject(searchQuery)) {
        return callback(common.getError(2007), null);
    }

    if (typeof (newUser.fname) === common.variableTypes.STRING) {
        updateQuery.$set.fname = newUser.fname;
    }

    if (typeof (newUser.lname) === common.variableTypes.STRING) {
        updateQuery.$set.lname = newUser.lname;
    }

    if (typeof (newUser.username) === common.variableTypes.STRING) {
        updateQuery.$set.username = newUser.username;
        searchQuery = { $and: [{ _id: newUser._id }, { username: { $ne: newUser.username } }] };
    }

    if (typeof (newUser.email) === common.variableTypes.STRING) {
        updateQuery.$set.email = newUser.email;
    }

    if (typeof (newUser.picture) === common.variableTypes.STRING) {
        updateQuery.$set.picture = newUser.picture;
    }

    if (typeof (newUser.password) === common.variableTypes.STRING) {
        updateQuery.$set.password = newUser.password;
    }

    if (typeof (newUser.notificationEnabled) === common.variableTypes.BOOLEAN) {
        updateQuery.$set.notificationEnabled = newUser.notificationEnabled;
    }

    if (common.isValueInObject(newUser.theme, common.colorThemes)) {
        updateQuery.$set.theme = newUser.theme;
    }

    if (common.isValueInObject(newUser.type, common.userTypes)) {
        updateQuery.$set.type = newUser.type;
        updateQuery.$set.canAccessUsers = (newUser.type === common.userTypes.PROFESSOR
            || newUser.type === common.userTypes.COLLABORATOR_ADMIN);
        updateQuery.$set.canAccessSettings = (newUser.type === common.userTypes.PROFESSOR
            || newUser.type === common.userTypes.COLLABORATOR_ADMIN);
        updateQuery.$set.canAccessGrades = (newUser.type === common.userTypes.PROFESSOR
            || newUser.type === common.userTypes.TA);
    }

    if (common.isEmptyObject(updateQuery.$set)) {
        delete updateQuery.$set;
    }

    if (common.isEmptyObject(updateQuery)) {
        return callback(common.getError(2007), null);
    }

    updateQuery.$set.mtime = common.getDate();

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

    if (typeof (newUser.password) === common.variableTypes.STRING) {
        bcrypt.hash(newUser.password, 11, function (err, hash) {
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

// <exports> -----------------------------------
exports.addUser = addUser;
exports.getLimitedUsersListSorted = getLimitedUsersListSorted;
exports.getUser = getUser;
exports.getUserByUsername = getUserByUsername;
exports.initialize = initialize;
exports.login = login;
exports.updateUser = updateUser;
// </exports> ----------------------------------