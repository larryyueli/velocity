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
        userToAdd.canAccessUsers = (user.type !== common.userTypes.STUDENT);
        userToAdd.canAccessSettings = (user.type === common.userTypes.PROFESSOR
            || user.type === common.userTypes.COLLABORATOR_ADMIN);
        userToAdd.canAccessGrades = (user.type === common.userTypes.PROFESSOR
            || user.type === common.userTypes.TA);

        db.addUser(userToAdd, callback);
    });
}
exports.addUser = addUser;

/**
 * find a single user by the search parameters
 * 
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getUser = function (searchQuery, callback) {
    db.getUser(searchQuery, callback);
}
exports.getUser = getUser;

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

    getUser({ username: username }, function (err, userObj) {
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
exports.login = login;

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

    if (common.isValueInObject(newUser.theme, common.colorThemes)) {
        updateQuery.$set.theme = newUser.theme;
    }

    if (typeof (newUser.notificationEnabled) === common.variableTypes.BOOLEAN) {
        updateQuery.$set.notificationEnabled = newUser.notificationEnabled;
    }

    if (common.isValueInObject(newUser.type, common.userTypes)) {
        updateQuery.$set.type = newUser.type;
    }

    if (common.isEmptyObject(updateQuery.$set)) {
        delete updateQuery.$set;
    }

    if (common.isEmptyObject(updateQuery)) {
        return callback(common.getError(2007), null);
    }

    updateQuery.$set.mtime = common.getDate();

    db.updateUser(searchQuery, updateQuery, callback);
}
exports.updateUser = updateUser;