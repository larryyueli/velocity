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
        || !common.isValueInObjectWithKeys(project.status, 'value', common.projectStatus)
        || !Array.isArray(project.admins)) {
        return callback(common.getError(5000), null);
    }

    const currentDate = common.getDate();
    var projectToAdd = {};

    projectToAdd._id = common.getUUID();
    projectToAdd.title = project.title;
    projectToAdd.ctime = currentDate;
    projectToAdd.mtime = currentDate;
    projectToAdd.description = project.description;
    projectToAdd.status = project.status;
    projectToAdd.admins = project.admins;
    projectToAdd.members = Array.isArray(project.members) ? project.members : project.admins;

    db.addProject(projectToAdd, callback);
}

/**
 * get projects list
 *
 * @param {function} callback callback function
 */
const getFullProjectsList = function (callback) {
    getLimitedProjectsListSorted({}, { title: 1, status: { $ne: common.projectStatus.DELETED.value } }, 0, callback);
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
    getLimitedProjectsListSorted({ members: userId, status: { $ne: common.projectStatus.DELETED.value } }, { title: 1 }, 0, callback);
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


/**
 * update the projects information
 *
 * @param {object} updateParams modify parameters
 * @param {function} callback callback function
 */
const updateProject = function (updateParams, callback) {
    var searchQuery = {};
    var updateQuery = {};
    updateQuery.$set = {};

    if (typeof (updateParams._id) === common.variableTypes.STRING) {
        searchQuery = { _id: updateParams._id };
    }

    if (common.isEmptyObject(searchQuery)) {
        return callback(common.getError(5006), null);
    }

    if (typeof (updateParams.title) === common.variableTypes.STRING) {
        updateQuery.$set.title = updateParams.title;
    }

    if (typeof (updateParams.description) === common.variableTypes.STRING) {
        updateQuery.$set.description = updateParams.description;
    }

    if (common.isValueInObjectWithKeys(updateParams.status, 'value', common.projectStatus)) {
        updateQuery.$set.status = updateParams.status;
    }

    if (common.isEmptyObject(updateQuery.$set)) {
        delete updateQuery.$set;
    }

    if (common.isEmptyObject(updateQuery)) {
        return callback(common.getError(5006), null);
    }

    updateQuery.$set.mtime = common.getDate();

    db.updateProject(searchQuery, updateQuery, callback);
}

/**
 * find the list of teams under project
 *
 * @param {string} projectId project id
 * @param {function} callback callback function
 */
const getProjectTeams = function (projectId, callback) {
    db.getLimitedTeamsListSorted({ projectId: projectId }, {}, 0, callback);
}

/**
 * Create a team under a project
 *
 * @param {string} projectId project id
 * @param {object} team team object to add
 * @param {function} callback callback function
 */
const addTeamToProject = function (projectId, team, callback) {
    if (typeof (projectId) !== common.variableTypes.STRING
        || typeof (team.name) !== common.variableTypes.STRING
        || !common.isValueInObjectWithKeys(team.status, 'value', common.teamStatus)
        || !Array.isArray(team.members)) {
        return callback(common.getError(6006), null);
    }

    const currentDate = common.getDate();
    var teamToAdd = {};

    teamToAdd._id = common.getUUID();
    teamToAdd.projectId = projectId;
    teamToAdd.name = team.name;
    teamToAdd.ctime = currentDate;
    teamToAdd.mtime = currentDate;
    teamToAdd.status = team.status;
    teamToAdd.members = team.members;

    db.addTeam(teamToAdd, callback);
}

/**
 * Update a team under a project
 *
 * @param {string} projectId project id
 * @param {object} updateQuery team object to add
 * @param {function} callback callback function
 */
const updateTeamInProject = function (projectId, updateQuery, callback) {
    var searchQuery = {};
    searchQuery.$and = {};
    var updateQuery = {};
    updateQuery.$set = {};

    if (typeof (projectId) === common.variableTypes.STRING) {
        searchQuery.projectId = projectId;
    }

    if (common.isEmptyObject(searchQuery)) {
        return callback(common.getError(6007), null);
    }

    searchQuery.$and = {
        projectId: projectId,
        '_id': (typeof (updateQuery._id) === common.variableTypes.STRING) ? updateQuery._id : common.getUUID()
    };

    if (typeof (updateQuery.name) === common.variableTypes.STRING) {
        updateQuery.$set.name = updateParams.name;
    }

    if (common.isValueInObjectWithKeys(updateParams.status, 'value', common.teamStatus)) {
        updateQuery.$set.status = updateParams.status;
    }

    if (Array.isArray(updateParams.members)) {
        updateQuery.$set.members = updateParams.members;
    }

    if (common.isEmptyObject(updateQuery.$set)) {
        delete updateQuery.$set;
    }

    if (common.isEmptyObject(updateQuery)) {
        return callback(common.getError(6007), null);
    }

    updateQuery.$set.mtime = common.getDate();

    db.updateTeam(searchQuery, updateQuery, callback);
}

// <exports> -----------------------------------
exports.addProject = addProject;
exports.addTeamToProject = addTeamToProject;
exports.getProject = getProject;
exports.getFullProjectsList = getFullProjectsList;
exports.getLimitedProjectsListSorted = getLimitedProjectsListSorted;
exports.getProjectById = getProjectById;
exports.getProjectsListByUserId = getProjectsListByUserId;
exports.getProjectTeams = getProjectTeams;
exports.updateProject = updateProject;
exports.updateTeamInProject = updateTeamInProject;
// </exports> ----------------------------------