const bcrypt = require('bcryptjs');
const Db = require('mongodb').Db;
const Server = require('mongodb').Server;

const common = require(`${__dirname}/common.js`);
const logger = require(`${__dirname}/logger.js`);

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_NAME = process.env.DB_NAME || 'quizzard';
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