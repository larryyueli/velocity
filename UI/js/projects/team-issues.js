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

var issueEntry = null;
var issuesList = null;

const searchFilterIssueId = '#searchFilterIssue';
const typeSelectionIssueId = '#typeSelectionIssue';

const issuesListId = '#issuesList';
const issuesLoadId = '#issuesLoad';

$(function () {
    $('select').material_select();

    $(typeSelectionIssueId).on('change', function () {
        startLoad(issuesLoadId, issuesListId);
        displayIssuesList();
    });

    $(searchFilterIssueId).on('keyup', function () {
        startLoad(issuesLoadId, issuesListId);
        displayIssuesList();
    });

    startLoad(issuesLoadId, issuesListId);
    getIssues();
});

function getIssues() {
    $.ajax({
        type: 'GET',
        url: '/components/team/issues',
        data: {
            projectId: projectId,
            teamId: teamId
        },
        success: function (data) {
            issueEntry = $(data.issueEntryHTML);
            issuesList = data.ticketsList;

            displayIssuesList();
        },
        error: function (data) {
            handle401And404(data);
        }
    });
}

function displayIssuesList() {
    $(issuesListId).html('');
    var rowPopulate = '';

    issuesList.forEach(issue => {
        if (passIssuesFilter(issue)) {
            $(issuesListId).append(fillIssuesRow(issue));
        }
    });

    if ($(issuesListId).find('li').length === 0) {
        $(issuesListId).append(`<p class="center"><i>${translate('noResultsFoundBasedOnSearch')}</i></p>`)
    }

    endLoad(issuesLoadId, issuesListId);
}

function fillIssuesRow(issue) {
    var bindedRow = issueEntry;

    bindedRow.find(statusId).removeClass((index, className) => {
        return (className.match (/(^|\s)state\S+/g) || []).join(' ');
    });

    if (issue.type === 0) {
        bindedRow.find(typeIconId).html('<img src="/img/icon-ladybird.png" alt="" height="25" width="auto">');
    } else if (issue.type === 1) {
        bindedRow.find(typeIconId).html('<img src="/img/icon-code-file.png" alt="" height="25" width="auto">');
    }  else if (issue.type === 2) {
        bindedRow.find(typeIconId).html('<img src="/img/icon-purchase-order.png" alt="" height="25" width="auto">');
    }

    if (issue.priority === 0 ) {
       bindedRow.find(priorityIconId).html('<img src="/img/icon-low-priority.png" alt="" height="25" width="auto">');
    } else if (issue.priority === 1) {
        bindedRow.find(priorityIconId).html('<img src="/img/icon-medium-priority.png" alt="" height="25" width="auto">');
    } else if (issue.priority === 2) {
        bindedRow.find(priorityIconId).html('<img src="/img/icon-high-priority.png" alt="" height="25" width="auto">');
    }

    bindedRow.find(nameId).html(issue.title);
    bindedRow.find(estimateId).html(issue.points);
    bindedRow.find(statusId).html(translate(`state${issue.state}`));
    bindedRow.find(imageId).html(`<img class="circle" src="/picture/${issue.assigneePicture}" alt="" height="25" width="25">`);
    bindedRow.find(statusId).addClass(`state${issue.state}`);

    bindedRow.find(openTicketId)[0].href = `/project/${projectId}/team/${teamId}/ticket/${issue._id}`;

    return bindedRow[0].outerHTML;
}

/**
 * Filters a ticket object to match filter parameters
 *
 * @param {Object} group
 */
function passIssuesFilter(issue) {
    const filterText = $(searchFilterIssueId)[0].value.trim().toLowerCase();
    const typeValue = parseInt($(typeSelectionIssueId).val());
    const assignee = selectedAssigneeIssue;

    // Ticket type filter
    if (typeValue !== -1 && issue.type !== typeValue) {
        return false;
    }

    // Ticket assignee filter
    if (assignee && assignee !== '' && assignee !== issue.assignee) {
        return false;
    }

    // Search filter
    if (filterText !== '' &&
        issue.title.toLowerCase().indexOf(filterText) === -1 &&
        issue.assignee.toLowerCase().indexOf(filterText) === -1 &&
        issue.displayId.toLowerCase().indexOf(filterText) === -1) {
        return false;
    }

    return true;
}
