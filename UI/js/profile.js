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

// variable definitions
const theme = '#theme';
const editForm = '#editForm';
const password = '#passwd';
const confirmPassword = '#confirmpasswd';
const userId = '#userId';
const viewForm = '#viewForm';
const editMode = '#editMode';
const notificationSwitch = '#notificationSwitch';
const profilePicIn = '#profile-picture-input';

/**
* Init function
*/
$(function () {
    $('select').material_select();
});

$(theme).on('change', function() {
    $('bodyclass').removeClass();
    $('bodyclass').addClass($(theme)[0].value);
});

/**
* Submits the new updates for the profile
*/
$(editForm).submit(function (evt) {
    evt.preventDefault();

    if ($(password).val() === $(confirmPassword).val()) {
        var id = $(userId).html();
        editProfile(id);
    } else {
        failSnackbar('Passwords do not match');
    }
});

/**
* Changes the view to the editing page
*
* @method enableEdit
*/
const enableEdit = function () {
    $(viewForm).addClass('hidden');
    $(editMode).removeClass('hidden');
}

/**
* Changes the view to the display page
*
* @method disableEdit
*/
const disableEdit = function () {
    location.reload();
}

/**
 * submit data to update the profile information
 *
 * @param {string} id
 */
const editProfile = function (id) {
    var fields = $(editForm).serializeArray();
    var user = {};

    jQuery.each(fields, function (i, field) {
        if (field.value) {
            user[field.name] = field.value;
        }
    });

    user['notificationEnabled'] = $(notificationSwitch)[0].checked;
    user['theme'] = $(theme)[0].value;

    $.ajax({
        type: 'POST',
        url: '/profile/update',
        data: user,
        success: function (data) {
            const files = $(profilePicIn).get(0).files;
            uploadProfilePicture();
        },
        error: function (data) {
            var jsonResponse = data.responseJSON;

            if (data['status'] === 401) {
                window.location.href = '/';
            } else {
                failSnackbar(getErrorMessageFromResponse(jsonResponse));
            }
        }
    });
}

/**
 * upload profile picture
 */
const uploadProfilePicture = function () {
    var files = $(profilePicIn).get(0).files;

    if (files.length < 1) {
        location.reload();
        return;
    }

    if (files.length !== 1) {
        warningSnackbar('You can only upload one picture!');
        return;
    }

    var formData = new FormData();
    formData.append('userpicture', files[0]);

    $.ajax({
        type: 'POST',
        url: '/profile/update/picture',
        processData: false,
        contentType: false,
        data: formData,
        success: function (data) {
            location.reload();
        },
        error: function (data) {
            var jsonResponse = data.responseJSON;

            if (data['status'] === 401) {
                window.location.href = '/';
            } else if (data['status'] === 404) {
                window.location.href = '/page-not-found';
            } else {
                failSnackbar(getErrorMessageFromResponse(jsonResponse));
            }
        }
    });
}