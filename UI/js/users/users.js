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

var userRow = null;
var userList = null;

$(function () {
    $('select').material_select();

    $('#typeFilter').on('change', function () {
        startLoad('#usersLoad', '#usersList');
        displayList();
    });

    $('#statusFilter').on('change', function () {
        startLoad('#usersLoad', '#usersList');
        displayList();
    });

    $('#searchFilter').on('keyup', function () {
        startLoad('#usersLoad', '#usersList');
        displayList();
    });

    getUsersList();
    startLoad('#usersLoad', '#usersList');
    getUsersList();
});

function getUsersList() {
    $.ajax({
        type: 'GET',
        url: '/usersListComponent',
        success: function (data) {
            userRow = $(data.usersEntryHTML);
            userList = data.usersList;
            displayList();
        },
        error: function (data) {
            //TODO: add fail snackbar
        }
    });
}

function displayList() {
    $('#usersList').html('');
    var rowPopulate = '';

    userList.forEach(user => {
        if (passFilter(user)) {
            $('#usersList').append(fillRow(user));
        }
    });

    if ($('#usersList').find('li').length === 0) {
        $('#usersList').append(`<p class="center"><i>${translate('noResultsFoundBasedOnSearch')}</i></p>`)
    }

    endLoad('#usersLoad', '#usersList');
}

function fillRow(user) {
    var bindedRow = userRow;
    var color = colours.green;
    var status = user.status;

    if (status === 0) {
        color = colours.red;
    } else if (status === 1) {
        color = colours.yellow;
    }

    bindedRow.find('#icon')[0].style.backgroundColor = color;
    bindedRow.find('#icon').html(userIcons[user.type]);
    bindedRow.find('#name').html(`${user.fname} ${user.lname} - ${user.username}`);
    bindedRow.find('#type').html(`${translate(`user${user.type}`)}`);
    bindedRow.find('#email').html(user.email);
    bindedRow.find('#editLink')[0].href = `users/edit/${user.username}`;
    return bindedRow[0].outerHTML;
}

function passFilter(user) {
    const type = parseInt($('#typeFilter')[0].value);
    const status = parseInt($('#statusFilter')[0].value);
    const filterText = $('#searchFilter')[0].value.trim().toLowerCase();

    // User type filter
    if (type !== -1 && type !== user.type) {
        return false;
    }

    // User status filter
    if (status !== -1 && status !== user.status) {
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
