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
const loaderId = '#loader';
const accountImportContainerId = '#account-import-container';
const accountImportDivId = '#account-import-div';
const navUsersId = '#nav-users';
const navmUsersId = '#navm-users';
const importDoneButtonId = '#account-import-form-done';

$(function () {
    $(navUsersId).addClass('active');
    $(navmUsersId).addClass('active');

    accountImportFormSubmit.click(() => {
        const files = accountImportFormInput.get(0).files;
        var formData = new FormData();

        if (files.length !== 1) {
            return warningSnackbar(translate('mustBeCsv'));
        }

        var fileNameSplit = accountImportFormInput.val().split('.');
        if (fileNameSplit[fileNameSplit.length - 1] !== 'csv') {
            return warningSnackbar(translate('mustImportOneFile'));
        }

        formData.append('usersImpotFile', files[0]);

        startLoad(loaderId, accountImportDivId);

        $.ajax({
            type: 'PUT',
            url: '/users/import/file',
            processData: false,
            contentType: false,
            data: formData,
            success: function (data) {
                $(accountImportContainerId).html(data);
                $(importDoneButtonId).click(() => {
                    window.location.href = '/users';
                });
                successSnackbar(translate('successfulFileUpload'));
            },
            error: function (data) {
                handle401And404(data);

                endLoad(loaderId, accountImportDivId);

                const jsonResponse = data.responseJSON;
                failSnackbar(getErrorMessageFromResponse(jsonResponse));
            }
        });
    })
});