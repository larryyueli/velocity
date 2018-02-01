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

const accountImportFormInput = $('#account-import-form-input');
const accountImportFormSubmit = $('#account-import-form-submit');

$(function () {
    accountImportFormSubmit.click(() => {
        const files = accountImportFormInput.get(0).files;
        var formData = new FormData();

        if (files.length !== 1) {
            return warningSnackbar('You can only import one file!');
        }

        var fileNameSplit = accountImportFormInput.val().split('.');
        if (fileNameSplit[fileNameSplit.length - 1] !== 'csv') {
            return warningSnackbar('File format must be csv!');
        }

        formData.append('usersImpotFile', files[0]);

        $.ajax({
            type: 'PUT',
            url: '/users/import/file',
            processData: false,
            contentType: false,
            data: formData,
            success: function (data) {
                successSnackbar('File uploaded successfully');
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
    })
});