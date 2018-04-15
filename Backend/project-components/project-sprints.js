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
 * Create a sprint
 *
 * @param {object} sprint sprint object to add
 * @param {function} callback callback function
 */
const addSprint = function (sprint, callback) {
    if (typeof (sprint.name) !== common.variableTypes.STRING
        || typeof (sprint.projectId) !== common.variableTypes.STRING
        || typeof (sprint.teamId) !== common.variableTypes.STRING
        || typeof (sprint.startDate) !== common.variableTypes.STRING
        || typeof (sprint.endDate) !== common.variableTypes.STRING
        || common.isEmptyString(sprint.name)) {
        return callback(common.getError(10006), null);
    }

    const currentDate = common.getDate();
    const currentISODate = common.getISODate();
    let sprintToAdd = {};

    sprintToAdd._id = common.getUUID();
    sprintToAdd.ctime = currentDate;
    sprintToAdd.mtime = currentDate;
    sprintToAdd.ictime = currentISODate;
    sprintToAdd.imtime = currentISODate;
    sprintToAdd.projectId = sprint.projectId;
    sprintToAdd.teamId = sprint.teamId;
    sprintToAdd.name = sprint.name;
    sprintToAdd.startDate = sprint.startDate;
    sprintToAdd.endDate = sprint.endDate;
    sprintToAdd.status = common.sprintStatus.OPEN.value;
    sprintToAdd.tickets = Array.isArray(sprint.tickets) ? sprint.tickets : [];

    db.addSprint(sprintToAdd, callback);
}

/**
 * get sprints list with search, sort and limit params
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit on the results list length
 * @param {function} callback callback function
 */
const getLimitedSprintsListSorted = function (searchQuery, sortQuery, lim, callback) {
    db.getLimitedSprintsListSorted(searchQuery, sortQuery, lim, callback);
}

/**
 * find a single sprint by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getSprint = function (searchQuery, callback) {
    db.getSprint(searchQuery, callback);
}

/**
 * update sprint found by the search query
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateSprint = function (searchQuery, updateQuery, callback) {
    db.updateSprint(searchQuery, updateQuery, callback);
}

/**
 * update sprints found by the search query
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateSprints = function (searchQuery, updateQuery, callback) {
    db.updateSprints(searchQuery, updateQuery, callback);
}

/**
 * find a sprint by its id
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {string} sprintId sprint id
 * @param {function} callback callback function
 */
const getSprintById = function (projectId, teamId, sprintId, callback) {
    getSprint({ $and: [{ _id: sprintId }, { projectId: projectId }, { teamId: teamId }, { status: { $ne: common.sprintStatus.DELETED.value } }] }, callback);
}

/**
 * find the list of sprints by their ids
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {array} sprintsIds sprints ids
 * @param {function} callback callback function
 */
const getSprintsByIds = function (projectId, teamId, sprintsIds, callback) {
    let sprintsIdsList = [];
    for (let i = 0; i < sprintsIds.length; i++) {
        sprintsIdsList.push({ _id: sprintsIds[i] });
    }

    if (sprintsIds.length === 0) {
        return callback(null, []);
    }

    getLimitedSprintsListSorted({ $and: [{ $or: sprintsIdsList }, { projectId: projectId }, { teamId: teamId }, { status: { $ne: common.sprintStatus.DELETED.value } }] }, { status: -1, name: 1 }, 0, callback);
}

/**
 * update the given sprints by adding the ticket to them
 *
 * @param {string} ticketId ticket id
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {array} sprintsIds sprints ids
 * @param {function} callback callback function
 */
const addTicketToSprints = function (ticketId, projectId, teamId, sprintsIds, callback) {
    let sprintsIdsList = [];
    for (let i = 0; i < sprintsIds.length; i++) {
        sprintsIdsList.push({ _id: sprintsIds[i] });
    }

    if (sprintsIds.length === 0) {
        return callback(null, 'ok');
    }

    updateSprints({ $and: [{ $or: sprintsIdsList }, { projectId: projectId }, { teamId: teamId }, { $or: [{ status: common.sprintStatus.ACTIVE.value }, { status: common.sprintStatus.OPEN.value }] }] }, { $addToSet: { tickets: ticketId }, $set: { mtime: common.getDate(), imtime: common.getISODate() } }, callback);
}

