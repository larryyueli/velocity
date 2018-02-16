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

const loginForm = $('#loginForm');
const errorField = $('#loginForm_invalid');
const passwordField = $('#loginForm_password');

loginForm.submit(function (evt) {
    evt.preventDefault();
    $.ajax({
        type: 'POST',
        url: '/login',
        data: loginForm.serialize(),
        success: function (data) {
            window.location.href = '/';
        },
        error: function (data) {
            const jsonResponse = data.responseJSON;
            errorField.html(getErrorPill(jsonResponse));
        },
        complete: function (data) {
            passwordField.val('').focus();
        }
    });
});
