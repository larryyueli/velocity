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

const common = require('./../common.js');

var projectsCollection;

/**
 * instantiate the projects database object
 *
 * @param {object} collectionObject collection object
 */
const initialize = function (collectionObject) {
    projectsCollection = collectionObject;
}

/**
 * add a project object
 *
 * @param {object} projectObj the project object
 * @param {function} callback callback function
 */
const addProject = function (projectObj, callback) {
    projectsCollection.insert(projectObj, function (err, obj) {
        if (err) {
            return callback(common.getError(5001), null);
        }

        return callback(null, projectObj);
    });
}

/**
 * get the limited list of projects from the database
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit
 * @param {function} callback callback function
 */
const getLimitedProjectsListSorted = function (searchQuery, sortQuery, lim, callback) {
    projectsCollection.find(searchQuery).sort(sortQuery).limit(lim).toArray(function (err, list) {
        if (err) {
            return callback(common.getError(5002), null);
        }

        return callback(null, list);
    });
}

/**
 * find a single project by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getProject = function (searchQuery, callback) {
    projectsCollection.findOne(searchQuery, function (err, obj) {
        if (err) {
            return callback(common.getError(5003), null);
        }

        if (!obj) {
            return callback(common.getError(5004), null);
        }

        return callback(null, obj);
    });
}

// <exports> -----------------------------------
exports.addProject = addProject;
exports.getLimitedProjectsListSorted = getLimitedProjectsListSorted;
exports.getProject = getProject;
exports.initialize = initialize;
// </exports> ----------------------------------