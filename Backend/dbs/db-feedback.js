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

var feedbackCollection;

/**
 * instantiate the feedback database object
 *
 * @param {object} collectionObject collection object
 */
const initialize = function (collectionObject) {
    feedbackCollection = collectionObject;
}

/**
 * add feedback object
 *
 * @param {object} feedbackObj the feedback object
 * @param {function} callback callback function
 */
const addFeedback = function (feedbackObj, callback) {
    feedbackCollection.insert(feedbackObj, function (err, obj) {
        if (err) {
            return callback(common.getError(13001), null);
        }

        return callback(null, feedbackObj);
    });
}

/**
 * get the limited list of feedbacks from the database
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit
 * @param {function} callback callback function
 */
const getLimitedFeedbacksListSorted = function (searchQuery, sortQuery, lim, callback) {
    feedbackCollection.find(searchQuery).sort(sortQuery).limit(lim).toArray(function (err, list) {
        if (err) {
            return callback(common.getError(13002), null);
        }

        return callback(null, list);
    });
}

/**
 * find a single feedback by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getFeedback = function (searchQuery, callback) {
    feedbackCollection.findOne(searchQuery, function (err, obj) {
        if (err) {
            return callback(common.getError(13003), null);
        }

        if (!obj) {
            return callback(common.getError(13004), null);
        }

        return callback(null, obj);
    });
}

// <exports> -----------------------------------
exports.addFeedback = addFeedback;
exports.getFeedback = getFeedback;
exports.getLimitedFeedbacksListSorted = getLimitedFeedbacksListSorted;
exports.initialize = initialize;
// </exports> ----------------------------------