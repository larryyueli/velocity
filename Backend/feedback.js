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

const common = require('./common.js');
const db = require('./db.js');

/**
 * initialize the feedback components
 *
 * @param {function} callback callback function
 */
const initialize = function (callback) {

}

/**
 * Create feedback, if the feedback object is valid
 *
 * @param {object} feedback feedback object to add
 * @param {function} callback callback function
 */
const addFeedback = function (feedback, callback) {
    if (typeof (feedback.subject) !== common.variableTypes.STRING
        || typeof (feedback.body) !== common.variableTypes.STRING
        || typeof (feedback.creator) !== common.variableTypes.STRING
        || common.isEmptyString(feedback.subject)
        || common.isEmptyString(feedback.body)) {
        return callback(common.getError(13003), null);
    }

    const currentDate = common.getDate();
    const currentISODate = common.getISODate();
    let feedbackToAdd = {};

    feedbackToAdd._id = common.getUUID();
    feedbackToAdd.ctime = currentDate;
    feedbackToAdd.mtime = currentDate;
    feedbackToAdd.ictime = currentISODate;
    feedbackToAdd.imtime = currentISODate;
    feedbackToAdd.subject = feedback.subject;
    feedbackToAdd.body = feedback.body;
    feedbackToAdd.creator = feedback.creator;
    feedbackToAdd.status = common.feedbackStatus.ACTIVE.value;

    db.addFeedback(feedbackToAdd, callback);
}

/**
 * find a single feedback by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getFeedback = function (searchQuery, callback) {
    db.getFeedback(searchQuery, callback);
}

/**
 * get the full list of feedback from the feedbacks collection
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit
 * @param {function} callback callback function
 */
const getLimitedFeedbackListSorted = function (searchQuery, sortQuery, lim, callback) {
    db.getLimitedFeedbacksListSorted(searchQuery, sortQuery, lim, callback);
}

/**
 * find a single feedback by the search parameters
 *
 * @param {function} callback callback function
 */
const getFeedbackList = function (callback) {
    getLimitedFeedbackListSorted({ status: common.feedbackStatus.ACTIVE.value }, { ictime: 1 }, 0, callback);
}

// <exports> -----------------------------------
exports.addFeedback = addFeedback;
exports.getFeedbackList = getFeedbackList;
// </exports> ----------------------------------