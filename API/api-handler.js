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

const path = require('path');

const comment_api = require('./api-components/comments-api.js');
const common_api = require('./api-components/common-api.js');
const notifications_api = require('./api-components/notifications-api.js');
const projects_api = require('./api-components/projects-api.js');
const releases_api = require('./api-components/releases-api.js');
const settings_api = require('./api-components/settings-api.js');
const sprints_api = require('./api-components/sprints-api.js');
const tags_api = require('./api-components/tags-api.js');
const teams_api = require('./api-components/teams-api.js');
const tickets_api = require('./api-components/tickets-api.js');
const users_api = require('./api-components/users-api.js');

const cfs = require('../Backend/customFileSystem.js');
const common_backend = require('../Backend/common.js');
const config = require('../Backend/config.js');
const logger = require('../Backend/logger.js');
const projects = require('../Backend/projects.js');
const settings = require('../Backend/settings.js');
const users = require('../Backend/users.js');

// <Requests Function> -----------------------------------------------
/**
 * initialize the api components
 *
 * @param {object} pug pug object/instance
 * @param {object} notificationsWS notifications web secket instance
 * @param {function} callback callback function
 */
const initialize = function (pug, notificationsWS, callback) {
    common_api.pugComponents.boardTicketEntryComponent = pug.compileFile('Templates/tickets/board-entry.pug');
    common_api.pugComponents.boardUserOutlineComponent = pug.compileFile('Templates/projects/sprint-active-user-outline.pug');
    common_api.pugComponents.projectsEntryComponent = pug.compileFile('Templates/projects/projects-entry.pug');
    common_api.pugComponents.projectsGroupEntryComponent = pug.compileFile('Templates/projects/projects-group-entry.pug');
    common_api.pugComponents.projectsGroupModalComponent = pug.compileFile('Templates/projects/projects-group-modal.pug');
    common_api.pugComponents.projectsGroupModalEntryComponent = pug.compileFile('Templates/projects/projects-group-modal-entry.pug');
    common_api.pugComponents.projectsGroupUserEntryComponent = pug.compileFile('Templates/projects/projects-group-user-entry.pug');
    common_api.pugComponents.projectsUserEntryComponent = pug.compileFile('Templates/projects/projects-users-entry.pug');
    common_api.pugComponents.sprintEntryComponent = pug.compileFile('Templates/tickets/sprint-entry.pug');
    common_api.pugComponents.teamEntryComponent = pug.compileFile('Templates/projects/team-entry.pug');
    common_api.pugComponents.teamManagementReleaseEntryComponent = pug.compileFile('Templates/projects/team-management-release-entry.pug');
    common_api.pugComponents.teamManagementSprintEntryComponent = pug.compileFile('Templates/projects/team-management-sprint-entry.pug');
    common_api.pugComponents.teamManagementTagEntryComponent = pug.compileFile('Templates/projects/team-management-tag-entry.pug');
    common_api.pugComponents.ticketCommentEntry = pug.compileFile('Templates/tickets/tickets-comments-entry.pug');
    common_api.pugComponents.ticketEntryComponent = pug.compileFile('Templates/tickets/ticket-entry.pug');
    common_api.pugComponents.usersEntryComponent = pug.compileFile('Templates/users/users-entry.pug');

    notifications_api.initialize(notificationsWS);

    return callback(null, 'ok');
}

