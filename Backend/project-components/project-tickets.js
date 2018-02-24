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

const common = require('../common.js');
const db = require('../db.js');

/**
 * initialize the ticket
 *
 * @param {function} callback callback function
 */
const initialize = function (callback) {

}

/**
 * Create a ticket
 *
 * @param {object} ticket ticket object to add
 * @param {function} callback callback function
 */
const addTicket = function (ticket, callback) {
    if (typeof (ticket.title) !== common.variableTypes.STRING
        || typeof (ticket.description) !== common.variableTypes.STRING
        || typeof (ticket.projectId) !== common.variableTypes.STRING
        || typeof (ticket.teamId) !== common.variableTypes.STRING
        || typeof (ticket.reporter) !== common.variableTypes.STRING
        || !common.isValueInObjectWithKeys(ticket.status, 'value', common.ticketStatus)
        || !common.isValueInObjectWithKeys(ticket.state, 'value', common.ticketStates)
        || !common.isValueInObjectWithKeys(ticket.type, 'value', common.ticketTypes)) {
        return callback(common.getError(7006), null);
    }

    const currentDate = common.getDate();
    let ticketToAdd = {};

    ticketToAdd._id = common.getUUID();
    ticketToAdd.projectId = ticket.projectId;
    ticketToAdd.teamId = ticket.teamId;
    ticketToAdd.title = ticket.title;
    ticketToAdd.ctime = currentDate;
    ticketToAdd.mtime = currentDate;
    ticketToAdd.description = ticket.description;
    ticketToAdd.status = ticket.status;
    ticketToAdd.state = ticket.state;
    ticketToAdd.type = ticket.type;
    ticketToAdd.reporter = ticket.reporter;
    ticketToAdd.assignee = typeof (ticket.assignee) === common.variableTypes.STRING ? ticket.assignee : null;

    db.addTicket(ticketToAdd, callback);
}

// <exports> -----------------------------------
exports.addTicket = addTicket;
exports.initialize = initialize;
// </exports> ----------------------------------