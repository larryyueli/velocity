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

// server related configuration
const hostName = 'localhost';
const httpPort = 8000;
const httpsPort = 8080;
const notificationsWSPort = 8001;
const urlencoded = true;
var debugMode = false;
const ssl_options = {
    key: fs.readFileSync(`${__dirname}/../Keys/private.key`),
    cert: fs.readFileSync(`${__dirname}/../Keys/cert.crt`)
};

exports.hostName = hostName;
exports.httpPort = httpPort;
exports.httpsPort = httpsPort;
exports.notificationsWSPort = notificationsWSPort;
exports.urlencoded = urlencoded;
exports.debugMode = debugMode;
exports.ssl_options = ssl_options;

// database related configuration
const default_db_host = process.env.DB_HOST || 'localhost';
const default_db_port = process.env.DB_PORT || 27017;
var default_db_name = process.env.DB_NAME || 'velocity_db_972154c0-0c6e-11e8-b39f-91511441d1cd';

exports.default_db_host = default_db_host;
exports.default_db_port = default_db_port;
exports.default_db_name = default_db_name;

// session related configuration
const maxSessionAge = 60 * 60 * 1000;
const sessionSecret = 'superSecretSecret';
const sessionResave = false;
const saveUninitializedSession = false;
const rollingSession = true;
const secureSessionCookie = false;
const languageOptions = ['en'];
const defaultLanguage = 'en';

exports.maxSessionAge = maxSessionAge;
exports.sessionSecret = sessionSecret;
exports.sessionResave = sessionResave;
exports.saveUninitializedSession = saveUninitializedSession;
exports.rollingSession = rollingSession;
exports.secureSessionCookie = secureSessionCookie;
exports.languageOptions = languageOptions;
exports.defaultLanguage = defaultLanguage;

// files upload settings
const filesSizeLimit = 50 * 1024 * 1024;
const safeFileNames = true;
const preserveFileExtension = true;
const abortOnExceedLimit = true;

exports.filesSizeLimit = filesSizeLimit;
exports.safeFileNames = safeFileNames;
exports.preserveFileExtension = preserveFileExtension;
exports.abortOnExceedLimit = abortOnExceedLimit;
