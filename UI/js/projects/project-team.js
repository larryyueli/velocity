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
