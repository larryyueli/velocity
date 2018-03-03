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

const common = require('./../common.js');

var notificationCollection;

/**
 * instantiate the notifications database object
 *
 * @param {object} collectionObject collection object
 */
const initialize = function (collectionObject) {
    notificationCollection = collectionObject;
}

/**
 * add a notification object
 *
 * @param {object} notificationObj the notification object
 * @param {function} callback callback function
 */
const addNotification = function (notificationObj, callback) {
    notificationCollection.insert(notificationObj, function (err, obj) {
        if (err) {
            return callback(common.getError(7001), null);
        }

        return callback(null, notificationObj);
    });
}

/**
 * get the limited list of notifications from the database
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit
 * @param {function} callback callback function
 */
const getLimitedNotificationsListSorted = function (searchQuery, sortQuery, lim, callback) {
    notificationCollection.find(searchQuery).sort(sortQuery).limit(lim).toArray(function (err, list) {
        if (err) {
            return callback(common.getError(7002), null);
        }

        return callback(null, list);
    });
}

/**
 * find a single notifications by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getNotification = function (searchQuery, callback) {
    notificationCollection.findOne(searchQuery, function (err, obj) {
        if (err) {
            return callback(common.getError(7003), null);
        }

        if (!obj) {
            return callback(common.getError(7004), null);
        }

        return callback(null, obj);
    });
}

/**
 * find notifications by the search parameters,
 * then update their values by the update parameters
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateNotification = function (searchQuery, updateQuery, callback) {
    notificationCollection.update(searchQuery, updateQuery, function (err, result) {
        if (err) {
            return callback(common.getError(7005), null);
        }

        return callback(null, 'ok');
    });
}

// <exports> -----------------------------------
exports.addNotification = addNotification;
exports.getLimitedNotificationsListSorted = getLimitedNotificationsListSorted;
exports.getNotification = getNotification;
exports.initialize = initialize;
exports.updateNotification = updateNotification;
// </exports> ----------------------------------