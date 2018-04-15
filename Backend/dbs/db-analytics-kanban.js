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

var kanbanAnalyticsCollection;

/**
 * Instantiate the analytics database object
 *
 * @param {object} collectionObject collection object
 */
const initialize = function (collectionObject) {
    kanbanAnalyticsCollection = collectionObject;
}

/**
 * Add an analytics object
 *
 * @param {object} analyticsObj the analytics object
 * @param {function} callback callback function
 */
const addKanbanAnalytics = function (analyticsObj, callback) {
    kanbanAnalyticsCollection.insert(analyticsObj, function (err, obj) {
        if (err) {
            return callback(common.getError(8001), null);
        }

        return callback(null, analyticsObj);
    });
}

/**
 * Get the limited list of analytics from the database
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit
 * @param {function} callback callback function
 */
const getLimitedKanbanAnalyticsListSorted = function (searchQuery, sortQuery, lim, callback) {
    kanbanAnalyticsCollection.find(searchQuery).sort(sortQuery).limit(lim).toArray(function (err, list) {
        if (err) {
            console.log(err);
            return callback(common.getError(8002), null);
        }

        return callback(null, list);
    });
}


// <exports> -----------------------------------
exports.addKanbanAnalytics = addKanbanAnalytics;
exports.getLimitedKanbanAnalyticsListSorted = getLimitedKanbanAnalyticsListSorted;
exports.initialize = initialize;
// </exports> ----------------------------------