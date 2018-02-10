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
var unassignedList = null;

const descriptionId = '#description';
const groupSelection = $('#groupSelect');
const groupStatusId = '#groupStatus';
const unassignedUserListId = '#unassignedList';
const nameId = "#name";

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

    getUnassignedUsersList();
});

function groupVisibility() {

}

function getUnassignedUsersList() {
    $.ajax({
        type: 'GET',
        url: '/projectsGroupUnassignedList',
        success: function (data) {
            groupUserRow = $(data.groupUserHTML);
            unassignedList = data.unassignedList;
            displayList();
        },
        error: function (data) {
            //TODO: add fail snackbar
        }
    });
}

function displayList() {
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

    //endLoad(projectsLoadId, unassignedUserListId);
}

function fillUserRow(user) {
    var bindedRow = groupUserRow;

    bindedRow.find(nameId).html(user.name);

    return bindedRow[0].outerHTML;
}
