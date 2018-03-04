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

const common = require('./common.js');
const db = require('./db.js');

/**
 * initialize the notifications component
 *
 * @param {function} callback callback function
 */
const initialize = function (callback) {

}

/**
 * add a notification
 *
 * @param {object} notification notification object to add
 * @param {function} callback callback function
 */
const addNotification = function (notification, callback) {
    if (typeof (notification.userId) !== common.variableTypes.STRING
        || typeof (notification.name) !== common.variableTypes.STRING
        || typeof (notification.link) !== common.variableTypes.STRING) {
        return callback(common.getError(9000), null);
    }



    const currentDate = common.getDate();
    let notificationToAdd = {};

    notificationToAdd._id = common.getUUID();
    notificationToAdd.userId = notification.userId;
    notificationToAdd.name = notification.name;
    notificationToAdd.link = notification.link;
    notificationToAdd.ctime = currentDate;
    db.addNotification(notificationToAdd, callback);
}


/**
 * get the full list of notifications
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit
 * @param {function} callback callback function
 */
const getLimitedNotificationsListSorted = function (searchQuery, sortQuery, lim, callback) {
    db.getLimitedNotificationsListSorted(searchQuery, sortQuery, lim, callback);
}

/**
 * get the list of notification by the user id
 *
 * @param {string} userId user id
 * @param {function} callback callback function
 */
const getNotificationsByUserId = function (userId, callback) {
    getLimitedNotificationsListSorted({ userId: userId }, {}, 0, callback);
}

// <exports> -----------------------------------
exports.addNotification = addNotification;
exports.getNotificationsByUserId = getNotificationsByUserId;
exports.initialize = initialize;
// </exports> ----------------------------------