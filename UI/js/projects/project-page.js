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

// Project ID from the path
const projectId = window.location.href.split('/project/')[1];

// Global variables from the request
var adminUserRow = null;
var groupList = [];
var groupModalEntryHTML = null;
var groupModalHTML = null;
var groupPrefix = '';
var groupRow = null;
var groupSize = null;
var groupSelectType = null;
var groupUserRow = null;
var unassignedList = null;
var projectAdminsList = null;
var projectUsersList = null;

// Permissions
var isProjectAdmin = null;
var isClassMode = null;
var isCollabMode = null;

// Element Ids
const assignedList = '#assignedList';
const boardSelection = '#boardSelection';
const boardSelectionRow = $('#boardSelectionRow');
const canForceBoardType = '#canForceBoardType';
const createGroupButtonId = '#createGroupButton';
const descriptionId = '#description';
const deleteAllGroupsId = '#deleteAllGroups';
const deleteGroupId = '#deleteGroup';
const emailId = '#email';
const groupCreateModalId = '#groupCreateModal';
const groupBodyId = '#groupBody';
const groupIconId = '#groupIcon';
const groupListId = '#groupList';
const groupLoadId = '#groupLoad';
const groupMembersList = '#groupMembersList';
const groupModalListId = '#groupModalList';
const groupNameId = '#groupName';
const groupPrefixId = '#groupPrefix';
const groupPrefixLabelId = '#groupPrefixLabel';
const groupsRowId = '#groupsRow';
const groupSelection = $('#groupSelect');
const groupSelectionCardId = '#groupSelectionCard';
const groupSizeId = '#groupSize';
const groupSizeLabelId = '#groupSizeLabel';
const groupStatusId = '#groupStatus';
const headerId = '#header';
const iconId = "#icon";
const joinGroupId = '#joinGroup';
const joinLinkId = '#joinLink';
const leaveGroupId = '#leaveGroup';
const membersId = '#members';
const nameId = '#name';
const newGroupNameId = '#newGroupName';
const newGroupId = '#newGroup';
const projectAdminsListId = '#projectAdminsList';
const projectAdminsLoadId = '#projectAdminsLoad';
const projectAdminsRowId = '#projectAdminsRow';
const projectUsersListId = '#projectUsersList';
const projectUsersLoadId = '#projectUsersLoad';
const randomizeRemainingId = '#randomizeRemaining';
const removeId = '#remove';
const saveAdminsConfigurationId = '#saveAdminsConfiguration';
const saveGroupConfigurationId = '#saveGroupConfiguration';
const sizeId = '#size'
const titleId = '#title';
const transferId = '#transfer';
const typeId = '#type';
const unassignedLoadId = '#unassignedLoad'
const unassignedUserListId = '#unassignedList';
const unassignedUserListName = 'unassignedList';
const unassignedUsersRowId = '#unassignedUsersRow';
const userGroupId = '#userGroup';

// Options in the select
const optionGroups = $('#option-groups');

// Filter Ids
const adminsSearchId = '#adminsSearch';
const groupsSearchId = '#groupsSearch';
const groupSizeFilterId = '#groupSizeFilter';
const searchAdminFilterId = '#searchAdminFilter';
const searchGroupFilterId = '#searchGroupFilter';
const searchUserFilterId = '#searchUserFilter';
const typeFilterId = '#typeFilter';
const typeAdminFilterId = '#typeAdminFilter';
const unassignedSearchId = '#unassignedSearch';

// Modal Ids
const groupModalId = '#groupModal';
const modalsSectionId = '#modals';
const modalTriggerId = '#modalTrigger';

// General settings Ids
const generalActivateButtonId = '#generalActivateButton';
const generalActiveUpdateButtonId = '#generalActiveUpdateButton';
const generalCloseButtonId = '#generalCloseButton';
const generalDeleteButtonId = '#generalDeleteButton';
const generalSaveButtonId = '#generalSaveButton';
const generalCloseButton = '#generalCloseButton';

// Navbar Ids
const navmProjectsId = '#navm-projects';
const navProjectsId = '#nav-projects';

// Drag Variables
var inDragMode = false;
var selectedUsers = [];
var selectedObjects = [];
var userDragged = null;

