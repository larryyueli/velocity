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
 * 5000 -> projects
 * 6000 -> teams
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
    1008: 'failed to get the users list, database issue',
    1009: 'failed to parse csv file',

    //2000 users
    2000: 'missing requirement',
    2001: 'user already exists',
    2002: 'missing username or password for login',
    2003: 'user not found',
    2004: 'wrong password',
    2005: 'user account is not active',
    2006: 'user\'s session is not valid or timed out',
    2007: 'failed to update user, missing information',
    2008: 'invalid profile picture extension',
    2009: 'invalid users import file extension',

    //3000 settings
    3000: 'failed to get settings object, database issue',
    3001: 'settings object does not exist',
    3002: 'could not delete the settings object, database issue',
    3003: 'could not add the settings object, database issue',
    3004: 'could not update the settings object, database issue',
    3005: 'could not update the selected mode',
    3006: 'invalid mode',
    3007: 'website is not active',
    3008: 'failed to update the settings, missing parameters',
    3009: 'failed to update the website active status, invalid status type',

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
    4009: 'failed to remove the custom file system root from the physical file system',
    4010: 'permission denied',

    //5000 projects
    5000: 'missing requirement',
    5001: 'failed to add a project, database issue',
    5002: 'failed to get projects list, database issue',
    5003: 'failed to get a project, database issue',
    5004: 'project not found',
    5005: 'failed to update projects, database issue',
    5006: 'failed to update project, missing information',

    //6000 teams
    6000: 'missing requirement',
    6001: 'failed to add a team, database issue',
    6002: 'failed to get teams list, database issue',
    6003: 'failed to get a team, database issue',
    6004: 'team not found',
    6005: 'failed to update team, database issue',
    6006: 'failed to create a team, missing information',
    6007: 'failed to update a team, missing information',
});
exports.errors = errors;

const defaultError = 'unknown error';
exports.defaultError = defaultError;
// </Global Errors> ------------------------------------------

// <Global Constants> ------------------------------------------
// all user types
const userTypes = Object.freeze({
    MODE_SELECTOR: { value: 0, text: 'modeSelector' },
    COLLABORATOR_ADMIN: { value: 1, text: 'collaboratorAdmin' },
    COLLABORATOR: { value: 2, text: 'collaborator' },
    PROFESSOR: { value: 3, text: 'professor' },
    TA: { value: 4, text: 'ta' },
    STUDENT: { value: 5, text: 'student' }
});
exports.userTypes = userTypes;

// user status
const userStatus = Object.freeze({
    DISABLED: { value: 0, text: 'disabled' },
    PENDING: { value: 1, text: 'pending' },
    ACTIVE: { value: 2, text: 'active' }
});
exports.userStatus = userStatus;

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
    DEFAULT: 'theme-default',
    AHMED: 'theme-ahmed'
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
    SYSTEM: 0,
    OWNER: 1,
    PUBLIC: 2
});
exports.cfsPermission = cfsPermission;

// common system item types
const cfsTypes = Object.freeze({
    DIRECTORY: 0,
    FILE: 1
});
exports.cfsTypes = cfsTypes;

// common system directory names
const cfsMainDirectories = Object.freeze({
    FILESYSTEM: 'FileSystem',
    USERS: 'Users'
});
exports.cfsMainDirectories = cfsMainDirectories;

// common languages
const languages = Object.freeze({
    English: { value: 'en', text: 'english' }
});
exports.languages = languages;

// common board types
const boardTypes = Object.freeze({
    KANBAN: { value: 0, text: 'kanban' },
    SCRUM: { value: 1, text: 'scrum' }
});
exports.boardTypes = boardTypes;

// common project status
const projectStatus = Object.freeze({
    CLOSED: { value: 0, text: 'closed' },
    DRAFT: { value: 1, text: 'draft' },
    ACTIVE: { value: 2, text: 'active' },
    DELETED: { value: 3, text: 'deleted' }
});
exports.projectStatus = projectStatus;

// common team status
const teamStatus = Object.freeze({
    DISABLED: { value: 0, text: 'disabled' },
    ACTIVE: { value: 1, text: 'active' }
});
exports.teamStatus = teamStatus;

