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
 * Global kanban analytics
 */
const saveKanbanAnalytics = function () {
    let projectsList = [];
    projects.getActiveProjectsList(function (err, projectsObj) {
        projectsList = common.convertJsonListToList('_id', projectsObj);
        projects.getProjectsTeams(projectsList, function (err, teams) {
            projects.getTicketsByProjectIds(projectsList, function (err, tickets) {
                saveSpecificKanbanAnalytics(teams, tickets, function (err, kanbanObj) {
                    
                });
            });
        });
    });
}

/**
 * Runs analytics for a specific team list
 * 
 * @param {object} team team obj
 * @param {array} tickets tickets belonging to the team
 * @param {function} callback callback function
 */
const saveSpecificKanbanAnalytics = function (teams, tickets, callback) {

    let kanbanAnalyticsList = [];
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].boardType === common.boardTypes.KANBAN.value) {
            let analyticsObj = {
                _id: common.getUUID(),
                idate: common.getDate(),
                teamId: teams[i]._id,
                members: [],
                cumulativeflowdiagram: []
            }
            for (let j = 0; j < teams[i].members.length; j++) {
                analyticsObj.members.push(createKanbanMemberObject(teams[i].members[j], tickets, teams[i]._id));
            }
            analyticsObj.cumulativeflowdiagram.push(createFlowDiagramEntry(analyticsObj.members));
            kanbanAnalyticsList.push(analyticsObj);
        }
    }

    let processedKanbanList = 0;
    if (kanbanAnalyticsList.length === 0) {
        return callback(null, teams);
    }
    for (let i = 0; i < kanbanAnalyticsList.length; i++) {
        db.addKanbanAnalytics(kanbanAnalyticsList[i], function (err, kanbanObj) {
            if (err) {
                logger.error(JSON.stringify(err));
            }
            processedKanbanList++;
            if (processedKanbanList === kanbanAnalyticsList.length) {
                return callback(null, teams);
            }
        });
    }
}

/**
 * Creates the kanban member analytics object
 * 
 * @param {string} userId user id
 * @param {array} tickets tickets list
 * @param {string} teamId team id
 */
const createKanbanMemberObject = function (userId, tickets, teamId) {
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
        if (tickets[i].assignee === userId
            && tickets[i].teamId === teamId) {
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
        date: common.getDate(),
        states: {},
        points: {}
    };
    Object.keys(common.ticketStates).forEach(state => {
        entry.states[common.ticketStates[state].value] = 0;
        entry.points[common.ticketStates[state].value] = 0;
    });
    for (let i = 0; i < members.length; i++) {
        Object.keys(members[i].points).forEach(key => {
            entry.points[key] += members[i].points[key];
        });
        Object.keys(members[i].states).forEach(key => {
            entry.states[key] += members[i].states[key];
        });
    }
    return entry;
}

/**
 * Returns the kanban analytics
 * @param {object} team team object
 * @param {object} tickets tickets object
 * @param {function} callback callback
 */
const getKanbanAnalytics = function (team, tickets, callback) {

    getLimitedKanbanAnalyticsListSorted({ $and: [{ teamId: team._id }] }, { idate: 1 }, 0, function (err, kanbanAnalytics) {
        if (err) {
            logger.error(JSON.stringify(err));
            return callback(common.getError(6004), null);
        }
        let kanban = {
            members: [],
            cumulativeflowdiagram: []
        };
        for (let i = 0; i < kanbanAnalytics.length; i++) {
            let currentMembers = common.convertJsonListToList('_id', kanbanAnalytics[i].members);
            let pastMembers = common.convertJsonListToList('_id', kanban.members);
            kanban.members = kanbanAnalytics[i].members;
            kanban.cumulativeflowdiagram.push(kanbanAnalytics[i].cumulativeflowdiagram[0]);

            for (let j = 0; j < pastMembers.length; j++) {
                if (currentMembers.indexOf(pastMembers[j]) === -1) {
                    kanban.members.push(createKanbanMemberObject(pastMembers[j], tickets, team._id));
                    kanban.cumulativeflowdiagram = createFlowDiagramEntry(kanban.members);
                }
            }
        }
        return callback(null, kanban);
    });

}

/**
 * get analytics list for kanban with search, sort and limit params
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit on the results list length
 * @param {function} callback callback function
 */
const getLimitedKanbanAnalyticsListSorted = function (searchQuery, sortQuery, lim, callback) {
    db.getLimitedKanbanAnalyticsListSorted(searchQuery, sortQuery, lim, callback);
}

// <exports> -----------------------------------
exports.getKanbanAnalytics = getKanbanAnalytics;
exports.saveKanbanAnalytics = saveKanbanAnalytics;
exports.saveSpecificKanbanAnalytics = saveSpecificKanbanAnalytics;
// </exports> ----------------------------------