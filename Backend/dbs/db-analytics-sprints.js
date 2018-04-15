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

var sprintsAnalyticsCollection;

/**
 * Instantiate the analytics database object
 *
 * @param {object} collectionObject collection object
 */
const initialize = function (collectionObject) {
    sprintsAnalyticsCollection = collectionObject;
}

/**
 * Add a analytics object
 *
 * @param {object} analyticsObj the analytics object
 * @param {function} callback callback function
 */
const addSprintAnalytics = function (analyticsObj, callback) {
    sprintsAnalyticsCollection.insert(analyticsObj, function (err, obj) {
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
const getLimitedSprintAnalyticsListSorted = function (searchQuery, sortQuery, lim, callback) {
    sprintsAnalyticsCollection.find(searchQuery).sort(sortQuery).limit(lim).toArray(function (err, list) {
        if (err) {
            console.log(err);
            return callback(common.getError(8002), null);
        }

        return callback(null, list);
    });
}

/**
 * find sprints by the search parameters,
 * then update their values by the update parameters
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateSprintAnalytics = function (searchQuery, updateQuery, callback) {
    sprintsAnalyticsCollection.update(searchQuery, updateQuery, function (err, result) {
        if (err) {
            return callback(common.getError(8005), null);
        }

        return callback(null, 'ok');
    });
}


// <exports> -----------------------------------
exports.addSprintAnalytics = addSprintAnalytics;
exports.getLimitedSprintAnalyticsListSorted = getLimitedSprintAnalyticsListSorted;
exports.initialize = initialize;
exports.updateSprintAnalytics = updateSprintAnalytics;
// </exports> ----------------------------------