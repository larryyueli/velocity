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

const tickets = require('./project-components/project-tickets.js');

/**
 * initialize the projects
 *
 * @param {function} callback callback function
 */
const initialize = function (callback) {

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
    let projectToAdd = {};

    projectToAdd._id = common.getUUID();
    projectToAdd.title = project.title;
    projectToAdd.ctime = currentDate;
    projectToAdd.mtime = currentDate;
    projectToAdd.description = project.description;
    projectToAdd.status = project.status;
    projectToAdd.admins = project.admins;
    projectToAdd.members = Array.isArray(project.members) ? project.members : project.admins;
    projectToAdd.teamSize = common.defaultTeamSize;
    projectToAdd.teamSelectionType = common.teamSelectionTypes.ADMIN.value;
    projectToAdd.teamPrefix = common.defaultTeamPrefix;

    db.addProject(projectToAdd, callback);
}

/**
 * get projects list
 *
 * @param {function} callback callback function
 */
const getFullProjectsList = function (callback) {
    getLimitedProjectsListSorted({ status: { $ne: common.projectStatus.DELETED.value } }, { title: 1 }, 0, callback);
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
    getLimitedProjectsListSorted({ $and: [{ members: userId }, { status: { $ne: common.projectStatus.DELETED.value } }] }, { title: 1 }, 0, callback);
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
    getProject({ $and: [{ _id: projectId }, { status: { $ne: common.projectStatus.DELETED.value } }] }, callback);
}

/**
 * find projects in draft with user selections type
 *
 * @param {function} callback callback function
 */
const getDraftProjectsInUserSelectionType = function (callback) {
    getLimitedProjectsListSorted({ $and: [{ status: common.projectStatus.DRAFT.value }, { teamSelectionType: common.teamSelectionTypes.USER.value }] }, { title: 1 }, 0, callback);
}

/**
 * update the projects information
 *
 * @param {object} updateParams modify parameters
 * @param {function} callback callback function
 */
const updateProject = function (updateParams, callback) {
    let searchQuery = {};
    let updateQuery = {};
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

    if (Array.isArray(updateParams.admins)) {
        updateQuery.$set.admins = updateParams.admins;
    }

    if (Array.isArray(updateParams.members)) {
        updateQuery.$set.members = updateParams.members;
    }

    if (typeof (updateParams.teamSize) === common.variableTypes.NUMBER
        && updateParams.teamSize > 0) {
        updateQuery.$set.teamSize = updateParams.teamSize;
    }

    if (common.isValueInObjectWithKeys(updateParams.status, 'value', common.projectStatus)) {
        updateQuery.$set.status = updateParams.status;
    }

    if (common.isValueInObjectWithKeys(updateParams.teamSelectionType, 'value', common.teamSelectionTypes)) {
        updateQuery.$set.teamSelectionType = updateParams.teamSelectionType;
    }

    if (typeof (updateParams.teamPrefix) === common.variableTypes.STRING) {
        updateQuery.$set.teamPrefix = updateParams.teamPrefix;
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
    getLimitedTeamsListSorted({ $and: [{ projectId: projectId }, { status: common.teamStatus.ACTIVE.value }] }, { name: 1 }, 0, callback);
}

/**
 * get teams list with search, sort and limit params
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit on the results list length
 * @param {function} callback callback function
 */
const getLimitedTeamsListSorted = function (searchQuery, sortQuery, lim, callback) {
    db.getLimitedTeamsListSorted(searchQuery, sortQuery, lim, callback);
}

/**
 * find a single team by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getTeam = function (searchQuery, callback) {
    db.getTeam(searchQuery, callback);
}

/**
 * find a team under project by its name
 *
 * @param {string} projectId project id
 * @param {string} teamName team name
 * @param {function} callback callback function
 */
const getTeamByName = function (projectId, teamName, callback) {
    getTeam({ $and: [{ projectId: projectId }, { name: teamName }, { status: common.teamStatus.ACTIVE.value }] }, callback);
}

/**
 * find a team under project by its id
 *
 * @param {string} projectId project id
 * @param {string} teamId team id
 * @param {function} callback callback function
 */
const getTeamById = function (projectId, teamId, callback) {
    getTeam({ $and: [{ projectId: projectId }, { _id: teamId }, { status: common.teamStatus.ACTIVE.value }] }, callback);
}

/**
 * find the team of a user
 *
 * @param {string} projectId project id
 * @param {string} userId team id
 * @param {function} callback callback function
 */
const getTeamByUserId = function (projectId, userId, callback) {
    getTeam({ $and: [{ projectId: projectId }, { members: userId }, { status: common.teamStatus.ACTIVE.value }] }, callback);
}

/**
 * Create a team under a project
 *
 * @param {string} projectId project id
 * @param {object} team team object to add
 * @param {function} callback callback function
 */
const addTeam = function (projectId, team, callback) {
    if (typeof (projectId) !== common.variableTypes.STRING
        || typeof (team.name) !== common.variableTypes.STRING
        || !common.isValueInObjectWithKeys(team.status, 'value', common.teamStatus)
        || !Array.isArray(team.members)) {
        return callback(common.getError(6006), null);
    }

    const currentDate = common.getDate();
    let teamToAdd = {};

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
 * @param {object} updateParams team object to add
 * @param {function} callback callback function
 */
const updateTeam = function (projectId, updateParams, callback) {
    let searchQuery = {};
    searchQuery.$and = {};
    let updateQuery = {};
    updateQuery.$set = {};

    if (typeof (projectId) !== common.variableTypes.STRING) {
        return callback(common.getError(6007), null);
    }

    if (typeof (updateParams._id) !== common.variableTypes.STRING) {
        return callback(common.getError(6007), null);
    }

    searchQuery.$and = [{ projectId: projectId }, { _id: updateParams._id }];

    if (typeof (updateParams.name) === common.variableTypes.STRING) {
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
exports.addTeamToProject = addTeam;
exports.getDraftProjectsInUserSelectionType = getDraftProjectsInUserSelectionType;
exports.getProject = getProject;
exports.getFullProjectsList = getFullProjectsList;
exports.getProjectById = getProjectById;
exports.getProjectsListByUserId = getProjectsListByUserId;
exports.getProjectTeams = getProjectTeams;
exports.getTeamInProjectById = getTeamById;
exports.getTeamInProjectByName = getTeamByName;
exports.getTeamOfUser = getTeamByUserId;
exports.updateProject = updateProject;
exports.updateTeamInProject = updateTeam;
// </exports> ----------------------------------

// <tickets> -----------------------------------
exports.addTicketToTeam = tickets.addTicket;
// </tickets> ----------------------------------