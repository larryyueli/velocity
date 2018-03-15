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

const common_api = require('./api-components/common-api.js');
const notifications_api = require('./api-components/notifications-api.js');
const settings_api = require('./api-components/settings-api.js');
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
    common_api.pugComponents.ticketEntryComponent = pug.compileFile('Templates/tickets/ticket-entry.pug');
    common_api.pugComponents.sprintEntryComponent = pug.compileFile('Templates/tickets/sprint-entry.pug');
    common_api.pugComponents.projectsEntryComponent = pug.compileFile('Templates/projects/projects-entry.pug');
    common_api.pugComponents.projectsGroupEntryComponent = pug.compileFile('Templates/projects/projects-group-entry.pug');
    common_api.pugComponents.projectsGroupModalComponent = pug.compileFile('Templates/projects/projects-group-modal.pug');
    common_api.pugComponents.projectsGroupModalEntryComponent = pug.compileFile('Templates/projects/projects-group-modal-entry.pug');
    common_api.pugComponents.projectsGroupUserEntryComponent = pug.compileFile('Templates/projects/projects-group-user-entry.pug');
    common_api.pugComponents.projectsUserEntryComponent = pug.compileFile('Templates/projects/projects-users-entry.pug');
    common_api.pugComponents.teamEntryComponent = pug.compileFile('Templates/projects/team-entry.pug');
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

