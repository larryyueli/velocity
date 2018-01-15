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