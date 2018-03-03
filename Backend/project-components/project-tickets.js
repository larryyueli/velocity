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

var nextTicketId = 1;

/**
 * initialize the ticket
 *
 * @param {function} callback callback function
 */
const initialize = function (callback) {
    getLimitedTicketsListSorted({}, {}, 0, function (err, commentsList) {
        if (err) {
            return callback(err, null);
        }

        nextTicketId += commentsList.length;
        return callback(null, 'ok');
    });
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
        || !common.isValueInObjectWithKeys(ticket.priority, 'value', common.ticketPriority)
        || !common.isValueInObjectWithKeys(ticket.state, 'value', common.ticketStates)
        || !common.isValueInObjectWithKeys(ticket.type, 'value', common.ticketTypes)) {
        return callback(common.getError(7006), null);
    }

    const currentDate = common.getDate();
    let ticketToAdd = {};

    ticketToAdd._id = common.getUUID();
    ticketToAdd.displayId = `TICKET-${nextTicketId}`;
    ticketToAdd.projectId = ticket.projectId;
    ticketToAdd.teamId = ticket.teamId;
    ticketToAdd.title = ticket.title;
    ticketToAdd.ctime = currentDate;
    ticketToAdd.mtime = currentDate;
    ticketToAdd.description = ticket.description;
    ticketToAdd.status = common.ticketStatus.ACTIVE.value;
    ticketToAdd.state = ticket.state;
    ticketToAdd.type = ticket.type;
    ticketToAdd.reporter = ticket.reporter;
    ticketToAdd.priority = ticket.priority;
    ticketToAdd.assignee = typeof (ticket.assignee) === common.variableTypes.STRING ? ticket.assignee : common.noAssignee;
    ticketToAdd.points = typeof (ticket.points) === common.variableTypes.NUMBER ? ticket.points : common.defaultPoints;
    ticketToAdd.stateHistory = [];
    ticketToAdd.assigneeHistory = [];

    db.addTicket(ticketToAdd, callback);
}

/**
 * get tickets list with search, sort and limit params
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit on the results list length
 * @param {function} callback callback function
 */
const getLimitedTicketsListSorted = function (searchQuery, sortQuery, lim, callback) {
    db.getLimitedTicketsListSorted(searchQuery, sortQuery, lim, callback);
}

/**
 * find a single ticket by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getTicket = function (searchQuery, callback) {
    db.getTicket(searchQuery, callback);
}

/**
 * find team's list of tickets
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {function} callback callback function
 */
const getTicketsByTeamId = function (projectId, teamId, callback) {
    getLimitedTicketsListSorted({ $and: [{ projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }] }, { title: 1 }, 0, callback);
}

/**
 * find a ticket
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {string} ticketId ticket id
 * @param {function} callback callback function
 */
const getTicketById = function (projectId, teamId, ticketId, callback) {
    getTicket({ $and: [{ _id: ticketId }, { projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }] }, callback);
}

/**
 * update the ticket information
 *
 * @param {string} ticketId ticket id
 * @param {string} teamId team id
 * @param {string} projectId project id
 * @param {object} updateParams modify parameters
 * @param {function} callback callback function
 */
const updateTicket = function (ticketId, teamId, projectId, updateParams, callback) {
    let searchQuery = {};
    searchQuery.$and = {};
    let updateQuery = {};
    updateQuery.$set = {};
    updateQuery.$push = {};

    if (typeof (projectId) !== common.variableTypes.STRING) {
        return callback(common.getError(7007), null);
    }

    if (typeof (teamId) !== common.variableTypes.STRING) {
        return callback(common.getError(7007), null);
    }

    if (typeof (ticketId) !== common.variableTypes.STRING) {
        return callback(common.getError(7007), null);
    }

    searchQuery.$and = [{ _id: ticketId }, { projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }];

    if (typeof (updateParams.title) === common.variableTypes.STRING) {
        updateQuery.$set.title = updateParams.title;
    }

    if (typeof (updateParams.description) === common.variableTypes.STRING) {
        updateQuery.$set.description = updateParams.description;
    }

    if (typeof (updateParams.assignee) === common.variableTypes.STRING) {
        updateQuery.$set.assignee = updateParams.assignee;
    }

    if (typeof (updateParams.points) === common.variableTypes.NUMBER) {
        updateQuery.$set.points = updateParams.points;
    }

    if (typeof (updateParams.stateHistoryEntry) === common.variableTypes.OBJECT) {
        updateQuery.$push.stateHistory = updateParams.stateHistoryEntry;
    }

    if (typeof (updateParams.assigneeHistoryEntry) === common.variableTypes.OBJECT) {
        updateQuery.$push.assigneeHistory = updateParams.assigneeHistoryEntry;
    }

    if (common.isValueInObjectWithKeys(updateParams.priority, 'value', common.ticketPriority)) {
        updateQuery.$set.priority = updateParams.priority;
    }

    if (common.isValueInObjectWithKeys(updateParams.status, 'value', common.ticketStatus)) {
        updateQuery.$set.status = updateParams.status;
    }

    if (common.isValueInObjectWithKeys(updateParams.state, 'value', common.ticketStates)) {
        updateQuery.$set.state = updateParams.state;
    }

    if (common.isValueInObjectWithKeys(updateParams.type, 'value', common.ticketTypes)) {
        updateQuery.$set.type = updateParams.type;
    }

    if (common.isEmptyObject(updateQuery.$push)) {
        delete updateQuery.$push;
    }

    if (common.isEmptyObject(updateQuery.$set)) {
        delete updateQuery.$set;
    }

    if (common.isEmptyObject(updateQuery)) {
        return callback(common.getError(7007), null);
    }

    updateQuery.$set.mtime = common.getDate();

    db.updateTicket(searchQuery, updateQuery, callback);
}

// <exports> -----------------------------------
exports.addTicket = addTicket;
exports.getTicketById = getTicketById;
exports.getTicketsByTeamId = getTicketsByTeamId;
exports.initialize = initialize;
exports.updateTicket = updateTicket;
// </exports> ----------------------------------