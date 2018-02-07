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

const navProjectsId = '#nav-projects';
const navmProjectsId = '#navm-projects';
const descriptionId = '#description';
const titleId = '#title';
const statusId = '#status';
const projectAddform = '#projectAddform';

$(function () {
    $(navProjectsId).addClass('active');
    $(navmProjectsId).addClass('active');

    $('select').material_select();
    initSummernote();

    $(projectAddform).submit(function (evt) {
        evt.preventDefault();

        if ($(descriptionId).summernote('isEmpty')) {
            return warningSnackbar(translate('emptyProjectDescription'));
        }

        const titleText = $(titleId).val();
        const descriptionText = $(descriptionId).summernote('code');
        const status = $(statusId).val();

        $.ajax({
            type: 'PUT',
            url: '/projects/create',
            data: {
                title: titleText,
                description: descriptionText,
                status: status
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

/* Initialize the summernote and all its sub modal */
const initSummernote = function () {
    $(descriptionId).summernote({ height: 200 });
    $('div.note-btn-group.btn-group button').unbind('mouseenter mouseleave').addClass('customSummernoteButton');
    $('div.note-btn-group.btn-group.note-insert button').unbind();
    $('div.note-btn-group.btn-group.note-view button:nth-child(3)').unbind();
    $('div.note-btn-group.btn-group.note-insert button:nth-child(1)').click(function () {
        $('#mediaModal0').modal('open');
        $('#mediaModal0 > div > div > div.modal-footer > button')
            .unbind()
            .removeClass('disabled')
            .removeAttr('href')
            .prop('disabled', false)
            .prop('type', 'button')
            .click(function () {
                var text = $('#mediaModal0 > div > div > div.modal-body > div:nth-child(1) > input').val();
                var url = $('#mediaModal0 > div > div > div.modal-body > div:nth-child(2) > input').val();
                $(descriptionId).summernote('createLink', {
                    text: text,
                    url: url,
                    isNewWindow: true
                });
                $('#mediaModal0').modal('close');
            });
        $('#mediaModal0 > div > div > div.modal-header > button').click(function () {
            $('#mediaModal0').modal('close');
        });
    });
    $('div.note-btn-group.btn-group.note-insert button:nth-child(2)').click(function () {
        $('#mediaModal1').modal('open');
        $('#mediaModal1 > div > div > div.modal-body > div.form-group.note-group-select-from-files').hide();
        $('#mediaModal1 > div > div > div.modal-footer > button')
            .unbind()
            .removeClass('disabled')
            .removeAttr('href')
            .prop('disabled', false)
            .prop('type', 'button')
            .click(function () {
                var url = $('#mediaModal1 > div > div > div.modal-body > div.form-group.note-group-image-url > input').val();
                $(descriptionId).summernote('insertImage', url);
                $('#mediaModal1').modal('close');
            });
        $('#mediaModal1 > div > div > div.modal-header > button').click(function () {
            $('#mediaModal1').modal('close');
        });
    });
    $('div.note-btn-group.btn-group.note-insert button:nth-child(3)').remove();
    $('div.note-btn-group.btn-group.note-view button:nth-child(3)').click(function () {
        $('#mediaModal3').modal('open');
        $('#mediaModal3 > div > div > div.modal-header > button').click(function () {
            $('#mediaModal3').modal('close');
        });
    });
    $('.modal').modal({
        dismissible: false
    });
    $('div.note-editor.note-frame.panel.panel-default .modal').each(function (i) {
        $(this).attr('id', 'mediaModal' + i);
        $('#mediaModal' + i + '> div > div').removeClass('modal-content');
    });
}