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
 * Create a release
 *
 * @param {object} release release object to add
 * @param {function} callback callback function
 */
const addRelease = function (release, callback) {
    if (typeof (release.name) !== common.variableTypes.STRING
        || typeof (release.projectId) !== common.variableTypes.STRING
        || typeof (release.teamId) !== common.variableTypes.STRING
        || common.isEmptyString(release.name)) {
        return callback(common.getError(12006), null);
    }

    const currentDate = common.getDate();
    const currentISODate = common.getISODate();
    let releaseToAdd = {};

    releaseToAdd._id = common.getUUID();
    releaseToAdd.ctime = currentDate;
    releaseToAdd.mtime = currentDate;
    releaseToAdd.ictime = currentISODate;
    releaseToAdd.imtime = currentISODate;
    releaseToAdd.projectId = release.projectId;
    releaseToAdd.teamId = release.teamId;
    releaseToAdd.name = release.name;
    releaseToAdd.status = common.releaseStatus.ACTIVE.value;
    releaseToAdd.tickets = Array.isArray(release.tickets) ? release.tickets : [];

    db.addRelease(releaseToAdd, callback);
}

/**
 * get releases list with search, sort and limit params
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit on the results list length
 * @param {function} callback callback function
 */
const getLimitedReleasesListSorted = function (searchQuery, sortQuery, lim, callback) {
    db.getLimitedReleasesListSorted(searchQuery, sortQuery, lim, callback);
}

/**
 * find a single release by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getRelease = function (searchQuery, callback) {
    db.getRelease(searchQuery, callback);
}

/**
 * find the list of releases by their ids
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {array} releasesIds releases ids
 * @param {function} callback callback function
 */
const getReleasesByIds = function (projectId, teamId, releasesIds, callback) {
    let releasesIdsList = [];
    for (let i = 0; i < releasesIds.length; i++) {
        releasesIdsList.push({ _id: releasesIds[i] });
    }

    if (releasesIds.length === 0) {
        return callback(null, []);
    }

    getLimitedReleasesListSorted({ $and: [{ $or: releasesIdsList }, { projectId: projectId }, { teamId: teamId }, { status: { $ne: common.releaseStatus.DELETED.value } }] }, { status: -1, name: 1 }, 0, callback);
}

/**
 * find the release by id
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {array} releaseId release id
 * @param {function} callback callback function
 */
const getReleaseById = function (projectId, teamId, releaseId, callback) {
    getRelease({ $and: [{ _id: releaseId }, { projectId: projectId }, { teamId: teamId }, { status: { $ne: common.releaseStatus.DELETED.value } }] }, callback);
}

/**
 * find the list of releases by team id
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {function} callback callback function
 */
const getReleasesByTeamId = function (projectId, teamId, callback) {
    getLimitedReleasesListSorted({ $and: [{ projectId: projectId }, { teamId: teamId }, { status: { $ne: common.releaseStatus.DELETED.value } }] }, { status: -1, name: 1 }, 0, callback);
}

/**
 * find the list of releases under a ticket
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {string} ticketId ticket id
 * @param {function} callback callback function
 */
const getReleasesByTicketId = function (projectId, teamId, ticketId, callback) {
    getLimitedReleasesListSorted({ $and: [{ projectId: projectId }, { teamId: teamId }, { tickets: ticketId }, { status: { $ne: common.releaseStatus.DELETED.value } }] }, { status: -1, name: 1 }, 0, callback);
}

/**
 * find the list of active releases
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {function} callback callback function
 */
const getAvailableReleasesByTeamId = function (projectId, teamId, callback) {
    getLimitedReleasesListSorted({ $and: [{ projectId: projectId }, { teamId: teamId }, { status: common.releaseStatus.ACTIVE.value }] }, { status: -1, name: 1 }, 0, callback);
}

/**
 * update the given releases by adding the ticket to them
 *
 * @param {string} ticketId ticket id
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {array} releasesIds releases ids
 * @param {function} callback callback function
 */
const addTicketToReleases = function (ticketId, projectId, teamId, releasesIds, callback) {
    let releasesIdsList = [];
    for (let i = 0; i < releasesIds.length; i++) {
        releasesIdsList.push({ _id: releasesIds[i] });
    }

    if (releasesIds.length === 0) {
        return callback(null, 'ok');
    }

    updateReleases({ $and: [{ $or: releasesIdsList }, { projectId: projectId }, { teamId: teamId }, { status: common.releaseStatus.ACTIVE.value }] }, { $addToSet: { tickets: ticketId }, $set: { mtime: common.getDate(), imtime: common.getISODate() } }, callback);
}

/**
 * update the given releases by removing the ticket from their tickets list
 *
 * @param {string} ticketId ticket id
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {array} releasesIds releases ids
 * @param {function} callback callback function
 */
const removeTicketFromReleases = function (ticketId, projectId, teamId, releasesIds, callback) {
    let releasesIdsList = [];
    for (let i = 0; i < releasesIds.length; i++) {
        releasesIdsList.push({ _id: releasesIds[i] });
    }

    if (releasesIds.length === 0) {
        return callback(null, 'ok');
    }

    updateReleases({ $and: [{ $or: releasesIdsList }, { projectId: projectId }, { teamId: teamId }, { status: common.releaseStatus.ACTIVE.value }] }, { $pull: { tickets: ticketId }, $set: { mtime: common.getDate(), imtime: common.getISODate() } }, callback);
}

/**
 * update release found by the search query
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateRelease = function (searchQuery, updateQuery, callback) {
    db.updateRelease(searchQuery, updateQuery, callback);
}

/**
 * update releases found by the search query
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateReleases = function (searchQuery, updateQuery, callback) {
    db.updateReleases(searchQuery, updateQuery, callback);
}

/**
 * update the release information
 *
 * @param {string} releaseId release id
 * @param {string} teamId team id
 * @param {string} projectId project id
 * @param {object} updateParams modify parameters
 * @param {function} callback callback function
 */
const updateReleaseById = function (releaseId, teamId, projectId, updateParams, callback) {
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

    if (typeof (releaseId) !== common.variableTypes.STRING) {
        return callback(common.getError(10007), null);
    }

    searchQuery.$and = [{ _id: releaseId }, { projectId: projectId }, { teamId: teamId }, { status: common.releaseStatus.ACTIVE.value }];

    if (typeof (updateParams.name) === common.variableTypes.STRING
        && !common.isEmptyString(updateParams.name)) {
        updateQuery.$set.name = updateParams.name;
    }

    if (common.isValueInObjectWithKeys(updateParams.status, 'value', common.releaseStatus)) {
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

    updateRelease(searchQuery, updateQuery, callback);
}

// <exports> -----------------------------------
exports.addRelease = addRelease;
exports.addTicketToReleases = addTicketToReleases;
exports.getAvailableReleasesByTeamId = getAvailableReleasesByTeamId;
exports.getReleaseById = getReleaseById;
exports.getReleasesByIds = getReleasesByIds;
exports.getReleasesByTeamId = getReleasesByTeamId;
exports.getReleasesByTicketId = getReleasesByTicketId;
exports.initialize = initialize;
exports.removeTicketFromReleases = removeTicketFromReleases;
exports.updateReleaseById = updateReleaseById;
// </exports> ----------------------------------