/**
 * update the given sprints by removing the ticket from their tickets list
 *
 * @param {string} ticketId ticket id
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {array} sprintsIds sprints ids
 * @param {function} callback callback function
 */
const removeTicketFromSprints = function (ticketId, projectId, teamId, sprintsIds, callback) {
    let sprintsIdsList = [];
    for (let i = 0; i < sprintsIds.length; i++) {
        sprintsIdsList.push({ _id: sprintsIds[i] });
    }

    if (sprintsIds.length === 0) {
        return callback(null, 'ok');
    }

    updateSprints({ $and: [{ $or: sprintsIdsList }, { projectId: projectId }, { teamId: teamId }, { $or: [{ status: common.sprintStatus.ACTIVE.value }, { status: common.sprintStatus.OPEN.value }] }] }, { $pull: { tickets: ticketId }, $set: { mtime: common.getDate(), imtime: common.getISODate() } }, callback);
}

/**
 * Get all the sprints belonging to any one of the given project ids
 * 
 * @param {array} projectIds project ids
 * @param {function} callback callback function
 */
const getSprintsByProjectIds = function (projectIds, callback) {
    let projectIdsList = [];
    for (let i = 0; i < projectIds.length; i++) {
        projectIdsList.push({ projectId: projectIds[i] });
    }

    if (projectIds.length === 0) {
        return callback(null, []);
    }

    getLimitedSprintsListSorted({ $and: [{ $or: projectIdsList }, { status: { $ne: common.sprintStatus.DELETED.value } }] }, { status: -1, name: 1 }, 0, callback);
}

/**
 * Get all the active sprints belonging to any one of the given project ids
 * 
 * @param {array} projectIds project ids
 * @param {function} callback callback function
 */
const getActiveSprintsByProjectIds = function (projectIds, callback) {
    let projectIdsList = [];
    for (let i = 0; i < projectIds.length; i++) {
        projectIdsList.push({ projectId: projectIds[i] });
    }

    if (projectIds.length === 0) {
        return callback(null, []);
    }

    getLimitedSprintsListSorted({ $and: [{ $or: projectIdsList }, { $status: common.sprintStatus.ACTIVE.value }] }, { status: -1, name: 1 }, 0, callback);
}

/**
 * Get all the active or closed sprints belonging to any one of the given project ids
 * 
 * @param {array} projectIds project ids
 * @param {function} callback callback function
 */
const getActiveClosedSprintsByProjectIds = function (projectIds, callback) {
    let projectIdsList = [];
    for (let i = 0; i < projectIds.length; i++) {
        projectIdsList.push({ projectId: projectIds[i] });
    }

    if (projectIds.length === 0) {
        return callback(null, []);
    }

    let statusList = [
        { status: common.sprintStatus.ACTIVE.value },
        { status: common.sprintStatus.CLOSED.value }
    ];
    getLimitedSprintsListSorted({ $and: [{ $or: projectIdsList }, { $or: statusList }] }, { status: -1, name: 1 }, 0, callback);
}

/**
 * find the list of sprints under a team
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {function} callback callback function
 */
const getSprintsByTeamId = function (projectId, teamId, callback) {
    getLimitedSprintsListSorted({ $and: [{ projectId: projectId }, { teamId: teamId }, { status: { $ne: common.sprintStatus.DELETED.value } }] }, { status: -1, name: 1 }, 0, callback);
}

/**
 * find the list of sprints under a ticket
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {string} ticketId ticket id
 * @param {function} callback callback function
 */
const getSprintsByTicketId = function (projectId, teamId, ticketId, callback) {
    getLimitedSprintsListSorted({ $and: [{ projectId: projectId }, { teamId: teamId }, { tickets: ticketId }, { status: { $ne: common.sprintStatus.DELETED.value } }] }, { status: -1, name: 1 }, 0, callback);
}

/**
 * find the list of active or open sprints
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {function} callback callback function
 */
const getAvailableSprintsByTeamId = function (projectId, teamId, callback) {
    getLimitedSprintsListSorted({ $and: [{ projectId: projectId }, { teamId: teamId }, { $or: [{ status: common.sprintStatus.ACTIVE.value }, { status: common.sprintStatus.OPEN.value }] }] }, { status: -1, name: 1 }, 0, callback);
}

/**
 * find the active sprint under a team
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {function} callback callback function
 */
const getActiveSprint = function (projectId, teamId, callback) {
    getSprint({ $and: [{ projectId: projectId }, { teamId: teamId }, { status: common.sprintStatus.ACTIVE.value }] }, callback);
}

