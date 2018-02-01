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
        }
    });
}

function displayList() {
    $('#usersList').html('');
    var rowPopulate = '';

    userList.forEach(user => {
        $('#usersList').append(fillRow(user));
    });
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
    bindedRow.find('#type').html(`${userTypes[user.type]}`);
    bindedRow.find('#email').html(user.email);
    bindedRow.find('#editLink')[0].href = `users/edit/${user.username}`;
    return bindedRow[0].outerHTML;
}
