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
const logger = require('../logger.js');
const projects = require('../projects.js');
const users = require('../users.js');

/**
 * Save marker for sprints
 */
const saveSprintAnalytics = function () {
    let projectsList = [];
    projects.getActiveProjectsList(function (err, projectsObj) {
        projectsList = common.convertJsonListToList('_id', projectsObj);
        projects.getProjectsTeams(projectsList, function (err, teams) {
            projects.getSprintsByProjectIds(projectsList, function (err, sprints) {
                projects.getTicketsByProjectIds(projectsList, function (err, tickets) {
                    for (let i = 0; i < sprints.length; i++) {
                        if (sprints[i].status === common.sprintStatus.ACTIVE.value) {
                            getCurrentAnalyticsForSprint(sprints[i], teams, tickets, function (err, analyticsObj) {
                                db.addSprintAnalytics(analyticsObj, function (err, sprintObj) {
                                    if (err) {
                                        logger.error(JSON.stringify(err));
                                    }
                                });
                            });
                        }
                    }
                });
            });
        });
    });
}

/**
 * Saves an analytics object for a specific sprint
 * 
 * @param {object} sprintObj sprint object
 * @param {object} team team object
 * @param {array} tickets tickets list
 * @param {function} callback callback function
 */
const saveSpecificSprintAnalytics = function (sprintObj, team, tickets, callback) {
    getCurrentAnalyticsForSprint(sprintObj, [team], tickets, function (err, analyticsObj) {
        db.addSprintAnalytics(analyticsObj, callback);
    });
}

/**
 * Gets the current analytics for a sprint
 * Also fixes discrepancies in past data when ran
 * 
 * @param {object} sprint sprint object
 * @param {array} teams teams list
 * @param {array} tickets tickets list
 * @param {function} callback callback function
 */
const getCurrentAnalyticsForSprint = function (sprint, teams, tickets, callback) {
    let analyticsObj = {
        _id: common.getUUID(),
        date: common.getDate(),
        idate: common.getISODate(),
        sprintId: sprint._id,
        sprintName: sprint.name,
        sprintStatus: sprint.status,
        sprintStart: sprint.startDate,
        sprintEnd: sprint.endDate,
        members: []
    }
    for (let j = 0; j < teams.length; j++) {
        if (teams[j]._id === sprint.teamId) {
            for (let z = 0; z < teams[j].members.length; z++) {
                analyticsObj.members.push(createSprintMemberObject(teams[j].members[z], sprint._id, tickets));
            }
        }
    }
    getLimitedSprintAnalyticsListSorted({ $and: [{ sprintId: sprint._id }] }, { idate: 1 }, 0, function (err, sprintAnalytics) {
        if (err) {
            logger.error(JSON.stringify(err));
            return callback(common.getError(8002), null);
        }

        let membersDeleted = [];
        let membersAdded = [];
        let updatedMembers = [];
        if (sprintAnalytics.length !== 0) {
            let currentMembers = common.convertJsonListToList('_id', analyticsObj.members);
            let pastMembers = common.convertJsonListToList('_id', sprintAnalytics[sprintAnalytics.length - 1].members);
            for (let i = 0; i < pastMembers.length; i++) {
                if (currentMembers.indexOf(pastMembers[i]) === -1) {
                    membersDeleted.push(createSprintMemberObject(pastMembers[i], sprint._id, tickets));
                }
                for (let j = 0; j < currentMembers.length; j++) {
                    if (pastMembers.indexOf(currentMembers[j]) === -1
                        && updatedMembers.indexOf(currentMembers[j]) === -1) {
                        updatedMembers.push(currentMembers[j]);
                        membersAdded.push(createSprintMemberObject(currentMembers[j], sprint._id, []));
                    }
                }
            }
            analyticsObj.members.push.apply(analyticsObj.members, membersDeleted);
        }

        let updatedAnalytics = [];
        for (let i = 0; i < sprintAnalytics.length; i++) {
            let pastMembers = common.convertJsonListToList('_id', sprintAnalytics[i].members);
            for (let j = 0; j < updatedMembers.length; j++) {
                if (pastMembers.indexOf(updatedMembers[j]) === -1) {
                    sprintAnalytics[i].members.push.apply(sprintAnalytics[i].members, membersAdded);
                    updatedAnalytics.push(sprintAnalytics[i]);
                }
            }
        }

        if (updatedAnalytics.length !== 0) {
            let processedAnalytics = 0;
            for (let i = 0; i < updatedAnalytics.length; i++) {
                updateSprintMembersAnalytics(updatedAnalytics[i], function (err, sprintObj) {
                    if (err) {
                        logger.error(JSON.stringify(err))
                    }
                    processedAnalytics++;
                    if (processedAnalytics === updatedAnalytics.length) {
                        return callback(null, analyticsObj);
                    }
                });
            }
        } else {
            return callback(null, analyticsObj);
        }
    });
}

