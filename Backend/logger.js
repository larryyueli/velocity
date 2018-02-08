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

const fs = require('fs');

const common = require('./common.js');
const config = require('./config.js');

var dateStamp;

/**
 * log an info message
 *
 * @param {string} text info text to log
 */
const info = function (text) {
    init();
    console.log(`[${common.getDate()}] info: ${text}`);
}

/**
 * log a warning message
 *
 * @param {string} text warning text to log
 */
const warning = function (text) {
    init();
    console.warn(`[${common.getDate()}] warning: ${text}`);
}

/**
 * log an error message
 *
 * @param {string} text error text to log
 */
const error = function (text) {
    init();
    console.error(`[${common.getDate()}] error: ${text}`);
}

/**
 * log a message
 *
 * @param {string} text text to log
 */
const log = function (text) {
    init();
    console.error(`[${common.getDate()}] ${text}`);
}

/**
 * initiate the logging with file
 */
const init = function () {
    const currentDate = common.getDateFormatted('YYYY-MM-DD');

    if (!config.debugMode && dateStamp !== currentDate) {
        dateStamp = currentDate;
        const logger = fs.createWriteStream(`${__dirname}/../Logs/${dateStamp}.log`, { 'flags': 'a' });
        process.stdout.write = process.stderr.write = logger.write.bind(logger);

        process.on('uncaughtException', function (err) {
            console.error((err && err.stack) ? err.stack : err);
        });
    }
}

// <exports> -----------------------------------
exports.error = error;
exports.info = info;
exports.log = log;
exports.warning = warning;
// </exports> ----------------------------------