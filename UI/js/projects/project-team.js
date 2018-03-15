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

const backButtonId = '#backButton'
const createTicketButtonId = '#createTicketButton';
const description = '#description';
const splithref = window.location.href.split('/');
const projectId = splithref[4];
const teamId = splithref[6];


const assigneeAutocompleteIssueId = '#assigneeAutocompleteIssue';
const assigneeAutocompleteId = '#assigneeAutocomplete';

var selectedAssignee = null;
var selectedAssigneeIssue = null;
var usernamesArray = [];

$(function () {
    initSummernote(description);
    $(description).summernote('disable');
    $(description).summernote({
        disableDragAndDrop: true,
        shortcuts: false
    });
    $('div.note-btn-group.btn-group button').remove();

    $(backButtonId).click(() => {
        window.location.href = '/projects';
    });

    $(createTicketButtonId).click(() => {
        window.location.href = `/project/${projectId}/team/${teamId}/tickets/add`;
    });

    getListOfAssignee();

    /*
    $.ajax({
        type: 'PUT',
        url: '/sprints/create',
        data: {
            projectId: projectId,
            teamId: teamId,
            name: 'Sprint 5',
            startDate: '1/2/2018',
            endDate: '1/20/2018'
        },
        success: function (data) {
            alert(data);
        },
        error: function (data) {
            handle401And404(data);
            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });*/

    /*
    $.ajax({
        type: 'GET',
        url: '/components/fullSprintsList',
        data: {
            projectId: projectId,
            teamId: teamId
        },
        success: function (data) {
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });*/

    /*
    $.ajax({
        type: 'GET',
        url: '/components/teamsList',
        data: {
            projectId: projectId
        },
        success: function (data) {
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });*/

    /*
    $.ajax({
        type: 'GET',
        url: '/components/ticketsList/activeSprint',
        data: {
            projectId: projectId,
            teamId: teamId
        },
        success: function (data) {
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });*/
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
            let nameObj = {};
            for (let i = 0; i < data.length; i++) {
                let user = data[i];
                usersObj[`${user.fname} ${user.lname}`] = `/profilePicture/${user.picture}`;
                usernameObj[`${user.fname} ${user.lname}`] = user.username;
                nameObj[`${user.fname} ${user.lname}`] = `${user.fname} ${user.lname}`;
                usernamesArray.push(user.username);
            }
            $(assigneeAutocompleteId).autocomplete({
                data: usersObj,
                limit: 20,
                onAutocomplete: function (val) {
                    selectedAssignee = nameObj[val];
                    startLoad(sprintsLoadId, sprintsListId);
                    displaySprintsList();
                },
                minLength: 0,
            });
            $(assigneeAutocompleteId).on('keyup', function() {
                selectedAssignee = $(assigneeAutocompleteId)[0].value;
                startLoad(sprintsLoadId, sprintsListId);
                displaySprintsList();
            });
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
            $(assigneeAutocompleteIssueId).on('keyup', function() {
                selectedAssigneeIssue = $(assigneeAutocompleteIssueId)[0].value;
                startLoad(issuesLoadId, issuesListId);
                displayIssuesList();
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