/**
 * Creates the sprint member analytics object
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
 * Returns the ticket states for sprints
 * @param {object} team team object
 * @param {object} sprints sprints object
 * @param {object} tickets tickets object
 * @param {function} callback callback
 */
const getSprintAnalytics = function (team, sprints, tickets, callback) {

    const sprintIds = common.convertJsonListToList('_id', sprints);
    let sprintIdList = [];

    for (let i = 0; i < sprintIds.length; i++) {
        sprintIdList.push({ sprintId: sprintIds[i] });
    }

    getCurrentAnalyticsForSprint(sprints, [team], tickets, function (err, updateObj) {
        if (err) {
            logger.error(err);
            return callback(common.getError(8002), null);
        }

        getLimitedSprintAnalyticsListSorted({ $and: [{ $or: sprintIdList }] }, { idate: 1 }, 0, function (err, sprintAnalytics) {
            if (err) {
                logger.error(err);
                return callback(common.getError(8002), null);
            }
            
            let sprintsList = [];
            for (let i = 0; i < sprintAnalytics.length; i++) {
                let currentSprints = common.convertJsonListToList('sprintId', sprintsList);
                let index = currentSprints.indexOf(sprintAnalytics[i].sprintId);
                if (index === -1) {
                    sprintsList.push({
                        sprintId: sprintAnalytics[i].sprintId,
                        sprintName: sprintAnalytics[i].sprintName,
                        sprintStatus: sprintAnalytics[i].sprintStatus,
                        sprintStart: sprintAnalytics[i].sprintStart,
                        sprintEnd: sprintAnalytics[i].sprintEnd,
                        history: [{
                            date: sprintAnalytics[i].date,
                            members: sprintAnalytics[i].members
                        }]
                    });
                } else {
                    if (sprintAnalytics[i].sprintStatus === common.sprintStatus.CLOSED.value) {
                        sprintsList[index].sprintStatus = common.sprintStatus.CLOSED.value;
                    }
                    sprintsList[index].history.push({
                        date: sprintAnalytics[i].date,
                        members: sprintAnalytics[i].members
                    });
                }
            }
            let activeFound = false;
            for (let i = 0; i < sprintsList.length; i++) {
                if (sprintsList[i].sprintStatus === common.sprintStatus.ACTIVE.value) {
                    let currentSprints = common.convertJsonListToList('_id', sprints);
                    let indexInSprints = currentSprints.indexOf(sprintAnalytics[i].sprintId);
                    let indexToSaveIn = i;
                    getCurrentAnalyticsForSprint(sprints[indexInSprints], [team], tickets, function(err, todayObj) {
                        sprintsList[indexToSaveIn].history.push({
                            date: todayObj.date,
                            members: todayObj.members
                        });
                        return callback(null, sprintsList);
                    });
                    activeFound = true;
                }
            }
            if (!activeFound) {
                return callback(null, sprintsList);
            }
        });
    });

}

/**
 * get analytics list for sprints with search, sort and limit params
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit on the results list length
 * @param {function} callback callback function
 */
const getLimitedSprintAnalyticsListSorted = function (searchQuery, sortQuery, lim, callback) {
    db.getLimitedSprintAnalyticsListSorted(searchQuery, sortQuery, lim, callback);
}

/**
 * Updates the sprint analytics members object
 * @param {object} sprintAnalyticsObj sprint analytics object
 * @param {function} callback callback function
 */
const updateSprintMembersAnalytics = function (sprintAnalyticsObj, callback) {
    let searchQuery = {};
    searchQuery.$and = [{ _id: sprintAnalyticsObj._id }];
    let updateQuery = {};
    updateQuery.$set = {};
    updateQuery.$set.members = sprintAnalyticsObj.members;
    db.updateSprintAnalytics(searchQuery, updateQuery, callback);
}

// <exports> -----------------------------------
exports.saveSprintAnalytics = saveSprintAnalytics;
exports.saveSpecificSprintAnalytics = saveSpecificSprintAnalytics;
exports.getSprintAnalytics = getSprintAnalytics;
// </exports> ----------------------------------