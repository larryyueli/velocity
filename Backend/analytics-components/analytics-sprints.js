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
                    let sprintAnalyticsList = [];
                    for (let i = 0; i < sprints.length; i++) {
                        let analyticsObj = {
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
                                    analyticsObj.members.push(createSprintMemberObject(teams[j].members[z], sprints[i]._id, tickets));
                                }
                            }
                        }
                        sprintAnalyticsList.push(analyticsObj);
                    }
                    for (let i = 0; i < sprintAnalyticsList.length; i++) {
                        db.addSprintAnalytics(sprintAnalyticsList[i], function (err, analyticsObj) {
                            if (err) {
                                logger.error(JSON.stringify(err));
                            }
                        });
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
    let analyticsObj = {
        _id: common.getUUID(),
        date: common.getDate(),
        idate: common.getISODate(),
        sprintId: sprintObj._id,
        sprintName: sprintObj.name,
        sprintStatus: sprintObj.status,
        members: []
    }
    for (let i = 0; i < team.members.length; i++) {
        analyticsObj.members.push(createSprintMemberObject(team.members[i], sprintObj._id, tickets));
    }
    db.addSprintAnalytics(analyticsObj, callback);
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
    getLimitedSprintAnalyticsListSorted({ $and: [{ $or: sprintIdList }] }, { idate: 1 }, 0, function(err, sprintAnalytics) {
        if (err) {
            logger.error(err);
            return callback(common.getError(8002), null);
        }
        let sprints = [];
        for (let i = 0; i < sprintAnalytics.length; i++) {
            let currentSprints = common.convertJsonListToList('sprintId', sprints);
            let index = currentSprints.indexOf(sprintAnalytics[i].sprintId);
            if (index === -1) {
                sprints.push({
                    sprintId: sprintAnalytics[i].sprintId,
                    sprintName: sprintAnalytics[i].sprintName,
                    sprintStatus: sprintAnalytics[i].sprintStatus,
                    history: [{
                        date: sprintAnalytics[i].date,
                        members: sprintAnalytics[i].members
                    }]
                });
            } else {
                if (sprintAnalytics[i].sprintStatus === common.sprintStatus.CLOSED.value) {
                    sprints[index].sprintStatus = common.sprintStatus.CLOSED.value;
                }
                sprints[index].history.push({
                    date: sprintAnalytics[i].date,
                    members: sprintAnalytics[i].members
                });
            }
        }
        return callback(null, sprints);
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

// <exports> -----------------------------------
exports.saveSprintAnalytics = saveSprintAnalytics;
exports.saveSpecificSprintAnalytics = saveSpecificSprintAnalytics;
exports.getSprintAnalytics = getSprintAnalytics;
// </exports> ----------------------------------