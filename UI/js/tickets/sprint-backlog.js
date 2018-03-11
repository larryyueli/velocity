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



const typeIconId = '#typeIcon';
const priorityIconId = '#priorityIcon';
const nameId = '#name';
const openTicketId = '#openTicket';
const estimateId = '#estimate';

const searchFilterId = '#searchFilter';
const assigneeAutocompleteId = '#assigneeAutocomplete';
const typeSelectionId = '#typeSelection';
var selectedAssignee = null;
var usernamesArray = [];

const sprintsLoadId = '#sprintsLoad';
const sprintHeaderId = '#sprintHeader';
const sprintBodyId = '#sprintBody';


$(function () {
    $('select').material_select();

    $(typeSelectionId).on('change', function () {
        startLoad(sprintsLoadId, sprintsListId);
        displaySprintsList();
    });

    $(searchFilterId).on('keyup', function () {
        startLoad(sprintsLoadId, sprintsListId);
        displaySprintsList();
    });

    startLoad(sprintsLoadId, sprintsListId);
    getListOfAssignee();
    getBacklog();
});

/**
 * list of possible assignee
*/
function getListOfAssignee() {
    $.ajax({
        type: 'GET',
        url: '/project/team/members/list',
        data: {
            projectId: projectId,
            teamId: teamId
        },
        success: function (data) {
            let usersObj = {};
            let usernameObj = {};
            for (let i = 0; i < data.length; i++) {
                let user = data[i];
                usersObj[`${user.fname} ${user.lname}`] = `/profilePicture/${user.picture}`;
                usernameObj[`${user.fname} ${user.lname}`] = user.username;
                usernamesArray.push(user.username);
            }
            $(assigneeAutocompleteId).autocomplete({
                data: usersObj,
                limit: 20,
                onAutocomplete: function (val) {
                    selectedAssignee = usernameObj[val];
                    startLoad(sprintsLoadId, sprintsListId);
                    displaySprintsList();
                },
                minLength: 0,
            });
        },
        error: function (data) {
            handle401And404(data);

            endLoad(sprintsLoadId, sprintsListId);
            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}


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

            // sprintsList.forEach(sprint => {
            //     sprint.isActive = false;
            // });

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

    endLoad(sprintsLoadId, sprintsListId);
}

function fillSprintsRow(tickets) {
    var bindedRow = sprintEntryHTML;
    var isActive = false;
    bindedRow.find(backlogTicketListId).html('');

    bindedRow.find(titleId).html('Bonza - 1');

    tickets.forEach(ticket => {
        if (passTicketFilter(ticket)) {
            bindedRow.find(backlogTicketListId).append(fillTicketRow(ticket));
        }
    });

    bindedRow.find(issueCountId).html(`${tickets.length} ${translate('issuesFound')} (${bindedRow.find(backlogTicketListId).find('li').length} ${translate('total')})`);

    if (bindedRow.find(backlogTicketListId).find('li').length === 0) {
        bindedRow.find(backlogTicketListId).append(`<p class="center"><i>${translate('noResultsFoundBasedOnSearch')}</i></p>`)
    }

    // if (tickets.isActive) {
    //     bindedRow.find(sprintHeaderId).addClass('active');
    //     bindedRow.find(sprintBodyId)[0].style.display = 'block';
    // } else {
    //     bindedRow.find(sprintHeaderId).removeClass('active');
    //     bindedRow.find(sprintBodyId)[0].style.display = 'none';
    // }

    return bindedRow[0].outerHTML;
}

/**
 * Filters a group object to match filter parameters
 *
 * @param {Object} group
 */
function passTicketFilter(ticket) {
    const filterText = $(searchFilterId)[0].value.trim().toLowerCase();
    const typeValue = parseInt($(typeSelectionId).val());
    const assignee = selectedAssignee;

    // Ticket type filter
    if (typeValue !== -1 && ticket.type !== typeValue) {
        return false;
    }

    // Search filter
    if (filterText !== '' &&
        ticket.title.toLowerCase().indexOf(filterText) === -1 &&
        ticket.displayId.toLowerCase().indexOf(filterText) === -1) {
        return false;
    }

    return true;
}


function fillTicketRow(ticket) {
    var bindedRow = ticketEntryHTML;

    if (ticket.type === 0) {
        bindedRow.find(typeIconId).html('<img src="/img/icon-ladybird.png" alt="" height="25" width="auto">');
    } else if (ticket.type === 1) {
        bindedRow.find(typeIconId).html('<img src="/img/icon-code-file.png" alt="" height="25" width="auto">');
    }  else if (ticket.type === 3) {
        bindedRow.find(typeIconId).html('<img src=/img/icon-purchase-order.png" alt="" height="25" width="auto">');
    }

    if (ticket.priority === 0 ) {
       bindedRow.find(priorityIconId).html('<img src="/img/icon-low-priority.png" alt="" height="25" width="auto">');
    } else if (ticket.priority === 1) {
        bindedRow.find(priorityIconId).html('<img src="/img/icon-medium-priority.png" alt="" height="25" width="auto">');
    } else if (ticket.priority === 2) {
        bindedRow.find(priorityIconId).html('<img src="/img/icon-high-priority.png" alt="" height="25" width="auto">');
    }

    bindedRow.find(nameId).html(ticket.title);
    bindedRow.find(estimateId).html(ticket.points);
    bindedRow.find(openTicketId)[0].href = `/project/${projectId}/team/${teamId}/ticket/${ticket._id}`;

    return bindedRow[0].outerHTML;
}

/**
 * Sets the status of a sprint to opened or closed to save in memory
 *
 * @param {Object} clicked
 */
function setActive(clicked) {
    const sprintName = clicked.parent().find('#title').text();

    // const clickedSprint = sprintsList.find(sprint => {
    //     return sprint.name === sprintName;
    // });
    //
    // if (clickedSprint) {
    //     clickedSprint.isActive = !clicked.hasClass('active');
    // }
}
