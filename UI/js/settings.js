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

const cancelButton = $('#cancelButton');
const resetButton = $('#resetButton');
const saveButton = $('#saveButton');
const activeSwitch = $('#generalActive')[0];
const canEditNameSwitch = $('#canEditNameSwitch')[0];
const canEditEmailSwitch = $('#canEditEmailSwitch')[0];
const canEditPasswordwitch = $('#canEditPasswordwitch')[0];

$(function () {
    cancelButton.click(() => {
        window.location.reload();
    });

    resetButton.click(() => {
        $.ajax({
            type: 'POST',
            url: '/settings/reset',
            success: function (data) {
                window.location.reload();
            },
            error: function (data) {
                handle401And404(data);

                const jsonResponse = data.responseJSON;
                failSnackbar(getErrorMessageFromResponse(jsonResponse));
            }
        });
    });

    saveButton.click(() => {
        $.ajax({
            type: 'POST',
            url: '/settings/update',
            data: {
                active: activeSwitch.checked,
                canEditEmail: canEditEmailSwitch.checked,
                canEditFirstAndLastName: canEditNameSwitch.checked,
                canEditPassword: canEditPasswordwitch.checked
            },
            success: function (data) {
                window.location.reload();
            },
            error: function (data) {
                handle401And404(data);

                const jsonResponse = data.responseJSON;
                failSnackbar(getErrorMessageFromResponse(jsonResponse));
            }
        });
    });
});
