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

const path = require('path');

const common_api = require('./common-api.js');

const notifications = require('../../Backend/customFileSystem.js');

var notificationsWS;

/**
 * handling connection request for notifications server
 *
 * @param {object} client client object
 * @param {object} req req object
 */
const handleNotificationsConnection = function (client, req) {
    if (common_api.isActiveSession(req)) {
        client.userId = req.session.user._id;
        console.log(req.session.user);
        notifications.getNotificationsByUserId(req.session.user._id, function (err, notifList) {
            client.send('ok');
        });
    }

    client.on('message', function incoming(message) {
        console.log('received: %s', message);
    });

    client.send('something');
}

/**
 * initialize the notifications api components
 *
 * @param {object} nWS notifications web secket instance
 * @param {function} callback callback function
 */
const initialize = function (nWS) {
    notificationsWS = nWS;
    notificationsWS.on('connection', handleNotificationsConnection);
}

setInterval(function () {
    console.log(notificationsWS.clients);
    for (let client of notificationsWS.clients) {
        console.log('received: %s', client.userId);
        client.send('ws ok');
    }
}, 1000);

// <exports> ------------------------------------------------
exports.initialize = initialize;
// </exports> -----------------------------------------------