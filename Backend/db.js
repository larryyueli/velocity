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

const bcrypt = require('bcryptjs');
const Db = require('mongodb').Db;
const Server = require('mongodb').Server;

const common = require(`${__dirname}/common.js`);
const config = require(`${__dirname}/config.js`);
const logger = require(`${__dirname}/logger.js`);

const DB_HOST = config.default_db_host;
const DB_PORT = config.default_db_port;
const DB_NAME = config.default_db_name;
const db = new Db(DB_NAME, new Server(DB_HOST, DB_PORT));

var usersCollection;

/**
 * Open a connection to the database
 *
 * @param {function} callback
 */
exports.initialize = function (callback) {
    db.open(function (err, db) {
        if (err) {
            logger.error(common.getError(1004).message);
            return callback(err, null);
        }

        logger.info('Connection to Quizzard database successful.');
        usersCollection = db.collection('users');

        return callback(null, 'ok');
    });
}