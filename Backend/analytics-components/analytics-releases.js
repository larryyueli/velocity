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
                    for (let i = 0; i < releases.length; i++) {
                        getCurrentAnalyticsForRelease(releases[i], teams, tickets, function (err, analyticsObj) {
                            db.addReleaseAnalytics(analyticsObj, function (err, releaseObj) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                }
                            });
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
    getCurrentAnalyticsForRelease(releaseObj, [team], tickets, function (err, analyticsObj) {
        db.addReleaseAnalytics(analyticsObj, callback);
    });
}

/**
 * Gets the current analytics for a release
 * Also fixes discrepancies in past data when ran
 * 
 * @param {object} release release object
 * @param {array} teams teams list
 * @param {array} tickets tickets list
 * @param {function} callback callback function
 */
const getCurrentAnalyticsForRelease = function (release, teams, tickets, callback) {
    let analyticsObj = {
        _id: common.getUUID(),
        date: common.getDate(),
        idate: common.getISODate(),
        releaseId: release._id,
        releaseName: release.name,
        releaseStatus: release.status,
        members: []
    }
    for (let j = 0; j < teams.length; j++) {
        if (teams[j]._id === release.teamId) {
            for (let z = 0; z < teams[j].members.length; z++) {
                analyticsObj.members.push(createReleaseMemberObject(teams[j].members[z], release._id, tickets));
            }
        }
    }
    getLimitedReleaseAnalyticsListSorted({ $and: [{ releaseId: release._id }] }, { idate: 1 }, 0, function (err, releaseAnalytics) {
        if (err) {
            logger.error(JSON.stringify(err));
            return callback(common.getError(8002), null);
        }

        let membersDeleted = [];
        let membersAdded = [];
        let updatedMembers = [];
        if (releaseAnalytics.length !== 0) {
            let currentMembers = common.convertJsonListToList('_id', analyticsObj.members);
            let pastMembers = common.convertJsonListToList('_id', releaseAnalytics[releaseAnalytics.length - 1].members);
            for (let i = 0; i < pastMembers.length; i++) {
                if (currentMembers.indexOf(pastMembers[i]) === -1) {
                    membersDeleted.push(createReleaseMemberObject(pastMembers[i], release._id, tickets));
                }
                for (let j = 0; j < currentMembers.length; j++) {
                    if (pastMembers.indexOf(currentMembers[j]) === -1
                        && updatedMembers.indexOf(currentMembers[j]) === -1) {
                        updatedMembers.push(currentMembers[j]);
                        membersAdded.push(createReleaseMemberObject(currentMembers[j], release._id, []));
                    }
                }
            }
            analyticsObj.members.push.apply(analyticsObj.members, membersDeleted);
        }

        let updatedAnalytics = [];
        for (let i = 0; i < releaseAnalytics.length; i++) {
            let pastMembers = common.convertJsonListToList('_id', releaseAnalytics[i].members);
            for (let j = 0; j < updatedMembers.length; j++) {
                if (pastMembers.indexOf(updatedMembers[j]) === -1) {
                    releaseAnalytics[i].members.push.apply(releaseAnalytics[i].members, membersAdded);
                    updatedAnalytics.push(releaseAnalytics[i]);
                }
            }
        }

        if (updatedAnalytics.length !== 0) {
            let processedAnalytics = 0;
            for (let i = 0; i < updatedAnalytics.length; i++) {
                updateReleaseMembersAnalytics(updatedAnalytics[i], function (err, releaseObj) {
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

    getCurrentAnalyticsForRelease(releases, [team], tickets, function (err, updateObj) {
        if (err) {
            logger.error(err);
            return callback(common.getError(8002), null);
        }

        getLimitedReleaseAnalyticsListSorted({ $and: [{ $or: releaseIdList }] }, { idate: 1 }, 0, function (err, releaseAnalytics) {
            if (err) {
                logger.error(err);
                return callback(common.getError(8002), null);
            }
            let releasesList = [];
            for (let i = 0; i < releaseAnalytics.length; i++) {
                let currentReleases = common.convertJsonListToList('releaseId', releasesList);
                let index = currentReleases.indexOf(releaseAnalytics[i].releaseId);
                if (index === -1) {
                    releasesList.push({
                        releaseId: releaseAnalytics[i].releaseId,
                        releaseName: releaseAnalytics[i].releaseName,
                        releaseStatus: releaseAnalytics[i].releaseStatus,
                        history: [{
                            date: releaseAnalytics[i].date,
                            members: releaseAnalytics[i].members
                        }]
                    });
                } else {
                    if (releaseAnalytics[i].releaseStatus === common.releaseStatus.CLOSED.value) {
                        releasesList[index].releaseStatus = common.releaseStatus.CLOSED.value;
                    }
                    releasesList[index].history.push({
                        date: releaseAnalytics[i].date,
                        members: releaseAnalytics[i].members
                    });
                }
            }
            let activeStatusIndicies = [];
            for (let i = 0; i < releasesList.length; i++) {
                if (releasesList[i].releaseStatus === common.releaseStatus.ACTIVE.value) {
                    activeStatusIndicies.push(i);
                }
            }
            if (activeStatusIndicies.length === 0) {
                return callback(null, releasesList);
            }
            let processedActives = 0;
            for (let i = 0; i < activeStatusIndicies.length; i++) {
                setUpReleaseActiveAppend(releases[activeStatusIndicies[i]], [team], tickets, activeStatusIndicies[i], function (err, todayObj) {
                    releasesList[todayObj.index].history.push({
                        date: todayObj.date,
                        members: todayObj.members
                    });
                    processedActives++;
                    if (processedActives === activeStatusIndicies.length) {
                        return callback(null, releasesList);
                    }
                });
            }
        });
    });

}

/**
 * Sets up the release object to be appended to history
 * 
 * @param {object} release release obj
 * @param {object} team team obj
 * @param {array} tickets tickets
 * @param {int} index index in releasesList
 * @param {function} callback callback function
 */
const setUpReleaseActiveAppend = function (release, team, tickets, index, callback) {
    getCurrentAnalyticsForRelease(release, team, tickets, function (err, analyticsObj) {
        analyticsObj.index = index;
        return callback(null, analyticsObj);
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

/**
 * Updates the release analytics members object
 * @param {object} releaseAnalyticsObj release analytics object
 * @param {function} callback callback function
 */
const updateReleaseMembersAnalytics = function (releaseAnalyticsObj, callback) {
    let searchQuery = {};
    searchQuery.$and = [{ _id: releaseAnalyticsObj._id }];
    let updateQuery = {};
    updateQuery.$set = {};
    updateQuery.$set.members = releaseAnalyticsObj.members;
    db.updateReleaseAnalytics(searchQuery, updateQuery, callback);
}

// <exports> -----------------------------------
exports.saveReleaseAnalytics = saveReleaseAnalytics;
exports.saveSpecificReleaseAnalytics = saveSpecificReleaseAnalytics;
exports.getReleaseAnalytics = getReleaseAnalytics;
// </exports> ----------------------------------