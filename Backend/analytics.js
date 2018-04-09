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
const config = require('./config.js');
const projects = require('./projects.js');
const users = require('./users.js');

const analyticsTimeInterval = 86400000;

/**
 * Initialize the intervals
 *
 * @param {function} callback callback function
 */
const initialize = function (callback) {
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();
    var secondsTilMidNight = ((24 * 60 * 60) - (h * 60 * 60) - (m * 60) - s) * 1000;

    if (config.debugMode) {
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
                        let historyList = [];
                        for (let i = 0; i < sprints.length; i++) {
                            let historyObj = {
                                _id: common.getUUID(),
                                date: new Date().toJSON().slice(0,10).replace(/-/g,'/'),
                                sprintId: sprints[i]._id,
                                members: []
                            }
                            for (let j = 0; j < teams.length; j++) {
                                if (teams[j]._id === sprints[i].teamId) {
                                    for (let z = 0; z < teams[j].members.length; z++) {
                                        historyObj.members.push(createSprintMemberObject(teams[j].members[z], sprints[i]._id, tickets));
                                    }
                                }
                            }
                            historyList.push(historyObj);
                        }
                    });
                });
            });
        });
    });
}

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
            console.log(`Ticket state: ${tickets[i].state}`);
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
    let result = {
        sprints: [],
        releases: []
    }
    let membersList = [];
    let usersIdObj = common.convertListToJason('_id', users.getActiveUsersList());
    for (let i = 0; i < team.members.length; i++) {
        membersList.push({
            _id: team.members[i],
            fname: usersIdObj[team.members[i]].fname,
            lname: usersIdObj[team.members[i]].lname,
            username: usersIdObj[team.members[i]].username,
            points: {},
            states: {}
        });
    }
    Object.keys(common.ticketStates).forEach(state => {
        for (let i = 0; i < membersList.length; i++) {
            membersList[i].states[common.ticketStates[state].value] = 0;
            membersList[i].points[common.ticketStates[state].value] = 0;
        }
    });

    for (let i = 0; i < sprints.length; i++) {
        result.sprints.push({
            sprintName: sprints[i].name,
            sprintId: sprints[i]._id,
            sprintStatus: sprints[i].status,
            members: membersList
        });
        for (let j = 0; j < tickets.length; j++) {
            for (let z = 0; z < sprints[i].tickets.length; z++) {
                if (tickets[j]._id === sprints[i].tickets[z]) {
                    for (let h = 0; h < result.sprints[i].members.length; h++) {
                        if (result.sprints[i].members[h]._id === tickets[j].assignee) {
                            result.sprints[i].members[h].states[tickets[j].state]++;
                            result.sprints[i].members[h].points[tickets[j].state] += tickets[j].points;
                        }
                    }
                }
            }
        }
    }
    for (let i = 0; i < releases.length; i++) {
        result.releases.push({
            releaseName: releases[i].name,
            releaseId: releases[i]._id,
            sprintStatus: releases[i].status,
            members: membersList
        });
        for (let j = 0; j < tickets.length; j++) {
            for (let z = 0; z < releases[i].tickets.length; z++) {
                if (tickets[j]._id === releases[i].tickets[z]) {
                    for (let h = 0; h < result.releases[i].members.length; h++) {
                        if (result.releases[i].members[h]._id === tickets[j].assignee) {
                            result.releases[i].members[h].states[tickets[j].state]++;
                            result.releases[i].members[h].points[tickets[j].state] += tickets[j].points;
                        }
                    }
                }
            }
        }
    }

    return callback(null, result);
}

// <exports> -----------------------------------
exports.initialize = initialize;
exports.getTicketStates = getTicketStates;
// </exports> ----------------------------------