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

var groupUserRow = null;
var groupRow = null;
var groupList = null;
var unassignedList = null;
var groupModalHTML = null;
var groupModalEntryHTML = null;
var groupSize = null;
var groupPrefix = '';
var groupSelectType = null;

const assignedList = '#assignedList';
const createGroupButtonId = '#createGroupButton';
const descriptionId = '#description';
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
const groupSelection = $('#groupSelect');
const groupSizeId = '#groupSize';
const groupSizeLabelId = '#groupSizeLabel';
const groupStatusId = '#groupStatus';
const headerId = '#header';
const iconId = "#icon";
const joinLinkId = '#joinLink';
const membersId = '#members';
const nameId = '#name';
const randomizeRemainingId = '#randomizeRemaining';
const removeId = '#remove';
const newGroupNameId = '#newGroupName';
const sizeId = '#size'
const titleId = '#title';
const unassignedLoadId = '#unassignedLoad'
const unassignedUserListId = '#unassignedList';
const unassignedUserListName = 'unassignedList';

const optionGroups = $('#option-groups');

const groupSizeFilterId = '#groupSizeFilter';
const searchGroupFilterId = '#searchGroupFilter';
const searchUserFilterId = '#searchUserFilter';
const typeFilterId = '#typeFilter';

const modalTriggerId = '#modalTrigger';
const modalsSectionId = '#modals';
const groupModalId = '#groupModal';

const generalDeleteButtonId = '#generalDeleteButton';
const generalSaveButtonId = '#generalSaveButton';
const generalActivateButtonId = '#generalActivateButton';

const navProjectsId = '#nav-projects';
const navmProjectsId = '#navm-projects';

const projectId = window.location.href.split('/project/')[1];

$(function () {
    $(navProjectsId).addClass('active');
    $(navmProjectsId).addClass('active');
    $('select').material_select();

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

    $(groupStatusId).on('change', function() {
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
            swal({
                text: translate('deletePremadeGroups'),
                icon: 'warning',
                dangerMode: true,
                buttons: [translate('cancel'), translate('delete')]
            }).then((deleteGroups) => {
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
            });

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
            failSnackbar(translate('groupNamealreadyExists'));
        } else {
            groupList.push(makeGroupObject(false, [], groupName));

            $(groupCreateModalId).modal('close');
            startLoad(groupLoadId, groupListId);
            displayGroupList();
        }
    });

    $(generalDeleteButtonId).click(() => { generalDeleteProject(); });
    $(generalSaveButtonId).click(() => { generalSaveProject(); });
    $(generalActivateButtonId).click(() => { generalActivateProject(); });

    optionGroups.click(() => {
        getGroupAssign();
        startLoad(groupLoadId, groupListId);
        startLoad(unassignedLoadId, unassignedUserListId);
    });
});

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
 * delete a project
 */
