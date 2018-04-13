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
const releasesAutocompleteId = '#releasesAutocomplete';
const tagsAutocompleteId = '#tagsAutocomplete';
const titleFieldId = '#titleField';
const typeSelectionId = '#typeSelection';
const stateSelectionId = '#stateSelection';
const prioritySelectionId = '#prioritySelection';
const pointsId = '#pointsSelection';
const ticketSprintsDivId = '#ticketSprintsDivId';
const ticketReleasesDivId = '#ticketReleasesDivId';
const ticketTagsDivId = '#ticketTagsDivId';
const saveLinkButton = '#saveLinkButton';
const relatedInput = '#relatedInput';
const relatedTicketDivId = '#relatedTicketDivId';
const relatedSelectedInput = '#relatedSelectedInput';
const uploadButton = '#uploadButton';
const uploadModal = '#uploadModal';
const uploadInput = '#file-input';

var selectedAssignee = null;
var selectedSprints = [];
var selectedReleases = [];
var selectedTags = [];
var selectedRelatedObj = {};
var sprintIdsObj = {};
var releaseIdsObj = {};
var tagIdsObj = {};

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
    getListOfReleases();
    getListOfTags();

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

    if ($(assigneeAutocompleteId).val().trim().length === 0) {
        selectedAssignee = 'No Assignee';
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
            sprints: selectedSprints,
            releases: selectedReleases,
            tags: selectedTags,
            links: selectedRelatedObj
        },
        success: function (data) {
            window.location.href = `/project/${projectId}/team/${teamId}/ticket/${data}`;
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
                usersObj[`${user.fname} ${user.lname}`] = `/picture/${user.picture}`;
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
                        $(ticketReleasesDivId).append(`<div class="chip release-chips" id=${releaseIdsObj[val]}>${val}<i class="close material-icons" onClick="removeReleaseId('${releaseIdsObj[val]}')">close</i></div>`);
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
                        $(ticketTagsDivId).append(`<div class="chip tag-chips" id=${tagIdsObj[val]}>${val}<i class="close material-icons" onClick="removeTagId('${tagIdsObj[val]}')">close</i></div>`);
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

/**
 * save link function
*/
function saveLinkFunction() {
    const relatedTicket = $(relatedInput).val();
    const relatedText = $(`${relatedSelectedInput} option:selected`).text();
    const relatedValue = $(`${relatedSelectedInput} option:selected`).val();

    $(saveLinkButton).attr('disabled', true);

    $.ajax({
        type: 'GET',
        url: '/lookup/ticket/by/displayId',
        data: {
            projectId: projectId,
            teamId: teamId,
            displayId: relatedTicket
        },
        success: function (data) {
            if (selectedRelatedObj[data._id]) {
                delete selectedRelatedObj[data._id];
                $(`#${data._id} > .close`).trigger('click');
            }

            selectedRelatedObj[data._id] = relatedValue;
            $(relatedTicketDivId).append(`
                <div class="row margin-bottom-0 margin-right-10">
                    <div class="chip full-width related-chips text-left ticketStatusColors state${data.state}" id=${data._id}>
                        <img src="/picture/${data.assigneePicture}">
                        <p class="truncateTextCommon">${relatedText}: ${relatedTicket}. ${data.title}</p>
                        <i class="close material-icons" onClick="removeRelatedId('${data._id}')">delete_forever</i>
                    </div>
                </div>`);
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        },
        complete: function (data) {
            $(saveLinkButton).attr('disabled', false);
        }
    });
}

/**
 * list of possible related id
 *
 * @param {string} id related id
*/
function removeRelatedId(relatedId) {
    delete selectedRelatedObj[relatedId];
}

/**
 * upload a file
*/
function uploadFile() {
    const files = $(uploadInput).get(0).files;
    var formData = new FormData();

    if (files.length !== 1) {
        return warningSnackbar(translate('mustImportOneFile'));
    }

    formData.append('ticketImpotFile', files[0]);

    $(uploadButton).attr('disabled', true);
    return;
    $.ajax({
        type: 'PUT',
        url: '/users/import/file',
        processData: false,
        contentType: false,
        data: formData,
        success: function (data) {
            $(uploadModal).modal('close');
            successSnackbar(translate('successfulFileUpload'));
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        },
        complete: function () {
            $(uploadButton).attr('disabled', false);
        }
    });
}
