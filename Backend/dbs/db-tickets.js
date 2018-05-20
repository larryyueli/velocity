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

var ticketsCollection;

/**
 * instantiate the tickets database object
 *
 * @param {object} collectionObject collection object
 */
const initialize = function (collectionObject) {
    ticketsCollection = collectionObject;
}

/**
 * add a ticket object
 *
 * @param {object} ticketObj the ticket object
 * @param {function} callback callback function
 */
const addTicket = function (ticketObj, callback) {
    ticketsCollection.insert(ticketObj, function (err, obj) {
        if (err) {
            return callback(common.getError(7001), null);
        }

        return callback(null, ticketObj);
    });
}

/**
 * get the limited list of tickets from the database
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit
 * @param {function} callback callback function
 */
const getLimitedTicketsListSorted = function (searchQuery, sortQuery, lim, callback) {
    ticketsCollection.find(searchQuery).sort(sortQuery).limit(lim).toArray(function (err, list) {
        if (err) {
            return callback(common.getError(7002), null);
        }

        return callback(null, list);
    });
}

/**
 * find a single ticket by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getTicket = function (searchQuery, callback) {
    ticketsCollection.findOne(searchQuery, function (err, obj) {
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
 * find tickets by the search parameters,
 * then update their values by the update parameters
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateTicket = function (searchQuery, updateQuery, callback) {
    ticketsCollection.update(searchQuery, updateQuery, function (err, result) {
        if (err) {
            return callback(common.getError(7005), null);
        }

        return callback(null, 'ok');
    });
}

/**
 * find tickets by the search parameters,
 * then update their values by the update parameters
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateTickets = function (searchQuery, updateQuery, callback) {
    ticketsCollection.update(searchQuery, updateQuery, { multi: true }, function (err, result) {
        if (err) {
            return callback(common.getError(7005), null);
        }

        return callback(null, 'ok');
    });
}

// <exports> -----------------------------------
exports.addTicket = addTicket;
exports.getLimitedTicketsListSorted = getLimitedTicketsListSorted;
exports.getTicket = getTicket;
exports.initialize = initialize;
exports.updateTicket = updateTicket;
exports.updateTickets = updateTickets;
// </exports> ----------------------------------