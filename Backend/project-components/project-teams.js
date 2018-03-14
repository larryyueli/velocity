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

const common = require('../common.js');
const db = require('../db.js');

/**
 * initialize the ticket
 *
 * @param {function} callback callback function
 */
const initialize = function (callback) {

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
        || !Array.isArray(team.members)) {
        return callback(common.getError(6006), null);
    }

    const currentDate = common.getDate();
    const currentISODate = common.getISODate();
    let teamToAdd = {};

    teamToAdd._id = common.getUUID();
    teamToAdd.ctime = currentDate;
    teamToAdd.mtime = currentDate;
    teamToAdd.ictime = currentISODate;
    teamToAdd.imtime = currentISODate;
    teamToAdd.projectId = projectId;
    teamToAdd.name = team.name;
    teamToAdd.status = common.teamStatus.ACTIVE.value;
    teamToAdd.members = team.members;
    teamToAdd.boardType = common.isValueInObjectWithKeys(team.boardType, 'value', common.boardTypes) ? team.boardType : common.boardTypes.UNKNOWN.value;

    db.addTeam(teamToAdd, callback);
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
 * set teams board type
 *
 * @param {string} projectId project id
 * @param {array} teamIds team ids
 * @param {number} boardType boardType
 * @param {function} callback callback function
 */
const setTeamsBoardType = function (projectId, teamIds, boardType, callback) {
    if (!common.isValueInObjectWithKeys(boardType, 'value', common.boardTypes)) {
        return callback(common.getError(6007), null);
    }

    let teamsIdsList = [];
    for (let i = 0; i < teamIds.length; i++) {
        teamsIdsList.push({ _id: teamIds[i] });
    }

    if (teamsIdsList.length === 0) {
        return callback(null, 'ok');
    }

    updateTeams({ $and: [{ $or: teamsIdsList }, { projectId: projectId }, { status: common.teamStatus.ACTIVE.value }] }, { $set: { boardType: boardType } }, callback);
}

/**
 * update a single team found by the search query
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateTeam = function (searchQuery, updateQuery, callback) {
    db.updateTeam(searchQuery, updateQuery, callback);
}

/**
 * update teams found by the search query
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateTeams = function (searchQuery, updateQuery, callback) {
    db.updateTeams(searchQuery, updateQuery, callback);
}

/**
 * Update a team under a project
 *
 * @param {string} teamId team id
 * @param {string} projectId project id
 * @param {object} updateParams team object to add
 * @param {function} callback callback function
 */
const updateTeamById = function (teamId, projectId, updateParams, callback) {
    let searchQuery = {};
    searchQuery.$and = {};
    let updateQuery = {};
    updateQuery.$set = {};

    if (typeof (projectId) !== common.variableTypes.STRING) {
        return callback(common.getError(6007), null);
    }

    if (typeof (teamId) !== common.variableTypes.STRING) {
        return callback(common.getError(6007), null);
    }

    searchQuery.$and = [{ _id: teamId }, { projectId: projectId }, { status: common.teamStatus.ACTIVE.value }];

    if (typeof (updateParams.name) === common.variableTypes.STRING) {
        updateQuery.$set.name = updateParams.name;
    }

    if (common.isValueInObjectWithKeys(updateParams.status, 'value', common.teamStatus)) {
        updateQuery.$set.status = updateParams.status;
    }

    if (common.isValueInObjectWithKeys(updateParams.boardType, 'value', common.boardTypes)) {
        updateQuery.$set.boardType = updateParams.boardType;
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
    updateQuery.$set.imtime = common.getISODate();

    updateTeam(searchQuery, updateQuery, callback);
}

// <exports> -----------------------------------
exports.addTeamToProject = addTeam;
exports.getProjectTeams = getProjectTeams;
exports.getTeamInProjectById = getTeamById;
exports.getTeamInProjectByName = getTeamByName;
exports.getTeamByUserId = getTeamByUserId;
exports.initialize = initialize;
exports.setTeamsBoardType = setTeamsBoardType;
exports.updateTeamInProject = updateTeamById;
// </exports> ----------------------------------