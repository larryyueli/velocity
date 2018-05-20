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

var sprintEntryHTML = null;
var ticketEntryHTML = null;
var sprintsList = null;

var isReadonly = true;

const backlogTicketListId = '#backlogTicketList';
const datesId = '#dates';
const issueCountId = '#issueCount';
const sprintsListId = '#sprintsList';
const titleId = '#title';

const typeIconId = '#typeIcon';
const priorityIconId = '#priorityIcon';
const nameId = '#name';
const openTicketId = '#openTicket';
const estimateId = '#estimate';
const statusId = '#status';
const imageId = '#image';

const searchFilterId = '#searchFilter';
const typeSelectionId = '#typeSelection';

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

    $(optionBacklogId).click(() => {
        startLoad(sprintsLoadId, sprintsListId);
        getBacklog();
    });
});

function getBacklog() {
    $.ajax({
        type: 'GET',
        url: '/components/team/backlog',
        data: {
            projectId: projectId,
            teamId: teamId
        },
        success: function (data) {
            sprintEntryHTML = $(data.sprintEntryHTML);
            ticketEntryHTML = $(data.ticketEntryHTML);
            sprintsList = data.sprintsList;
            isReadonly = data.isReadOnly;

            sprintsList.forEach(sprint => {
                sprint.isActive = true;
            });

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

    sprintsList.forEach(sprint => {
        $(sprintsListId).append(fillSprintsRow(sprint));

        sprint.tickets.forEach(ticket => {
            $(`#${ticket._id}-backlog`).on('click', function () {
                window.location.href = `/project/${projectId}/team/${teamId}/ticket/${ticket._id}`;
            });
        });
    });

    endLoad(sprintsLoadId, sprintsListId);
}

function fillSprintsRow(sprint) {
    var tickets = sprint.tickets;
    var bindedRow = sprintEntryHTML;
    var isActive = false;
    bindedRow.find(backlogTicketListId).html('');

    tickets.forEach(ticket => {
        if (passTicketFilter(ticket)) {
            bindedRow.find(backlogTicketListId).append(fillTicketRow(ticket));
        }
    });

    bindedRow.find(issueCountId).html(`${tickets.length} ${translate('issuesFound')} (${bindedRow.find(backlogTicketListId).find('li').length} ${translate('total')})`);

    if (sprint.name === 'backlog') {
        bindedRow.find(titleId).html(translate(sprint.name));
        bindedRow.find(datesId).html('');
    } else {
        bindedRow.find(titleId).html(sprint.name);
        bindedRow.find(datesId).html(`${sprint.startDate} - ${sprint.endDate}`);
    }

    if (bindedRow.find(backlogTicketListId).find('li').length === 0) {
        bindedRow.find(backlogTicketListId).append(`<p class="center"><i>${translate('noResultsFoundBasedOnSearch')}</i></p>`)
    }

    if (sprint.isActive) {
        bindedRow.find(sprintHeaderId).addClass('active');
        bindedRow.find(sprintBodyId)[0].style.display = 'block';
    } else {
        bindedRow.find(sprintHeaderId).removeClass('active');
        bindedRow.find(sprintBodyId)[0].style.display = 'none';
    }

    return bindedRow[0].outerHTML;
}

/**
 * Filters a ticket object to match filter parameters
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

    // Ticket assignee filter
    if (assignee && assignee !== '' && assignee !== ticket.assignee) {
        return false;
    }

    // Search filter
    if (filterText !== '' &&
        ticket.title.toLowerCase().indexOf(filterText) === -1 &&
        ticket.assignee.toLowerCase().indexOf(filterText) === -1 &&
        ticket.displayId.toLowerCase().indexOf(filterText) === -1) {
        return false;
    }

    return true;
}


function fillTicketRow(ticket) {
    var bindedRow = ticketEntryHTML;

    bindedRow.find(statusId).removeClass((index, className) => {
        return (className.match(/(^|\s)state\S+/g) || []).join(' ');
    });

    if (ticket.type === 0) {
        bindedRow.find(typeIconId).html('<img src="/img/icon-ladybird.png" alt="" height="25" width="auto">');
    } else if (ticket.type === 1) {
        bindedRow.find(typeIconId).html('<img src="/img/icon-code-file.png" alt="" height="25" width="auto">');
    } else if (ticket.type === 2) {
        bindedRow.find(typeIconId).html('<img src="/img/icon-purchase-order.png" alt="" height="25" width="auto">');
    }

    if (ticket.priority === 0) {
        bindedRow.find(priorityIconId).html('<img src="/img/icon-low-priority.png" alt="" height="25" width="auto">');
    } else if (ticket.priority === 1) {
        bindedRow.find(priorityIconId).html('<img src="/img/icon-medium-priority.png" alt="" height="25" width="auto">');
    } else if (ticket.priority === 2) {
        bindedRow.find(priorityIconId).html('<img src="/img/icon-high-priority.png" alt="" height="25" width="auto">');
    }

    bindedRow.attr('id', `${ticket._id}-backlog`);
    bindedRow.find(nameId).html(ticket.title);
    bindedRow.find(estimateId).html(ticket.points);
    bindedRow.find(statusId).html(translate(`state${ticket.state}`));
    bindedRow.find(imageId).html(`<img class="circle" src="/picture/${ticket.assigneePicture}" alt="" height="25" width="25">`);
    bindedRow.find(statusId).addClass(`state${ticket.state}`);

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

    const clickedSprint = sprintsList.find(sprint => {
        return sprint.name === sprintName;
    });

    if (clickedSprint) {
        clickedSprint.isActive = !clicked.hasClass('active');
    }
}
