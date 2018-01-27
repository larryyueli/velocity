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
exports.hostName = hostName;
const httpPort = 8000;
exports.httpPort = httpPort;
const httpsPort = 8080;
exports.httpsPort = httpsPort;
const urlencoded = true;
exports.urlencoded = urlencoded;
var debugMode = false;
exports.debugMode = debugMode;
const ssl_options = {
    key: fs.readFileSync(`${__dirname}/../Keys/private.key`),
    cert: fs.readFileSync(`${__dirname}/../Keys/cert.crt`)
};
exports.ssl_options = ssl_options;

// database related configuration
const default_db_host = process.env.DB_HOST || 'localhost';
exports.default_db_host = default_db_host;
const default_db_port = process.env.DB_PORT || 27017;
exports.default_db_port = default_db_port;
var default_db_name = process.env.DB_NAME || 'velocity_db_2efc4df0-02a0-11e8-9f6d-e15e5bb48eb6';
exports.default_db_name = default_db_name;

// session related configuration
const maxSessionAge = 60 * 60 * 1000;
exports.maxSessionAge = maxSessionAge;
const sessionSecret = 'superSecretSecret';
exports.sessionSecret = sessionSecret;
const sessionResave = false;
exports.sessionResave = sessionResave;
const saveUninitializedSession = false;
exports.saveUninitializedSession = saveUninitializedSession;
const rollingSession = true;
exports.rollingSession = rollingSession;
const secureSessionCookie = false;
exports.secureSessionCookie = secureSessionCookie;
const languageOptions = ['en'];
exports.languageOptions = languageOptions;
const defaultLanguage = 'en';
exports.defaultLanguage = defaultLanguage;