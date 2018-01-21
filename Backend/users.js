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
    if (typeof (user.fname) === common.variableTypes.UNDEFINED
        || typeof (user.lname) === common.variableTypes.UNDEFINED
        || typeof (user.username) === common.variableTypes.UNDEFINED
        || typeof (user.password) === common.variableTypes.UNDEFINED
        || typeof (user.type) === common.variableTypes.UNDEFINED) {
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
        userToAdd.canAccessUsers = (user.type !== common.userTypes.STUDENT);
        userToAdd.canAccessSettings = (user.type === common.userTypes.PROFESSOR
            || user.type === common.userTypes.COLLABORATOR);
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
    if (typeof (username) === common.variableTypes.UNDEFINED
        || typeof (password) === common.variableTypes.UNDEFINED) {
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