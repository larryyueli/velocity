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

const uuidv1 = require('uuid/v1');
const date = require('moment');

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
    1001: 'failed to connet to the db',

    //2000 users
});
exports.errors = errors;

const defaultError = 'unknown error';
exports.defaultError = defaultError;
// </Global Errors> ------------------------------------------

// <Global Constants> ------------------------------------------
// </Global Constants> ------------------------------------------

// <Global Function> --------------------------------------------

/**
 * return an object of error code and its message
 *
 * @param {number} errorCode the error number
 * @return {object} object of the error and its message
 */
var getError = function(errorCode) {
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
var getDate = function () {
    return getDateFormatted('YYYY-MM-DD hh:mm:ss A');
}
exports.getDate = getDate;

/**
* return the current date formatted
*
* @param {string} format date format
* @return {string} date formatted
*/
var getDateFormatted = function (format) {
    return date().format(format);
}
exports.getDateFormatted = getDateFormatted;

// </Global Function> -----------------------------------------------