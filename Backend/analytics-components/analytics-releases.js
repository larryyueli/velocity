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
 * Save marker for releases
 */
const saveReleaseAnalytics = function () {
    let projectsList = [];
    projects.getActiveProjectsList(function (err, projectsObj) {
        projectsList = common.convertJsonListToList('_id', projectsObj);
        projects.getProjectsTeams(projectsList, function (err, teams) {
            projects.getReleasesByProjectIds(projectsList, function (err, releases) {
                projects.getTicketsByProjectIds(projectsList, function (err, tickets) {
                    let releaseAnalyticsList = [];
                    for (let i = 0; i < releases.length; i++) {
                        let analyticsObj = {
                            _id: common.getUUID(),
                            date: common.getDate(),
                            idate: common.getISODate(),
                            releaseId: releases[i]._id,
                            releaseName: releases[i].name,
                            releaseStatus: releases[i].status,
                            members: [],
                            cumulativeflowdiagram: []
                        }
                        for (let j = 0; j < teams.length; j++) {
                            if (teams[j]._id === releases[i].teamId) {
                                for (let z = 0; z < teams[j].members.length; z++) {
                                    analyticsObj.members.push(createReleaseMemberObject(teams[j].members[z], releases[i]._id, tickets));
                                }
                            }
                        }
                        analyticsObj.cumulativeflowdiagram.push(createFlowDiagramEntry(analyticsObj.members));
                        releaseAnalyticsList.push(analyticsObj);
                    }
                    for (let i = 0; i < releaseAnalyticsList.length; i++) {
                        db.addReleaseAnalytics(releaseAnalyticsList[i], function (err, analyticsObj) {
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
 * Saves an analytics object for a specific release
 * 
 * @param {object} releaseObj release object
 * @param {object} team team object
 * @param {array} tickets tickets list
 * @param {function} callback callback function
 */
const saveSpecificReleaseAnalytics = function (releaseObj, team, tickets, callback) {
    let analyticsObj = {
        _id: common.getUUID(),
        date: common.getDate(),
        idate: common.getISODate(),
        releaseId: releaseObj._id,
        releaseName: releaseObj.name,
        releaseStatus: releaseObj.status,
        members: [],
        cumulativeflowdiagram: []
    }
    for (let i = 0; i < team.members.length; i++) {
        analyticsObj.members.push(createReleaseMemberObject(team.members[i], releaseObj._id, tickets));
    }
    analyticsObj.cumulativeflowdiagram.push(createFlowDiagramEntry(analyticsObj.members));
    db.addReleaseAnalytics(analyticsObj, callback);
}

/**
 * Creates the release member analytics object
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
 * Create an entry for the flow diagram
 * @param {*} members members list
 */
const createFlowDiagramEntry = function (members) {
    let entry = {
        date: common.getDate()
    };
    Object.keys(common.ticketStates).forEach(state => {
        entry[common.ticketStates[state].value] = 0;
    });
    for (let i = 0; i < members.length; i++) {
        Object.keys(members[i].points).forEach(key => {
            entry[key] += members[i].points[key];
        });
    }
    return entry;
}

/**
 * Returns the ticket states for releases
 * @param {object} team team object
 * @param {object} releases releases object
 * @param {object} tickets tickets object
 * @param {function} callback callback
 */
const getReleaseAnalytics = function (team, releases, tickets, callback) {
    
    const releaseIds = common.convertJsonListToList('_id', releases);
    let releaseIdList = [];

    for (let i = 0; i < releaseIds.length; i++) {
        releaseIdList.push({ releaseId: releaseIds[i] });
    }
    getLimitedReleaseAnalyticsListSorted({ $and: [{ $or: releaseIdList }] }, { idate: 1 }, 0, function(err, releaseAnalytics) {
        if (err) {
            logger.error(err);
            return callback(common.getError(8002), null);
        }
        let releases = [];
        for (let i = 0; i < releaseAnalytics.length; i++) {
            let currentReleases = common.convertJsonListToList('releaseId', releases);
            let index = currentReleases.indexOf(releaseAnalytics[i].releaseId);
            if (index === -1) {
                releases.push({
                    releaseId: releaseAnalytics[i].releaseId,
                    releaseName: releaseAnalytics[i].releaseName,
                    releaseStatus: releaseAnalytics[i].releaseStatus,
                    history: [{
                        date: releaseAnalytics[i].date,
                        members: releaseAnalytics[i].members
                    }],
                    cumulativeflowdiagram: [
                        releaseAnalytics[i].cumulativeflowdiagram
                    ]
                });
            } else {
                if (releaseAnalytics[i].releaseStatus === common.releaseStatus.CLOSED.value) {
                    releases[index].releaseStatus = common.releaseStatus.CLOSED.value;
                }
                releases[index].history.push({
                    date: releaseAnalytics[i].date,
                    members: releaseAnalytics[i].members
                });
                releases[index].cumulativeflowdiagram.push(
                    releaseAnalytics[i].cumulativeflowdiagram
                );
            }
        }
        return callback(null, releases);
    });

}

/**
 * get analytics list for releases with search, sort and limit params
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit on the results list length
 * @param {function} callback callback function
 */
const getLimitedReleaseAnalyticsListSorted = function (searchQuery, sortQuery, lim, callback) {
    db.getLimitedReleaseAnalyticsListSorted(searchQuery, sortQuery, lim, callback);
}

// <exports> -----------------------------------
exports.saveReleaseAnalytics = saveReleaseAnalytics;
exports.saveSpecificReleaseAnalytics = saveSpecificReleaseAnalytics;
exports.getReleaseAnalytics = getReleaseAnalytics;
// </exports> ----------------------------------