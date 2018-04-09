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
const logger = require('./logger.js');
const projects = require('./projects.js');
const users = require('./users.js');

const analyticsTimeInterval = 86400000;

/**
 * Initialize the intervals
 *
 * @param {function} callback callback function
 */
const initialize = function (debug, callback) {
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();
    var secondsTilMidNight = ((24 * 60 * 60) - (h * 60 * 60) - (m * 60) - s) * 1000;

    if (debug) {
        saveHistory();
    }
    
    setTimeout(function () {
        saveHistory();
        setInterval(function () {
            saveHistory();
        }, analyticsTimeInterval);
    }, secondsTilMidNight);
    return callback(null, '');
}

/**
 * Save marker for sprints and releases
 */
const saveHistory = function () {
    let projectsList = [];
    projects.getActiveProjectsList(function (err, projectsObj) {
        projectsList = common.convertJsonListToList('_id', projectsObj);
        projects.getProjectsTeams(projectsList, function (err, teams) {
            projects.getActiveClosedSprintsByProjectIds(projectsList, function (err, sprints) {
                projects.getReleasesByProjectIds(projectsList, function (err, releases) {
                    projects.getTicketsByProjectIds(projectsList, function (err, tickets) {
                        let sprintHistoryList = [];
                        let releaseHistoryList = [];
                        for (let i = 0; i < sprints.length; i++) {
                            let historyObj = {
                                _id: common.getUUID(),
                                date: common.getDate(),
                                idate: common.getISODate(),
                                sprintId: sprints[i]._id,
                                sprintName: sprints[i].name,
                                sprintStatus: sprints[i].status,
                                members: []
                            }
                            for (let j = 0; j < teams.length; j++) {
                                if (teams[j]._id === sprints[i].teamId) {
                                    for (let z = 0; z < teams[j].members.length; z++) {
                                        historyObj.members.push(createSprintMemberObject(teams[j].members[z], sprints[i]._id, tickets));
                                    }
                                }
                            }
                            sprintHistoryList.push(historyObj);
                        }
                        for (let i = 0; i < releases.length; i++) {
                            let historyObj = {
                                _id: common.getUUID(),
                                date: common.getDate(),
                                idate: common.getISODate(),
                                releaseId: releases[i]._id,
                                releaseName: releases[i].name,
                                releaseStatus: releases[i].status,
                                members: []
                            }
                            for (let j = 0; j < teams.length; j++) {
                                if (teams[j]._id === releases[i].teamId) {
                                    for (let z = 0; z < teams[j].members.length; z++) {
                                        historyObj.members.push(createReleaseMemberObject(teams[j].members[z], releases[i]._id, tickets));
                                    }
                                }
                            }
                            releaseHistoryList.push(historyObj);
                        }

                        for (let i = 0; i < sprintHistoryList.length; i++) {
                            db.addSprintHistory(sprintHistoryList[i], function (err, historyObj) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                }
                            });
                        }
                        for (let i = 0; i < releaseHistoryList.length; i++) {
                            db.addReleaseHistory(releaseHistoryList[i], function (err, historyObj) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                }
                            });
                        }
                        
                    });
                });
            });
        });
    });
}

/**
 * Creates the sprint member history object
 * 
 * @param {*} userId user id
 * @param {*} sprintId sprint id
 * @param {*} tickets tickets list
 */
const createSprintMemberObject = function (userId, sprintId, tickets) {
    let usersIdObj = common.convertListToJason('_id', users.getActiveUsersList()); 
    let memberObject = {
        _id: userId,
        fname: usersIdObj[userId].fname,
        lname: usersIdObj[userId].lname,
        username: usersIdObj[userId].username,
        states: {},
        points: {}
    }

    Object.keys(common.ticketStates).forEach(state => {
        memberObject.states[common.ticketStates[state].value] = 0;
        memberObject.points[common.ticketStates[state].value] = 0;
    }); 

    for (let i = 0; i < tickets.length; i++) {
        if (tickets[i].assignee === userId &&
            tickets[i].sprints.indexOf(sprintId) > -1) {
            memberObject.states[tickets[i].state]++;
            memberObject.points[tickets[i].state] += tickets[i].points;
        }
    }

    return memberObject;
}

/**
 * Creates the release member history object
 * 
 * @param {*} userId user id
 * @param {*} releaseId release id
 * @param {*} tickets tickets list
 */
