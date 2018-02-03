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

const userEditform = $('#userEditform');
const fname = $('#fname');
const lname = $('#lname');
const username = $('#username');
const passwword = $('#passwword');
const email = $('#email');
const userType = $('#userType');
const userStatus = $('#userStatus');

$(function () {
    $('select').material_select();
});

userEditform.submit(function (evt) {
    evt.preventDefault();
    const oldUsername = window.location.href.split('/users/edit/')[1];

    var newUser = {
        oldUsername: oldUsername,
        fname: fname.val(),
        lname: lname.val(),
        username: username.val(),
        email: email.val(),
        type: userType.val(),
        status: userStatus.val()
    };

    if (passwword.val().trim().length > 0) {
        newUser[password] = passwword.val();
    }

    $.ajax({
        type: 'POST',
        url: '/users/update',
        data: newUser,
        success: function (data) {
            window.location.href = '/users';
        },
        error: function (data) {
            handle401And404A(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
});