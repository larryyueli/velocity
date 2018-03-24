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
const sprintsAutocompleteId = '#sprintsAutocomplete';
const releasesAutocompleteId = '#releasesAutocomplete';
const tagsAutocompleteId = '#tagsAutocomplete';
const titleFieldId = '#titleField';
const typeSelectionId = '#typeSelection';
const stateSelectionId = '#stateSelection';
const prioritySelectionId = '#prioritySelection';
const pointsId = '#pointsSelection';
const addNewCommentId = '#addNewComment';
const newCommentField = '#newComment';
const ticketSprintsDivId = '#ticketSprintsDivId';
const ticketReleasesDivId = '#ticketReleasesDivId';
const ticketTagsDivId = '#ticketTagsDivId';

var selectedAssignee = null;
var usernamesArray = [];
var selectedSprints = [];
var selectedReleases = [];
var selectedTags = [];
var sprintIdsObj = {};
var releaseIdsObj = {};
var tagIdsObj = {};

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

    $('.sprint-chips').each(function (index) {
        selectedSprints.push($(this).attr('id'));
    });

    initSummernote(descriptionId);

    getListOfAssignee();
    getListOfSprints();
    getListOfReleases();
    getListOfTags();

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

    if ($(assigneeAutocompleteId).val().trim().length === 0) {
        selectedAssignee = 'No Assignee';
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
            assignee: selectedAssignee,
            sprints: selectedSprints
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
    label.after(`<div >
                    <div class="row col12 margin-0">
                        <div class="input-field">
                            <textarea id='edit_${commentId}' class="materialize-textarea"></textarea>
                            <label >Edit Comment</label>
                        </div>
                        <div class="right">
                            <button id='edit_${commentId}_save' class="btn btn-flat waves-effect waves-light comment-buttons" onclick="updateComment('${commentId}')"><i class="material-icons right">save</i></button>
                            <button id='edit_${commentId}_close' class="btn btn-flat waves-effect waves-light comment-buttons"><i class="material-icons right">close</i></button>
                        </div>
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
        selectedSprints.splice(selectedSprints.indexOf(sprintId), 1);
    }
}

/**
 * list of possible releases
*/
function getListOfReleases() {
    $.ajax({
        type: 'GET',
        url: '/project/team/releases/list',
        data: {
            projectId: projectId,
            teamId: teamId
        },
        success: function (data) {
            let releasesObj = {};

            for (let i = 0; i < data.releasesList.length; i++) {
                let release = data.releasesList[i];
                releasesObj[`${release.name}`] = null;
                releaseIdsObj[`${release.name}`] = release._id;
            }
            $(releasesAutocompleteId).autocomplete({
                data: releasesObj,
                limit: 20,
                onAutocomplete: function (val) {
                    if (selectedReleases.indexOf(releaseIdsObj[val]) === -1) {
                        selectedReleases.push(releaseIdsObj[val]);
                        $(ticketReleasesDivId).append(`<div class="chip sprint-chips" id=${releaseIdsObj[val]}>${val}<i class="close material-icons" onClick="removeReleaseId('${releaseIdsObj[val]}')">close</i></div>`);
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
 * list of possible releases
 * 
 * @param {string} id release id
*/
function removeReleaseId(releaseId) {
    if (selectedReleases.indexOf(releaseId) !== -1) {
        selectedReleases.splice(selectedReleases.indexOf(releaseId), 1);
    }
}

/**
 * list of possible tags
*/
function getListOfTags() {
    $.ajax({
        type: 'GET',
        url: '/project/team/tags/list',
        data: {
            projectId: projectId,
            teamId: teamId
        },
        success: function (data) {
            let tagsObj = {};

            for (let i = 0; i < data.tagsList.length; i++) {
                let tag = data.tagsList[i];
                tagsObj[`${tag.name}`] = null;
                tagIdsObj[`${tag.name}`] = tag._id;
            }
            $(tagsAutocompleteId).autocomplete({
                data: tagsObj,
                limit: 20,
                onAutocomplete: function (val) {
                    if (selectedTags.indexOf(tagIdsObj[val]) === -1) {
                        selectedTags.push(tagIdsObj[val]);
                        $(ticketTagsDivId).append(`<div class="chip sprint-chips" id=${tagIdsObj[val]}>${val}<i class="close material-icons" onClick="removeTagId('${tagIdsObj[val]}')">close</i></div>`);
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
 * list of possible tags
 * 
 * @param {string} id tag id
*/
function removeTagId(tagId) {
    if (selectedTags.indexOf(tagId) !== -1) {
        selectedTags.splice(selectedTags.indexOf(tagId), 1);
    }
}