/**
 * set active sprint 
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {string} sprintId sprint id
 * @param {function} callback callback function
 */
const setActiveSprint = function (projectId, teamId, sprintId, callback) {
    let deactivateSearchQuery = { $and: [{ status: { $ne: common.sprintStatus.DELETED.value } }, { status: common.sprintStatus.ACTIVE.value }, { projectId: projectId }, { teamId: teamId }] };
    let deactivateUpdateQuery = { $set: { status: common.sprintStatus.CLOSED.value, mtime: common.getDate(), imtime: common.getISODate() } };
    updateSprints(deactivateSearchQuery, deactivateUpdateQuery, function (err, result) {
        if (err) {
            return callback(err, null);
        }

        let activateSearchQuery = { $and: [{ _id: sprintId }, { projectId: projectId }, { teamId: teamId }, { status: { $ne: common.sprintStatus.DELETED.value } }, { status: common.sprintStatus.OPEN.value }] };
        let activateUpdateQuery = { $set: { status: common.sprintStatus.ACTIVE.value, mtime: common.getDate(), imtime: common.getISODate() } };
        updateSprint(activateSearchQuery, activateUpdateQuery, callback);
    });
}

/**
 * update the sprint information
 *
 * @param {string} sprintId sprint id
 * @param {string} teamId team id
 * @param {string} projectId project id
 * @param {object} updateParams modify parameters
 * @param {function} callback callback function
 */
const updateSprintById = function (sprintId, teamId, projectId, updateParams, callback) {
    let searchQuery = {};
    searchQuery.$and = {};
    let updateQuery = {};
    updateQuery.$set = {};

    if (typeof (projectId) !== common.variableTypes.STRING) {
        return callback(common.getError(10007), null);
    }

    if (typeof (teamId) !== common.variableTypes.STRING) {
        return callback(common.getError(10007), null);
    }

    if (typeof (sprintId) !== common.variableTypes.STRING) {
        return callback(common.getError(10007), null);
    }

    searchQuery.$and = [{ _id: sprintId }, { projectId: projectId }, { teamId: teamId }, { $or: [{ status: common.sprintStatus.ACTIVE.value }, { status: common.sprintStatus.OPEN.value }] }];

    if (typeof (updateParams.name) === common.variableTypes.STRING
        && !common.isEmptyString(updateParams.name)) {
        updateQuery.$set.name = updateParams.name;
    }

    if (typeof (updateParams.startDate) === common.variableTypes.STRING) {
        updateQuery.$set.startDate = updateParams.startDate;
    }

    if (typeof (updateParams.endDate) === common.variableTypes.STRING) {
        updateQuery.$set.endDate = updateParams.endDate;
    }

    if (common.isValueInObjectWithKeys(updateParams.status, 'value', common.sprintStatus)) {
        updateQuery.$set.status = updateParams.status;
    }

    if (Array.isArray(updateParams.tickets)) {
        updateQuery.$set.tickets = updateParams.tickets;
    }

    if (common.isEmptyObject(updateQuery.$set)) {
        delete updateQuery.$set;
    }

    if (common.isEmptyObject(updateQuery)) {
        return callback(common.getError(10007), null);
    }

    updateQuery.$set.mtime = common.getDate();
    updateQuery.$set.imtime = common.getISODate();

    updateSprint(searchQuery, updateQuery, callback);
}

// <exports> -----------------------------------
exports.addSprint = addSprint;
exports.addTicketToSprints = addTicketToSprints;
exports.getActiveSprintsByProjectIds = getActiveSprintsByProjectIds;
exports.getActiveClosedSprintsByProjectIds = getActiveClosedSprintsByProjectIds;
exports.getActiveSprint = getActiveSprint;
exports.getAvailableSprintsByTeamId = getAvailableSprintsByTeamId;
exports.getSprintById = getSprintById;
exports.getSprintsByIds = getSprintsByIds;
exports.getSprintsByProjectIds = getSprintsByProjectIds;
exports.getSprintsByTeamId = getSprintsByTeamId;
exports.getSprintsByTicketId = getSprintsByTicketId;
exports.initialize = initialize;
exports.removeTicketFromSprints = removeTicketFromSprints;
exports.setActiveSprint = setActiveSprint;
exports.updateSprintById = updateSprintById;
// </exports> ----------------------------------