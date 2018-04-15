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

const addReleaseDiv = '#appendReleaseDiv';
const addSprintDiv = '#appendSprintDiv';
const addTagDiv = '#appendTagDiv';
const boardTypeSelectionId = '#boardTypeSelection';
const createTicketButtonId = '#createTicketButton';
const description = '#description';
const splithref = window.location.href.split('/');
const projectId = splithref[4];
const releaseCreations = '#releaseCreation';
const releaseField = '#releaseField';
const releaseInputRow = '.releaseInputRow';
const releaseVisibility = '#releaseVisibility';
const sprintCreations = '#sprintCreation';
const sprintEnd = '#endDatePicker'
const sprintField = '#sprintField';
const sprintInputRow = '.sprintInputRow';
const sprintStart = '#startDatePicker';
const sprintVisibility = '#sprintVisibility'
const tagCreations = '#tagCreation';
const tagField = '#tagField';
const tagInputRow = '.tagInputRow';
const tagVisibility = '#tagVisibility';
const teamId = splithref[6];

const assigneeAutocompleteBoardId = '#assigneeAutocompleteBoard';
const assigneeAutocompleteIssueId = '#assigneeAutocompleteIssue';
const assigneeAutocompleteId = '#assigneeAutocomplete';
const sprintFilterUserAutocompleteId = '#sprintFilterUserAutocomplete';
const releaseFilterUserAutocompleteId = '#releaseFilterUserAutocomplete';

var releaseComponent = null;
var selectedAssignee = null;
var selectedAssigneeBoard = null;
var selectedAssigneeIssue = null;
var sprintFilterUser = null;
var releaseFilterUser = null;
var sprintComponent = null;
var tagComponent = null;
var usernamesArray = [];
var isReadonly = true;

$(function () {
    initSummernote(description);
    $(description).summernote('disable');
    $(description).summernote({
        disableDragAndDrop: true,
        shortcuts: false
    });
    $('div.note-btn-group.btn-group button').remove();
    $('.note-toolbar-wrapper').remove();
    $('.note-editable').css('background-color', '#ffffff');

    $(releaseInputRow).hide();
    $(tagInputRow).hide();
    $(sprintInputRow).hide();

    $(releaseVisibility).click(() => {
        $(releaseInputRow).show();
        $(releaseVisibility).hide();
    });

    $(tagVisibility).click(() => {
        $(tagInputRow).show();
        $(tagVisibility).hide();
    });

    $(sprintVisibility).click(() => {
        $(sprintInputRow).show();
        $(sprintVisibility).hide();
    });

    $(releaseCreation).click(() => {
        createRelease();
    });

    $(tagCreation).click(() => {
        createTag();
    });

    $(sprintCreation).click(() => {
        createSprint();
    });

    $('.collapsible').collapsible();

    $(createTicketButtonId).click(() => {
        window.location.href = `/project/${projectId}/team/${teamId}/tickets/add`;
    });

    $(sprintStart).pickadate({
        onClose: () => {
            $(":focus").blur();
        },
        selectMonths: true,
        selectYears: 15,
        today: translate('today'),
        clear: translate('clear'),
        close: translate('ok'),
        closeOnSelect: false,
        container: undefined
    });

    $(sprintEnd).pickadate({
        onClose: () => {
            $(":focus").blur();
        },
        selectMonths: true,
        selectYears: 15,
        today: translate('today'),
        clear: translate('clear'),
        close: translate('ok'),
        closeOnSelect: false,
        container: undefined
    });

    getListOfAssignee();
    getComponents();
});

/**
 * Gets the release, tag, and sprint component
 */
