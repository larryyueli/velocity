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

const fs = require('fs');

// server related configuration
var hostName = 'localhost';
var httpPort = 8000;
var httpsPort = 8080;
var notificationsWSPort = 8001;
const urlencoded = true;
var password = 'superSecretSecret';
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
exports.password = password;

// database related configuration
var db_host = 'localhost';
var db_port = 27017;
var db_name = 'velocity_db_UNKNOWN';
var db_admin_name = 'admin';
var db_admin_password = 'password';

exports.db_host = db_host;
exports.db_port = db_port;
exports.db_name = db_name;
exports.db_admin_name = db_admin_name;
exports.db_admin_password = db_admin_password;

// session related configuration
var maxSessionAge = 60 * 60; // In seconds
const sessionResave = false;
const saveUninitializedSession = false;
const rollingSession = true;
const secureSessionCookie = true;
const languageOptions = ['en', 'fr'];
const defaultLanguage = 'en';

exports.maxSessionAge = maxSessionAge;
exports.sessionSecret = password;
exports.sessionResave = sessionResave;
exports.saveUninitializedSession = saveUninitializedSession;
exports.rollingSession = rollingSession;
exports.secureSessionCookie = secureSessionCookie;
exports.languageOptions = languageOptions;
exports.defaultLanguage = defaultLanguage;

// files upload settings
const filesSizeLimit = 50 * 1024 * 1024; // In bytes
const safeFileNames = true;
const preserveFileExtension = true;
const abortOnExceedLimit = true;

exports.filesSizeLimit = filesSizeLimit;
exports.safeFileNames = safeFileNames;
exports.preserveFileExtension = preserveFileExtension;
exports.abortOnExceedLimit = abortOnExceedLimit;

// encryption
const encryptionAlgorithm = 'aes-256-ctr';

exports.encryptionAlgorithm = encryptionAlgorithm;
exports.encryptionPassword = password;