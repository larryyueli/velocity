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

const splithref = window.location.href.split('/');
const projectId = splithref[4];
const teamId = splithref[6];
const tagId = splithref[8];

const issuesListId = '#issuesList';
const issuesLoadId = '#issuesLoad';
const assigneeAutocompleteIssueId = '#assigneeAutocompleteIssue';

var usernamesArray = [];
var selectedAssigneeIssue = null;
var issuesList = null;
var issueEntry = null;

const searchFilterIssueId = '#searchFilterIssue';
const typeSelectionIssueId = '#typeSelectionIssue';
const statusId = '#status';
const typeIconId = '#typeIcon';
const priorityIconId = '#priorityIcon';
const nameId = '#name';
const estimateId  = '#estimate';
const imageId = '#image';
const openTicketId = '#openTicket';

$(function() {
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
    getTags();
})

function getTags() {
    $.ajax({
        type: 'GET',
        url: '/components/team/tag',
        data: {
            projectId: projectId,
            teamId: teamId,
            tagId: tagId
        },
        success: function (data) {
            issuesList = data.ticketsList;
            issueEntry = $(data.ticketEntryComponent);

            displayIssuesList();
            getListOfAssignee();
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}

function displayIssuesList() {
    $(issuesListId).html('');
    var rowPopulate = '';

    if (issuesList) {
        issuesList.forEach(issue => {
            if (passIssuesFilter(issue)) {
                $(issuesListId).append(fillIssuesRow(issue));

                $(`#${issue._id}`).on('click', function() {
                     window.location.href = `/project/${projectId}/team/${teamId}/ticket/${issue._id}`;
                });
            }
        });
    }

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

    bindedRow.attr('id', issue._id);
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
            let nameObj = {};
            for (let i = 0; i < data.length; i++) {
                let user = data[i];
                usersObj[`${user.fname} ${user.lname}`] = `/picture/${user.picture}`;
                usernameObj[`${user.fname} ${user.lname}`] = user.username;
                nameObj[`${user.fname} ${user.lname}`] = `${user.fname} ${user.lname}`;
                usernamesArray.push(user.username);
            }
            $(assigneeAutocompleteIssueId).autocomplete({
                data: usersObj,
                limit: 20,
                onAutocomplete: function (val) {
                    selectedAssigneeIssue = nameObj[val];
                    startLoad(issuesLoadId, issuesListId);
                    displayIssuesList();
                },
                minLength: 0,
            });
            $(assigneeAutocompleteIssueId).on('keyup', function () {
                selectedAssigneeIssue = $(assigneeAutocompleteIssueId)[0].value;
                startLoad(issuesLoadId, issuesListId);
                displayIssuesList();
            });
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}
