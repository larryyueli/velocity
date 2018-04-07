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
const users = require('./users.js');

/**
 * Returns the ticket states for sprints and releases
 * @param {*} team team object
 * @param {object} sprints sprints object
 * @param {object} tickets tickets object
 * @param {function} callback callback
 */
const getTicketStates = function (team, sprints, tickets, callback) {
    let result = {
        sprints: []
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
    
    return callback(null, result);
}

// <exports> -----------------------------------
exports.getTicketStates = getTicketStates;
// </exports> ----------------------------------