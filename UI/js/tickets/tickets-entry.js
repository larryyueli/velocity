/*
Copyright (C) 2018
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
const milestoneTicketsOuterRow = $('.milestoneTicketsOuterRow');
const milestoneRow = $('.milestoneRow');
const milestoneOuterRow = $('.milestoneOuterRow');
const milestoneTicketRow = $('.milestoneTicketRow')
const milestoneTicketSelection = $('#milestoneTicketSelection');
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
const attachmentsDivId = '#attachmentsDivId';
const uploadName = '#file-name';
const saveMilestoneButton = '#saveMilestoneButton';
const milestoneInput = '#milestoneInput';
const milestoneDiv = '#milestoneDiv';
const milestoneTicketsDiv = '#milestoneTicketsDiv';
const milestoneTicketsInput = '#milestoneTicketsInput';
const saveMilestoneTicketsButton = '#saveMilestoneTicketsButton';
const relatedIssuesRow = $('.relatedIssuesRow');

var attachmentsList = [];
var milestonesTicketsList = [];
var selectedAssignee = null;
var selectedMilestone = null;
var selectedSprints = [];
var selectedReleases = [];
var selectedTags = [];
var selectedRelatedObj = {};
var sprintIdsObj = {};
var releaseIdsObj = {};
var tagIdsObj = {};

$(function () {
    typeSelection.change(function () {
        if (typeSelection.val() === '0') {
            milestoneOuterRow.show();
            relatedIssuesRow.show();
            milestoneTicketsOuterRow.hide();
        } else if (typeSelection.val() === '1') {
            milestoneOuterRow.show();
            relatedIssuesRow.show();
            milestoneTicketsOuterRow.hide();
        } else if (typeSelection.val() === '2') {
            milestoneOuterRow.hide();
            relatedIssuesRow.hide();
            milestoneTicketsOuterRow.show();
        }
    });

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
            links: selectedRelatedObj,
            attachments: attachmentsList,
            milestone: selectedMilestone,
            milestoneTickets: milestonesTicketsList
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
                        $(ticketSprintsDivId).append(`
                            <div class="row margin-bottom-0 padding-right-10 padding-left-10">
                                <div class="chip full-width sprint-chips text-left" id=${sprintIdsObj[val]}>
                                    <p class="truncateTextCommon margin-bottom-0">${val}</p>
                                    <i class="close material-icons" onClick="removeSprintId('${sprintIdsObj[val]}')">delete_forever</i>
                                    <i onclick="openSprintInNewTab('${sprintIdsObj[val]}')" class="chipIcon material-icons">open_in_new</i>
                                </div>
                            </div>`);
                    }
                    $(sprintsAutocompleteId).val('');
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
                        $(ticketReleasesDivId).append(`
                            <div class="row margin-bottom-0 padding-right-10 padding-left-10">
                                <div class="chip full-width release-chips text-left" id=${releaseIdsObj[val]}>
                                    <p class="truncateTextCommon margin-bottom-0">${val}</p>
                                    <i class="close material-icons" onClick="removeReleaseId('${releaseIdsObj[val]}')">delete_forever</i>
                                    <i onclick="openReleaseInNewTab('${releaseIdsObj[val]}')" class="chipIcon material-icons">open_in_new</i>
                                </div>
                            </div>`);
                    }
                    $(releasesAutocompleteId).val('');
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
                        $(ticketTagsDivId).append(`
                            <div class="row margin-bottom-0 padding-right-10 padding-left-10">
                                <div class="chip full-width tag-chips text-left" id=${tagIdsObj[val]}>
                                    <p class="truncateTextCommon margin-bottom-0">${val}</p>
                                    <i class="close material-icons" onClick="removeTagId('${tagIdsObj[val]}')">delete_forever</i>
                                    <i onclick="openTagInNewTab('${tagIdsObj[val]}')" class="chipIcon material-icons">open_in_new</i>
                                </div>
                            </div>`);
                    }
                    $(tagsAutocompleteId).val('');
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
            if (data.type !== 0 && data.type !== 1) {
                return failSnackbar(getErrorMessageFromResponse({ code: 1000 }));
            }

            if (selectedRelatedObj[data._id]) {
                delete selectedRelatedObj[data._id];
                $(`#${data._id} > .close`).trigger('click');
            }

            selectedRelatedObj[data._id] = relatedValue;
            $(relatedTicketDivId).append(`
                <div class="row margin-bottom-0">
                    <div class="chip full-width related-chips text-left ticketStatusColors state${data.state}" id=${data._id}>
                        <img src="/picture/${data.assigneePicture}">
                        <p class="truncateTextCommon margin-bottom-0">${relatedText}: ${relatedTicket}. ${data.title}</p>
                        <i class="close material-icons" onClick="removeRelatedId('${data._id}')">delete_forever</i>
                        <i onclick="openTicketInNewTab('${data._id}')" class="chipIcon material-icons">open_in_new</i>
                    </div>
                </div>`);
            $(relatedInput).val('');
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

    formData.append('uploadedFile', files[0]);

    $(uploadButton).attr('disabled', true);

    $.ajax({
        type: 'PUT',
        url: '/upload/file',
        processData: false,
        contentType: false,
        data: formData,
        success: function (data) {
            $(uploadModal).modal('close');
            successSnackbar(translate('successfulFileUpload'));

            attachmentsList.push(data);
            $(attachmentsDivId).append(`
                <div class="row margin-bottom-0 margin-right-10">
                    <div id="${data}" class="chip full-width related-chips text-left ticketStatusColors attachmentsClass">
                        <p class="truncateTextCommon">${$(uploadName).val()}</p>
                        <i onclick="removeAttachment('${data}')" class="close material-icons">delete_forever</i>
                        <i onclick="downloadAttachment('${data}')" class="chipIcon material-icons">file_download</i>
                    </div>
                </div>
            `);
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

/**
 * remove attachment
*/
function removeAttachment(id) {
    if (attachmentsList.indexOf(id) !== -1) {
        attachmentsList.splice(attachmentsList.indexOf(id), 1);
    }
}

