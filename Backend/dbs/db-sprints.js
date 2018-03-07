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

var sprintsCollection;

/**
 * instantiate the sprints database object
 *
 * @param {object} collectionObject collection object
 */
const initialize = function (collectionObject) {
    sprintsCollection = collectionObject;
}

/**
 * add a sprint object
 *
 * @param {object} sprintObj the sprint object
 * @param {function} callback callback function
 */
const addSprint = function (sprintObj, callback) {
    sprintsCollection.insert(sprintObj, function (err, obj) {
        if (err) {
            return callback(common.getError(6001), null);
        }

        return callback(null, sprintObj);
    });
}

/**
 * get the limited list of sprints from the database
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit
 * @param {function} callback callback function
 */
const getLimitedSprintsListSorted = function (searchQuery, sortQuery, lim, callback) {
    sprintsCollection.find(searchQuery).sort(sortQuery).limit(lim).toArray(function (err, list) {
        if (err) {
            return callback(common.getError(6002), null);
        }

        return callback(null, list);
    });
}

/**
 * find a single sprint by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getSprint = function (searchQuery, callback) {
    sprintsCollection.findOne(searchQuery, function (err, obj) {
        if (err) {
            return callback(common.getError(6003), null);
        }

        if (!obj) {
            return callback(common.getError(6004), null);
        }

        return callback(null, obj);
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
const updateSprint = function (searchQuery, updateQuery, callback) {
    sprintsCollection.update(searchQuery, updateQuery, function (err, result) {
        if (err) {
            return callback(common.getError(6005), null);
        }

        return callback(null, 'ok');
    });
}

// <exports> -----------------------------------
exports.addSprint = addSprint;
exports.getLimitedSprintsListSorted = getLimitedSprintsListSorted;
exports.getSprint = getSprint;
exports.initialize = initialize;
exports.updateSprint = updateSprint;
// </exports> ----------------------------------