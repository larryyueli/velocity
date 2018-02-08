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

const common = require('./common.js');
const db = require('./db.js');

/**
 * initialize the projects
 *
 * @param {function} callback callback function
 */
const initialize = function (callback) {
    return updateCachedList(callback);
}

/**
 * Create a project
 *
 * @param {object} project project object to add
 * @param {function} callback callback function
 */
const addProject = function (project, callback) {
    if (typeof (project.title) !== common.variableTypes.STRING
        || typeof (project.description) !== common.variableTypes.STRING
        || !common.isValueInObjectWithKeys(project.type, 'value', common.projectTypes)
        || !common.isValueInObjectWithKeys(project.status, 'value', common.projectStatus)) {
        return callback(common.getError(5000), null);
    }

    const currentDate = common.getDate();
    var projectToAdd = {};

    projectToAdd._id = common.getUUID();
    projectToAdd.title = project.title;
    projectToAdd.ctime = currentDate;
    projectToAdd.mtime = currentDate;
    projectToAdd.description = project.description;
    projectToAdd.type = project.type;
    projectToAdd.status = project.status;
    projectToAdd.admins = [];
    projectToAdd.members = [];

    db.addProject(projectToAdd, callback);
}

/**
 * get projects list
 *
 * @param {function} callback callback function
 */
const getFullProjectsList = function (callback) {
    getLimitedProjectsListSorted({}, { title: 1 }, 0, callback);
}

/**
 * get projects list with search, sort and limit params
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit on the results list length
 * @param {function} callback callback function
 */
const getLimitedProjectsListSorted = function (searchQuery, sortQuery, lim, callback) {
    db.getLimitedProjectsListSorted(searchQuery, sortQuery, lim, callback);
}

/**
 * get projects list for a user (member of)
 *
 * @param {string} userId user id
 * @param {function} callback callback function
 */
const getProjectsListByUserId = function (userId, callback) {
    getLimitedProjectsListSorted({}, { title: 1 }, 0, callback);
}

/**
 * find a single project by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getProject = function (searchQuery, callback) {
    db.getProject(searchQuery, callback);
}

/**
 * find a single project by its Id
 *
 * @param {string} projectId project id
 * @param {function} callback callback function
 */
const getProjectById = function (projectId, callback) {
    getProject({ _id: projectId }, callback);
}

// <exports> -----------------------------------
exports.addProject = addProject;
exports.getProject = getProject;
exports.getFullProjectsList = getFullProjectsList;
exports.getLimitedProjectsListSorted = getLimitedProjectsListSorted;
exports.getProjectById = getProjectById;
exports.getProjectsListByUserId = getProjectsListByUserId;
// </exports> ----------------------------------