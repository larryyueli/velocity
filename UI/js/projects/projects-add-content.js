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

$(function () {
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
});
