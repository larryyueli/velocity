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

const comments = require('./project-components/project-comments.js');
const teams = require('./project-components/project-teams.js');
const tickets = require('./project-components/project-tickets.js');

/**
 * initialize the projects
 *
 * @param {function} callback callback function
 */
const initialize = function (callback) {
    tickets.initialize(callback);
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
 * @param {string} projectId project id
 * @param {object} updateParams modify parameters
 * @param {function} callback callback function
 */
const updateProject = function (projectId, updateParams, callback) {
    let searchQuery = {};
    let updateQuery = {};
    updateQuery.$set = {};

    if (typeof (projectId) === common.variableTypes.STRING) {
        searchQuery = { $and: [{ _id: projectId }, { status: { $ne: common.projectStatus.DELETED.value } }] };
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

// <exports> -----------------------------------
exports.addProject = addProject;
exports.getDraftProjectsInUserSelectionType = getDraftProjectsInUserSelectionType;
exports.getProject = getProject;
exports.getFullProjectsList = getFullProjectsList;
exports.getProjectById = getProjectById;
exports.getProjectsListByUserId = getProjectsListByUserId;
exports.initialize = initialize;
exports.updateProject = updateProject;
// </exports> ----------------------------------

// <teams> -----------------------------------
exports.addTeamToProject = teams.addTeamToProject;
exports.getProjectTeams = teams.getProjectTeams;
exports.getTeamInProjectById = teams.getTeamInProjectById;
exports.getTeamInProjectByName = teams.getTeamInProjectByName;
exports.getTeamByUserId = teams.getTeamByUserId;
exports.updateTeamInProject = teams.updateTeamInProject;
// </teams> ----------------------------------

// <tickets> -----------------------------------
exports.addTicketToTeam = tickets.addTicket;
exports.getTicketById = tickets.getTicketById;
exports.getTicketsByTeamId = tickets.getTicketsByTeamId;
exports.updateTicket = tickets.updateTicket;
// </tickets> ----------------------------------

// <comments> -----------------------------------
exports.addCommentToTicket = comments.addComment;
exports.getCommentById = comments.getCommentById;
exports.getCommentsByTicketId = comments.getCommentsByTicketId;
exports.updateComment = comments.updateComment;
// </comments> ----------------------------------