function getComponents() {

    $.ajax({
        type: 'GET',
        url: '/components/team/management',
        data: {
            projectId: projectId,
            teamId: teamId
        },
        success: function (data) {
            releaseComponent = data.releaseEntryComponent;
            sprintComponent = data.sprintEntryComponent;
            tagComponent = data.tagEntryComponent;
            isReadonly = data.isReadOnly;

            if (isReadonly) {
                $(createTicketButton).addClass('hidden');
                $(releaseVisibility).addClass('hidden');
                $(sprintVisibility).addClass('hidden');
                $(tagVisibility).addClass('hidden');
                $("[class^='sprintOpen_']").hide();
                $("[class^='sprintActive_']").hide();
                $("[class^='releaseButton_']").hide();
                $("[class^='tagButton_']").hide();
            }
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });

}

/**
 * Creates a release
 */
function createRelease() {
    if ($(releaseField).val() === "") {
        warningSnackbar(translate('emptyRelease'));
    } else {
        $.ajax({
            type: 'PUT',
            url: '/releases/create',
            data: {
                projectId: projectId,
                teamId: teamId,
                name: $(releaseField).val()
            },
            success: function (data) {
                let release = releaseComponent;
                release = release.replace(new RegExp('release._id', 'g'), data._id);
                release = release.replace(new RegExp('release.name', 'g'), data.name);
                release = release.replace(new RegExp('projectId', 'g'), projectId);
                release = release.replace(new RegExp('teamId', 'g'), teamId);
                $(addReleaseDiv).append(release);
                $(releaseInputRow).hide();
                $(releaseVisibility).show();
                $(releaseField).val('');
            },
            error: function (data) {
                const jsonResponse = data.responseJSON;
                failSnackbar(getErrorMessageFromResponse(jsonResponse));
            }
        });
    }
}

/**
 * Creates a tag
 */
function createTag() {
    if ($(tagField).val() === "") {
        warningSnackbar(translate('emptyTag'));
    } else {
        $.ajax({
            type: 'PUT',
            url: '/tags/create',
            data: {
                projectId: projectId,
                teamId: teamId,
                name: $(tagField).val()
            },
            success: function (data) {
                let tag = tagComponent;
                tag = tag.replace(new RegExp('tag._id', 'g'), data._id);
                tag = tag.replace(new RegExp('tag.name', 'g'), data.name);
                tag = tag.replace(new RegExp('projectId', 'g'), projectId);
                tag = tag.replace(new RegExp('teamId', 'g'), teamId);
                $(addTagDiv).append(tag);
                $(tagInputRow).hide();
                $(tagVisibility).show();
                $(tagField).val('');
            },
            error: function (data) {
                const jsonResponse = data.responseJSON;
                failSnackbar(getErrorMessageFromResponse(jsonResponse));
            }
        });
    }
}

/**
 * load page
 */
function loadPage(text) {
    window.location.href = text;
}

/**
 * Creates a sprint
 */
function createSprint() {
    if ($(sprintField).val() === "") {
        warningSnackbar(translate('emptySprint'));
    } else if ($(sprintStart).val() === "") {
        warningSnackbar(translate('emptySprintStart'));
    } else if ($(sprintEnd).val() === "") {
        warningSnackbar(translate('emptySprintEnd'));
    } else {
        $.ajax({
            type: 'PUT',
            url: '/sprints/create',
            data: {
                projectId: projectId,
                teamId: teamId,
                name: $(sprintField).val(),
                startDate: $(sprintStart).val(),
                endDate: $(sprintEnd).val()
            },
            success: function (data) {
                let sprint = sprintComponent;
                sprint = sprint.replace(new RegExp('sprint._id', 'g'), data._id);
                sprint = sprint.replace(new RegExp('sprint.name', 'g'), data.name);
                sprint = sprint.replace(new RegExp('projectId', 'g'), projectId);
                sprint = sprint.replace(new RegExp('teamId', 'g'), teamId);
                sprint = sprint.replace('sprint.startDate', `${translate('startDate')}${data.startDate}`);
                sprint = sprint.replace('sprint.endDate', `${translate('endDate')}${data.endDate}`);
                $(addSprintDiv).append(sprint);
                $(sprintInputRow).hide();
                $(sprintVisibility).show();
                $(sprintField).val('');
                $(sprintStart).val('');
                $(sprintEnd).val('');
                $(`.sprintActive_${data._id}`).hide();
            },
            error: function (data) {
                const jsonResponse = data.responseJSON;
                failSnackbar(getErrorMessageFromResponse(jsonResponse));
            }
        });
    }
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
            let nameObj = {};
            for (let i = 0; i < data.length; i++) {
                let user = data[i];
                usersObj[`${user.fname} ${user.lname}`] = `/picture/${user.picture}`;
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
            $(assigneeAutocompleteId).on('keyup', function () {
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
            $(assigneeAutocompleteIssueId).on('keyup', function () {
                selectedAssigneeIssue = $(assigneeAutocompleteIssueId)[0].value;
                startLoad(issuesLoadId, issuesListId);
                displayIssuesList();
            });
            $(assigneeAutocompleteBoardId).autocomplete({
                data: usersObj,
                limit: 20,
                onAutocomplete: function (val) {
                    selectedAssigneeBoard = nameObj[val];
                    startLoad(boardsUserLoadId, boardsUserListId);
                    displayBoard();
                },
                minLength: 0,
            });
            $(assigneeAutocompleteBoardId).on('keyup', function () {
                selectedAssigneeBoard = $(assigneeAutocompleteBoardId)[0].value;
                startLoad(boardsUserLoadId, boardsUserListId);
                displayBoard();
            });
            $(sprintFilterUserAutocompleteId).autocomplete({
                data: usersObj,
                limit: 20,
                onAutocomplete: function (val) {
                    sprintFilterUser = usernameObj[val];
                    // startLoad(sprintsLoadId, sprintsListId);
                    if (globalData.boardType === 2) {
                        displayFilteredTeamData();
                    } else {
                        displayFilteredTeamDataKanban();
                    }
                },
                minLength: 0,
            });
            $(sprintFilterUserAutocompleteId).on('keyup', function () {
                sprintFilterUser = usernameObj[$(sprintFilterUserAutocompleteId)[0].value.trim()];
                // startLoad(sprintsLoadId, sprintsListId);
                if (globalData.boardType === 2) {
                    displayFilteredTeamData();
                } else {
                    displayFilteredTeamDataKanban();
                }
            });
            $(releaseFilterUserAutocompleteId).autocomplete({
                data: usersObj,
                limit: 20,
                onAutocomplete: function (val) {
                    releaseFilterUser = usernameObj[val];
                    // startLoad(sprintsLoadId, sprintsListId);
                    displayFilteredReleaseData();
                },
                minLength: 0,
            });
            $(releaseFilterUserAutocompleteId).on('keyup', function () {
                releaseFilterUser = usernameObj[$(releaseFilterUserAutocompleteId)[0].value.trim()];
                // startLoad(sprintsLoadId, sprintsListId);
                displayFilteredReleaseData();
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

/**
 * save board type
*/
function saveBoardType() {
    let boardTypeValue = $(boardTypeSelectionId).val();
    swal({
        text: translate('saveBoardType'),
        icon: 'warning',
        dangerMode: true,
        buttons: [translate('cancel'), translate('save')]
    }).then(canDelete => {
        if (canDelete) {
            $.ajax({
                type: 'POST',
                url: '/project/teams/update/boardType/me',
                data: {
                    projectId: projectId,
                    boardType: boardTypeValue
                },
                success: function (data) {
                    window.location.reload();
                },
                error: function (data) {
                    handle401And404(data);

                    const jsonResponse = data.responseJSON;
                    failSnackbar(getErrorMessageFromResponse(jsonResponse));
                }
            });
        }
    });
}

/**
 * Closes a release
 * @param {*} releaseId release id
 * @param {*} releaseName release name
 */
function closeRelease(releaseId, releaseName) {
    swal({
        text: translate('closeReleaseWarning'),
        icon: 'warning',
        dangerMode: true,
        buttons: [translate('cancel'), translate('close')]
    }).then(canClose => {
        if (canClose) {
            $.ajax({
                type: 'POST',
                url: '/releases/close',
                data: {
                    projectId: projectId,
                    teamId: teamId,
                    releaseId: releaseId
                },
                success: function (data) {
                    $(`.releaseButton_${releaseId}`).hide();
                },
                error: function (data) {
                    handle401And404(data);

                    const jsonResponse = data.responseJSON;
                    failSnackbar(getErrorMessageFromResponse(jsonResponse));
                }
            });
        }
    });
}

/**
 * Deletes a release
 * @param {*} releaseId release id
 * @param {*} releaseName release name
 */
function deleteRelease(releaseId, releaseName) {
    swal({
        text: translate('deleteReleaseWarning'),
        icon: 'warning',
        dangerMode: true,
        buttons: [translate('cancel'), translate('delete')]
    }).then(canDelete => {
        if (canDelete) {
            $.ajax({
                type: 'DELETE',
                url: '/releases/delete',
                data: {
                    projectId: projectId,
                    teamId: teamId,
                    releaseId: releaseId
                },
                success: function (data) {
                    $(`#release_${releaseId}`).hide();
                },
                error: function (data) {
                    handle401And404(data);

                    const jsonResponse = data.responseJSON;
                    failSnackbar(getErrorMessageFromResponse(jsonResponse));
                }
            });
        }
    });
}

/**
 * Deletes a tag
 * @param {*} tagId tag id
 * @param {*} tagName tag name
 */
function deleteTag(tagId, tagName) {
    swal({
        text: translate('deleteTagWarning'),
        icon: 'warning',
        dangerMode: true,
        buttons: [translate('cancel'), translate('delete')]
    }).then(canDelete => {
        if (canDelete) {
            $.ajax({
                type: 'DELETE',
                url: '/tags/delete',
                data: {
                    projectId: projectId,
                    teamId: teamId,
                    tagId: tagId
                },
                success: function (data) {
                    $(`#tag_${tagId}`).hide();
                },
                error: function (data) {
                    handle401And404(data);

                    const jsonResponse = data.responseJSON;
                    failSnackbar(getErrorMessageFromResponse(jsonResponse));
                }
            });
        }
    });
}

/**
 * Activates a sprint
 * @param {*} sprintId sprint id
 * @param {*} sprintName sprint name
 */
function activateSprint(sprintId, sprintName) {
    swal({
        text: translate('activateSprintWarning'),
        icon: 'warning',
        buttons: [translate('cancel'), translate('activate')]
    }).then(canActivate => {
        if (canActivate) {
            $.ajax({
                type: 'POST',
                url: '/sprints/activate',
                data: {
                    projectId: projectId,
                    teamId: teamId,
                    sprintId: sprintId
                },
                success: function (data) {
                    $("[class^='sprintActive']").hide();
                    $(`.sprintOpen_${sprintId}`).hide();
                    $(`.sprintActive_${sprintId}`).removeClass('hidden');
                    $(`.sprintActive_${sprintId}`).show();
                },
                error: function (data) {
                    handle401And404(data);

                    const jsonResponse = data.responseJSON;
                    failSnackbar(getErrorMessageFromResponse(jsonResponse));
                }
            });
        }
    });
}

/**
 * Closes a sprint
 * @param {*} sprintId sprint id
 * @param {*} sprintName sprint name
 */
function closeSprint(sprintId, sprintName) {
    swal({
        text: translate('closeSprintWarning'),
        icon: 'warning',
        dangerMode: true,
        buttons: [translate('cancel'), translate('close')]
    }).then(canClose => {
        if (canClose) {
            $.ajax({
                type: 'POST',
                url: '/sprints/close',
                data: {
                    projectId: projectId,
                    teamId: teamId,
                    sprintId: sprintId
                },
                success: function (data) {
                    $(`.sprintActive_${sprintId}`).hide();
                },
                error: function (data) {
                    handle401And404(data);

                    const jsonResponse = data.responseJSON;
                    failSnackbar(getErrorMessageFromResponse(jsonResponse));
                }
            });
        }
    });
}

/**
 * Deletes a sprint
 * @param {*} sprintId sprint id
 * @param {*} sprintName sprint name
 */
function deleteSprint(sprintId, sprintName) {
    swal({
        text: translate('deleteSprintWarning'),
        icon: 'warning',
        dangerMode: true,
        buttons: [translate('cancel'), translate('delete')]
    }).then(canDelete => {
        if (canDelete) {
            $.ajax({
                type: 'DELETE',
                url: '/sprints/delete',
                data: {
                    projectId: projectId,
                    teamId: teamId,
                    sprintId: sprintId
                },
                success: function (data) {
                    $(`#sprint_${sprintId}`).hide();
                },
                error: function (data) {
                    handle401And404(data);

                    const jsonResponse = data.responseJSON;
                    failSnackbar(getErrorMessageFromResponse(jsonResponse));
                }
            });
        }
    });
}

/**
 * download attachment
*/
function downloadAttachment(id) {
    window.location = `/download/file?fileId=${id}`;
}

/**
 * view image
*/
function viewImage(id) {
    $('#imageViewer').modal('open');
    $('#imageViewerImage').attr('src', `/picture/${id}`);
}