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

const saveAdminAnalytics = function () {
    let projectsList = [];
    projects.getActiveProjectsList(function (err, projectsObj) {
        projectsList = common.convertJsonListToList('_id', projectsObj);
        projects.getProjectsTeams(projectsList, function (err, teams) {
            projects.getTicketsByProjectIds(projectsList, function (err, tickets) {
                let adminAnalyticsList = [];
                for (let i = 0; i < teams.length; i++) {
                    let analyticsObj = {
                        _id: common.getUUID(),
                        date: common.getDate(),
                        idate: common.getISODate(),
                        teamId: teams[i]._id,
                        teamName: teams[i].name,
                        projectId: teams[i].projectId,
                        doneCount: 0
                    };
                    for (let j = 0; j < tickets.length; j++) {
                        if (tickets[j].teamId === teams[i]._id
                            && tickets[j].state === common.ticketStates.DONE.value) {
                            analyticsObj.doneCount++;
                        }
                    }
                    adminAnalyticsList.push(analyticsObj);
                }
                for (let i = 0; i < adminAnalyticsList.length; i++) {
                    db.addAdminAnalytics(adminAnalyticsList[i], function (err, adminObj) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                        }
                    });
                }
            });
        });
    });
}

/**
 * Gets the admin analytics
 * 
 * @param {object} projectObj project object
 * @param {array} tickets tickets list
 * @param {function} callback callback function
 */
const getAdminAnalytics = function (projectObj, tickets, callback) {
    getLimitedAdminAnalyticsListSorted({ $and: [{ projectId: projectObj._id }] }, { idate: 1 }, 0, function (err, adminAnalytics) {
        if (err) {
            logger.error(err);
            return callback(common.getError(8002), null);
        }

        let admin = [];
        for (let i = 0; i < adminAnalytics.length; i++) {
            let currentTeams = common.convertJsonListToList('teamId', admin);
            let index = currentTeams.indexOf(adminAnalytics[i].teamId);
            if (index === -1) {
                admin.push({
                    teamId: adminAnalytics[i].teamId,
                    teamName: adminAnalytics[i].teamName,
                    history: [{
                        date: adminAnalytics[i].date,
                        doneCount: adminAnalytics[i].doneCount
                    }]
                });
            } else {
                admin[index].history.push({
                    date: adminAnalytics[i].date,
                    doneCount: adminAnalytics[i].doneCount
                })
            }
        }

        for (let i = 0; i < admin.length; i++) {
            let currentAnalytics = getCurrentAnalyticsForTeam(admin[i].teamId, tickets);
            admin[i].states = currentAnalytics.states;
            admin[i].points = currentAnalytics.points;
        }
        return callback(null, admin);
    });
}

/**
 * Gets current analytics for a given team
 * @param {string} teamId team id
 * @param {array} tickets tickets list
 */
const getCurrentAnalyticsForTeam = function (teamId, tickets) {
    let result = {
        states: [],
        points: []
    }

    Object.keys(common.ticketStates).forEach(state => {
        result.states[common.ticketStates[state].value] = 0;
        result.points[common.ticketStates[state].value] = 0;
    });

    for (let i = 0; i < tickets.length; i++) {
        if (tickets[i].teamId === teamId) {
            result.states[tickets[i].state]++;
            result.points[tickets[i].state] += tickets[i].points;
        } 
    }

    return result;
}

/**
 * get analytics list for admin with search, sort and limit params
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit on the results list length
 * @param {function} callback callback function
 */
const getLimitedAdminAnalyticsListSorted = function (searchQuery, sortQuery, lim, callback) {
    db.getLimitedAdminAnalyticsListSorted(searchQuery, sortQuery, lim, callback);
}

// <exports> -----------------------------------
exports.saveAdminAnalytics = saveAdminAnalytics;
exports.getAdminAnalytics = getAdminAnalytics;
// </exports> ----------------------------------