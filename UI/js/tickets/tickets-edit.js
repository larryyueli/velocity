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
const saveTicketButtonId = '#saveTicketButton';
const descriptionId = '#description';
const newCommentId = '#newComment';
const splithref = window.location.href.split('/');
const projectId = splithref[4];
const teamId = splithref[6];
const ticketId = splithref[8];
const assigneeAutocompleteId = '#assigneeAutocomplete';
const titleFieldId = '#titleField';
const typeSelectionId = '#typeSelection';
const stateSelectionId = '#stateSelection';
const prioritySelectionId = '#prioritySelection';
const pointsId = '#pointsSelection';
const addNewCommentId = '#addNewComment';
const newCommentField = '#newComment';

var selectedAssignee = null;
var usernamesArray = [];

$(function () {
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

    typeSelection.change();
    $('select').material_select();

    initSummernote(descriptionId);

    getListOfAssignee();

    $(saveTicketButtonId).click(() => {
        updateTicketAction();
    });

    $(addNewCommentId).click(() => {
        addNewCommentFunction();
    });
});

/**
 * update ticket action
*/
function updateTicketAction() {
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
        type: 'POST',
        url: '/tickets/update',
        data: {
            projectId: projectId,
            teamId: teamId,
            ticketId: ticketId,
            title: titleValue,
            description: descriptionValue,
            type: typeValue,
            priority: priorityValue,
            state: stateValue,
            points: pointsValue,
            assignee: selectedAssignee
        },
        success: function (data) {
            window.location.href = `/project/${projectId}/team/${teamId}/ticket/${ticketId}`;
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}

/**
 * add a new comment
*/
function addNewCommentFunction() {
    const newCommentValue = $(newCommentField).val().trim();

    if (newCommentValue.length <= 0) {
        return warningSnackbar(translate('commentCanNotBeEmpty'));
    }

    $.ajax({
        type: 'PUT',
        url: '/comment/create',
        data: {
            projectId: projectId,
            teamId: teamId,
            ticketId: ticketId,
            content: newCommentValue
        },
        success: function (data) {
            window.location.href = `/project/${projectId}/team/${teamId}/ticket/${ticketId}`;
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
                usernamesArray.push(user.username);
            }
            $(newCommentField).atwho({
                at: '@',
                data: usernamesArray
            });
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
 * Deletes a comment
 * 
 * @param {String} commentId comment id
 */
function deleteComment(commentId) {
    $.ajax({
        type: 'DELETE',
        url: '/comment/delete',
        data: {
            projectId: projectId,
            teamId: teamId,
            ticketId: ticketId,
            commentId: commentId
        },
        success: function (data) {
            $(`#comment_${commentId}`).hide();
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}

/**
 * change a comment to a textfield
 * 
 * @param {String} commentId comment id
 */
function changeToInput(commentId) {
    let fullId = `#comment_${commentId}`;
    let label = $(fullId);
    label.after(`<div>
                    <div class="input-field">
                        <textarea id='edit_${commentId}' class="materialize-textarea"></textarea>
                        <label >Edit Comment</label>
                    </div>
                    <div  class="right">
                        <button id='edit_${commentId}_save' class="btn btn-flat waves-effect waves-light comment-buttons" onclick="updateComment('${commentId}')"><i class="material-icons right">save</i></button>
                        <button id='edit_${commentId}_close' class="btn btn-flat waves-effect waves-light comment-buttons"><i class="material-icons right">close</i></button>
                    </div>
                </div>`);

    let textbox = $(fullId).next();
    let originalText = label.html();
    textbox.find('textarea').val(originalText.split('<br>')[2]);
    textbox.find('textarea').focus();

    label.hide();
    label.next().show();

    textbox.find(`#edit_${commentId}_save`).click(function () {
        textbox.hide();
        textbox.prev().html(originalText);
        textbox.prev().show();
    });
    textbox.find(`#edit_${commentId}_close`).click(function () {
        textbox.hide();
        textbox.prev().html(originalText);
        textbox.prev().show();
    });
    textbox.find('textarea').atwho({
        at: '@',
        data: usernamesArray
    });
}

/**
 * update a comment
 * 
 * @param {String} commentId comment id
 */
function updateComment(commentId) {
    const updatedCommentValue = $(`#edit_${commentId}`).val().trim();

    if (updatedCommentValue.length <= 0) {
        return warningSnackbar(translate('commentCanNotBeEmpty'));
    }

    $.ajax({
        type: 'POST',
        url: '/tickets/comment/edit',
        data: {
            projectId: projectId,
            teamId: teamId,
            ticketId: ticketId,
            commentId: commentId,
            content: updatedCommentValue
        },
        success: function (data) {
            window.location.href = `/project/${projectId}/team/${teamId}/ticket/${ticketId}`;
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}