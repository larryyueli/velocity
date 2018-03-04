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
 * Create a comment
 *
 * @param {object} comment comment object to add
 * @param {function} callback callback function
 */
const addComment = function (comment, callback) {
    if (typeof (comment.content) !== common.variableTypes.STRING
        || typeof (comment.userId) !== common.variableTypes.STRING
        || typeof (comment.projectId) !== common.variableTypes.STRING
        || typeof (comment.teamId) !== common.variableTypes.STRING
        || typeof (comment.ticketId) !== common.variableTypes.STRING) {
        return callback(common.getError(8006), null);
    }

    const currentDate = common.getDate();
    const currentISODate = common.getISODate();
    let commentToAdd = {};

    commentToAdd._id = common.getUUID();
    commentToAdd.ctime = currentDate;
    commentToAdd.mtime = currentDate;
    commentToAdd.ictime = currentISODate;
    commentToAdd.imtime = currentISODate;
    commentToAdd.projectId = comment.projectId;
    commentToAdd.teamId = comment.teamId;
    commentToAdd.ticketId = comment.ticketId;
    commentToAdd.userId = comment.userId;
    commentToAdd.status = common.commentStatus.ACTIVE.value;
    commentToAdd.content = comment.content;

    db.addComment(commentToAdd, callback);
}

/**
 * get comments list with search, sort and limit params
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit on the results list length
 * @param {function} callback callback function
 */
const getLimitedCommentsListSorted = function (searchQuery, sortQuery, lim, callback) {
    db.getLimitedCommentsListSorted(searchQuery, sortQuery, lim, callback);
}

/**
 * find a single comment by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getComment = function (searchQuery, callback) {
    db.getComment(searchQuery, callback);
}

/**
 * find team's list of tickets
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {string} ticketId ticket id
 * @param {function} callback callback function
 */
const getCommentsByTicketId = function (projectId, teamId, ticketId, callback) {
    getLimitedCommentsListSorted({ $and: [{ projectId: projectId }, { teamId: teamId }, { ticketId: ticketId }, { status: common.commentStatus.ACTIVE.value }] }, { imtime: 1 }, 0, callback);
}

/**
 * find a comment
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {string} ticketId ticket id
 * @param {string} commentId comment id
 * @param {function} callback callback function
 */
const getCommentById = function (projectId, teamId, ticketId, commentId, callback) {
    getComment({ $and: [{ _id: commentId }, { projectId: projectId }, { teamId: teamId }, { ticketId: ticketId }, { status: common.commentStatus.ACTIVE.value }] }, callback);
}

/**
 * update the comment information
 *
 * @param {string} commentId comment id
 * @param {string} ticketId ticket id
 * @param {string} teamId team id
 * @param {string} projectId project id
 * @param {object} updateParams modify parameters
 * @param {function} callback callback function
 */
const updateComment = function (commentId, ticketId, teamId, projectId, updateParams, callback) {
    let searchQuery = {};
    searchQuery.$and = {};
    let updateQuery = {};
    updateQuery.$set = {};

    if (typeof (projectId) !== common.variableTypes.STRING) {
        return callback(common.getError(8007), null);
    }

    if (typeof (teamId) !== common.variableTypes.STRING) {
        return callback(common.getError(8007), null);
    }

    if (typeof (ticketId) !== common.variableTypes.STRING) {
        return callback(common.getError(8007), null);
    }

    if (typeof (commentId) !== common.variableTypes.STRING) {
        return callback(common.getError(8007), null);
    }

    searchQuery.$and = [{ _id: commentId }, { projectId: projectId }, { teamId: teamId }, { ticketId: ticketId }, { status: common.commentStatus.ACTIVE.value }];

    if (typeof (updateParams.content) === common.variableTypes.STRING) {
        updateQuery.$set.content = updateParams.content;
    }

    if (common.isValueInObjectWithKeys(updateParams.status, 'value', common.commentStatus)) {
        updateQuery.$set.status = updateParams.status;
    }

    if (common.isEmptyObject(updateQuery.$set)) {
        delete updateQuery.$set;
    }

    if (common.isEmptyObject(updateQuery)) {
        return callback(common.getError(8007), null);
    }

    updateQuery.$set.mtime = common.getDate();
    updateQuery.$set.imtime = common.getISODate();

    db.updateComment(searchQuery, updateQuery, callback);
}

// <exports> -----------------------------------
exports.addComment = addComment;
exports.getCommentById = getCommentById;
exports.getCommentsByTicketId = getCommentsByTicketId;
exports.initialize = initialize;
exports.updateComment = updateComment;
// </exports> ----------------------------------