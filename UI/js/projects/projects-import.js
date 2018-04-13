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

const projectsImportFormInput = $('#projects-import-form-input');
const projectsImportFormSubmit = $('#projects-import-form-submit');
const loaderId = '#loader';
const projectsImportContainerId = '#projects-import-container';
const projectsImportDivId = '#projects-import-div';
const navProjectsId = '#nav-projects';
const navmProjectsId = '#navm-projects';
const importDoneButtonId = '#projects-import-form-done';

$(function () {
    $(navProjectsId).addClass('active');
    $(navmProjectsId).addClass('active');

    projectsImportFormSubmit.click(() => {
        const files = projectsImportFormInput.get(0).files;
        var formData = new FormData();

        if (files.length !== 1) {
            return warningSnackbar(translate('mustImportOneFile'));
        }

        var fileNameSplit = projectsImportFormInput.val().split('.');
        if (fileNameSplit[fileNameSplit.length - 1] !== 'velocity') {
            return warningSnackbar(translate('mustBeVelocity'));
        }

        formData.append('projectsImpotFile', files[0]);

        startLoad(loaderId, projectsImportDivId);

        $.ajax({
            type: 'PUT',
            url: '/projects/import/file',
            processData: false,
            contentType: false,
            data: formData,
            success: function (data) {
                $(projectsImportContainerId).html(data);
                $(importDoneButtonId).click(() => {
                    window.location.href = '/projects';
                });
                successSnackbar(translate('successfulFileUpload'));
            },
            error: function (data) {
                handle401And404(data);

                endLoad(loaderId, projectsImportDivId);

                const jsonResponse = data.responseJSON;
                failSnackbar(getErrorMessageFromResponse(jsonResponse));
            }
        });
    })
});