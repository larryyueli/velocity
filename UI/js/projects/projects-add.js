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

const boardSelection = '#boardSelection';
const boardSelectionRow = $('#boardSelectionRow');
const deadlineSelectionRow = $('#deadlineSelectionRow');
const canForceBoardType = '#canForceBoardType';
const canForceDeadline = '#canForceDeadline';
const navProjectsId = '#nav-projects';
const navmProjectsId = '#navm-projects';
const descriptionId = '#description';
const titleId = '#title';
const datepickerId = '#datepicker';
const timepickerId = '#timepicker';
const projectAddform = '#projectAddform';
const uploadButton = '#uploadButton';
const uploadModal = '#uploadModal';
const uploadInput = '#file-input';
const attachmentsDivId = '#attachmentsDivId';
const uploadName = '#file-name';

var attachmentsList = [];

$(function () {
    $(navProjectsId).addClass('active');
    $(navmProjectsId).addClass('active');

    initSummernote(descriptionId);
    if ($(descriptionId).attr('value') === '1') {
        $(descriptionId).summernote('disable');
        $(descriptionId).summernote({
            disableDragAndDrop: true,
            shortcuts: false
        });
        $('div.note-btn-group.btn-group button').remove();
        $('.note-toolbar-wrapper').remove();
        $('.note-editable').css('background-color', '#ffffff')
    }
    $('#datepicker').pickadate({
        onClose: () => {
            $(":focus").blur();
        },
        selectMonths: true,
        selectYears: 15,
        today: translate('today'),
        clear: translate('clear'),
        close: translate('ok'),
        closeOnSelect: false,
        container: undefined
    });

    $('#timepicker').pickatime({
        onClose: () => {
            $(":focus").blur();
        },
        default: translate('now'),
        fromnow: 0,
        twelvehour: true,
        donetext: translate('ok'),
        cleartext: translate('clear'),
        canceltext: translate('cancel'),
        container: undefined,
        autoclose: false,
        ampmclickable: true
    });

    $('select').material_select();

    $(canForceBoardType).change(() => {
        if ($(canForceBoardType).is(':checked')) {
            boardSelectionRow.show();
        } else {
            boardSelectionRow.hide();
        }
    });

    $(canForceDeadline).change(() => {
        if ($(canForceDeadline).is(':checked')) {
            deadlineSelectionRow.show();
        } else {
            deadlineSelectionRow.hide();
        }
    });

    $(canForceBoardType).change();
    $(canForceDeadline).change();

    $(projectAddform).submit(function (evt) {
        evt.preventDefault();

        if ($(descriptionId).summernote('isEmpty')) {
            return warningSnackbar(translate('emptyProjectDescription'));
        }

        const titleText = $(titleId).val();
        const descriptionText = $(descriptionId).summernote('code');
        const boardType = $(boardSelection).val();
        const canForceBoardTypeValue = $(canForceBoardType).is(':checked');
        const canForceDeadlineValue = $(canForceDeadline).is(':checked');
        const deadlineDate = $(datepickerId).val();
        const deadlineTime = $(timepickerId).val();

        if (canForceDeadlineValue) {
            if (deadlineDate.length === 0) {
                return warningSnackbar(translate('emptyDeadlineDate'));
            }

            if (deadlineTime.length === 0) {
                return warningSnackbar(translate('emptyDeadlineTime'));
            }
        }

        $.ajax({
            type: 'PUT',
            url: '/projects/create',
            data: {
                title: titleText,
                description: descriptionText,
                boardType: boardType,
                deadlineDate: deadlineDate,
                deadlineTime: deadlineTime,
                canForceBoardType: canForceBoardTypeValue,
                canForceDeadline: canForceDeadlineValue,
                attachments: attachmentsList
            },
            success: function (data) {
                window.location.href = `/project/${data}`;
            },
            error: function (data) {
                handle401And404(data);

                const jsonResponse = data.responseJSON;
                failSnackbar(getErrorMessageFromResponse(jsonResponse));
            }
        });
    });
});

/**
 * upload a file
*/
function uploadFile() {
    const files = $(uploadInput).get(0).files;
    var formData = new FormData();

    if (files.length !== 1) {
        return warningSnackbar(translate('mustImportOneFile'));
    }

    formData.append('uploadedFile', files[0]);

    $(uploadButton).attr('disabled', true);

    $.ajax({
        type: 'PUT',
        url: '/upload/file',
        processData: false,
        contentType: false,
        data: formData,
        success: function (data) {
            $(uploadModal).modal('close');
            successSnackbar(translate('successfulFileUpload'));
            attachmentsList.push(data);
            $(attachmentsDivId).append(`
                <div class="row margin-bottom-0 margin-right-10">
                    <div id="${data}" class="chip full-width related-chips text-left ticketStatusColors attachmentsClass">
                        <p class="truncateTextCommon">${$(uploadName).val()}</p>
                        <i onclick="removeAttachment('${data}')" class="close material-icons">delete_forever</i>
                        <i onclick="downloadAttachment('${data}')" class="chipIcon material-icons">file_download</i>
                    </div>
                </div>
            `);
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        },
        complete: function () {
            $(uploadButton).attr('disabled', false);
        }
    });
}

/**
 * remove attachment
*/
function removeAttachment(id) {
    delete attachmentsList[id];
}

/**
 * download attachment
*/
function downloadAttachment(id) {
    window.location = `/download/file?fileId=${id}`;
}