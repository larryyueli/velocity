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

const userAddform = $('#userAddform');
const fname = $('#fname');
const lname = $('#lname');
const username = $('#username');
const passwword = $('#passwword');
const email = $('#email');
const userType = $('#userType');

$(function () {
    $('select').material_select();
});

userAddform.submit(function (evt) {
    evt.preventDefault();
    $.ajax({
        type: 'PUT',
        url: '/users/create',
        data: {
            fname: fname.val(),
            lname: lname.val(),
            username: username.val(),
            password: passwword.val(),
            email: email.val(),
            type: userType.val()
        },
        success: function (data) {
            window.location.href = '/users';
        },
        error: function (data) {
            if (data['status'] === 401) {
                window.location.href = '/';
            } else if (data['status'] === 404) {
                window.location.href = '/pageNotFound';
            }

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
});