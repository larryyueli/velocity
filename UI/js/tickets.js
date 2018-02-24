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

typeSelection.change(function () {
    if (typeSelection.val() === 'bug') {
        subtaskRow.hide();
        milestoneIssuesRow.hide();
    } else if (typeSelection.val() === 'story') {
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

    $('input.autocomplete').autocomplete({
        data: {
            "Apple": null,
            "Microsoft": null,
            "Google": 'https://placehold.it/250x250'
        },
        limit: 20, // The max amount of results that can be shown at once. Default: Infinity.
        onAutocomplete: function (val) {
            // Callback function when value is autcompleted.
        },
        minLength: 1, // The minimum length of the input for the autocomplete to start. Default: 1.
    });

    $(createTicketButtonId).click(() => {
        createTicketAction();
    });
});

/** 
 * create ticket action
*/
function createTicketAction() {
    $.ajax({
        type: 'PUT',
        url: '/tickets/create',
        data: {
            projectId: projectId,
            teamId: teamId,
            title: 'ticket title',
            description: 'ticket description',
            type: 1,
            priority: 8,
            state: 1,
            assignee: 'student1'
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