/**
 * download attachment
*/
function downloadAttachment(id) {
    window.location = `/download/file?fileId=${id}`;
}

/**
 * save milestone function
*/
function saveMilestoneFunction() {
    const milestoneTicket = $(milestoneInput).val();

    $(saveMilestoneButton).attr('disabled', true);

    $.ajax({
        type: 'GET',
        url: '/lookup/ticket/by/displayId',
        data: {
            projectId: projectId,
            teamId: teamId,
            displayId: milestoneTicket
        },
        success: function (data) {
            if (data.type !== 2) {
                return failSnackbar(getErrorMessageFromResponse({ code: 1000 }));
            }

            if (selectedMilestone) {
                $(`#${selectedMilestone} > .close`).trigger('click');
            }

            selectedMilestone = data._id;

            $(milestoneDiv).append(`
                <div class="row margin-bottom-0">
                    <div class="chip full-width milestone-chips text-left ticketStatusColors state${data.state}" id=${data._id}>
                        <img src="/picture/${data.assigneePicture}">
                        <p class="truncateTextCommon margin-bottom-0">${milestoneTicket}. ${data.title}</p>
                        <i class="close material-icons" onClick="removeMilestoneId('${data._id}')">delete_forever</i>
                        <i onclick="openTicketInNewTab('${data._id}')" class="chipIcon material-icons">open_in_new</i>
                    </div>
                </div>`);
            milestoneRow.hide();
            $(milestoneInput).val('');
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        },
        complete: function (data) {
            $(saveMilestoneButton).attr('disabled', false);
        }
    });
}

/**
 * remove milestone
*/
function removeMilestoneId(id) {
    selectedMilestone = null;
    milestoneRow.show();
}

/**
 * save milestone issues function
*/
function saveMilestoneTicketsFunction() {
    const milestoneIssueTicket = $(milestoneTicketsInput).val();

    $(saveMilestoneTicketsButton).attr('disabled', true);

    $.ajax({
        type: 'GET',
        url: '/lookup/ticket/by/displayId',
        data: {
            projectId: projectId,
            teamId: teamId,
            displayId: milestoneIssueTicket
        },
        success: function (data) {
            if (data.type !== 0 && data.type !== 1) {
                return failSnackbar(getErrorMessageFromResponse({ code: 1000 }));
            }

            if (milestonesTicketsList.indexOf(data._id) !== -1) {
                removeMilestoneTicket(data._id);
                $(`#${data._id} > .close`).trigger('click');
            }

            milestonesTicketsList.push(data._id);
            $(milestoneTicketsDiv).append(`
                <div class="row padding-right-10 padding-left-10 margin-top-0 padding-top-0 margin-bottom-0 padding-bottom-0">
                    <div class="chip full-width milestoneTicket-chips text-left ticketStatusColors state${data.state}" id=${data._id}>
                        <img src="/picture/${data.assigneePicture}">
                        <p class="truncateTextCommon margin-bottom-0">${milestoneIssueTicket}. ${data.title}</p>
                        <i class="close material-icons" onClick="removeMilestoneTicket('${data._id}')">delete_forever</i>
                        <i onclick="openTicketInNewTab('${data._id}')" class="chipIcon material-icons">open_in_new</i>
                    </div>
                </div>`);
            $(milestoneTicketsInput).val('');
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        },
        complete: function (data) {
            $(saveMilestoneTicketsButton).attr('disabled', false);
        }
    });
}

/**
 * remove milestone ticket
*/
function removeMilestoneTicket(id) {
    if (milestonesTicketsList.indexOf(id) !== -1) {
        milestonesTicketsList.splice(milestonesTicketsList.indexOf(id), 1);
    }
}

/**
 * open in new tab
 */
function openTicketInNewTab(ticketId) {
    var win = window.open(`/project/${projectId}/team/${teamId}/ticket/${ticketId}`, '_blank');
    win.focus();
}

/**
 * open in new tab
 */
function openReleaseInNewTab(releaseId) {
    var win = window.open(`/project/${projectId}/team/${teamId}/release/${releaseId}`, '_blank');
    win.focus();
}

/**
 * open in new tab
 */
function openTagInNewTab(tagId) {
    var win = window.open(`/project/${projectId}/team/${teamId}/tag/${tagId}`, '_blank');
    win.focus();
}

/**
 * open in new tab
 */
function openSprintInNewTab(sprintId) {
    var win = window.open(`/project/${projectId}/team/${teamId}/sprint/${sprintId}`, '_blank');
    win.focus();
}