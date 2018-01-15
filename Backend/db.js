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