$(function () {
    // Navbar highlight
    $(navProjectsId).addClass('active');
    $(navmProjectsId).addClass('active');

    // Dropdown setup
    $('select').material_select();

    // Event listeners
    // Filters
    $(typeFilterId).on('change', function () {
        startLoad(unassignedLoadId, unassignedUserListId);
        displayUnassignedList();
    });

    $(searchUserFilterId).on('keyup', function () {
        startLoad(unassignedLoadId, unassignedUserListId);
        displayUnassignedList();
    });

    $(searchGroupFilterId).on('keyup', function () {
        startLoad(groupLoadId, groupListId);
        displayGroupList();
    });

    $(groupSizeFilterId).on('keyup mouseup', function () {
        startLoad(groupLoadId, groupListId);
        displayGroupList();
    });

    $(searchAdminFilterId).on('keyup', function () {
        startLoad(projectAdminsLoadId, projectAdminsListId);
        startLoad(projectUsersLoadId, projectUsersListId);
        displayAdminsList();
    });

    $(typeAdminFilterId).on('change', function () {
        startLoad(projectAdminsLoadId, projectAdminsListId);
        startLoad(projectUsersLoadId, projectUsersListId);
        displayAdminsList();
    });

    // Actions
    $(randomizeRemainingId).click(() => {
        if (!groupSize || groupSize < 1) {
            failSnackbar(translate('groupSizeCantBeZero'));
        } else {
            swal({
                text: translate('randomizeRemainingWarning'),
                icon: 'warning',
                dangerMode: false,
                buttons: [translate('cancel'), translate('randomize')]
            }).then((randomize) => {
                if (randomize) {
                    randomizeRemaining();
                }
            });
        }
    });

    $(saveGroupConfigurationId).click(() => {
        saveGroupConfiguration();
    });

    $(saveAdminsConfigurationId).click(() => {
        saveAdminsConfiguration();
    });

    $(groupStatusId).on('change', function () {
        groupSelectType = parseInt($(groupStatusId).val());

        if (groupSelectType === 0) {
            $(groupSizeId).val(1);
            $(groupSizeId).prop('disabled', true);
        } else if (groupSelectType === 1 || groupSelectType === 2) {
            $(groupSizeId).prop('disabled', false);
        } else if (groupSelectType === 3) {
            $(groupSizeId).prop('disabled', false);
        }
    });

    groupSelection.click(() => {
        groupSelectType = parseInt($(groupStatusId).val());
        groupSize = parseInt($(groupSizeId).val());
        groupPrefix = $(groupPrefixId).val();

        if (!groupSize || groupSize < 1) {
            failSnackbar(translate('groupSizeCantBeZero'));
        } else {
            if (groupList.length) {
                swal({
                    text: translate('deletePremadeGroups'),
                    icon: 'warning',
                    dangerMode: true,
                    buttons: [translate('cancel'), translate('delete')]
                }).then((deleteGroups) => {
                    changeGroupSelectionMode(deleteGroups);
                });
            } else {
                changeGroupSelectionMode(false);
            }
        }
    });

    $('.modal').modal({
        dismissible: true
    });

    $(createGroupButtonId).click(() => {
        const groupName = $(newGroupNameId).val().trim();

        if (groupName === '') {
            failSnackbar(translate('groupNameCantBeEmpty'));
        } else if (groupList.find(group => group.name === groupName)) {
            failSnackbar(translate('groupNameAlreadyExists'));
        } else {
            groupList.push(makeGroupObject(false, [], groupName));

            if (!isProjectAdmin) {
                joinGroup(null, groupName);
            }

            $(groupCreateModalId).modal('close');
            startLoad(groupLoadId, groupListId);
            displayGroupList();
        }
    });

    $(deleteAllGroupsId).click(() => {
        if (groupList.length) {
            swal({
                text: translate('deleteAllGroupsWarning'),
                icon: 'warning',
                dangerMode: true,
                buttons: [translate('cancel'), translate('delete')]
            }).then(canDelete => {
                if (canDelete) {
                    emptyGroups();
                    reloadAllLists();
                }
            });
        }
    });

    $(canForceBoardType).change(() => {
        if ($(canForceBoardType).is(':checked')) {
            boardSelectionRow.show();
        } else {
            boardSelectionRow.hide();
        }
    });

    // General actions
    $(generalDeleteButtonId).click(() => { generalDeleteProject(); });
    $(generalSaveButtonId).click(() => { generalSaveProject(); });
    $(generalActivateButtonId).click(() => { generalActivateProject(); });
    $(generalCloseButton).click(() => { generalCloseProject(); });
    $(canForceBoardType).change();

    // Loads the groups and unassigned users, and starts the loaders
    startLoad(groupLoadId, groupListId);
    startLoad(unassignedLoadId, unassignedUserListId);
    getGroupAssign();

    startLoad(projectAdminsLoadId, projectAdminsListId);
    startLoad(projectUsersLoadId, projectUsersListId);
    getUsersList();
});

// ----------------------- Begin general helpers section -----------------------

/**
 * Returns a group object based on the given parameters
 *
 * @param {Boolean} active
 * @param {List} members
 * @param {String} groupName
 */
function makeGroupObject(active, members, groupName) {
    return {
        isActive: active,
        members: members,
        name: groupName
    }
}

/**
 * Empties all the groups that are already made
*/
function emptyGroups() {
    groupList.forEach(group => {
        group.members.forEach(user => {
            unassignedList.push(user);
        });
    });

    groupList = [];
}

/**
 * Returns a name of a group that has not been taken before
 */