/**
 * path to get the project admins and non projects admins list
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectsAdminsListComponentPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.query.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2010)));
            return res.status(403).send(common_backend.getError(2010));
        }

        const fullUserObjectsList = users.getActiveUsersList();
        const fullUsersList = common_backend.convertJsonListToList('_id', fullUserObjectsList);
        const fullUsersListObject = common_backend.convertListToJason('_id', fullUserObjectsList);

        let adminsList = projectObj.admins;
        let usersList = common_backend.getArrayDiff(fullUsersList, adminsList);

        let resolvedAdminsList = [];
        let resolvedUsersList = [];

        for (let i = 0; i < adminsList.length; i++) {
            let innerUser = fullUsersListObject[adminsList[i]];
            if (innerUser) {
                resolvedAdminsList.push({
                    fname: innerUser.fname,
                    lname: innerUser.lname,
                    username: innerUser.username,
                    email: innerUser.email,
                    type: innerUser.type
                });
            }
        }

        for (let i = 0; i < usersList.length; i++) {
            let innerUser = fullUsersListObject[usersList[i]];
            if (innerUser) {
                resolvedUsersList.push({
                    fname: innerUser.fname,
                    lname: innerUser.lname,
                    username: innerUser.username,
                    email: innerUser.email,
                    type: innerUser.type
                });
            }
        }

        return res.status(200).send({
            projectAdmins: resolvedAdminsList,
            projectUsers: resolvedUsersList,
            usersEntryHTML: common_api.pugComponents.projectsUserEntryComponent()
        });
    });
}

/**
 * path to get the projects page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectsPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type === common_backend.userTypes.MODE_SELECTOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2033)));
        return res.status(404).render(common_api.pugPages.pageNotFound);
    }

    return res.status(200).render(common_api.pugPages.projects, {
        user: req.session.user
    });
}

/**
 * path to get the tickets list component
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleTicketsListComponentPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.query.projectId;
    const teamId = req.query.teamId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            projects.getTicketsByTeamId(projectId, teamId, function (err, ticketsObjList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                const usersObj = common_backend.convertListToJason('_id', users.getActiveUsersList());
                let limitedTicketList = [];
                for (let i = 0; i < ticketsObjList.length; i++) {
                    let ticket = ticketsObjList[i];
                    let ticketAssignee = usersObj[ticket.assignee];
                    let ticketReporter = usersObj[ticket.reporter];
                    limitedTicketList.push({
                        _id: ticket._id,
                        ctime: ticket.ctime,
                        mtime: ticket.mtime,
                        displayId: ticket.displayId,
                        title: ticket.title,
                        state: ticket.state,
                        type: ticket.type,
                        assignee: ticketAssignee ? `${ticketAssignee.fname} ${ticketAssignee.lname}` : common_backend.noAssignee,
                        reporter: ticketReporter ? `${ticketReporter.fname} ${ticketReporter.lname}` : common_backend.noReporter,
                        assigneePicture: ticketAssignee ? ticketAssignee.picture : null,
                        reporterPicture: ticketReporter ? ticketReporter.picture : null,
                        priority: ticket.priority,
                        points: ticket.points
                    });
                }

                return res.status(200).send({
                    ticketEntryHTML: common_api.pugComponents.ticketEntryComponent(),
                    ticketsList: limitedTicketList
                });
            });
        });
    });
}

/**
 * path to get the tickets list in active sprint
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleActiveSprintTicketsListComponentPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.query.projectId;
    const teamId = req.query.teamId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            projects.getActiveSprintByTeamId(projectId, teamId, function (err, activeSprintObj) {
                if (err && err.code !== 10004) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                projects.getTicketsByIds(projectId, teamId, activeSprintObj.tickets, function (err, ticketsObjList) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    const usersObj = common_backend.convertListToJason('_id', users.getActiveUsersList());
                    let limitedTicketList = [];
                    for (let i = 0; i < ticketsObjList.length; i++) {
                        let ticket = ticketsObjList[i];
                        let ticketAssignee = usersObj[ticket.assignee];
                        let ticketReporter = usersObj[ticket.reporter];
                        limitedTicketList.push({
                            _id: ticket._id,
                            ctime: ticket.ctime,
                            mtime: ticket.mtime,
                            displayId: ticket.displayId,
                            title: ticket.title,
                            state: ticket.state,
                            type: ticket.type,
                            assignee: ticketAssignee ? `${ticketAssignee.fname} ${ticketAssignee.lname}` : common_backend.noAssignee,
                            reporter: ticketReporter ? `${ticketReporter.fname} ${ticketReporter.lname}` : common_backend.noReporter,
                            assigneePicture: ticketAssignee ? ticketAssignee.picture : null,
                            reporterPicture: ticketReporter ? ticketReporter.picture : null,
                            priority: ticket.priority,
                            points: ticket.points
                        });
                    }

                    return res.status(200).send({
                        ticketEntryHTML: common_api.pugComponents.ticketEntryComponent(),
                        ticketsList: limitedTicketList
                    });
                });
            });
        });
    });
}

/**
 * path to get the teams list component
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleTeamsListComponentPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.query.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getProjectTeams(projectId, function (err, teamsList) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            const usersIdObj = common_backend.convertListToJason('_id', users.getActiveUsersList());
            let resolvedTeamsList = [];

            for (let i = 0; i < teamsList.length; i++) {
                let team = teamsList[i];
                let resolvedMembers = [];
                for (let j = 0; j < team.members.length; j++) {
                    let member = usersIdObj[team.members[j]];
                    if (member) {
                        resolvedMembers.push(`${member.fname} ${member.lname} - ${member.username}`);
                    }
                }
                resolvedTeamsList.push({
                    teamId: team._id,
                    projectId: team.projectId,
                    ctime: team.ctime,
                    mtime: team.mtime,
                    name: team.name,
                    members: resolvedMembers,
                    newTickets: 4,
                    progressTickets: 6,
                    doneTickets: 1
                });
            }

            return res.status(200).send({
                teamsList: resolvedTeamsList,
                teamRowHTML: common_api.pugComponents.teamEntryComponent()
            });
        });
    });
}

/**
 * path to get the projects list entry
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectsListComponentPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type === common_backend.userTypes.MODE_SELECTOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2034)));
        return res.status(403).send(common_backend.getError(2034));
    }

    projects.getProjectsListByUserId(req.session.user._id, function (err, projectsList) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        let addDraft = function () {
            projects.getDraftProjectsInUserSelectionType(function (err, draftProjectsList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                let joinedLists = common_backend.joinLists(projectsList, draftProjectsList);
                return res.status(200).send({
                    projectsList: joinedLists,
                    projectsEntryHTML: common_api.pugComponents.projectsEntryComponent()
                });
            });
        }

        if (req.session.user.type === common_backend.userTypes.STUDENT.value) {
            addDraft();
        } else {
            return res.status(200).send({
                projectsList: projectsList,
                projectsEntryHTML: common_api.pugComponents.projectsEntryComponent()
            });
        }
    });
}

/**
 * path to get the projects user groups list entry
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectsGroupAssignPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type === common_backend.userTypes.MODE_SELECTOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2034)));
        return res.status(403).send(common_backend.getError(2034));
    }

    const projectId = req.query.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        let userIsAdmin = projectObj.admins.indexOf(req.session.user._id) !== -1;
        let userIsMember = projectObj.members.indexOf(req.session.user._id) !== -1;

        if (projectObj.status === common_backend.projectStatus.ACTIVE.value && !userIsMember) {
            logger.error(JSON.stringify(common_backend.getError(2034)));
            return res.status(403).send(common_backend.getError(2034));
        }

        if (projectObj.status === common_backend.projectStatus.DRAFT.value
            && !userIsAdmin
            && projectObj.teamSelectionType !== common_backend.teamSelectionTypes.USER.value) {
            logger.error(JSON.stringify(common_backend.getError(2034)));
            return res.status(403).send(common_backend.getError(2034));
        }

        if (projectObj.status === common_backend.projectStatus.CLOSED.value && !userIsMember) {
            logger.error(JSON.stringify(common_backend.getError(2034)));
            return res.status(403).send(common_backend.getError(2034));
        }

        if (projectObj.status === common_backend.projectStatus.DELETED.value) {
            logger.error(JSON.stringify(common_backend.getError(2034)));
            return res.status(403).send(common_backend.getError(2034));
        }

        projects.getProjectTeams(projectId, function (err, teamsList) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            let projectMembers = [];
            for (let i = 0; i < teamsList.length; i++) {
                projectMembers = common_backend.joinSets(projectMembers, teamsList[i].members);
            }

            const fullUserObjectsList = users.getActiveUsersList();
            const fullUsersListObject = common_backend.convertListToJason('_id', fullUserObjectsList);
            const usersList = common_backend.convertJsonListToList('_id', fullUserObjectsList);

            let unassignedList = common_backend.getArrayDiff(usersList, projectMembers);
            let unassignedObjectsList = [];

            for (let i = 0; i < unassignedList.length; i++) {
                let innerUser = fullUsersListObject[unassignedList[i]];
                if (innerUser) {
                    unassignedObjectsList.push({
                        fname: innerUser.fname,
                        lname: innerUser.lname,
                        username: innerUser.username,
                        type: innerUser.type
                    });
                }
            }

            let resolvedTeamsList = [];
            for (let i = 0; i < teamsList.length; i++) {
                let teamObject = teamsList[i];
                let teamMembers = [];
                for (let j = 0; j < teamObject.members.length; j++) {
                    let teamUser = fullUsersListObject[teamObject['members'][j]];
                    if (teamUser) {
                        teamMembers.push({
                            fname: teamUser.fname,
                            lname: teamUser.lname,
                            username: teamUser.username,
                            type: teamUser.type
                        });
                    }
                }
                resolvedTeamsList.push({
                    name: teamObject.name,
                    members: teamMembers
                });
            }

            return res.status(200).send({
                unassignedList: unassignedObjectsList,
                groupList: resolvedTeamsList,
                groupSize: projectObj.teamSize,
                groupSelectionType: projectObj.teamSelectionType,
                groupPrefix: projectObj.teamPrefix,
                groupUserHTML: common_api.pugComponents.projectsGroupUserEntryComponent(),
                groupHTML: common_api.pugComponents.projectsGroupEntryComponent(),
                groupModalHTML: common_api.pugComponents.projectsGroupModalComponent(),
                groupModalEntryHTML: common_api.pugComponents.projectsGroupModalEntryComponent(),
                isProjectAdmin: projectObj.admins.indexOf(req.session.user._id) !== -1,
                isClassMode: settings.getModeType() === common_backend.modeTypes.CLASS,
                isCollabMode: settings.getModeType() === common_backend.modeTypes.COLLABORATORS
            });
        });
    });
}

/**
 * path to get the projects add page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectsAddPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2035)));
        return res.status(404).render(common_api.pugPages.pageNotFound);
    }

    return res.status(200).render(common_api.pugPages.projectsAdd, {
        user: req.session.user,
        isClassMode: settings.getModeType() === common_backend.modeTypes.CLASS,
        isCollabMode: settings.getModeType() === common_backend.modeTypes.COLLABORATORS,
        isActive: false,
        selectedBoardType: common_backend.boardTypes.KANBAN.value
    });
}

/**
 * root path to create a project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectsCreatePath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2036)));
        return res.status(403).send(common_backend.getError(2036));
    }

    const parsedBoardType = parseInt(req.body.boardType);
    const boardType = common_backend.convertStringToBoolean(req.body.canForceBoardType)
        ? typeof (parsedBoardType) === common_backend.variableTypes.NUMBER
            ? parsedBoardType
            : common_backend.boardTypes.UNKNOWN.value
        : common_backend.boardTypes.UNKNOWN.value;

    const newProject = {
        title: req.body.title,
        description: req.body.description,
        status: common_backend.projectStatus.DRAFT.value,
        admins: [req.session.user._id],
        boardType: boardType
    };

    projects.addProject(newProject, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        return res.status(200).send(projectObj._id);
    });
}

/**
 * path to get a project page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectByIdPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type === common_backend.userTypes.MODE_SELECTOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2038)));
        return res.status(404).render(common_api.pugPages.pageNotFound);
    }

    const projectId = req.params.projectId;
    projects.getProjectById(projectId, function (err, projectObj) { // TODO: change to use active projects
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        let userIsAdmin = projectObj.admins.indexOf(req.session.user._id) !== -1;
        let userIsMember = projectObj.members.indexOf(req.session.user._id) !== -1;

        if (projectObj.status === common_backend.projectStatus.ACTIVE.value && !userIsMember) {
            logger.error(JSON.stringify(common_backend.getError(2038)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.status === common_backend.projectStatus.ACTIVE.value && !userIsAdmin) {
            return projects.getTeamByUserId(projectId, req.session.user._id, function (err, teamObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).send(err);
                }

                return res.redirect(`/project/${projectId}/team/${teamObj._id}`);
            });
        }

        if (projectObj.status === common_backend.projectStatus.DRAFT.value
            && !userIsAdmin
            && projectObj.teamSelectionType !== common_backend.teamSelectionTypes.USER.value) {
            logger.error(JSON.stringify(common_backend.getError(2038)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.status === common_backend.projectStatus.CLOSED.value && !userIsMember) {
            logger.error(JSON.stringify(common_backend.getError(2038)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.status === common_backend.projectStatus.DELETED.value) {
            logger.error(JSON.stringify(common_backend.getError(2038)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        return res.status(200).render(common_api.pugPages.projectPage, {
            user: req.session.user,
            title: projectObj.title,
            isProjectAdmin: projectObj.admins.indexOf(req.session.user._id) !== -1,
            description: projectObj.description,
            isClassMode: settings.getModeType() === common_backend.modeTypes.CLASS,
            isCollabMode: settings.getModeType() === common_backend.modeTypes.COLLABORATORS,
            isActive: projectObj.status === common_backend.projectStatus.ACTIVE.value,
            forceBoardType: projectObj.boardType !== common_backend.boardTypes.UNKNOWN.value,
            selectedBoardType: projectObj.boardType
        });
    });
}

/**
 * path to update a project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectUpdatePath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2037)));
            return res.status(403).send(common_backend.getError(2037));
        }

        if (projectObj.status !== common_backend.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common_backend.getError(2042)));
            return res.status(400).send(common_backend.getError(2042));
        }

        const parsedBoardType = parseInt(req.body.boardType);
        const boardType = common_backend.convertStringToBoolean(req.body.canForceBoardType)
            ? typeof (parsedBoardType) === common_backend.variableTypes.NUMBER
                ? parsedBoardType
                : common_backend.boardTypes.UNKNOWN.value
            : common_backend.boardTypes.UNKNOWN.value;

        let newProject = {
            title: req.body.title,
            description: req.body.description,
            boardType: boardType
        };
        projects.updateProject(req.body.projectId, newProject, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(400).send(err);
            }

            return res.status(200).send('ok');
        });
    });
}

/**
 * path to update an active project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectActiveUpdatePath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2037)));
            return res.status(403).send(common_backend.getError(2037));
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value) {
            logger.error(JSON.stringify(common_backend.getError(2042)));
            return res.status(400).send(common_backend.getError(2042));
        }

        let newProject = {
            title: req.body.title,
            description: req.body.description
        };
        projects.updateProject(req.body.projectId, newProject, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(400).send(err);
            }

            return res.status(200).send('ok');
        });
    });
}

/**
 * path to update a project's teams
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamsUpdatePath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2039)));
            return res.status(403).send(common_backend.getError(2039));
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value
            && projectObj.status !== common_backend.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common_backend.getError(2042)));
            return res.status(400).send(common_backend.getError(2042));
        }

        let inputTeamsList = req.body.teamsList;
        if (!Array.isArray(inputTeamsList)) {
            try {
                inputTeamsList = JSON.parse(inputTeamsList);
            }
            catch (err) {
                logger.error(common_backend.getError(1011));
                inputTeamsList = [];
            }
        }

        projects.getProjectTeams(projectId, function (err, projectTeamsList) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            let projectTeamsListofNames = common_backend.convertJsonListToList('name', projectTeamsList);
            let inputTeamsListofNames = common_backend.convertJsonListToList('name', inputTeamsList);
            let teamsListofNamesToDelete = common_backend.getArrayDiff(projectTeamsListofNames, inputTeamsListofNames);
            let teamsObj = common_backend.convertListToJason('name', projectTeamsList);

            let updateTeams = function () {
                const fullUserObjectsList = users.getActiveUsersList();
                const fullUsersListObject = common_backend.convertListToJason('username', fullUserObjectsList);

                let resolvedTeamsList = [];
                for (let i = 0; i < inputTeamsList.length; i++) {
                    let team = inputTeamsList[i];
                    let members = [];
                    if (team.members) {
                        for (let j = 0; j < team.members.length; j++) {
                            let username = team['members'][j]['username'];
                            if (fullUsersListObject[username]) {
                                members.push(fullUsersListObject[username]._id);
                            }
                        }
                    }
                    resolvedTeamsList.push({
                        name: team.name,
                        members: members,
                        boardType: projectObj.status === common_backend.projectStatus.ACTIVE.value ? projectObj.boardType : team.boardType
                    });
                }

                let updateTeamsCounter = 0;
                if (updateTeamsCounter === resolvedTeamsList.length) {
                    return res.status(200).send('ok');
                }
                for (let i = 0; i < resolvedTeamsList.length; i++) {
                    let team = resolvedTeamsList[i];
                    projects.getTeamInProjectByName(projectId, team.name, function (err, teamObj) {
                        if (err) {
                            if (err.code === 6004) {
                                projects.addTeamToProject(projectId, team, function (err, result) {
                                    if (err) {
                                        logger.error(JSON.stringify(err));
                                    }

                                    updateTeamsCounter++;
                                    if (updateTeamsCounter === resolvedTeamsList.length) {
                                        if (projectObj.status === common_backend.projectStatus.ACTIVE.value) {
                                            updateActiveTeam();
                                        } else {
                                            return res.status(200).send('ok');
                                        }
                                    }
                                });
                            } else {
                                logger.error(JSON.stringify(err));
                            }
                        }

                        if (teamObj) {
                            projects.updateTeamInProject(teamObj._id, projectId, team, function (err, result) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                }

                                updateTeamsCounter++;
                                if (updateTeamsCounter === resolvedTeamsList.length) {
                                    if (projectObj.status === common_backend.projectStatus.ACTIVE.value) {
                                        updateActiveTeam();
                                    } else {
                                        return res.status(200).send('ok');
                                    }
                                }
                            });
                        }
                    });
                }
            }

            let updateActiveTeam = function () {
                projects.getProjectTeams(projectId, function (err, teamsList) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    let members = projectObj.admins;
                    for (let i = 0; i < teamsList.length; i++) {
                        members = common_backend.joinSets(members, teamsList[i].members);
                    }

                    let newProject = {
                        status: common_backend.projectStatus.ACTIVE.value,
                        members: members
                    };
                    projects.updateProject(req.body.projectId, newProject, function (err, result) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            return res.status(400).send(err);
                        }

                        return res.status(200).send('ok');
                    });
                });
            }

            let completedDeletedTeams = 0;
            if (completedDeletedTeams === teamsListofNamesToDelete.length) {
                updateTeams();
            } else {
                for (let i = 0; i < teamsListofNamesToDelete.length; i++) {
                    let deleteTeamName = teamsListofNamesToDelete[i];
                    if (teamsObj[deleteTeamName]) {
                        let teamToDeleteUpdate = teamsObj[deleteTeamName];
                        teamToDeleteUpdate.status = common_backend.teamStatus.DISABLED.value;
                        projects.updateTeamInProject(teamToDeleteUpdate._id, projectId, teamToDeleteUpdate, function (err, result) {
                            if (err) {
                                logger.error(JSON.stringify(err));
                            }

                            completedDeletedTeams++;
                            if (completedDeletedTeams === teamsListofNamesToDelete.length) {
                                updateTeams();
                            }
                        });
                    }
                }
            }
        });
    });
}

/**
 * path to update a project's admins
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectAdminsUpdatePath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2037)));
            return res.status(403).send(common_backend.getError(2037));
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value
            && projectObj.status !== common_backend.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common_backend.getError(2042)));
            return res.status(400).send(common_backend.getError(2042));
        }

        const inputAdminsList = req.body.adminsList;
        if (!Array.isArray(inputAdminsList)) {
            try {
                inputAdminsList = JSON.parse(inputAdminsList);
            }
            catch (err) {
                logger.error(common_backend.getError(1011));
                inputAdminsList = [];
            }
        }

        const projectAdminsListofNames = common_backend.convertJsonListToList('username', inputAdminsList);
        const fullUserObjectsList = users.getActiveUsersList();
        const fullUsersListObject = common_backend.convertListToJason('username', fullUserObjectsList);

        let newAdminsList = [];
        for (let i = 0; i < projectAdminsListofNames.length; i++) {
            let adminObj = fullUsersListObject[projectAdminsListofNames[i]];
            if (adminObj) {
                newAdminsList.push(adminObj._id);
            }
        }

        const newProject = {
            admins: newAdminsList
        };
        projects.updateProject(projectId, newProject, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            return res.status(200).send('ok');
        });
    });
}

/**
 * path to activate a project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectActivatePath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2041)));
            return res.status(403).send(common_backend.getError(2041));
        }

        if (projectObj.status !== common_backend.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common_backend.getError(2042)));
            return res.status(400).send(common_backend.getError(2042));
        }

        projects.getProjectTeams(projectId, function (err, teamsList) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            let members = projectObj.admins;
            let teamsIds = [];
            for (let i = 0; i < teamsList.length; i++) {
                teamsIds.push(teamsList[i]._id);
                members = common_backend.joinSets(members, teamsList[i].members);
            }

            let newProject = {
                status: common_backend.projectStatus.ACTIVE.value,
                members: members
            };

            projects.updateProject(req.body.projectId, newProject, function (err, result) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(400).send(err);
                }

                projects.setTeamsBoardType(projectId, teamsIds, projectObj.boardType, function (err, result) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    return res.status(200).send('ok');
                });
            });
        });
    });
}

/**
 * path to close a project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectClosePath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2041)));
            return res.status(403).send(common_backend.getError(2041));
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value) {
            logger.error(JSON.stringify(common_backend.getError(2042)));
            return res.status(400).send(common_backend.getError(2042));
        }

        let newProject = {
            status: common_backend.projectStatus.CLOSED.value,
        };
        projects.updateProject(req.body.projectId, newProject, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(400).send(err);
            }

            return res.status(200).send('ok');
        });
    });
}

/**
 * path to delete a project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectDeletePath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2040)));
            return res.status(403).send(common_backend.getError(2040));
        }

        let newProject = {
            status: common_backend.projectStatus.DELETED.value
        };
        projects.updateProject(req.body.projectId, newProject, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(400).send(err);
            }

            return res.status(200).send('ok');
        });
    });
}

/**
 * path to update a project teams configuration
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamsConfigPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (settings.getModeType() !== common_backend.modeTypes.CLASS) {
        logger.error(JSON.stringify(common_backend.getError(1000)));
        return res.status(400).send(common_backend.getError(1000));
    }

    if (req.session.user.type !== common_backend.userTypes.PROFESSOR.value
        && req.session.user.type !== common_backend.userTypes.TA.value
        && req.session.user.type !== common_backend.userTypes.STUDENT.value) {
        logger.error(JSON.stringify(common_backend.getError(1000)));
        return res.status(403).send(common_backend.getError(1000));
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2037)));
            return res.status(403).send(common_backend.getError(2037));
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value
            && projectObj.status !== common_backend.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common_backend.getError(2042)));
            return res.status(400).send(common_backend.getError(2042));
        }

        let newProject = {
            teamSize: parseInt(req.body.groupSize),
            teamSelectionType: parseInt(req.body.groupSelectType),
            teamPrefix: req.body.groupPrefix
        };
        projects.updateProject(projectId, newProject, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(400).send(err);
            }

            return res.status(200).send('ok');
        });
    });
}

/**
 * path to update user's team board type
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectBoardTypeMePath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const boardType = parseInt(req.body.boardType);
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value) {
            logger.error(JSON.stringify(common_backend.getError(2012)));
            return res.status(403).send(common_backend.getError(2012));
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamByUserId(projectId, req.session.user._id, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (teamObj.boardType !== common_backend.boardTypes.UNKNOWN.value) {
                logger.error(JSON.stringify(common_backend.getError(1000)));
                return res.status(400).send(common_backend.getError(1000));
            }

            if (boardType !== common_backend.boardTypes.KANBAN.value
                && boardType !== common_backend.boardTypes.SCRUM.value) {
                logger.error(JSON.stringify(common_backend.getError(1000)));
                return res.status(400).send(common_backend.getError(1000));
            }

            projects.updateTeamInProject(teamObj._id, projectId, { boardType: boardType }, function (err, result) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                return res.status(200).send('ok');
            });
        });
    });
}

/**
 * path to update a student's team in a  project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamsUpdateMePath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.STUDENT.value) {
        logger.error(JSON.stringify(common_backend.getError(1000)));
        return res.status(400).send(common_backend.getError(1000));
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.status === common_backend.projectStatus.ACTIVE.value) {
            logger.error(JSON.stringify(common_backend.getError(2012)));
            return res.status(403).send(common_backend.getError(2012));
        }

        if (projectObj.status === common_backend.projectStatus.CLOSED.value) {
            logger.error(JSON.stringify(common_backend.getError(2013)));
            return res.status(403).send(common_backend.getError(2013));
        }

        if (projectObj.status !== common_backend.projectStatus.DRAFT.value
            && projectObj.teamSelectionType !== common_backend.teamSelectionTypes.USER.value) {
            logger.error(JSON.stringify(common_backend.getError(2014)));
            return res.status(403).send(common_backend.getError(2014));
        }

        projects.getTeamByUserId(projectId, req.session.user._id, function (err, teamObj) {
            if (err) {
                if (err.code !== 6004) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }
            }

            const teamNotExist = (err && err.code === 6004);
            const addAction = req.body.action === 'add';
            const removeAction = req.body.action === 'remove';
            const teamName = req.body.teamName;

            if (!addAction && !removeAction) {
                logger.error(JSON.stringify(common_backend.getError(2015)));
                return res.status(400).send(common_backend.getError(2015));
            }

            if (addAction) {
                if (teamObj) {
                    logger.error(JSON.stringify(common_backend.getError(2016)));
                    return res.status(400).send(common_backend.getError(2016));
                }

                projects.getTeamInProjectByName(projectId, teamName, function (err, teamObjFound) {
                    if (err) {
                        if (err.code === 6004) {
                            const newTeam = {
                                name: teamName,
                                projectId: projectId,
                                members: [req.session.user._id]
                            };
                            projects.addTeamToProject(projectId, newTeam, function (err, result) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                return res.status(200).send('ok');
                            });
                        } else {
                            logger.error(JSON.stringify(err));
                            return res.status(400).send(err);
                        }
                    }

                    if (teamObjFound) {
                        if (projectObj.teamSize < teamObjFound.members.length + 1) {
                            logger.error(JSON.stringify(common_backend.getError(2020)));
                            return res.status(400).send(common_backend.getError(2020));
                        }

                        teamObjFound.members.push(req.session.user._id);
                        const updatedTeam = {
                            projectId: projectId,
                            members: teamObjFound.members
                        };
                        projects.updateTeamInProject(teamObjFound._id, projectId, updatedTeam, function (err, result) {
                            if (err) {
                                logger.error(JSON.stringify(err));
                                return res.status(500).send(err);
                            }

                            return res.status(200).send('ok');
                        });
                    }
                });
            }

            if (removeAction) {
                if (teamNotExist) {
                    logger.error(JSON.stringify(common_backend.getError(2017)));
                    return res.status(400).send(common_backend.getError(2017));
                }

                if (teamObj.name !== teamName) {
                    logger.error(JSON.stringify(common_backend.getError(2021)));
                    return res.status(400).send(common_backend.getError(2021));
                }

                teamObj.members.splice(teamObj.members.indexOf(req.session.user._id), 1);

                let updatedTeam = {
                    projectId: projectId,
                    members: teamObj.members,
                    status: teamObj.members.length === 0 ? common_backend.teamStatus.DISABLED.value : common_backend.teamStatus.ACTIVE.value
                };

                projects.updateTeamInProject(teamObj._id, projectId, updatedTeam, function (err, result) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    return res.status(200).send('ok');
                });
            }
        });
    });
}

/**
 * root path to create a ticket
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleTicketsCreatePath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const assignee = req.body.assignee;
    const sprints = req.body.sprints;

    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            users.getUserByUsername(assignee, function (err, assigneeObj) {
                if (err && err.code !== 2003) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                let newTicket = {
                    projectId: req.body.projectId,
                    teamId: req.body.teamId,
                    title: req.body.title,
                    description: req.body.description,
                    type: parseInt(req.body.type),
                    state: parseInt(req.body.state),
                    points: parseInt(req.body.points),
                    priority: parseInt(req.body.priority),
                    reporter: req.session.user._id
                };

                if (assigneeObj) {
                    if (projectObj.members.indexOf(assigneeObj._id) === -1) {
                        logger.error(JSON.stringify(common_backend.getError(2018)));
                        return res.status(400).send(common_backend.getError(2018));
                    }

                    if (settings.getModeType() === common_backend.modeTypes.CLASS
                        && teamObj.members.indexOf(assigneeObj._id) === -1) {
                        logger.error(JSON.stringify(common_backend.getError(2019)));
                        return res.status(400).send(common_backend.getError(2019));
                    }

                    newTicket.assignee = assigneeObj._id;
                }

                projects.addTicketToTeam(newTicket, function (err, ticketObj) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    if (Array.isArray(sprints)) {
                        projects.getSprintsByIds(projectId, teamId, sprints, function (err, sprintsList) {
                            if (err) {
                                logger.error(JSON.stringify(err));
                                return res.status(500).send(err);
                            }

                            let sprintsIdsList = [];
                            for (let i = 0; i < sprintsList.length; i++) {
                                sprintsIdsList.push(sprintsList[i]['_id']);
                            }
                            projects.addTicketToSprints(ticketObj._id, projectId, teamId, sprintsIdsList, function (err, result) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                projects.updateTicket(ticketObj._id, teamId, projectId, { sprints: sprintsIdsList }, function (err, result) {
                                    if (err) {
                                        logger.error(JSON.stringify(err));
                                        return res.status(500).send(err);
                                    }

                                    return res.status(200).send('ok');
                                });
                            });
                        });
                    } else {
                        return res.status(200).send('ok');
                    }
                });
            });
        });
    });
}


/**
 * root path to update a ticket
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleTicketsUpdatePath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const ticketId = req.body.ticketId;
    const assignee = req.body.assignee;
    const sprints = req.body.sprints;

    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (settings.getModeType() === common_backend.modeTypes.CLASS
                && projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            projects.getTicketById(projectId, teamId, ticketId, function (err, ticketObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                users.getUserByUsername(assignee, function (err, assigneeObj) {
                    if (err && err.code !== 2003) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    let newType = parseInt(req.body.type);
                    let newState = parseInt(req.body.state);
                    let newPoints = parseInt(req.body.points);
                    let newPriority = parseInt(req.body.priority);

                    let updatedTicket = {
                        title: req.body.title,
                        description: req.body.description,
                        type: newType,
                        state: newState,
                        points: newPoints,
                        priority: newPriority
                    };

                    if (common_backend.isValueInObjectWithKeys(newState, 'value', common_backend.ticketStates)
                        && ticketObj.state !== newState) {
                        updatedTicket.stateHistoryEntry = {
                            actor: req.session.user._id,
                            from: ticketObj.state,
                            to: newState,
                            ctime: common_backend.getDate()
                        };
                    }

                    if (assigneeObj) {
                        if (projectObj.members.indexOf(assigneeObj._id) === -1) {
                            logger.error(JSON.stringify(common_backend.getError(2018)));
                            return res.status(400).send(common_backend.getError(2018));
                        }

                        if (settings.getModeType() === common_backend.modeTypes.CLASS
                            && teamObj.members.indexOf(assigneeObj._id) === -1) {
                            logger.error(JSON.stringify(common_backend.getError(2019)));
                            return res.status(400).send(common_backend.getError(2019));
                        }

                        updatedTicket.assignee = assigneeObj._id;

                        if (ticketObj.assignee !== assigneeObj._id) {
                            updatedTicket.assigneeHistoryEntry = {
                                actor: req.session.user._id,
                                from: ticketObj.assignee,
                                to: assigneeObj._id,
                                ctime: common_backend.getDate()
                            };
                        }
                    }

                    if (Array.isArray(sprints)) {
                        let allSprints = common_backend.joinSets(ticketObj.sprints, sprints);
                        projects.getSprintsByIds(projectId, teamId, allSprints, function (err, sprintsList) {
                            if (err) {
                                logger.error(JSON.stringify(err));
                                return res.status(500).send(err);
                            }

                            let allSprintsId = [];
                            for (let i = 0; i < sprintsList.length; i++) {
                                allSprintsId.push(sprintsList[i]['_id']);
                            }

                            let validSprintIds = [];
                            for (let i = 0; i < sprints.length; i++) {
                                let sprintId = sprints[i];
                                if (allSprintsId.indexOf(sprintId) !== -1) {
                                    validSprintIds.push(sprintId);
                                }
                            }

                            let sprintsToRemove = common_backend.getArrayDiff(allSprintsId, validSprintIds);

                            projects.addTicketToSprints(ticketObj._id, projectId, teamId, validSprintIds, function (err, result) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                projects.removeTicketFromSprints(ticketObj._id, projectId, teamId, sprintsToRemove, function (err, result) {
                                    if (err) {
                                        logger.error(JSON.stringify(err));
                                        return res.status(500).send(err);
                                    }

                                    updatedTicket.sprints = validSprintIds;
                                    projects.updateTicket(ticketObj._id, teamId, projectId, updatedTicket, function (err, result) {
                                        if (err) {
                                            logger.error(JSON.stringify(err));
                                            return res.status(500).send(err);
                                        }

                                        return res.status(200).send('ok');
                                    });
                                });
                            });
                        });
                    } else {
                        updatedTicket.sprints = [];
                        projects.removeTicketFromSprints(ticketObj._id, projectId, teamId, ticketObj.sprints, function (err, result) {
                            if (err) {
                                logger.error(JSON.stringify(err));
                                return res.status(500).send(err);
                            }

                            projects.updateTicket(ticketId, teamId, projectId, updatedTicket, function (err, result) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                return res.status(200).send('ok');
                            });
                        });
                    }
                });
            });
        });
    });
}

/**
 * root path to render the team's project page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.params.projectId;
    const teamId = req.params.teamId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value
            && projectObj.status !== common_backend.projectStatus.CLOSED.value) {
            logger.error(JSON.stringify(common_backend.getError(2044)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(404).render(common_api.pugPages.pageNotFound);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(404).render(common_api.pugPages.pageNotFound);
            }

            projects.getTicketsByTeamId(projectId, teamId, function (err, ticketsObjList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                const usersIdObj = common_backend.convertListToJason('_id', users.getActiveUsersList());
                let resolvedMembers = [];
                for (let i = 0; i < teamObj.members.length; i++) {
                    let member = usersIdObj[teamObj.members[i]];
                    if (member) {
                        resolvedMembers.push({
                            fname: member.fname,
                            lname: member.lname,
                            email: member.email,
                            picture: member.picture
                        });
                    }
                }
                let resolvedTeamObj = {
                    teamId: teamObj._id,
                    projectId: teamObj.projectId,
                    ctime: teamObj.ctime,
                    mtime: teamObj.mtime,
                    name: teamObj.name,
                    members: resolvedMembers
                };

                return res.status(200).render(common_api.pugPages.projectTeam, {
                    user: req.session.user,
                    project: projectObj,
                    team: resolvedTeamObj,
                    ticketsList: ticketsObjList,
                    canSearch: true
                });
            });
        });
    });
}

/**
 * root path to search for tickets in projects
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamSearchPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.params.projectId;
    const teamId = req.params.teamId;
    const terms = req.query.criteria;

    let searchForTickets = function (projectId, teamId, terms) {
        if (settings.getModeType() === common_backend.modeTypes.COLLABORATORS) {
            projects.searchTicketsByProjectId(projectId, terms, function (err, ticketsList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                return res.status(200).render(common_api.pugPages.ticketSearch, {
                    user: req.session.user,
                    projectId: projectId,
                    teamId: teamId,
                    ticketsList: ticketsList,
                    canSearch: true
                });
            });
        } else {
            projects.searchTicketsByTeamId(projectId, teamId, terms, function (err, ticketsList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                return res.status(200).render(common_api.pugPages.ticketSearch, {
                    user: req.session.user,
                    projectId: projectId,
                    teamId: teamId,
                    ticketsList: ticketsList,
                    canSearch: true
                });
            });
        }
    }

    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value) {
            logger.error(JSON.stringify(common_backend.getError(2043)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (typeof (teamId) === common_backend.variableTypes.UNDEFINED) {
            projects.getTeamByUserId(projectId, req.session.user._id, function (err, teamObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                searchForTickets(projectId, teamObj._id, terms);
            });
        } else {
            projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                if (projectObj.admins.indexOf(req.session.user._id) === -1
                    && teamObj.members.indexOf(req.session.user._id) === -1) {
                    logger.error(JSON.stringify(common_backend.getError(2019)));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                searchForTickets(projectId, teamId, terms);
            });
        }
    });
}

/**
 * root path to render the team's project tickets add page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamTicketsAddPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.params.projectId;
    const teamId = req.params.teamId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value) {
            logger.error(JSON.stringify(common_backend.getError(2043)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(404).render(common_api.pugPages.pageNotFound);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(404).render(common_api.pugPages.pageNotFound);
            }

            const reporter = `${req.session.user.fname} ${req.session.user.lname}`;
            const assignee = '';

            return res.status(200).render(common_api.pugPages.ticketCreation, {
                user: req.session.user,
                projectId: projectId,
                teamId: teamId,
                reporter: reporter,
                assignee: assignee,
                canSearch: true
            });
        });
    });
}

/**
 * root path to render the team's project tickets modify page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamTicketPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.params.projectId;
    const teamId = req.params.teamId;
    const ticketId = req.params.ticketId;

    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value
            && projectObj.status !== common_backend.projectStatus.CLOSED.value) {
            logger.error(JSON.stringify(common_backend.getError(2044)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(404).render(common_api.pugPages.pageNotFound);
            }

            if (settings.getModeType() === common_backend.modeTypes.CLASS
                && projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(404).render(common_api.pugPages.pageNotFound);
            }

            let continueWithTicketsList = function (ticketsList) {
                let ticketObj = null;
                for (let i = 0; i < ticketsList.length; i++) {
                    if (ticketsList[i]._id === ticketId) {
                        ticketObj = ticketsList[i];
                        break;
                    }
                }

                if (!ticketObj) {
                    logger.error(JSON.stringify(common_backend.getError(7004)));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                projects.getCommentsByTicketId(projectId, teamId, ticketId, function (err, commentsList) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(404).render(common_api.pugPages.pageNotFound);
                    }

                    const usersIdObj = common_backend.convertListToJason('_id', users.getActiveUsersList());
                    const ticketsIdObj = common_backend.convertListToJason('_id', ticketsList);

                    let assignee = '';
                    let resolvedAssignee = usersIdObj[ticketObj.assignee];
                    if (resolvedAssignee) {
                        assignee = `${resolvedAssignee.fname} ${resolvedAssignee.lname}`
                    }

                    let reporter = common_backend.noReporter;
                    let resolvedReporter = usersIdObj[ticketObj.reporter];
                    if (resolvedReporter) {
                        reporter = `${resolvedReporter.fname} ${resolvedReporter.lname}`
                    }

                    for (let i = 0; i < commentsList.length; i++) {
                        let comment = commentsList[i];
                        let resolvedUserFromComment = usersIdObj[comment.userId];
                        if (resolvedUserFromComment) {
                            commentsList[i]['username'] = `${resolvedUserFromComment.fname} ${resolvedUserFromComment.lname}`;
                            commentsList[i]['picture'] = resolvedUserFromComment.picture;
                        }
                    }

                    projects.getSprintsByIds(projectId, teamId, ticketObj.sprints, function (err, sprintsObjList) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            return res.status(404).render(common_api.pugPages.pageNotFound);
                        }

                        return res.status(200).render(common_api.pugPages.ticketModification, {
                            user: req.session.user,
                            projectId: projectId,
                            teamId: teamId,
                            reporter: reporter,
                            assignee: assignee,
                            ticket: ticketObj,
                            comments: commentsList,
                            sprints: sprintsObjList,
                            resolveState: (state) => {
                                return common_backend.getValueInObjectByKey(state, 'value', 'text', common_backend.ticketStates);
                            },
                            resolveUsername: (userId) => {
                                return usersIdObj[userId] ? `${usersIdObj[userId].fname} ${usersIdObj[userId].lname}` : common_backend.noAssignee;
                            },
                            resolveCommentContent: (content) => {
                                let splitContent = content.split(' ');
                                let resolvedContent = '';

                                for (let i = 0; i < splitContent.length; i++) {
                                    let phrase = splitContent[i];
                                    let firstChar = phrase.charAt(0);
                                    switch (firstChar) {
                                        case '@':
                                            let userId = phrase.slice(1);
                                            let user = usersIdObj[userId];
                                            if (user) {
                                                resolvedContent += `<b>@${user.username}</b> `;
                                            } else {
                                                resolvedContent += `@UNKNOWN `;
                                            }
                                            break;
                                        case '#':
                                            let ticketId = phrase.slice(1);
                                            let ticket = ticketsIdObj[ticketId];
                                            if (ticket) {
                                                resolvedContent += `<a href='/project/${ticket.projectId}/team/${ticket.teamId}/ticket/${ticket._id}'>#${ticket.displayId} </a>`;
                                            } else {
                                                resolvedContent += `#UNKNOWN `;
                                            }
                                            break;
                                        default:
                                            resolvedContent += `${phrase} `;
                                            break;
                                    }
                                }

                                return resolvedContent.trim();
                            },
                            canSearch: true
                        });
                    });
                });
            }

            if (settings.getModeType() === common_backend.modeTypes.CLASS) {
                projects.getTicketsByTeamId(projectId, teamId, function (err, ticketsList) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(404).render(common_api.pugPages.pageNotFound);
                    }
                    return continueWithTicketsList(ticketsList);
                });
            }

            if (settings.getModeType() === common_backend.modeTypes.COLLABORATORS) {
                projects.getTicketsByProjectId(projectId, function (err, ticketsList) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(404).render(common_api.pugPages.pageNotFound);
                    }
                    return continueWithTicketsList(ticketsList);
                });
            }
        });
    });
}

/**
 * root path for commenting on a ticket
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleTicketsCommentPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const ticketId = req.body.ticketId;

    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (settings.getModeType() === common_backend.modeTypes.CLASS
                && projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            projects.getTicketsByTeamId(projectId, teamId, function (err, ticketsList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                let ticketObj = null;
                for (let i = 0; i < ticketsList.length; i++) {
                    if (ticketsList[i]._id === ticketId) {
                        ticketObj = ticketsList[i];
                    }
                }

                if (!ticketObj) {
                    logger.error(JSON.stringify(common_backend.getError(7004)));
                    return res.status(400).send(common_backend.getError(7004));
                }

                const ticketsDisplayIdObj = common_backend.convertListToJason('displayId', ticketsList);
                const userNamesObj = common_backend.convertListToJason('username', users.getActiveUsersList());

                const content = req.body.content;
                let splitContent = content.split(' ');
                let resolvedContent = '';

                for (let i = 0; i < splitContent.length; i++) {
                    let phrase = splitContent[i];
                    let firstChar = phrase.charAt(0);
                    switch (firstChar) {
                        case '@':
                            let username = phrase.slice(1);
                            let user = userNamesObj[username];
                            if (user) {
                                resolvedContent += `@${user._id} `;
                            } else {
                                resolvedContent += `@UNKNOWN `;
                            }
                            break;
                        case '#':
                            let ticketDisplayId = phrase.slice(1);
                            let ticket = ticketsDisplayIdObj[ticketDisplayId];
                            if (ticket) {
                                resolvedContent += `#${ticket._id} `;
                            } else {
                                resolvedContent += `#UNKNOWN `;
                            }
                            break;
                        default:
                            resolvedContent += `${phrase} `;
                            break;
                    }
                }

                resolvedContent = resolvedContent.trim();

                const newComment = {
                    projectId: projectId,
                    teamId: teamId,
                    ticketId: ticketId,
                    userId: req.session.user._id,
                    content: resolvedContent
                };

                projects.addCommentToTicket(newComment, function (err, result) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    return res.status(200).send('ok');
                });
            });
        });
    });
}

/**
 * root path to delete a comment
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleCommentDeletePath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const ticketId = req.body.ticketId;
    const commentId = req.body.commentId;

    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (settings.getModeType() === common_backend.modeTypes.CLASS
                && projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            projects.getTicketById(projectId, teamId, ticketId, function (err, ticketObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                projects.getCommentById(projectId, teamId, ticketId, commentId, function (err, commentObj) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    if (commentObj.userId !== req.session.user._id) {
                        logger.error(JSON.stringify(common_backend.getError(2018)));
                        return res.status(400).send(common_backend.getError(2018));
                    }

                    let updatedComment = { status: common_backend.commentStatus.DELETED.value };
                    projects.updateComment(commentId, ticketId, teamId, projectId, updatedComment, function (err, result) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            return res.status(500).send(err);
                        }

                        return res.status(200).send('ok');
                    });
                });
            });
        });
    });
}

/**
 * root path to edit a comment
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleTicketsCommentEditPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const ticketId = req.body.ticketId;
    const commentId = req.body.commentId;

    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (settings.getModeType() === common_backend.modeTypes.CLASS
                && projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            projects.getTicketById(projectId, teamId, ticketId, function (err, ticketObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                projects.getCommentById(projectId, teamId, ticketId, commentId, function (err, commentObj) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    if (commentObj.userId !== req.session.user._id) {
                        logger.error(JSON.stringify(common_backend.getError(2018)));
                        return res.status(400).send(common_backend.getError(2018));
                    }

                    let updatedComment = { content: req.body.content };
                    projects.updateComment(commentId, ticketId, teamId, projectId, updatedComment, function (err, result) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            return res.status(500).send(err);
                        }

                        return res.status(200).send('ok');
                    });
                });
            });
        });
    });
}

/**
 * root path to get the list of team members
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamMembersListPath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.query.projectId;
    const teamId = req.query.teamId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (settings.getModeType() === common_backend.modeTypes.CLASS
                && projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            const usersObj = common_backend.convertListToJason('_id', users.getActiveUsersList());
            let listToResolve = [];
            let usersList = [];

            if (settings.getModeType() === common_backend.modeTypes.CLASS) {
                listToResolve = teamObj.members;
            }

            if (settings.getModeType() === common_backend.modeTypes.COLLABORATORS) {
                listToResolve = projectObj.members;
            }

            for (let i = 0; i < listToResolve.length; i++) {
                let memberId = listToResolve[i];
                let memberObj = usersObj[memberId];
                if (memberObj) {
                    usersList.push({
                        username: memberObj.username,
                        fname: memberObj.fname,
                        lname: memberObj.lname,
                        picture: memberObj.picture
                    });
                }
            }

            return res.status(200).send(usersList);
        });
    });
}

/**
 * root path to get the sprints list
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamSprintsListPath = function (req, res) {
    const projectId = req.query.projectId;
    const teamId = req.query.teamId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (settings.getModeType() === common_backend.modeTypes.CLASS
                && projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            projects.getSprintsByTeamId(projectId, teamId, function (err, sprintsObjList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                let sprintsList = [];
                for (let i = 0; i < sprintsObjList.length; i++) {
                    let sprint = sprintsObjList[i];
                    sprintsList.push({
                        _id: sprint._id,
                        name: sprint.name,
                        startDate: sprint.startDate,
                        endDate: sprint.endDate
                    });
                }

                return res.status(200).send({
                    sprintsList: sprintsList
                });
            });
        });
    });
}

/**
 * root path to get the list of sprints
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamSprintsFullListPath = function (req, res) {
    const projectId = req.query.projectId;
    const teamId = req.query.teamId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (settings.getModeType() === common_backend.modeTypes.CLASS
                && projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            const usersObj = common_backend.convertListToJason('_id', users.getActiveUsersList());

            projects.getTicketsWithNoSprints(projectId, teamId, function (err, ticketsWithNoSprintList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                let limitedTicketsWithNoSprintList = [];
                for (let i = 0; i < ticketsWithNoSprintList.length; i++) {
                    let ticket = ticketsWithNoSprintList[i];
                    let ticketAssignee = usersObj[ticket.assignee];
                    let ticketReporter = usersObj[ticket.reporter];
                    limitedTicketsWithNoSprintList.push({
                        _id: ticket._id,
                        ctime: ticket.ctime,
                        mtime: ticket.mtime,
                        displayId: ticket.displayId,
                        title: ticket.title,
                        state: ticket.state,
                        type: ticket.type,
                        assignee: ticketAssignee ? `${ticketAssignee.fname} ${ticketAssignee.lname}` : common_backend.noAssignee,
                        reporter: ticketReporter ? `${ticketReporter.fname} ${ticketReporter.lname}` : common_backend.noReporter,
                        assigneePicture: ticketAssignee ? ticketAssignee.picture : null,
                        reporterPicture: ticketReporter ? ticketReporter.picture : null,
                        priority: ticket.priority,
                        points: ticket.points
                    });
                }

                projects.getSprintsByTeamId(projectId, teamId, function (err, sprintsObjList) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    let finalList = [];
                    let completedSprints = 0;

                    if (sprintsObjList.length === 0) {
                        finalList.push({
                            id: 'backlog',
                            name: 'backlog',
                            startDate: null,
                            endDate: null,
                            tickets: limitedTicketsWithNoSprintList
                        });

                        return res.status(200).send({
                            sprintEntryHTML: common_api.pugComponents.sprintEntryComponent(),
                            ticketEntryHTML: common_api.pugComponents.ticketEntryComponent(),
                            sprintsList: finalList
                        });
                    }

                    for (let i = 0; i < sprintsObjList.length; i++) {
                        let sprint = sprintsObjList[i];
                        projects.getTicketsByIds(projectId, teamId, sprint.tickets, function (err, ticketsList) {
                            if (err) {
                                logger.error(JSON.stringify(err));
                                return res.status(500).send(err);
                            }

                            let limitedTicketList = [];
                            for (let j = 0; j < ticketsList.length; j++) {
                                let ticket = ticketsList[j];
                                let ticketAssignee = usersObj[ticket.assignee];
                                let ticketReporter = usersObj[ticket.reporter];
                                limitedTicketList.push({
                                    _id: ticket._id,
                                    ctime: ticket.ctime,
                                    mtime: ticket.mtime,
                                    displayId: ticket.displayId,
                                    title: ticket.title,
                                    state: ticket.state,
                                    type: ticket.type,
                                    assignee: ticketAssignee ? `${ticketAssignee.fname} ${ticketAssignee.lname}` : common_backend.noAssignee,
                                    reporter: ticketReporter ? `${ticketReporter.fname} ${ticketReporter.lname}` : common_backend.noReporter,
                                    assigneePicture: ticketAssignee ? ticketAssignee.picture : null,
                                    reporterPicture: ticketReporter ? ticketReporter.picture : null,
                                    priority: ticket.priority,
                                    points: ticket.points
                                });
                            }

                            finalList.push({
                                id: sprint._id,
                                name: sprint.name,
                                startDate: sprint.startDate,
                                endDate: sprint.endDate,
                                tickets: limitedTicketList
                            });

                            completedSprints++;
                            if (completedSprints === sprintsObjList.length) {
                                finalList.push({
                                    id: 'backlog',
                                    name: 'backlog',
                                    startDate: null,
                                    endDate: null,
                                    tickets: limitedTicketsWithNoSprintList
                                });

                                return res.status(200).send({
                                    sprintEntryHTML: common_api.pugComponents.sprintEntryComponent(),
                                    ticketEntryHTML: common_api.pugComponents.ticketEntryComponent(),
                                    sprintsList: finalList
                                });
                            }
                        });
                    }
                });
            });
        });
    });
}

/**
 * root path to create a sprint
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleSprintsCreatePath = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            let newSprint = {
                projectId: projectId,
                teamId: teamId,
                name: req.body.name,
                startDate: req.body.startDate,
                endDate: req.body.endDate
            };
            projects.addSprintToTeam(newSprint, function (err, sprintObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                return res.status(200).send('ok');
            });
        });
    });
}
// </Requests Function> -----------------------------------------------

// <common Requests> ------------------------------------------------
exports.handleModeSelectPath = handleModeSelectPath;
exports.handleRootPath = handleRootPath;
exports.initialize = initialize;
exports.isActiveSession = common_api.isActiveSession;
// </common Requests> -----------------------------------------------

// <Get Requests> ------------------------------------------------
exports.handleActiveSprintTicketsListComponentPath = handleActiveSprintTicketsListComponentPath;
exports.handleProjectByIdPath = handleProjectByIdPath;
exports.handleProjectTeamPath = handleProjectTeamPath;
exports.handleProjectTeamSearchPath = handleProjectTeamSearchPath;
exports.handleProjectTeamTicketsAddPath = handleProjectTeamTicketsAddPath;
exports.handleProjectTeamTicketPath = handleProjectTeamTicketPath;
exports.handleProjectTeamMembersListPath = handleProjectTeamMembersListPath;
exports.handleProjectTeamSprintsListPath = handleProjectTeamSprintsListPath;
exports.handleProjectTeamSprintsFullListPath = handleProjectTeamSprintsFullListPath;
exports.handleProjectsPath = handleProjectsPath;
exports.handleProjectsListComponentPath = handleProjectsListComponentPath;
exports.handleTeamsListComponentPath = handleTeamsListComponentPath;
exports.handleTicketsListComponentPath = handleTicketsListComponentPath;
exports.handleProjectsAdminsListComponentPath = handleProjectsAdminsListComponentPath;
exports.handleProjectsGroupAssignPath = handleProjectsGroupAssignPath;
exports.handleProjectsAddPath = handleProjectsAddPath;
// </Get Requests> -----------------------------------------------

// <Post Requests> -----------------------------------------------
exports.handleProjectActivatePath = handleProjectActivatePath;
exports.handleProjectAdminsUpdatePath = handleProjectAdminsUpdatePath;
exports.handleProjectClosePath = handleProjectClosePath;
exports.handleProjectBoardTypeMePath = handleProjectBoardTypeMePath;
exports.handleProjectTeamsUpdatePath = handleProjectTeamsUpdatePath;
exports.handleProjectTeamsUpdateMePath = handleProjectTeamsUpdateMePath;
exports.handleProjectTeamsConfigPath = handleProjectTeamsConfigPath;
exports.handleProjectUpdatePath = handleProjectUpdatePath;
exports.handleProjectActiveUpdatePath = handleProjectActiveUpdatePath;
exports.handleTicketsUpdatePath = handleTicketsUpdatePath;
exports.handleTicketsCommentEditPath = handleTicketsCommentEditPath;
// </Post Requests> -----------------------------------------------

// <Put Requests> ------------------------------------------------
exports.handleProjectsCreatePath = handleProjectsCreatePath;
exports.handleTicketsCreatePath = handleTicketsCreatePath;
exports.handleTicketsCommentPath = handleTicketsCommentPath;
exports.handleProjectDeletePath = handleProjectDeletePath;
exports.handleCommentDeletePath = handleCommentDeletePath;
// </Put Requests> -----------------------------------------------

// <Settings Requests> ------------------------------------------------
exports.handleSettingsPath = settings_api.renderSettingsPage;
exports.handleSettingsResetPath = settings_api.resetSettings;
exports.handleSettingsUpdatePath = settings_api.updateSettings;
// </Settings Requests> -----------------------------------------------

// <Sprints Requests> ------------------------------------------------
exports.handleSprintsCreatePath = handleSprintsCreatePath;
// </Sprints Requests> -----------------------------------------------

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
exports.handleUsersImportFilePath = users_api.importUsersFile;
exports.handleUsersImportPath = users_api.renderUsersImportPage;
exports.handleUsersListComponentPath = users_api.adminUsersListComponent;
exports.handleUsersPath = users_api.renderAdminsUsersPage;
exports.handleUsersRequestAccessPath = users_api.requestAccess;
exports.handleUsersUpdatePath = users_api.editUser;
// </Users Requests> -----------------------------------------------

// <Notifications Requests> ------------------------------------------------
exports.handleDeleteAllNotificationsPath = notifications_api.deleteAllNotifications;
exports.handleNotificationDeletePath = notifications_api.deleteNotification;
exports.handleNotificationsConnection = notifications_api.handleNotificationsConnection;
// </Notifications Requests> -----------------------------------------------
