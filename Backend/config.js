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

// server related configuration
const port = 8000;
exports.port = port;
const urlencoded = true;
exports.urlencoded = urlencoded;

// database related configuration
const default_db_host = 'localhost';
exports.default_db_host = default_db_host;
const default_db_port = 27017;
exports.default_db_port = default_db_port;
const default_db_name = 'velocity';
exports.default_db_name = default_db_name;

// session related configuration
const maxSessionAge = 60 * 60 * 1000;
exports.maxSessionAge = maxSessionAge;
const sessionSecret = 'test';
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
exports.secureSessionCookie = languageOptions;
const defaultLanguage = 'en';
exports.secureSessionCookie = defaultLanguage;