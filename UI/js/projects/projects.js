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

var projectRow = null;
var projectList = null;

const projectsLoadId = '#projectsLoad';
const projectsListId = '#projectsList';
const navProjectsId = '#nav-projects';
const navmProjectsId = '#navm-projects';
const statusFilterId = '#statusFilter';
const searchFilterId = '#searchFilter';
const nameId = '#name';
const iconId = '#icon';
const statusId = '#status';
const editLinkId = '#goLink'

$(function () {
    $(navProjectsId).addClass('active');
    $(navmProjectsId).addClass('active');

    $('.collapsible').collapsible();
    $('select').material_select();

    $(statusFilterId).on('change', function () {
        startLoad(projectsLoadId, projectsListId);
        displayList();
    });

    $(searchFilterId).on('keyup', function () {
        startLoad(projectsLoadId, projectsListId);
        displayList();
    });

    startLoad(projectsLoadId, projectsListId);
    getProjectsList();
});

function getProjectsList() {
    $.ajax({
        type: 'GET',
        url: '/components/projectsList',
        success: function (data) {
            projectRow = $(data.projectsEntryHTML);
            projectList = data.projectsList;
            displayList();
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}

function displayList() {
    $(projectsListId).html('');
    var rowPopulate = '';

    projectList.forEach(project => {
        if (passFilter(project)) {
            $(projectsListId).append(fillRow(project));

            $(`#${project._id}`).on('click', function() {
                 window.location.href = `/project/${project._id}`;
            });
        }
    });

    if ($(projectsListId).find('li').length === 0) {
        $(projectsListId).append(`<p class="center"><i>${translate('noResultsFoundBasedOnSearch')}</i></p>`)
    }

    endLoad(projectsLoadId, projectsListId);
}

function fillRow(project) {
    var bindedRow = projectRow;
    var color = colours.green;
    var status = project.status;

    if (status === 0) {
        color = colours.red;
    } else if (status === 1) {
        color = colours.yellow;
    }

    bindedRow.attr('id', project._id);
    bindedRow.find(iconId)[0].style.backgroundColor = color;
    bindedRow.find(iconId).html('assignment');
    bindedRow.find(editLinkId)[0].href = `/project/${project._id}`;
    bindedRow.find(nameId).html(project.title);
    bindedRow.find(statusId).html(translate(`projectStatus${project.status}`));
    return bindedRow[0].outerHTML;
}

function passFilter(project) {
    const status = parseInt($(statusFilterId)[0].value);
    const filterText = $(searchFilterId)[0].value.trim().toLowerCase();

    // Project status filter
    if (status !== -1 && status !== project.status) {
        return false;
    }

    // Project search filter
    if (filterText !== '' &&
        project.title.toLowerCase().indexOf(filterText) === -1 &&
        translate(`projectStatus${project.status}`).toLowerCase().indexOf(filterText) === -1) {
        return false;
    }

    return true;
}
