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

const assignedList = '#assignedList';
const descriptionId = '#description';
const groupListId = '#groupList';
const groupLoadId = '#groupLoad';
const groupSelection = $('#groupSelect');
const groupStatusId = '#groupStatus';
const nameId = '#name';
const titleId = '#title';
const unassignedLoadId = '#unassignedLoad'
const unassignedUserListId = '#unassignedList';

const optionGroups = $('#option-groups');

$(function () {
    $('select').material_select();

    groupSelection.click(() => {
        const value = $(groupStatusId).val();

        if (value === 0) {

        } else if (value === 1 || value === 2) {
            groupVisibility();
        } else if (value === 3) {

        }
    });

    optionGroups.click(() => {
        getGroupAssign();
        startLoad(groupLoadId, groupListId);
        startLoad(unassignedLoadId, unassignedUserListId);
    });
});

function groupVisibility() {

}

/**
 * Gets the list on unassigned users and groups
 */
function getGroupAssign() {
    $.ajax({
        type: 'GET',
        url: '/projectsGroupAssign',
        success: function (data) {
            groupUserRow = $(data.groupUserHTML);
            unassignedList = data.unassignedList;
            groupRow = $(data.groupHTML);
            groupList = data.groupList;

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
        //if (passFilter(project)) {
            $(unassignedUserListId).append(fillUserRow(user));
        //}
    });

    if ($(unassignedUserListId).find('li').length === 0) {
        $(unassignedUserListId).append(`<p class="center"><i>${translate('noResultsFoundBasedOnSearch')}</i></p>`)
    }

    endLoad(unassignedLoadId, unassignedUserListId);
}

/**
 * Fills a row entry of a user
 * 
 * @param {Object} user 
 */
function fillUserRow(user) {
    var bindedRow = groupUserRow;

    bindedRow.find(nameId).html(user.name);

    return bindedRow[0].outerHTML;
}














/**
 * displays the groups list
 */
function displayGroupList() {
    $(groupListId).html('');
    var rowPopulate = '';

    groupList.forEach(group => {
        //if (passFilter(project)) {
            $(groupListId).append(fillGroupRow(group));
        //}
    });

    if ($(groupListId).find('li').length === 0) {
        $(groupListId).append(`<p class="center"><i>${translate('noResultsFoundBasedOnSearch')}</i></p>`)
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
    bindedRow.find(assignedList).html('');

    bindedRow.find(titleId).html(`${group.name} (${group.members.length})`);
    group.members.forEach(user => {
        //if (passFilter(project)) {
            bindedRow.find(assignedList).append(fillUserRow(user));
        //}
    });

    return bindedRow[0].outerHTML;
}
