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

const accountExportFormSubmit = '#account-export-form-submit';
const loaderId = '#loader';
const accountExportContainerId = '#account-export-container';
const accountExportDivId = '#account-export-div';
const navUsersId = '#nav-users';
const navmUsersId = '#navm-users';
const exportDoneButtonId = '#account-export-form-done';

$(function () {
    $(navUsersId).addClass('active');
    $(navmUsersId).addClass('active');

    $(accountExportFormSubmit).click(() => {
        startLoad(loaderId, accountExportDivId);

        $.ajax({
            type: 'GET',
            url: '/users/export/file',
            success: function (data) {
                $(accountExportContainerId).html(data);
                $(exportDoneButtonId).click(() => {
                    window.location = `/users/export/file/download?fileId=${$('.completedFileName').html()}`;
                });
                successSnackbar(translate('successfulFileDownload'));
            },
            error: function (data) {
                handle401And404(data);

                endLoad(loaderId, accountExportDivId);

                const jsonResponse = data.responseJSON;
                failSnackbar(getErrorMessageFromResponse(jsonResponse));
            }
        });
    });
});