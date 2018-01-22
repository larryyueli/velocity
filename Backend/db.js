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

const mongoClient = require('mongodb').MongoClient;

const common = require('./common.js');
const config = require('./config.js');
const db_settings = require('./dbs/db-settings.js');
const db_users = require('./dbs/db-users.js');

/**
 * Open a connection to the database
 *
 * @param {function} callback callback function
 */
const initialize = function (callback) {
    const url = `mongodb://${config.default_db_host}:${config.default_db_port}`;
    mongoClient.connect(url, function (err, client) {
        if (err) {
            return callback(common.getError(1001), null);
        }

        db_settings.usersCollection = client.db(config.default_db_name).collection('settings');
        db_users.usersCollection = client.db(config.default_db_name).collection('users');

        return callback(null, 'ok');
    });
}
exports.initialize = initialize;

// <Users Collection> -------------------------------------------------
exports.addUser = db_users.addUser;
exports.getUser = db_users.getUser;
// </Users Collection> ------------------------------------------------

// <Settings Collection> ----------------------------------------------
exports.getSettings = db_settings.getSettings;
exports.removeSettings = db_settings.removeSettings;
exports.addSettings = db_settings.addSettings;
// </Settings Collection> ---------------------------------------------