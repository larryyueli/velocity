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

const date = require('moment');
const uuidv1 = require('uuid/v1');

// <Global Errors> ------------------------------------------
/**
 * These errors are only for BE and API use
 * Error codes and their corresponding message. Error codes are under different
 * categories:
 * 1000 -> system
 * 2000 -> user
 */

const errors = Object.freeze({
    //1000 system
    1000: 'invalid request',
    1001: 'failed to connect to the db',
    1002: 'failed to hash the password',
    1003: 'failed to get user, database issue',
    1004: 'failed to add user, database issue',
    1005: 'failed to verify password, hashing issue',
    1006: 'failed create user session',
    1007: 'failed to get settings object, database issue',
    1008: 'settings object does not exist',
    1009: 'could not delete the settings object, database issue',
    1010: 'could not add the settings object, database issue',
    1011: 'could not update the settings object, database issue',
    1012: 'could not the selected mode',

    //2000 users
    2000: 'missing requirement',
    2001: 'user already exists',
    2002: 'missing username or password for login',
    2003: 'user not found',
    2004: 'wrong password',
    2005: 'user account is not active',
    2006: 'user\'s session is not valid or timed out',
});
exports.errors = errors;

const defaultError = 'unknown error';
exports.defaultError = defaultError;
// </Global Errors> ------------------------------------------

// <Global Constants> ------------------------------------------
// all user types
const userTypes = Object.freeze({
    MODE_SELECTOR:      0,
    COLLABORATOR:       1,
    PROFESSOR:          2,
    TA:                 3,
    STUDENT:            4
});
exports.userTypes = userTypes;

// all variable types
const variableTypes = Object.freeze({
    UNDEFINED:      'undefined'
});
exports.variableTypes = variableTypes;

// all color themes
const colorThemes = Object.freeze({
    DEFAULT:        'default'
});
exports.colorThemes = colorThemes;

// all project types
const modeType = Object.freeze({
    UNKNOWN:        -1,
    CLASS:          0,
    COLLABORATOR:   1
});
exports.modeType = modeType;
// </Global Constants> ------------------------------------------

// <Global Function> --------------------------------------------
/**
 * get a unique string
 *
 * @return {string}
 */
const getUUID = function () {
    return uuidv1();
}
exports.getUUID = getUUID;

/**
 * check if json obejct is empty
 *
 * @param {object} obj object to check
 * @return {boolean}
 */
const isEmptyObject = function (obj) {
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        }
    }
    return true;
}
exports.isEmptyObject = isEmptyObject;

/**
 * return an object of error code and its message
 *
 * @param {number} errorCode the error number
 * @return {object} object of the error and its message
 */
const getError = function (errorCode) {
    return {
        code: errorCode,
        message: errors[errorCode] || defaultError
    }
}
exports.getError = getError;

/**
 * return the current date
 *
 * @return {string} date formatted as YYYY-MM-DD hh:mm:ss A
 */
const getDate = function () {
    return getDateFormatted('YYYY-MM-DD hh:mm:ss A');
}
exports.getDate = getDate;

/**
 * return the current date formatted
 *
 * @param {string} format date format
 * @return {string} date formatted
 */
const getDateFormatted = function (format) {
    return date().format(format);
}
exports.getDateFormatted = getDateFormatted;
// </Global Function> -----------------------------------------------