function getUntakenName(name) {
    var customName = name;
    var counter = 0;

    while (groupList.find(group => group.name === customName)) {
        customName = `${name} (${++counter})`;
    }

    return customName;
}

/**
 * Reloads all visible lists
 */
function reloadAllLists() {
    $(groupModalId).modal('close');
    startLoad(groupLoadId, groupListId);
    startLoad(unassignedLoadId, unassignedUserListId);
    displayUnassignedList();
    displayGroupList();
}

/**
 * Sets the status of a group to opened or closed to save in memory
 *
 * @param {Object} clicked
 */
function setActive(clicked) {
    const groupName = clicked.parent().find('#title').text();

    const clickedGroup = groupList.find(group => {
        return group.name === groupName;
    });

    if (clickedGroup) {
        clickedGroup.isActive = !clicked.hasClass('active');
    }
}

// ----------------------- End general helpers section -----------------------

// ----------------------- Begin Requests section -----------------------

function changeGroupSelectionMode(deleteGroups) {
    if (deleteGroups) {
        emptyGroups();
    }

    if (groupSelectType === 0) {
        individualMode();
    } else if (groupSelectType === 1 || groupSelectType === 2) {
        groupVisibility();
    } else if (groupSelectType === 3) {
        randomizeRemaining();
    }

    $.ajax({
        type: 'POST',
        url: '/project/teams/config',
        data: {
            projectId: projectId,
            groupSelectType: groupSelectType,
            groupSize: groupSize,
            groupPrefix: groupPrefix
        },
        success: function (data) {
            successSnackbar(translate('groupSelectionConfigurationSuccess'));
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}
/**
 * Gets the list on unassigned users and groups along with all the HTML
  * needed for the binding
 */
function getGroupAssign() {
    $.ajax({
        type: 'GET',
        url: '/projectsGroupAssign',
        data: {
            projectId: projectId
        },
        success: function (data) {
            // Permissions
            isProjectAdmin = data.isProjectAdmin;
            isClassMode = data.isClassMode;
            isCollabMode = data.isClassMode;

            // Variables
            groupUserRow = $(data.groupUserHTML);
            unassignedList = data.unassignedList;
            groupRow = $(data.groupHTML);
            groupList = data.groupList;
            groupList.forEach(group => {
                group.isActive = false;
            });
            groupModalHTML = $(data.groupModalHTML);
            groupModalEntryHTML = $(data.groupModalEntryHTML);
            groupSize = data.groupSize;
            $(groupSizeId).val(groupSize);
            $(groupSizeLabelId).addClass('active');
            groupSelectType = data.groupSelectionType;
            $(groupStatusId).val(groupSelectType);
            $(groupStatusId).material_select();
            groupPrefix = data.groupPrefix
            $(groupPrefixId).val(groupPrefix);
            $(groupPrefixLabelId).addClass('active');

            if (groupSelectType === 0) {
                $(groupSizeId).prop('disabled', true);
            } else if (groupSelectType === 1 || groupSelectType === 2) {
                $(groupSizeId).prop('disabled', false);
            } else if (groupSelectType === 3) {
                $(groupSizeId).prop('disabled', false);
            }

            // Group modal setup
            $(modalsSectionId).html(groupModalHTML);
            $('.modal').modal({
                dismissible: true,
                ready: function (modal, trigger) {
                    const username = trigger.parent().find(nameId).text();
                    $(groupModalId).find(titleId).html(translate('selectGroup'));
                    $(groupModalId).find(nameId).html(username);
                }
            });

            // Displays the lists
            displayUnassignedList();
            displayGroupList();
        },
        error: function (data) {
            handle401And404(data);

            $(groupListId).append(`<p class="center"><i>${translate('defaultError')}</i></p>`);
            $(unassignedUserListId).append(`<p class="center"><i>${translate('defaultError')}</i></p>`);

            $(unassignedSearchId).addClass('hidden');
            $(groupsSearchId).addClass('hidden');
            $(saveGroupConfigurationId).addClass('hidden');
            $(deleteAllGroupsId).addClass('hidden');
            $(newGroupId).addClass('hidden');
            $(randomizeRemainingId).addClass('hidden');
            $(groupSelectionCardId).addClass('hidden');
            $(groupsRowId).addClass('hidden');
            $(unassignedUsersRow).addClass('hidden');
            $(groupListId).addClass('light-border');
            $(groupListId).removeClass('collapsible');

            endLoad(groupLoadId, groupListId);
            endLoad(unassignedLoadId, unassignedUserListId);
        }
    });
}

/**
 * delete a project
 */
function generalDeleteProject() {
    swal({
        text: translate('deleteProjectPrompt'),
        icon: 'warning',
        dangerMode: true,
        buttons: [translate('cancel'), translate('delete')]
    }).then(canDelete => {
        if (canDelete) {
            $.ajax({
                type: 'DELETE',
                url: '/project/delete',
                data: {
                    projectId: projectId
                },
                success: function (data) {
                    window.location.href = '/projects';
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
 * Updates the group assignment
 */
function saveGroupConfiguration() {
    $.ajax({
        type: 'POST',
        url: '/project/teams/update',
        data: {
            projectId: projectId,
            teamsList: groupList ? groupList : []
        },
        success: function (data) {
            successSnackbar(translate('groupConfigurationSuccess'));
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}

/**
 * Updates the admin configuration
 */
function saveAdminsConfiguration() {
    $.ajax({
        type: 'POST',
        url: '/project/admins/update',
        data: {
            projectId: projectId,
            adminsList: projectAdminsList ? projectAdminsList : []
        },
        success: function (data) {
            successSnackbar(translate('adminConfigurationSuccess'));
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}

/**
 * update a project
 */
function generalSaveProject() {
    if ($(descriptionId).summernote('isEmpty')) {
        return warningSnackbar(translate('emptyProjectDescription'));
    }

    const titleText = $(titleId).val();
    const descriptionText = $(descriptionId).summernote('code');
    swal({
        text: translate('saveProjectPrompt'),
        icon: 'warning',
        dangerMode: true,
        buttons: [translate('cancel'), translate('save')]
    }).then(canSave => {
        if (canSave) {
            $.ajax({
                type: 'POST',
                url: '/project/update',
                data: {
                    projectId: projectId,
                    title: titleText,
                    description: descriptionText
                },
                success: function (data) {
                    successSnackbar(translate('updatedProject'));
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
 * activate a project
 */
function generalActivateProject() {
    swal({
        text: translate('activateProjectPrompt'),
        icon: 'warning',
        dangerMode: true,
        buttons: [translate('cancel'), translate('activate')]
    }).then(canActivate => {
        if (canActivate) {
            $.ajax({
                type: 'POST',
                url: '/project/activate',
                data: {
                    projectId: projectId
                },
                success: function (data) {
                    successSnackbar(translate('activatedProject'));
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
 * Closes a project
 */
function generalCloseProject() {
    swal({
        text: translate('closeProjectPrompt'),
        icon: 'warning',
        dangerMode: true,
        buttons: [translate('cancel'), translate('close')]
    }).then(canClose => {
        if (canClose) {
            
        }
    });
}

/**
 * gets the list of both project admins and non project admins along with the
 * HTML entry to bind
 */
function getUsersList() {
    $.ajax({
        type: 'GET',
        url: '/components/projectsAdminsList',
        data: {
            projectId: projectId
        },
        success: function (data) {
            adminUserRow = $(data.usersEntryHTML);
            projectAdminsList = data.projectAdmins;
            projectUsersList = data.projectUsers;
            displayAdminsList();
        },
        error: function (data) {
            handle401And404(data);

            $(projectAdminsListId).append(`<p class="center"><i>${translate('defaultError')}</i></p>`);
            $(projectUsersListId).append(`<p class="center"><i>${translate('defaultError')}</i></p>`);

            $(adminsSearchId).addClass('hidden');
            $(saveAdminsConfigurationId).addClass('hidden');
            $(projectAdminsRowId).addClass('hidden');

            endLoad(projectAdminsLoadId, projectAdminsListId);
            endLoad(projectUsersLoadId, projectUsersListId);
        }
    });
}

function nonAdminChangeGroup(action, groupName, callback) {
    $.ajax({
        type: 'POST',
        url: '/project/teams/update/me',
        data: {
            projectId: projectId,
            action: action,
            teamName: groupName
        },
        success: function (data) {
            callback();
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}

// ------------------------ End Requests section -----------------------

// ------------------------ Begin Mode Selection section -----------------------

/**
 * Sets the mode to be individual and populates the individual groups
 */
function individualMode() {
    groupSize = 1;
    var tempGroup = [];
    var random = null;
    var groupNumber = 0;

    while (unassignedList.length) {
        groupNumber += 1;
        random = unassignedList[Math.floor(Math.random() * unassignedList.length)];
        unassignedList.splice(unassignedList.indexOf(random), 1);
        groupList.push(makeGroupObject(false, [random], getUntakenName(`${groupPrefix}${groupNumber}`)));
    }

    reloadAllLists();
}

/**
 * randomizes the remaining users in the unassigned list
 */
function randomizeRemaining() {
    randomizeUnassigned();
    reloadAllLists();
}

/**
 * Randomizes the users in the unassigned list based on the users filter
 */
function randomizeUnassigned() {
    var tempGroup = [];
    var random = null;
    var groupNumber = 0;

    const filteredList = unassignedList.filter(user => {
        return passUserFilter(user);
    });

    while (filteredList.length) {
        tempGroup = [];
        groupNumber += 1;

        for (var i = 0; i < groupSize; i++) {
            if (filteredList.length === 0) {
                break;
            }

            random = filteredList[Math.floor(Math.random() * filteredList.length)];
            tempGroup.push(random)
            unassignedList.splice(unassignedList.indexOf(random), 1);
            filteredList.splice(filteredList.indexOf(random), 1);
        }

        groupList.push(makeGroupObject(false, tempGroup, getUntakenName(`${groupPrefix}${groupNumber}`)));
    }
}

/**
 * Sets up group visibility mode
 */
function groupVisibility() {
    reloadAllLists();
}

// ------------------------ End Mode Selection section -----------------------

// ------------------------ Begin User Binding section -----------------------

/**
 * Displays the unassigned users list
 */
function displayUnassignedList() {
    if (isProjectAdmin) {
        deselectAllUsers();

        $(unassignedUserListId).html('');
        var rowPopulate = '';

        unassignedList.forEach(user => {
            if (passUserFilter(user)) {
                $(unassignedUserListId).append(fillUserRow(user, true));
            }
        });

        if ($(unassignedUserListId).find('li').length === 0) {
            $(unassignedUserListId).append(`<p class="center"><i>${translate('noResultsFoundBasedOnSearch')}</i></p>`);
        }

        endLoad(unassignedLoadId, unassignedUserListId);
    }
}

/**
 * Fills a row entry of a user
 *
 * @param {Object} user
 */
function fillUserRow(user, isUnassigned) {
    var bindedRow = groupUserRow;

    bindedRow.find(iconId).html(userIcons[user.type]);
    bindedRow.find(nameId).html(`${user.fname} ${user.lname} - ${user.username}`);

    if (isUnassigned || !isProjectAdmin) {
        bindedRow.find(removeId).addClass('hidden');
    } else {
        bindedRow.find(removeId).removeClass('hidden');
    }

    if (!isProjectAdmin) {
        bindedRow.find(modalTriggerId).addClass('hidden');
        bindedRow.attr('draggable', null)
        bindedRow.attr('ondrag', null)
        bindedRow.attr('ondragend', null)
        bindedRow.attr('onclick', null)
    } else {
        bindedRow.find(modalTriggerId).removeClass('hidden');
    }

    return bindedRow[0].outerHTML;
}

/**
 * Filters a user object to match filter parameters
 *
 * @param {Object} user
 */
function passUserFilter(user) {
    const type = parseInt($(typeFilterId)[0].value);
    const filterText = $(searchUserFilterId)[0].value.trim().toLowerCase();

    // User type filter
    if (type !== -1 && type !== user.type) {
        return false;
    }

    // User search filter
    if (filterText !== '' &&
        `${user.fname} ${user.lname} - ${user.username}`.toLowerCase().indexOf(filterText) === -1 &&
        translate(`user${user.type}`).toLowerCase().indexOf(filterText) === -1) {
        return false;
    }

    return true;
}

// ------------------------ End User Binding section -----------------------

// ------------------------ Begin Group Binding section -----------------------

/**
 * displays the groups list
 */
function displayGroupList() {
    deselectAllUsers();
    $(groupListId).html('');
    $(userGroupId).html('');
    var rowPopulate = '';

    groupList.forEach(group => {
        var inGroup = null;
        if (passGroupFilter(group)) {
            if (!isProjectAdmin) {
                inGroup = groupList.find(groupSearch => {
                    return group.name === groupSearch.name && groupSearch.members.find(user => {
                        return user.username === meObject.username;
                    });
                });

                if (inGroup) {
                    $(userGroupId).append(fillGroupRow(group, true));
                } else {
                    $(groupListId).append(fillGroupRow(group, false));
                }
            } else {
                $(groupListId).append(fillGroupRow(group, false));
            }
        }
    });

    if ($(groupListId).find('li').length === 0) {
        $(groupListId).append(`<p class="center"><i>${translate('noResultsFoundBasedOnSearch')}</i></p>`);
    }

    if ($(userGroupId).find('li').length === 0) {
        $(userGroupId).append(`<p class="center"><i>${translate('notInGroup')}</i></p>`);
    }

    endLoad(groupLoadId, groupListId);
}

/**
 * fills an entry of a group
 *
 * @param {Object} group
 */
function fillGroupRow(group, isInGroup) {
    var bindedRow = groupRow;
    var color = colours.red;
    var isActive = false;
    bindedRow.find(assignedList).html('');

    if (isClassMode) {
        if (group.members.length < groupSize) {
            color = colours.yellow;
        } else if (group.members.length === groupSize) {
            color = colours.green
        }

        bindedRow.find(headerId)[0].style.backgroundColor = color;
    }

    if (isInGroup) {
        bindedRow.find(leaveGroupId).removeClass('hidden');
        bindedRow.find(deleteGroupId).addClass('hidden');
        bindedRow.find(joinGroupId).addClass('hidden');
    } else {
        bindedRow.find(leaveGroupId).addClass('hidden');

        if (!isProjectAdmin) {
            bindedRow.find(deleteGroupId).addClass('hidden');
            bindedRow.find(joinGroupId).removeClass('hidden');
        } else {
            bindedRow.find(deleteGroupId).removeClass('hidden');
            bindedRow.find(joinGroupId).addClass('hidden');
        }
    }

    if (!isProjectAdmin) {
        bindedRow.attr('ondragover', null)
        bindedRow.attr('ondrop', null)
    }

    if (group.isActive) {
        bindedRow.find(headerId).addClass('active');
        bindedRow.find(groupBodyId)[0].style.display = 'block';
    } else {
        bindedRow.find(headerId).removeClass('active');
        bindedRow.find(groupBodyId)[0].style.display = 'none';
    }

    bindedRow.find(titleId).html(group.name);

    if (isClassMode) {
        bindedRow.find(groupSizeId).html(`(${group.members.length}/${groupSize})`);
    } else {
        bindedRow.find(groupSizeId).html(`(${group.members.length})`);
    }

    group.members.forEach(user => {
        bindedRow.find(assignedList).append(fillUserRow(user, false));
    });

    return bindedRow[0].outerHTML;
}

/**
 * Filters a group object to match filter parameters
 *
 * @param {Object} group
 */
function passGroupFilter(group) {
    const size = parseInt($(groupSizeFilterId)[0].value);
    const filterText = $(searchGroupFilterId)[0].value.trim().toLowerCase();

    // Group size filter
    if (size && group.members.length !== size) {
        return false;
    }

    // Search filter
    if (filterText !== '' &&
        group.name.toLowerCase().indexOf(filterText) === -1 &&
        group.members.every(user => {
            return `${user.fname} ${user.lname} - ${user.username}`.toLowerCase().indexOf(filterText) === -1 &&
                translate(`user${user.type}`).toLowerCase().indexOf(filterText) === -1
        })) {
        return false;
    }

    return true;
}

/**
 * Displays the groups in the modal
 *
 * @param {Object} clicked
 */
function displayGroupsModalList(clicked) {
    $(groupModalListId).html('');
    var rowPopulate = '';

    groupList.forEach(group => {
        if (passGroupFilter(group)) {
            $(groupModalListId).append(fillGroupModalRow(group));
        }
    });

    if ($(groupModalListId).find('li').length === 0) {
        $(groupModalListId).append(`<p class="center"><i>${translate('noResultsFoundBasedOnSearch')}</i></p>`);
    }
}

/**
 * Fills a group row in the modal
 *
 * @param {Object} group
 */
function fillGroupModalRow(group) {
    var bindedRow = groupModalEntryHTML;
    var membersList = '';
    var color = colours.red;

    if (isClassMode) {
        if (group.members.length < groupSize) {
            color = colours.yellow;
        } else if (group.members.length === groupSize) {
            color = colours.green
        }

        bindedRow.find(groupIconId)[0].style.backgroundColor = color;
    }

    bindedRow.find(groupNameId).html(group.name);
    if (isClassMode) {
        bindedRow.find(sizeId).html(`(${group.members.length}/${groupSize})`);
    } else {
        bindedRow.find(sizeId).html(`${translate('size')}: ${group.members.length}`);
    }

    group.members.forEach(user => {
        membersList = (`${membersList}${user.fname} ${user.lname} - ${user.username}\n`);
    });

    bindedRow.find(membersId).html(membersList);
    return bindedRow[0].outerHTML;
}

// ------------------------ End Group Binding section -----------------------

// ------------------------ Begin User Movement section -----------------------

/**
 * Finds if the user is in a group or not
 *
 * @param {Object} clicked
 */
function moveUser(clicked) {
    const nameSplit = $(groupModalId).find(nameId).text().split('-');
    const userName = nameSplit[nameSplit.length - 1].trim();
    const groupName = clicked.parent().parent().find(groupNameId).text().trim();

    const userObject = unassignedList.find(user => {
        return user.username === userName;
    });

    if (userObject) {
        moveFromUnassignedToGroup(groupName, userName);
    } else {
        moveFromGroupToGroup(groupName, userName);
    }
}

/**
 * Moves an unassigned user to a group
 *
 * @param {String} groupName
 * @param {String} userName
 */
function moveFromUnassignedToGroup(groupName, userName) {
    const userObject = unassignedList.find(user => {
        return user.username === userName;
    });

    groupList.find(group => {
        return group.name === groupName;
    }).members.push(userObject);

    unassignedList.splice(unassignedList.indexOf(userObject), 1);
    reloadAllLists();
}

/**
 * Moves a user from one group to another group
 *
 * @param {String} groupName
 * @param {String} userName
 * @param {Boolean} isDrag
 */
function moveFromGroupToGroup(groupName, userName, isDrag) {
    const oldGroup = groupList.find(group => {
        return group.members.find(user => {
            return user.username === userName;
        });
    });

    if (oldGroup.name === groupName) {
        if (!isDrag) {
            failSnackbar(translate('alreadyInGroup'));
        }
    } else {
        const userObject = oldGroup.members.find(user => {
            return user.username === userName;
        });

        groupList.find(group => {
            return group.name === groupName;
        }).members.push(userObject);

        oldGroup.members.splice(oldGroup.members.indexOf(userObject), 1);

        if (!isProjectAdmin && oldGroup.members.length === 0) {
            groupList.splice(groupList.indexOf(oldGroup), 1);
        }
        reloadAllLists();
    }
}

/**
 * Removes a user from a group and puts them in the unassigned list
 *
 * @param {Object} clicked
 */
function removeFromGroup(event, clicked) {
    event.stopPropagation();

    const nameSplit = clicked.parent().find(nameId).text().split('-');
    const userName = nameSplit[nameSplit.length - 1].trim();

    const oldGroup = groupList.find(group => {
        return group.members.find(user => {
            return user.username === userName;
        });
    });

    const userObject = oldGroup.members.find(user => {
        return user.username === userName;
    });

    unassignedList.push(userObject);

    oldGroup.members.splice(oldGroup.members.indexOf(userObject), 1);
    reloadAllLists();
}

/**
 * Deletes a group and moves group members to unassigned list
 *
 * @param {Object} clicked
 */
function deleteGroup(clicked, event) {
    event.stopPropagation();
    const groupName = clicked.parent().find('#title').text().trim();

    const groupToDelete = groupList.find(group => {
        return group.name === groupName;
    });

    if (groupToDelete.members.length) {
        swal({
            text: translate('groupMembersDelete'),
            icon: 'warning',
            dangerMode: true,
            buttons: [translate('cancel'), translate('delete')]
        }).then(canDelete => {
            if (canDelete) {
                groupToDelete.members.forEach(user => {
                    unassignedList.push(user);
                });

                groupList.splice(groupList.indexOf(groupToDelete), 1);
                reloadAllLists();
            }
        });
    } else {
        groupList.splice(groupList.indexOf(groupToDelete), 1);
        reloadAllLists();
    }

}

/**
 * Removes the current user from a group
 */
function leaveGroup(event) {
    event.stopPropagation();
    const userName = meObject.username;

    const oldGroup = groupList.find(group => {
        return group.members.find(user => {
            return user.username === userName;
        });
    });

    nonAdminChangeGroup('remove', oldGroup.name, function () {
        const userObject = oldGroup.members.find(user => {
            return user.username === userName;
        });

        unassignedList.push(userObject);

        oldGroup.members.splice(oldGroup.members.indexOf(userObject), 1);

        if (oldGroup.members.length === 0) {
            groupList.splice(groupList.indexOf(oldGroup), 1);
        }

        reloadAllLists();
    });
}

/**
 * joins the current user in a group
 *
 * @param {Object} clicked
 * @param {String} createdGroup
 */
function joinGroup(clicked, createdGroup, event) {
    if (event) {
        event.stopPropagation();
    }

    const userName = meObject.username;
    const groupName = createdGroup || clicked.parent().find(titleId).text();

    const userObject = unassignedList.find(user => {
        return user.username === userName;
    });

    nonAdminChangeGroup('add', groupName, function () {
        if (userObject) {
            moveFromUnassignedToGroup(groupName, userName);
        } else {
            moveFromGroupToGroup(groupName, userName);
        }
    });
}

// ------------------------ End User Movement section -----------------------

// ------------------------ Begin Drag Movement section -----------------------

function dragfunction(event) {
    if (!inDragMode) {
        const nameSplit = $(event.target).find(nameId).text().split('-');
        const userName = nameSplit[nameSplit.length - 1].trim();
        userDragged = userName;

        const groups = $(groupListId).find('li');
        for (var i = 0; i < groups.length; i++) {
            if (groups[i].className.indexOf('collection-item') === -1) {
                groups[i].style.border = 'green dashed';
            }
        }

        if (selectedUsers.indexOf(userName) === -1) {
            deselectAllUsers();
        }

        inDragMode = true;
    }
}

function unDragfunction() {
    const groups = $(groupListId).find('li');
    for (var i = 0; i < groups.length; i++) {
        if (groups[i].className.indexOf('collection-item') === -1) {
            groups[i].style.border = '';
        }
    }

    inDragMode = false;
}

function dragMovement(event) {
    const dragToGroup = $(event.currentTarget).find(titleId).text().trim();

    if (selectedUsers.length) {
        selectedUsers.forEach(username => {
            let tempuser = unassignedList.find(user => {
                return user.username === username;
            });

            if (tempuser) {
                moveFromUnassignedToGroup(dragToGroup, username);
            } else {
                moveFromGroupToGroup(dragToGroup, username, true);
            }
        });
    } else {
        let userObject = unassignedList.find(user => {
            return user.username === userDragged;
        });

        if (userObject) {
            moveFromUnassignedToGroup(dragToGroup, userDragged);
        } else {
            moveFromGroupToGroup(dragToGroup, userDragged, true);
        }
    }
}

// ------------------------ End Drag Movement section -----------------------

// ------------------------ Begin User Admin section -----------------------

/**
 * displays the project users list and the project admins list
 */
function displayAdminsList() {
    $(projectAdminsListId).html('');
    $(projectUsersListId).html('');
    var rowPopulate = '';

    projectUsersList.forEach(user => {
        if (passAdminsFilter(user)) {
            $(projectUsersListId).append(fillAdminsRow(user));
        }
    });

    projectAdminsList.forEach(user => {
        if (passAdminsFilter(user)) {
            $(projectAdminsListId).append(fillAdminsRow(user));
        }
    });

    if ($(projectAdminsListId).find('li').length === 0) {
        $(projectAdminsListId).append(`<p class="center"><i>${translate('noResultsFoundBasedOnSearch')}</i></p>`)
    }

    if ($(projectUsersListId).find('li').length === 0) {
        $(projectUsersListId).append(`<p class="center"><i>${translate('noResultsFoundBasedOnSearch')}</i></p>`)
    }

    endLoad(projectAdminsLoadId, projectAdminsListId);
    endLoad(projectUsersLoadId, projectUsersListId);
}

/**
 * Fills a user row for the admin users page
 *
 * @param {Object} user
 */
function fillAdminsRow(user) {
    var bindedRow = adminUserRow;
    var status = user.status;

    bindedRow.find(iconId).html(userIcons[user.type]);
    bindedRow.find(nameId).html(`${user.fname} ${user.lname} - ${user.username}`);
    bindedRow.find(typeId).html(`${translate(`user${user.type}`)}`);
    bindedRow.find(emailId).html(user.email);

    if (user.username === meObject.username) {
        bindedRow.find(transferId).addClass('hidden');
    } else {
        bindedRow.find(transferId).removeClass('hidden');
    }
    return bindedRow[0].outerHTML;
}

/**
 * Returns a boolean to indicate whether the user passes the admins filter or not
 *
 * @param {Object} user
 * @return {Boolean} if passes filter
 */
function passAdminsFilter(user) {
    const type = parseInt($(typeAdminFilterId)[0].value);
    const filterText = $(searchAdminFilterId)[0].value.trim().toLowerCase();

    // User type filter
    if (type !== -1 && type !== user.type) {
        return false;
    }

    // User search filter
    if (filterText !== '' &&
        `${user.fname} ${user.lname}`.toLowerCase().indexOf(filterText) === -1 &&
        user.username.toLowerCase().indexOf(filterText) === -1 &&
        user.email.toLowerCase().indexOf(filterText) === -1 &&
        translate(`user${user.type}`).toLowerCase().indexOf(filterText) === -1) {
        return false;
    }

    return true;
}

/**
 * Moves a user between the admins list and the users list
 *
 * @param {Object} clicked
 */
function transfer(clicked) {
    const nameSplit = clicked.parent().find(nameId).text().split('-');
    const userName = nameSplit[nameSplit.length - 1].trim();

    var inAdminsList = projectAdminsList.find(user => {
        return user.username === userName;
    });

    if (inAdminsList) {
        projectAdminsList.splice(projectAdminsList.indexOf(inAdminsList), 1);
        projectUsersList.push(inAdminsList);
    } else {
        var inUsersList = projectUsersList.find(user => {
            return user.username === userName;
        });

        if (inUsersList) {
            projectUsersList.splice(projectUsersList.indexOf(inUsersList), 1);
            projectAdminsList.push(inUsersList);
        }
    }

    startLoad(projectAdminsLoadId, projectAdminsListId);
    startLoad(projectUsersLoadId, projectUsersListId);
    displayAdminsList();
}

// ------------------------ End User Admin section -----------------------

// ------------------------ Start multiselect section -----------------------

/**
 * Selects a user based on the key held
 *
 * @param {Object} event
 * @param {object} clicked
 */
function selectUser(event, clicked) {
    const nameSplit = clicked.find('#name').text().split('-');
    const userName = nameSplit[nameSplit.length - 1].trim();

    if (event.ctrlKey) {
        if (selectedUsers.indexOf(userName) !== -1) {
            let usernameIndex = selectedUsers.indexOf(userName);
            selectedUsers.splice(usernameIndex, 1);
            selectedObjects.splice(usernameIndex, 1);
            clicked[0].style.backgroundColor = 'white';
        } else {
            selectedUsers.push(userName);
            selectedObjects.push(clicked);
            clicked[0].style.backgroundColor = 'lightgray';
        }
    } else {
        deselectAllUsers();
        selectedUsers.push(userName);
        selectedObjects.push(clicked);
        clicked[0].style.backgroundColor = 'lightgray';
    }
}

/**
 * Clears the selected items
 */
function deselectAllUsers() {
    selectedObjects.forEach(item => {
        item[0].style.backgroundColor = 'white';
    });

    selectedUsers = [];
    selectedObjects = [];
}

// ------------------------ End multiselect section -----------------------
