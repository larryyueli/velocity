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

const goToLogin = $('#goToLogin');
const goToSignUp = $('#goToSignUp');
const loginForm = $('#loginForm');
const loginErrorField = $('#loginForm_invalid');
const loginPasswordField = $('#loginForm_password');
const loginSection = $('#loginSection');
const signupForm = $('#signupForm');
const signupErrorField = $('#signupForm_invalid');
const signupPasswordField = $('#signupForm_password');
const signupPasswordConfirmField = $('#signupForm_confirmPassword');
const signUpSection = $('#signUpSection');

$(function () {
    goToSignUp.on('click', function() {
        loginSection.addClass('hidden');
        signUpSection.removeClass('hidden');
    });

    goToLogin.on('click', function() {
        signUpSection.addClass('hidden');
        loginSection.removeClass('hidden');
    });
})

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
            loginErrorField.html(getErrorPill(getErrorMessageFromResponse(jsonResponse)));
        },
        complete: function (data) {
            loginPasswordField.val('').focus();
        }
    });
});

signupForm.submit(function (evt) {
    evt.preventDefault();
    if (signupPasswordField.val() === signupPasswordConfirmField.val()) {
        $.ajax({
            type: 'PUT',
            url: '/users/request/access',
            data: signupForm.serialize(),
            success: function (data) {
                window.location.href = '/';
            },
            error: function (data) {
                const jsonResponse = data.responseJSON;
                signupErrorField.html(getErrorPill(getErrorMessageFromResponse(jsonResponse)));
            }
        });
    } else {
        signupErrorField.html(getErrorPill(translate('passwordsDontMatch')));
    }
});