// common team selectino types
const teamSelectionTypes = Object.freeze({
    INDIVIDUAL: { value: 0, text: 'individual' },
    ADMIN: { value: 1, text: 'admin' },
    USER: { value: 2, text: 'user' },
    RANDOM: { value: 3, text: 'random' }
});
exports.teamSelectionTypes = teamSelectionTypes;


// default team prefix
const defaultTeamPrefix = 'group-';
exports.defaultTeamPrefix = defaultTeamPrefix;

// default team size
const defaultTeamSize = 1;
exports.defaultTeamSize = defaultTeamSize;
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
    for (let key in obj) {
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
    for (let key in obj) {
        if (obj[key] === value) {
            return true;
        }
    }
    return false;
}
exports.isValueInObject = isValueInObject;

/**
 * check if value in the object
 *
 * @param {any} value value to check
 * @param {string} key key of inner object
 * @param {object} obj object to check
 * @return {boolean}
 */
const isValueInObjectWithKeys = function (value, key, obj) {
    for (let i in obj) {
        if (obj[i][key] === value) {
            return true;
        }
    }
    return false;
}
exports.isValueInObjectWithKeys = isValueInObjectWithKeys;

/**
 * get the object value using its key
 *
 * @param {string} key key of inner object
 * @param {string} keyField name key field of inner object
 * @param {string} valueField name value field of inner object
 * @param {object} obj object to check
 * @return {*}
 */
const getValueInObjectByKey = function (key, keyField, valueField, obj) {
    for (let i in obj) {
        if (obj[i][keyField] === key) {
            return obj[i][valueField];
        }
    }
    return variableTypes.UNDEFINED;
}
exports.getValueInObjectByKey = getValueInObjectByKey;

/**
 * return boolean from boolean string if possible, otherwise undefined
 *
 * @param {string} value value to convert
 * @return {boolean}
 */
const convertStringToBoolean = function (value) {
    if (typeof (value) === variableTypes.BOOLEAN) {
        return value;
    }

    if (typeof (value) === variableTypes.STRING && value.toLowerCase() === 'false') {
        return false;
    }

    if (typeof (value) === variableTypes.STRING && value.toLowerCase() === 'true') {
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

/**
 * return an array of elements in the main array that are not in the secondary array
 *
 * @param {array} mainArray main array
 * @param {array} secondaryArray secondary array
 * @return {array} diff array
 */
const getArrayDiff = function (mainArray, secondaryArray) {
    return mainArray.diff(secondaryArray);
}
exports.getArrayDiff = getArrayDiff;

/**
 * implement the diff operation on arrays
 *
 */
Array.prototype.diff = function (a) {
    return this.filter(function (i) {
        return a.indexOf(i) < 0;
    });
};

/**
 * return a jason object from a list of json objects
 *
 * @param {string} key key inside each of the object entries
 * @param {array} jasonList secondary array
 * @return {object} result object
 */
const convertListToJason = function (key, jasonList) {
    let jasonResult = {};
    for (let i = 0; i < jasonList.length; i++) {
        let item = jasonList[i];
        jasonResult[item[key]] = item;
    }
    return jasonResult;
}
exports.convertListToJason = convertListToJason;

/**
 * return a list from a list of json objects
 *
 * @param {string} key key inside each of the object entries
 * @param {array} jasonList secondary array
 * @return {object} result object
 */
const convertJsonListToList = function (key, jasonList) {
    let listResult = [];
    for (let i = 0; i < jasonList.length; i++) {
        listResult.push(jasonList[i][key]);
    }
    return listResult;
}
exports.convertJsonListToList = convertJsonListToList;

/**
 * return a list of the unique join of two lists
 *
 * @param {array} list1 first list
 * @param {array} list2 second list
 * @return {list} result object
 */
const joinSets = function (list1, list2) {
    let result = [];
    for (let i = 0; i < list1.length; i++) {
        if (result.indexOf(list1[i]) === -1) {
            result.push(list1[i]);
        }
    }
    for (let i = 0; i < list2.length; i++) {
        if (result.indexOf(list2[i]) === -1) {
            result.push(list2[i]);
        }
    }
    return result;
}
exports.joinSets = joinSets;
// </Global Function> -----------------------------------------------