const createReleaseMemberObject = function (userId, releaseId, tickets) {
    let usersIdObj = common.convertListToJason('_id', users.getActiveUsersList()); 
    let memberObject = {
        _id: userId,
        fname: usersIdObj[userId].fname,
        lname: usersIdObj[userId].lname,
        username: usersIdObj[userId].username,
        states: {},
        points: {}
    }

    Object.keys(common.ticketStates).forEach(state => {
        memberObject.states[common.ticketStates[state].value] = 0;
        memberObject.points[common.ticketStates[state].value] = 0;
    }); 

    for (let i = 0; i < tickets.length; i++) {
        if (tickets[i].assignee === userId &&
            tickets[i].releases.indexOf(releaseId) > -1) {
            memberObject.states[tickets[i].state]++;
            memberObject.points[tickets[i].state] += tickets[i].points;
        }
    }

    return memberObject;
}

/**
 * Returns the ticket states for sprints and releases
 * @param {object} team team object
 * @param {object} sprints sprints object
 * @param {object} releases releases object
 * @param {object} tickets tickets object
 * @param {function} callback callback
 */
const getTicketStates = function (team, sprints, releases, tickets, callback) {
    const sprintIds = common.convertJsonListToList('_id', sprints);
    const releaseIds = common.convertJsonListToList('_id', releases);

    let sprintsIdList = [];
    let releaseIdList = [];
    for (let i = 0; i < sprintIds.length; i++) {
        sprintsIdList.push({ sprintId: sprintIds[i] });
    }
    for (let i = 0; i < releaseIds.length; i++) {
        releaseIdList.push({ releaseId: releaseIds[i] });
    }

    getLimitedSprintHistoryListSorted({ $and: [{ $or: sprintsIdList }] }, { idate: 1 }, 0, function(err, sprintHistory) {
        if (err) {
            logger.error(err);
            return callback(common.getError(8002), null);
        }
        getLimitedReleaseHistoryListSorted({ $and: [{ $or: releaseIdList }] }, { idate: 1 }, 0, function(err, releaseHistory) {
            if (err) {
                logger.error(err);
                return callback(common.getError(8002), null);
            }
            let result = {
                sprints: [],
                releases: []
            }
            for (let i = 0; i < sprintHistory.length; i++) {
                let currentSprints = common.convertJsonListToList('sprintId', result.sprints);
                let index = currentSprints.indexOf(sprintHistory[i].sprintId);
                if (index === -1) {
                    result.sprints.push({
                        sprintId: sprintHistory[i].sprintId,
                        sprintName: sprintHistory[i].sprintName,
                        sprintStatus: sprintHistory[i].sprintStatus,
                        history: [{
                            date: sprintHistory[i].date,
                            members: sprintHistory[i].members
                        }]
                    });
                } else {
                    result.sprints[index].history.push({
                        date: sprintHistory[i].date,
                        members: sprintHistory[i].members
                    });
                }
            }
            for (let i = 0; i < releaseHistory.length; i++) {
                let currentReleases = common.convertJsonListToList('sprintId', result.releases);
                let index = currentReleases.indexOf(releaseHistory[i].releaseId);
                if (index === -1) {
                    result.releases.push({
                        releaseId: releaseHistory[i].releaseId,
                        releaseName: releaseHistory[i].releaseName,
                        releaseStatus: releaseHistory[i].releaseStatus,
                        history: [{
                            date: releaseHistory[i].date,
                            members: releaseHistory[i].members
                        }]
                    });
                } else {
                    result.releases[index].history.push({
                        date: releaseHistory[i].date,
                        members: releaseHistory[i].members
                    });
                }
            }
            return callback(null, result);
        });
    });

}

/**
 * get history list for sprints with search, sort and limit params
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit on the results list length
 * @param {function} callback callback function
 */
const getLimitedSprintHistoryListSorted = function (searchQuery, sortQuery, lim, callback) {
    db.getLimitedSprintHistoryListSorted(searchQuery, sortQuery, lim, callback);
}

/**
 * get history list for releases with search, sort and limit params
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit on the results list length
 * @param {function} callback callback function
 */
const getLimitedReleaseHistoryListSorted = function (searchQuery, sortQuery, lim, callback) {
    db.getLimitedReleaseHistoryListSorted(searchQuery, sortQuery, lim, callback);
}

// <exports> -----------------------------------
exports.initialize = initialize;
exports.getTicketStates = getTicketStates;
// </exports> ----------------------------------