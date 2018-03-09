/*
Copyright (C) 2016
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

var sprintEntryHTML = null;
var ticketEntryHTML = null;
var ticketsList = null;

const backlogTicketListId = '#backlogTicketList';
const issueCountId = '#issueCount';
const sprintsListId = '#sprintsList';
const titleId = '#title';



const iconId = '#icon';
const nameId = '#name';
const openTicketId = '#openTicket';
const estimateId = '#estimate';



$(function () {
    getBacklog();
});

function getBacklog() {
    $.ajax({
        type: 'GET',
        url: '/components/ticketsList',
        data: {
            projectId: projectId,
            teamId: teamId
        },
        success: function (data) {
            sprintEntryHTML = $(data.sprintEntryHTML);
            ticketEntryHTML = $(data.ticketEntryHTML);
            ticketsList = data.ticketsList;

            displaySprintsList();
        },
        error: function (data) {
            handle401And404(data);
        }
    });
}

function displaySprintsList() {
    $(sprintsListId).html('');
    var rowPopulate = '';

    $(sprintsListId).append(fillSprintsRow(ticketsList));

    // groupList.forEach(group => {
    //     var inGroup = null;
    //     if (passGroupFilter(group)) {
    //         if (!isProjectAdmin) {
    //             inGroup = groupList.find(groupSearch => {
    //                 return group.name === groupSearch.name && groupSearch.members.find(user => {
    //                     return user.username === meObject.username;
    //                 });
    //             });

    //             if (inGroup) {
    //                 $(userGroupId).append(fillGroupRow(group, true));
    //             } else {
    //                 $(groupListId).append(fillGroupRow(group, false));
    //             }
    //         } else {
    //             $(groupListId).append(fillGroupRow(group, false));
    //         }
    //     }
    // });

    // endLoad(groupLoadId, groupListId);
}

function fillSprintsRow(tickets) {
    var bindedRow = sprintEntryHTML;

    bindedRow.find(issueCountId).html('14');
    bindedRow.find(titleId).html('Bonza - 1');

    tickets.forEach(ticket => {
        // if (passGroupFilter(group)) {
            bindedRow.find(backlogTicketListId).append(fillTicketRow(ticket));
        // }
    });

    //bindedRow.find(backlogTicketListId).html('sdfg');

    return bindedRow[0].outerHTML;
}

// /**
//  * Filters a group object to match filter parameters
//  *
//  * @param {Object} group
//  */
// function passGroupFilter(group) {
//     const size = parseInt($(groupSizeFilterId)[0].value);
//     const filterText = $(searchGroupFilterId)[0].value.trim().toLowerCase();

//     // Group size filter
//     if (size && group.members.length !== size) {
//         return false;
//     }

//     // Search filter
//     if (filterText !== '' &&
//         group.name.toLowerCase().indexOf(filterText) === -1 &&
//         group.members.every(user => {
//             return `${user.fname} ${user.lname} - ${user.username}`.toLowerCase().indexOf(filterText) === -1 &&
//                 translate(`user${user.type}`).toLowerCase().indexOf(filterText) === -1
//         })) {
//         return false;
//     }

//     return true;
// }









function fillTicketRow(ticket) {
    var bindedRow = ticketEntryHTML;

    if (ticket.type === 0) {
        bindedRow.find(iconId).html('assignment');
    } else if (ticket.type === 1) {
        bindedRow.find(iconId).html('assignment');
    }

    bindedRow.find(nameId).html(ticket.title);
    bindedRow.find(estimateId).html(ticket.points);
    bindedRow.find(openTicketId)[0].href = `/project/${projectId}/team/${teamId}/ticket/${ticket._id}`;

    return bindedRow[0].outerHTML;
}