/**
 * root path to redirect to the proper page based on session state
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleRootPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type === common_backend.userTypes.MODE_SELECTOR.value) {
        return res.status(200).render(common_api.pugPages.modeSelector);
    }

    return res.redirect('/projects');
}

/**
 * path to set the mode in the global settings
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleModeSelectPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.MODE_SELECTOR.value) {
        return res.status(400).send(common_backend.getError(1000));
    }

    const parsedSelectedMode = parseInt(req.body.selectedMode);
    if (!common_backend.isValueInObject(parsedSelectedMode, common_backend.modeTypes)) {
        logger.error(JSON.stringify(common_backend.getError(3006)));
        return res.status(400).send(common_backend.getError(3006));
    }

    settings.updateModeType(parsedSelectedMode, function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        let newType;
        if (parsedSelectedMode === common_backend.modeTypes.CLASS) {
            newType = common_backend.userTypes.PROFESSOR.value
        }

        if (parsedSelectedMode === common_backend.modeTypes.COLLABORATORS) {
            newType = common_backend.userTypes.COLLABORATOR_ADMIN.value
        }

        const updateObject = {
            _id: req.session.user._id,
            type: newType
        };

        users.updateUser(updateObject, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            users.getUserById(req.session.user._id, function (err, userObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                req.session.user = userObj;
                return res.status(200).send('mode updated successfully');
            });
        });
    });
}
// </Requests Function> -----------------------------------------------

// <Comments Requests> ------------------------------------------------
exports.handleTicketsCommentPath = comment_api.addComment;
exports.handleTicketsCommentEditPath = comment_api.updateComment;
exports.handleCommentDeletePath = comment_api.deleteComment;
// </Comments Requests> -----------------------------------------------

// <Common Requests> ------------------------------------------------
exports.handleModeSelectPath = handleModeSelectPath;
exports.handleRootPath = handleRootPath;
exports.initialize = initialize;
exports.isActiveSession = common_api.isActiveSession;
// </Common Requests> -----------------------------------------------

// <Notifications Requests> ------------------------------------------------
exports.handleDeleteAllNotificationsPath = notifications_api.deleteAllNotifications;
exports.handleNotificationDeletePath = notifications_api.deleteNotification;
exports.handleNotificationsConnection = notifications_api.handleNotificationsConnection;
// </Notifications Requests> -----------------------------------------------

// <Projects Requests> ------------------------------------------------
exports.handleProjectActivatePath = projects_api.activateProject;
exports.handleProjectActiveUpdatePath = projects_api.updateActiveProject;
exports.handleProjectAdminsUpdatePath = projects_api.updateProjectAdminsList;
exports.handleProjectByIdPath = projects_api.renderProjectPage;
exports.handleProjectClosePath = projects_api.closeProject;
exports.handleProjectCreatePath = projects_api.createProject;
exports.handleProjectDeletePath = projects_api.deleteProject;
exports.handleProjectsAddPath = projects_api.renderProjectsCreationPage;
exports.handleProjectsAdminsListComponentPath = projects_api.getAdminsListComponent;
exports.handleProjectsExportPath = projects_api.renderProjectsExportPage;
exports.handleProjectsExportFilePath = projects_api.exportProjectsFile;
exports.handleProjectsExportFileDownloadPath = projects_api.exportProjectsFileDownload;
exports.handleProjectsGroupAssignPath = projects_api.getTeamsAssignmentComponent;
exports.handleProjectsImportPath = projects_api.renderProjectsImportPage;
exports.handleProjectsImportFilePath = projects_api.importPorjectsFile;
exports.handleProjectsListComponentPath = projects_api.getProjectsListComponent;
exports.handleProjectsPath = projects_api.renderProjectsPage;
exports.handleProjectTeamsUpdatePath = projects_api.updateProjectTeamsList;
exports.handleProjectTeamsUpdateMePath = projects_api.updateProjectTeamsMe;
exports.handleProjectTeamsConfigPath = projects_api.updateProjectTeamsConfiguration;
exports.handleProjectUpdatePath = projects_api.updateDraftProject;
// </Projects Requests> -----------------------------------------------

// <Releases Requests> ------------------------------------------------
exports.handleReleasePagePath = releases_api.renderReleasePage;
exports.handleReleaseComponentsPath = releases_api.getReleaseComponents;
exports.handleReleasesCreatePath = releases_api.createRelease;
exports.handleReleasesClosePath = releases_api.closeRelease;
exports.handleReleasesDeletePath = releases_api.deleteRelease;
exports.handleReleasesListPath = releases_api.getReleasesList;
// </Releases Requests> -----------------------------------------------

// <Settings Requests> ------------------------------------------------
exports.handleSettingsPath = settings_api.renderSettingsPage;
exports.handleSettingsResetPath = settings_api.resetSettings;
exports.handleSettingsUpdatePath = settings_api.updateSettings;
// </Settings Requests> -----------------------------------------------

// <Sprints Requests> ------------------------------------------------
exports.handleSprintPagePath = sprints_api.renderSprintPage;
exports.handleSprintComponentsPath = sprints_api.getSprintComponents;
exports.handleSprintsActivatePath = sprints_api.activateSprint;
exports.handleSprintsClosePath = sprints_api.closeSprint;
exports.handleSprintsCreatePath = sprints_api.createSprint;
exports.handleSprintsDeletePath = sprints_api.deleteSprint;
exports.handleSprintsListPath = sprints_api.getSprintsList;
// </Sprints Requests> -----------------------------------------------

// <Tags Requests> ------------------------------------------------
exports.handleTagPagePath = tags_api.renderTagPage;
exports.handleTagComponentsPath = tags_api.getTagComponents;
exports.handleTagsCreatePath = tags_api.createTag;
exports.handleTagsDeletePath = tags_api.deleteTag;
exports.handleTagsListPath = tags_api.getTagsList;
// </Tags Requests> -----------------------------------------------

// <Teams Requests> ------------------------------------------------
exports.handleActiveSprintTicketsListComponentPath = teams_api.getBoardComponents;
exports.handleProjectBoardTypeMePath = teams_api.updateBoardType;
exports.handleProjectTeamBacklogPath = teams_api.getBacklogComponents;
exports.handleProjectTeamMembersListPath = teams_api.getMembersList;
exports.handleProjectTeamPath = teams_api.renderTeamPage;
exports.handleTeamManagementComponentsPath = teams_api.getManagementComponents;
exports.handleTeamsListComponentPath = teams_api.getTeamsListComponent;
// </Teams Requests> -----------------------------------------------

// <Tickets Requests> ------------------------------------------------
exports.handleLookupTicketByDisplayIdPath = tickets_api.getTicketByDisplayId;
exports.handleProjectTeamSearchPath = tickets_api.renderSearchPage;
exports.handleProjectTeamTicketPath = tickets_api.renderTicketPage;
exports.handleProjectTeamTicketsAddPath = tickets_api.renderCreateTicketPage;
exports.handleTicketEditPageComponentsPath = tickets_api.getEditPageComponents;
exports.handleTicketsCreatePath = tickets_api.createTicket;
exports.handleTicketsListComponentPath = tickets_api.getTicketsListComponent;
exports.handleTicketsUpdatePath = tickets_api.updateTicket;
exports.handleTicketsUpdateStatePath = tickets_api.updateTicketState;
// </Tickets Requests> -----------------------------------------------

// <Users Requests> ------------------------------------------------
exports.handleLoginPath = users_api.login;
exports.handleLogoutPath = users_api.logout;
exports.handleMePath = users_api.me;
exports.handleProfilePath = users_api.renderProfilePage;
exports.handleProfilePicturePath = users_api.getProfilePicture;
exports.handleProfileUpdatePath = users_api.updateProfile;
exports.handleUpdateProfilePicturePath = users_api.updateProfilePicture;
exports.handleUsersAddPath = users_api.renderUsersAddPage;
exports.handleUsersCreatePath = users_api.createUser;
exports.handleUsersEditPath = users_api.renderUsersEditPage;
exports.handleUsersExportPath = users_api.renderUsersExportPage;
exports.handleUsersExportFilePath = users_api.exportUsersFile;
exports.handleUsersExportFileDownloadPath = users_api.exportUsersFileDownload;
exports.handleUsersImportFilePath = users_api.importUsersFile;
exports.handleUsersImportPath = users_api.renderUsersImportPage;
exports.handleUsersListComponentPath = users_api.adminUsersListComponent;
exports.handleUsersPath = users_api.renderAdminsUsersPage;
exports.handleUsersRequestAccessPath = users_api.requestAccess;
exports.handleUsersUpdatePath = users_api.editUser;
// </Users Requests> -----------------------------------------------