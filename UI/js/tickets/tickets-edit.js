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
const newCommentId = '#newComment';
const splithref = window.location.href.split('/');
const projectId = splithref[4];
const teamId = splithref[6];
const assigneeAutocompleteId = '#assigneeAutocomplete';
const titleFieldId = '#titleField';
const typeSelectionId = '#typeSelection';
const stateSelectionId = '#stateSelection';
const prioritySelectionId = '#prioritySelection';
const pointsId = '#pointsSelection';

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
});