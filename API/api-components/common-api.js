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

"use strict";

const common_backend = require('../../Backend/common.js');

// File names to render the pages
const pugPages = Object.freeze({
    login: 'login',
    modeSelector: 'modeSelector',
    pageNotFound: 'pageNotFound',
    profile: 'profile',
    projects: 'projects/projects',
    projectPage: 'projects/project-page',
    projectsAdd: 'projects/projects-add',
    projectTeam: 'projects/project-team',
    settings: 'settings/settings',
    ticketCreation: 'tickets/tickets-entry',
    ticketModification: 'tickets/tickets-edit',
    ticketSearch: 'tickets/tickets-search',
    users: 'users/users',
    usersAdd: 'users/users-add',
    usersEdit: 'users/users-edit',
    usersImportComplete: 'users/users-import-complete',
    usersImport: 'users/users-import',
});
exports.pugPages = pugPages;

// all pages components
var pugComponents = {
    sprintEntryComponent: null,
    ticketEntryComponent: null,
    projectsEntryComponent: null,
    projectsGroupEntryComponent: null,
    projectsGroupModalComponent: null,
    projectsGroupModalEntryComponent: null,
    projectsGroupUserEntryComponent: null,
    projectsUserEntryComponent: null,
    usersEntryComponent: null
};
exports.pugComponents = pugComponents;

/**
 * verify active sessions
 *
 * @param {object} req req value of the session
 */
const isActiveSession = function (req) {
    return typeof (req.session) !== common_backend.variableTypes.UNDEFINED
        && typeof (req.session.user) !== common_backend.variableTypes.UNDEFINED;
}
exports.isActiveSession = isActiveSession;