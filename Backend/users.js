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

const common = require(`${__dirname}/common.js`);
const logger = require(`${__dirname}/logger.js`);

/**
 * Create USER, if the USER object is valid
 *
 * @param {object} user user object to add
 * @param {function} callback callback function
 */
const addUser = function (user, callback) {
    if (!user.fname || !user.lname || !user.username || !user.password || !user.type) {
        return callback(common.getError(2000), null);
    }

    bcrypt.hash(user.password, 11, function (err, hash) {
        if (err) {
            return callback(common.getError(1002), null);
        }

        var currentDate = common.getDate();
        var userToAdd = {};

        userToAdd._id = common.getUUID();
        userToAdd.username = user.username.toLowerCase();
        userToAdd.fname = user.fname;
        userToAdd.lname = user.lname;
        userToAdd.ctime = currentDate;
        userToAdd.atime = currentDate;
        userToAdd.mtime = currentDate;
        userToAdd.email = user.email ? user.email : '';
        userToAdd.type = common.userTypes.ADMIN;
        userToAdd.password = hash;
        userToAdd.active = true;
        userToAdd.picture = null;

        db.addUser(userToAdd, callback);
    });
}
exports.addUser = addUser;