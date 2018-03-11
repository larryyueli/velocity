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

const typeSelection = $('#typeSelection');
const subtaskRow = $('.subtasksRow')
const milestoneIssuesRow = $('.milestoneIssuesRow')
const subtaskSelection = $('#subtasksSelection');
const milestoneIssuesSelection = $('#milestoneIssuesSelection');
const createTicketButtonId = '#createTicketButton';
const descriptionId = '#description';
const splithref = window.location.href.split('/');
const projectId = splithref[4];
const teamId = splithref[6];
const assigneeAutocompleteId = '#assigneeAutocomplete';
const sprintsAutocompleteId = '#sprintsAutocomplete';
const titleFieldId = '#titleField';
const typeSelectionId = '#typeSelection';
const stateSelectionId = '#stateSelection';
const prioritySelectionId = '#prioritySelection';
const pointsId = '#pointsSelection';
const ticketSprintsDivId = '#ticketSprintsDivId';

var selectedAssignee = null;
var selectedSprints = [];
var sprintIdsObj = {};

typeSelection.change(function () {
    if (typeSelection.val() == 0) {
        subtaskRow.hide();
        milestoneIssuesRow.hide();
    } else if (typeSelection.val() == 1) {
        subtaskRow.show();
        milestoneIssuesRow.hide();
    } else {
        subtaskRow.hide();
        milestoneIssuesRow.show();
    }
});

$(function () {
    typeSelection.change();
    $('select').material_select();

    initSummernote(descriptionId);

    getListOfAssignee();
    getListOfSprints();

    $(createTicketButtonId).click(() => {
        createTicketAction();
    });
});

/**
 * create ticket action
*/
function createTicketAction() {
    const titleValue = $(titleFieldId).val().trim();
    const typeValue = $(typeSelectionId).val();
    const descriptionValue = $(descriptionId).summernote('code');
    const stateValue = $(stateSelectionId).val();
    const priorityValue = $(prioritySelectionId).val();
    const pointsValue = $(pointsId).val();

    if (titleValue.length <= 0) {
        return warningSnackbar(translate('titleCanNotBeEmpty'));
    }

    if ($(descriptionId).summernote('isEmpty')) {
        return warningSnackbar(translate('descriptionCanNotBeEmpty'));
    }

    $.ajax({
        type: 'PUT',
        url: '/tickets/create',
        data: {
            projectId: projectId,
            teamId: teamId,
            title: titleValue,
            description: descriptionValue,
            type: typeValue,
            priority: priorityValue,
            state: stateValue,
            points: pointsValue,
            assignee: selectedAssignee,
            sprints: selectedSprints
        },
        success: function (data) {
            window.location.href = `/project/${projectId}/team/${teamId}`;
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}

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
            }
            $(assigneeAutocompleteId).autocomplete({
                data: usersObj,
                limit: 20,
                onAutocomplete: function (val) {
                    selectedAssignee = usernameObj[val];
                },
                minLength: 0,
            });
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}

/**
 * list of possible sprints
*/
function getListOfSprints() {
    $.ajax({
        type: 'GET',
        url: '/project/team/sprints/list',
        data: {
            projectId: projectId,
            teamId: teamId
        },
        success: function (data) {
            let sprintsObj = {};

            for (let i = 0; i < data.sprintsList.length; i++) {
                let sprint = data.sprintsList[i];
                sprintsObj[`${sprint.name}`] = null;
                sprintIdsObj[`${sprint.name}`] = sprint._id;
            }
            $(sprintsAutocompleteId).autocomplete({
                data: sprintsObj,
                limit: 20,
                onAutocomplete: function (val) {
                    if (selectedSprints.indexOf(sprintIdsObj[val]) === -1) {
                        selectedSprints.push(sprintIdsObj[val]);
                        $(ticketSprintsDivId).append(`<div class="chip sprint-chips" id=${sprintIdsObj[val]}>${val}<i class="close material-icons" onClick="removeSprintId('${sprintIdsObj[val]}')">close</i></div>`);
                    }
                },
                minLength: 0,
            });
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}

/**
 * list of possible sprints
 * 
 * @param {string} id sprint id
*/
function removeSprintId(sprintId) {
    if (selectedSprints.indexOf(sprintId) !== -1) {
        selectedSprints.splice(selectedSprints.indexOf(sprintId),1);
    }
}