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
 * Create a tag
 *
 * @param {object} tag tag object to add
 * @param {function} callback callback function
 */
const addTag = function (tag, callback) {
    if (typeof (tag.name) !== common.variableTypes.STRING
        || typeof (tag.projectId) !== common.variableTypes.STRING
        || typeof (tag.teamId) !== common.variableTypes.STRING) {
        return callback(common.getError(12006), null);
    }

    const currentDate = common.getDate();
    const currentISODate = common.getISODate();
    let tagToAdd = {};

    tagToAdd._id = common.getUUID();
    tagToAdd.ctime = currentDate;
    tagToAdd.mtime = currentDate;
    tagToAdd.ictime = currentISODate;
    tagToAdd.imtime = currentISODate;
    tagToAdd.projectId = tag.projectId;
    tagToAdd.teamId = tag.teamId;
    tagToAdd.name = tag.name;
    tagToAdd.status = common.tagStatus.ACTIVE.value;
    tagToAdd.tickets = Array.isArray(tag.tickets) ? tag.tickets : [];

    db.addTag(tagToAdd, callback);
}

/**
 * get tags list with search, sort and limit params
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit on the results list length
 * @param {function} callback callback function
 */
const getLimitedTagsListSorted = function (searchQuery, sortQuery, lim, callback) {
    db.getLimitedTagsListSorted(searchQuery, sortQuery, lim, callback);
}

/**
 * find a single tag by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getTag = function (searchQuery, callback) {
    db.getTag(searchQuery, callback);
}

/**
 * find the list of tags by their ids
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {array} tagsIds tags ids
 * @param {function} callback callback function
 */
const getTagsByIds = function (projectId, teamId, tagsIds, callback) {
    let tagsIdsList = [];
    for (let i = 0; i < tagsIds.length; i++) {
        tagsIdsList.push({ _id: tagsIds[i] });
    }

    if (tagsIds.length === 0) {
        return callback(null, []);
    }

    getLimitedTagsListSorted({ $and: [{ $or: tagsIdsList }, { projectId: projectId }, { teamId: teamId }, { status: { $ne: common.tagStatus.DELETED.value } }] }, { status: -1, name: 1 }, 0, callback);
}

/**
 * find the list of active tags
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {function} callback callback function
 */
const getTagsByTeamId = function (projectId, teamId, callback) {
    getLimitedTagsListSorted({ $and: [{ projectId: projectId }, { teamId: teamId }, { status: common.tagStatus.ACTIVE.value }] }, { status: -1, name: 1 }, 0, callback);
}

/**
 * update the given tags by adding the ticket to them
 *
 * @param {string} ticketId ticket id
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {array} tagsIds tags ids
 * @param {function} callback callback function
 */
const addTicketToTags = function (ticketId, projectId, teamId, tagsIds, callback) {
    let tagsIdsList = [];
    for (let i = 0; i < tagsIds.length; i++) {
        tagsIdsList.push({ _id: tagsIds[i] });
    }

    if (tagsIds.length === 0) {
        return callback(null, 'ok');
    }

    updateTags({ $and: [{ $or: tagsIdsList }, { projectId: projectId }, { teamId: teamId }, { status: common.tagStatus.ACTIVE.value }] }, { $addToSet: { tickets: ticketId }, $set: { mtime: common.getDate(), imtime: common.getISODate() } }, callback);
}

/**
 * update the given tags by removing the ticket from their tickets list
 *
 * @param {string} ticketId ticket id
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {array} tagsIds tags ids
 * @param {function} callback callback function
 */
const removeTicketFromTags = function (ticketId, projectId, teamId, tagsIds, callback) {
    let tagsIdsList = [];
    for (let i = 0; i < tagsIds.length; i++) {
        tagsIdsList.push({ _id: tagsIds[i] });
    }

    if (tagsIds.length === 0) {
        return callback(null, 'ok');
    }

    updateTags({ $and: [{ $or: tagsIdsList }, { projectId: projectId }, { teamId: teamId }, { status: common.tagStatus.ACTIVE.value }] }, { $pull: { tickets: ticketId }, $set: { mtime: common.getDate(), imtime: common.getISODate() } }, callback);
}

/**
 * update tag found by the search query
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateTag = function (searchQuery, updateQuery, callback) {
    db.updateTag(searchQuery, updateQuery, callback);
}

/**
 * update tags found by the search query
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateTags = function (searchQuery, updateQuery, callback) {
    db.updateTags(searchQuery, updateQuery, callback);
}

/**
 * update the tag information
 *
 * @param {string} tagId tag id
 * @param {string} teamId team id
 * @param {string} projectId project id
 * @param {object} updateParams modify parameters
 * @param {function} callback callback function
 */
const updateTagById = function (tagId, teamId, projectId, updateParams, callback) {
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

    if (typeof (tagId) !== common.variableTypes.STRING) {
        return callback(common.getError(10007), null);
    }

    searchQuery.$and = [{ _id: tagId }, { projectId: projectId }, { teamId: teamId }, { status: common.tagStatus.ACTIVE.value }];

    if (typeof (updateParams.name) === common.variableTypes.STRING) {
        updateQuery.$set.name = updateParams.name;
    }

    if (common.isValueInObjectWithKeys(updateParams.status, 'value', common.tagStatus)) {
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

    updateTag(searchQuery, updateQuery, callback);
}

// <exports> -----------------------------------
exports.addTicketToTags = addTicketToTags;
exports.addTag = addTag;
exports.getTagsByIds = getTagsByIds;
exports.getTagsByTeamId = getTagsByTeamId;
exports.initialize = initialize;
exports.removeTicketFromTags = removeTicketFromTags;
exports.updateTagById = updateTagById;
// </exports> ----------------------------------