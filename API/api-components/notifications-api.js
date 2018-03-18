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

const notifications = require('../../Backend/notifications.js');
const logger = require('../../Backend/logger.js');

var notificationsWS;

/**
 * handling connection request for notifications server
 *
 * @param {object} client client object
 * @param {object} req req object
 */
const handleNotificationsConnection = function (client, req) {
    if (!common_api.isActiveSession(req)) {
        return;
    }

    client.isAlive = true;
    client.userId = req.session.user._id;
    client.on('pong', heartbeat);
    client.on('message', function incoming(message) {
    });

    notifications.getNotificationsByUserId(req.session.user._id, function (err, notifList) {
        if (err) {
            logger.error(JSON.stringify(err));
        }

        if (notifList) {
            try {
                client.send(JSON.stringify({ notifList: notifList }));
            } catch (e) {
                logger.error(JSON.stringify(e));
            }
        }
    });
}

/**
 * empty response if the client is not alive
 */
function noop() {

}

/**
 * keep the client alive
 */
function heartbeat() {
    this.isAlive = true;
}

/**
 * remove the client if its not active
 */
setInterval(function ping() {
    if (notificationsWS) {
        for (let client of notificationsWS.clients) {
            if (!client.isAlive) {
                return client.terminate();
            };
            client.isAlive = false;
            client.ping(noop);
        }
    }
}, 60000);

/**
 * send notifications every second
 */
setInterval(function () {
    //if (notificationsWS) {
    //    for (let client of notificationsWS.clients) {
    //        pushNotificationByUserId(client.userId, { userId: client.userId, name: 'new notifi', type: 'save', link: 'https://www.google.ca' }, (err, res) => { });
    //    }
    //}
}, 1000);

/**
 * push a notification to a user
 *
 * @param {string} userId user id
 * @param {string} link link used to redirect the user
 * @param {object} notificationObj notification obj
 */
const pushNotificationByUserId = function (userId, link, notificationObj) {
    notificationObj.userId = userId;
    notificationObj.link = link;
    notifications.addNotification(notificationObj, function (err, resultObj) {
        if (err) {
            return logger.error(JSON.stringify(err));
        }

        for (let client of notificationsWS.clients) {
            if (client.userId === userId) {
                try {
                    client.send(JSON.stringify({ notifList: [resultObj] }));
                } catch (e) {
                    logger.error(JSON.stringify(e));
                }
            }
        }
    });
}

/**
 * path to dismiss/delete a single notification
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const deleteNotification = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const notificationId = req.body.notificationId;
    notifications.deleteNotificationById(notificationId, function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        return res.status(200).send('ok');
    });
}

/**
 * path to dismiss/delete all notifications
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const deleteAllNotifications = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    notifications.deleteAllNotificationsByuserId(req.session.user._id, function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        return res.status(200).send('ok');
    });
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

// <exports> ------------------------------------------------
exports.deleteAllNotifications = deleteAllNotifications;
exports.deleteNotification = deleteNotification;
exports.initialize = initialize;
exports.pushNotificationByUserId = pushNotificationByUserId;
// </exports> -----------------------------------------------