function generalDeleteProject() {
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

/**
 * update a project
 */
function generalSaveProject() {
    if ($(descriptionId).summernote('isEmpty')) {
        return warningSnackbar(translate('emptyProjectDescription'));
    }

    const titleText = $(titleId).val();
    const descriptionText = $(descriptionId).summernote('code');

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

/**
 * activate a project
 */
function generalActivateProject() {
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

function emptyGroups() {
    groupList.forEach(group => {
        group.members.forEach(user => {
            unassignedList.push(user);
        });
    });

    groupList = [];
}

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

function getUntakenName(name) {
    var customName = name;
    var counter = 0;

    while (groupList.find(group => group.name === customName)) {
        customName = `${name} (${++counter})`;
    }

    return customName;
}

function groupVisibility() {
    reloadAllLists();
}

function randomizeRemaining() {
    randomizeUnassigned();
    reloadAllLists();
}

function randomizeUnassigned() {
    var tempGroup = [];
    var random = null;
    var groupNumber = 0;

    while (unassignedList.length) {
        tempGroup = [];
        groupNumber += 1;

        for (var i = 0; i < groupSize; i++) {
            if (unassignedList.length === 0) {
                break;
            }

            random = unassignedList[Math.floor(Math.random() * unassignedList.length)];
            tempGroup.push(random)
            unassignedList.splice(unassignedList.indexOf(random), 1);
        }

        groupList.push(makeGroupObject(false, tempGroup, `${groupPrefix}${groupNumber}`));
    }
}

/**
 * Gets the list on unassigned users and groups
 */
function getGroupAssign() {
    $.ajax({
        type: 'GET',
        url: '/projectsGroupAssign',
        data: {
            projectId: projectId
        },
        success: function (data) {
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

            $(modalsSectionId).html(groupModalHTML);
            $('.modal').modal({
                dismissible: true,
                ready: function (modal, trigger) {
                    const username = trigger.parent().find(nameId).text();
                    $(groupModalId).find(titleId).html(translate('selectGroup'));
                    $(groupModalId).find(nameId).html(username);
                }
            });
            displayUnassignedList();
            displayGroupList();
        },
        error: function (data) {
            //TODO: add fail snackbar
        }
    });
}

/**
 * Displays the unassigned users list
 */
function displayUnassignedList() {
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

/**
 * Fills a row entry of a user
 * 
 * @param {Object} user 
 */
function fillUserRow(user, isUnassigned) {
    var bindedRow = groupUserRow;

    bindedRow.find(iconId).html(userIcons[user.type]);
    bindedRow.find(nameId).html(`${user.fname} ${user.lname} - ${user.username}`);

    if (isUnassigned) {
        bindedRow.find(removeId).addClass('hidden');
    } else {
        bindedRow.find(removeId).removeClass('hidden');
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

/**
 * displays the groups list
 */
function displayGroupList() {
    $(groupListId).html('');
    var rowPopulate = '';

    groupList.forEach(group => {
        if (passGroupFilter(group)) {
            $(groupListId).append(fillGroupRow(group));
        }
    });

    if ($(groupListId).find('li').length === 0) {
        $(groupListId).append(`<p class="center"><i>${translate('noResultsFoundBasedOnSearch')}</i></p>`);
    }

    endLoad(groupLoadId, groupListId);
}

/**
 * fills an entry of a group
 * 
 * @param {Object} group 
 */
function fillGroupRow(group) {
    var bindedRow = groupRow;
    var color = colours.red;
    var isActive = false;
    bindedRow.find(assignedList).html('');

    if (group.members.length < groupSize) {
        color = colours.yellow;
    } else if (group.members.length === groupSize) {
        color = colours.green
    }

    if (group.isActive) {
        bindedRow.find(headerId).addClass('active');
        bindedRow.find(groupBodyId)[0].style.display = 'block';
    } else {
        bindedRow.find(headerId).removeClass('active');    
        bindedRow.find(groupBodyId)[0].style.display = 'none';    
    }

    bindedRow.find(headerId)[0].style.backgroundColor = color;
    bindedRow.find(titleId).html(group.name);
    bindedRow.find(groupSizeId).html(`(${group.members.length}/${groupSize})`);
    
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
        // if (group.name !== groupName) {
            $(groupModalListId).append(fillGroupModalRow(group));
        // }
    });

    if ($(groupModalListId).find('li').length === 0) {
        $(groupModalListId).append(`<p class="center"><i>${translate('noResultsFoundBasedOnSearch')}</i></p>`);
    }

    // endLoad(usersLoadId, usersListId);
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

    if (group.members.length < groupSize) {
        color = colours.yellow;
    } else if (group.members.length === groupSize) {
        color = colours.green

        //TODO: disable for students
        //bindedRow.find(joinLinkId).addClass('disabled');
    }

    bindedRow.find(groupIconId)[0].style.backgroundColor = color;
    bindedRow.find(groupNameId).html(group.name);
    bindedRow.find(sizeId).html(`${translate('size')}: ${group.members.length}`);
    group.members.forEach(user => {
        membersList = (`${membersList}${user.fname} ${user.lname} - ${user.username}\n`);
    });

    bindedRow.find(membersId).html(membersList);
    return bindedRow[0].outerHTML;
}

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
 */
function moveFromGroupToGroup(groupName, userName) {
    const oldGroup = groupList.find(group => {
        return group.members.find(user => {
            return user.username === userName;
        });
    });

    if (oldGroup.name === groupName) {
        failSnackbar(translate('alreadyInGroup'));
    } else {
        const userObject = oldGroup.members.find(user => {
            return user.username === userName;
        });
    
        groupList.find(group => {
            return group.name === groupName;
        }).members.push(userObject);
    
        oldGroup.members.splice(oldGroup.members.indexOf(userObject), 1);
        reloadAllLists();
    }
}

/**
 * Removes a user from a group and puts them in the unassigned list
 * 
 * @param {Object} clicked 
 */
function removeFromGroup(clicked) {
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

/**
 * Deletes a group and moves group members to unassigned list
 * 
 * @param {Object} clicked
 */
function deleteGroup(clicked) {
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