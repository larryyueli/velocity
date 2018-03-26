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
    getLimitedTicketsListSorted({}, {}, 0, function (err, ticketsList) {
        if (err) {
            return callback(err, null);
        }

        nextTicketId += ticketsList.length;
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
    const currentISODate = common.getISODate();
    let ticketToAdd = {};

    ticketToAdd._id = common.getUUID();
    ticketToAdd.ctime = currentDate;
    ticketToAdd.mtime = currentDate;
    ticketToAdd.ictime = currentISODate;
    ticketToAdd.imtime = currentISODate;
    ticketToAdd.displayId = `TICKET-${nextTicketId}`;
    ticketToAdd.projectId = ticket.projectId;
    ticketToAdd.teamId = ticket.teamId;
    ticketToAdd.sprints = Array.isArray(ticket.sprints) ? ticket.sprints : [];
    ticketToAdd.releases = Array.isArray(ticket.releases) ? ticket.releases : [];
    ticketToAdd.tags = Array.isArray(ticket.tags) ? ticket.tags : [];
    ticketToAdd.links = Array.isArray(ticket.links) ? ticket.links : [];
    ticketToAdd.title = ticket.title;
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

    db.addTicket(ticketToAdd, function (err, ticketObj) {
        if (err) {
            return callback(err, null);
        }

        nextTicketId++;
        return callback(null, ticketObj);
    });
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
 * find project's list of tickets
 *
 * @param {string} projectId project id
 * @param {function} callback callback function
 */
const getTicketsByProjectId = function (projectId, callback) {
    getLimitedTicketsListSorted({ $and: [{ projectId: projectId }, { status: common.ticketStatus.ACTIVE.value }] }, { title: 1 }, 0, callback);
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
 * find a ticket by its display id
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {string} ticketDisplayId ticket display id
 * @param {function} callback callback function
 */
const getTicketByDisplayId = function (projectId, teamId, ticketDisplayId, callback) {
    getTicket({ $and: [{ displayId: ticketDisplayId }, { projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }] }, callback);
}

/**
 * find the list of tickets under a team
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {array} ticketsIds tickets ids
 * @param {function} callback callback function
 */
const getTicketsByIds = function (projectId, teamId, ticketsIds, callback) {
    let ticketsIdsList = [];
    for (let i = 0; i < ticketsIds.length; i++) {
        ticketsIdsList.push({ _id: ticketsIds[i] });
    }

    if (ticketsIds.length === 0) {
        return callback(null, []);
    }

    getLimitedTicketsListSorted({ $and: [{ $or: ticketsIdsList }, { projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }] }, { title: 1 }, 0, callback);
}

/**
 * find the list of tickets with no sprints
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {function} callback callback function
 */
const getTicketsWithNoSprints = function (projectId, teamId, callback) {
    getLimitedTicketsListSorted({ $and: [{ sprints: { $size: 0 } }, { projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }] }, { title: 1 }, 0, callback);
}

/**
 * find tickets under a sprint
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {string} sprintId sprint id
 * @param {function} callback callback function
 */
const getTicketsBySprintId = function (projectId, teamId, sprintId, callback) {
    getTicket({ $and: [{ sprintId: sprintId }, { projectId: projectId }, { teamId: teamId }, { status: common.ticketStatus.ACTIVE.value }] }, callback);
}

/**
 * search for tickets in a project
 *
 * @param {string} projectId project id
 * @param {string} term search term
 * @param {function} callback callback function
 */
const searchTicketsByProjectId = function (projectId, term, callback) {
    getLimitedTicketsListSorted(
        {
            $and: [
                {
                    $or: [
                        {
                            displayId: { $regex: `(.*)${term}(.*)`, $options: 'i' }
                        }, {
                            title: { $regex: `(.*)${term}(.*)`, $options: 'i' }
                        }, {
                            description: { $regex: `(.*)${term}(.*)`, $options: 'i' }
                        }
                    ]
                }, {
                    projectId: projectId
                }, {
                    status: common.ticketStatus.ACTIVE.value
                }
            ]
        },
        {
            title: 1
        },
        0,
        callback
    );
}

/**
 * search for tickets in a team
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {string} term search term
 * @param {function} callback callback function
 */
const searchTicketsByTeamId = function (projectId, teamId, term, callback) {
    getLimitedTicketsListSorted(
        {
            $and: [
                {
                    $or: [
                        {
                            displayId: { $regex: `(.*)${term}(.*)`, $options: 'i' }
                        }, {
                            title: { $regex: `(.*)${term}(.*)`, $options: 'i' }
                        }, {
                            description: { $regex: `(.*)${term}(.*)`, $options: 'i' }
                        }
                    ]
                }, {
                    projectId: projectId
                }, {
                    teamId: teamId
                }, {
                    status: common.ticketStatus.ACTIVE.value
                }
            ]
        },
        {
            title: 1
        },
        0,
        callback
    );
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

    if (Array.isArray(updateParams.sprints)) {
        updateQuery.$set.sprints = updateParams.sprints;
    }

    if (Array.isArray(updateParams.releases)) {
        updateQuery.$set.releases = updateParams.releases;
    }

    if (Array.isArray(updateParams.tags)) {
        updateQuery.$set.tags = updateParams.tags;
    }

    if (Array.isArray(updateParams.links)) {
        updateQuery.$set.links = updateParams.links;
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
    updateQuery.$set.imtime = common.getISODate();

    db.updateTicket(searchQuery, updateQuery, callback);
}

// <exports> -----------------------------------
exports.addTicket = addTicket;
exports.getTicketByDisplayId = getTicketByDisplayId;
exports.getTicketById = getTicketById;
exports.getTicketsByIds = getTicketsByIds;
exports.getTicketsBySprintId = getTicketsBySprintId;
exports.getTicketsByProjectId = getTicketsByProjectId;
exports.getTicketsByTeamId = getTicketsByTeamId;
exports.getTicketsWithNoSprints = getTicketsWithNoSprints;
exports.initialize = initialize;
exports.searchTicketsByProjectId = searchTicketsByProjectId;
exports.searchTicketsByTeamId = searchTicketsByTeamId;
exports.updateTicket = updateTicket;
// </exports> ----------------------------------