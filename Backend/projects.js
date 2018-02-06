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

    db.addProject(projectToAdd, callback);
}

/**
 * get projects list
 *
 * @param {function} callback callback function
 */
const getProjectsList = function (callback) {
    db.getLimitedProjectsListSorted({}, { title: 1 }, 0, callback);
}

// <exports> -----------------------------------
exports.addProject = addProject;
exports.getProjectsList = getProjectsList;
// </exports> ----------------------------------