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
 * 3000 -> settings
 * 4000 -> custom file system
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
    1007: 'failed to update user object, database issue',

    //2000 users
    2000: 'missing requirement',
    2001: 'user already exists',
    2002: 'missing username or password for login',
    2003: 'user not found',
    2004: 'wrong password',
    2005: 'user account is not active',
    2006: 'user\'s session is not valid or timed out',
    2007: 'failed to update user, missing information',

    //3000 settings
    3000: 'failed to get settings object, database issue',
    3001: 'settings object does not exist',
    3002: 'could not delete the settings object, database issue',
    3003: 'could not add the settings object, database issue',
    3004: 'could not update the settings object, database issue',
    3005: 'could not update the selected mode',
    3006: 'invalid mode',

    //4000 custom file system
    4000: 'failed to add entry to the virtual file system, database issue',
    4001: 'failed to add entry to the physical file system',
    4002: 'failed to remove entry from the virtual file system, database issue',
    4003: 'failed to remove entry from the physical file system',
    4004: 'failed to forcefully remove entry from the physical file system',
    4005: 'failed to find an entry in the virtual file system, database issue',
    4006: 'entry does not exist in the virtual file system',
    4007: 'entry does not exist in the physical file system',
    4008: 'failed to write file into the physical file system',
    4009: 'failed to remove the custom file system root from the physical file system'
});
exports.errors = errors;

const defaultError = 'unknown error';
exports.defaultError = defaultError;
// </Global Errors> ------------------------------------------

// <Global Constants> ------------------------------------------
// all user types
const userTypes = Object.freeze({
    MODE_SELECTOR: 0,
    COLLABORATOR: 1,
    PROFESSOR: 2,
    TA: 3,
    STUDENT: 4
});
exports.userTypes = userTypes;

// all variable types
const variableTypes = Object.freeze({
    ARRAY: 'array',
    BOOLEAN: 'boolean',
    NUMBER: 'number',
    OBJECT: 'object',
    STRING: 'string',
    UNDEFINED: 'undefined'
});
exports.variableTypes = variableTypes;

// all color themes
const colorThemes = Object.freeze({
    DEFAULT: 'default'
});
exports.colorThemes = colorThemes;

// all project types
const modeTypes = Object.freeze({
    UNKNOWN: -1,
    CLASS: 0,
    COLLABORATORS: 1
});
exports.modeTypes = modeTypes;

// common path shared across the backend
const cfsTree = Object.freeze({
    ROOT: `${__dirname}/..`,
    HOME: `${__dirname}/../FileSystem`,
    USERS: `${__dirname}/../FileSystem/Users`
});
exports.cfsTree = cfsTree;

// common permissions on files
const cfsPermission = Object.freeze({
    PUBLIC: 0,
    OWNER: 1,
    SYSTEM: 2
});
exports.cfsPermission = cfsPermission;

// common system item types
const cfsTypes = Object.freeze({
    FILE: 0,
    DIRECTORY: 1
});
exports.cfsTypes = cfsTypes;
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
 * check if value in the object
 *
 * @param {any} value value to check
 * @param {object} obj object to check
 * @return {boolean}
 */
const isValueInObject = function (value, obj) {
    for (var key in obj) {
        if (obj[key] === value) {
            return true;
        }
    }
    return false;
}
exports.isValueInObject = isValueInObject;

/**
 * return boolean from boolean string if possible, otherwise undefined
 *
 * @param {string} value value to convert
 * @return {boolean}
 */
const convertStringToBoolean = function (value) {
    if (value.toLowerCase() === 'false') {
        return false;
    }

    if (value.toLowerCase() === 'true') {
        return true;
    }

    return variableTypes.UNDEFINED;
}
exports.convertStringToBoolean = convertStringToBoolean;

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