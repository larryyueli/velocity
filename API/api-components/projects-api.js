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

const common_api = require('./common-api.js');
const notifications_api = require('./notifications-api.js');

const analytics = require('../../Backend/analytics.js');
const cfs = require('../../Backend/customFileSystem.js');
const common_backend = require('../../Backend/common.js');
const logger = require('../../Backend/logger.js');
const projects = require('../../Backend/projects.js');
const settings = require('../../Backend/settings.js');
const users = require('../../Backend/users.js');

/**
 * path to get a project page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const renderProjectPage = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type === common_backend.userTypes.MODE_SELECTOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2038)));
        return res.status(404).render(common_api.pugPages.pageNotFound);
    }

    const projectId = req.params.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
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
                    return res.status(404).render(common_api.pugPages.pageNotFound);
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

        if (projectObj.status === common_backend.projectStatus.CLOSED.value && !userIsAdmin) {
            return projects.getTeamByUserId(projectId, req.session.user._id, function (err, teamObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                return res.redirect(`/project/${projectId}/team/${teamObj._id}`);
            });
        }

        if (projectObj.status === common_backend.projectStatus.DELETED.value) {
            logger.error(JSON.stringify(common_backend.getError(2038)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        let attachmentsList = [];
        const getAttachments = function (callback) {
            let attachmentsCounter = 0;
            if (attachmentsCounter === projectObj.attachments.length) {
                callback();
            }

            for (let i = 0; i < projectObj.attachments.length; i++) {
                const attId = projectObj.attachments[i];
                cfs.fileExists(attId, function (err, fileObj) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                    }

                    if (fileObj) {
                        fileObj.isViewable = (common_backend.fileExtensions.IMAGES.indexOf(fileObj.extension) !== -1);
                        attachmentsList.push(fileObj);
                    }

                    attachmentsCounter++;
                    if (attachmentsCounter === projectObj.attachments.length) {
                        callback();
                    }
                });
            }

        }

        getAttachments(function () {
            return res.status(200).render(common_api.pugPages.projectPage, {
                user: req.session.user,
                title: projectObj.title,
                isProjectAdmin: projectObj.admins.indexOf(req.session.user._id) !== -1,
                description: projectObj.description,
                isClassMode: settings.getModeType() === common_backend.modeTypes.CLASS,
                isCollabMode: settings.getModeType() === common_backend.modeTypes.COLLABORATORS,
                isActive: projectObj.status === common_backend.projectStatus.ACTIVE.value,
                isClosed: projectObj.status === common_backend.projectStatus.CLOSED.value,
                forceBoardType: projectObj.boardType !== common_backend.boardTypes.UNKNOWN.value,
                selectedBoardType: projectObj.boardType,
                forceDeadline: typeof (projectObj.deadlineDate) === common_backend.variableTypes.STRING
                    && typeof (projectObj.deadlineTime) === common_backend.variableTypes.STRING
                    && !common_backend.isEmptyString(projectObj.deadlineDate)
                    && !common_backend.isEmptyString(projectObj.deadlineTime),
                deadlineDate: projectObj.deadlineDate,
                deadlineTime: projectObj.deadlineTime,
                attachments: attachmentsList
            });
        });
    });
}

/**
 * path to activate a project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const activateProject = function (req, res) {
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
            return res.status(400).send(common_backend.getError(2041));
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
                    return res.status(500).send(err);
                }

                projects.setTeamsBoardType(projectId, teamsIds, projectObj.boardType, function (err, result) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    if (projectObj.boardType === common_backend.boardTypes.KANBAN.value) {
                        for (let i = 0; i < teamsList.length; i++) {
                            teamsList[i].boardType = common_backend.boardTypes.KANBAN.value;
                        }
                        analytics.saveSpecificKanbanAnalytics(teamsList, [], function (err, kanbanObj) {
                            if (err) {
                                logger.error(JSON.stringify(err));
                                return res.status(500).send(err);
                            }

                            return res.status(200).send('ok');
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
 * path to close a project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const closeProject = function (req, res) {
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
            return res.status(400).send(common_backend.getError(2041));
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value) {
            logger.error(JSON.stringify(common_backend.getError(2043)));
            return res.status(400).send(common_backend.getError(2043));
        }

        let newProject = {
            status: common_backend.projectStatus.CLOSED.value,
        };
        projects.updateProject(req.body.projectId, newProject, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
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
const deleteProject = function (req, res) {
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
            return res.status(400).send(common_backend.getError(2040));
        }

        let newProject = {
            status: common_backend.projectStatus.DELETED.value
        };
        projects.updateProject(req.body.projectId, newProject, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
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
const updateActiveProject = function (req, res) {
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
            return res.status(400).send(common_backend.getError(2037));
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value) {
            logger.error(JSON.stringify(common_backend.getError(2043)));
            return res.status(400).send(common_backend.getError(2043));
        }

        const deadlineDateText = req.body.deadlineDate;
        const deadlineTimeText = req.body.deadlineTime;
        const deadlineDate = common_backend.convertStringToBoolean(req.body.canForceDeadline)
            ? typeof (deadlineDateText) === common_backend.variableTypes.STRING
                ? deadlineDateText
                : null
            : '';
        const deadlineTime = common_backend.convertStringToBoolean(req.body.canForceDeadline)
            ? typeof (deadlineTimeText) === common_backend.variableTypes.STRING
                ? deadlineTimeText
                : null
            : '';

        let newProject = {
            title: req.body.title,
            description: req.body.description,
            deadlineDate: deadlineDate,
            deadlineTime: deadlineTime,
            attachments: Array.isArray(req.body.attachments) ? req.body.attachments : []
        };
        projects.updateProject(req.body.projectId, newProject, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            return res.status(200).send('ok');
        });
    });
}

/**
 * path to update a project's admins
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const updateProjectAdminsList = function (req, res) {
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
            return res.status(400).send(common_backend.getError(2037));
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value
            && projectObj.status !== common_backend.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common_backend.getError(2048)));
            return res.status(400).send(common_backend.getError(2048));
        }

        const inputAdminsList = req.body.adminsList;
        if (!Array.isArray(inputAdminsList)) {
            try {
                inputAdminsList = JSON.parse(inputAdminsList);
            }
            catch (err) {
                logger.error(JSON.stringify(common_backend.getError(1011)));
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
            admins: newAdminsList,
            members: common_backend.joinSets(newAdminsList, projectObj.members)
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
 * root path to create a project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const createProject = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2036)));
        return res.status(400).send(common_backend.getError(2036));
    }

    const parsedBoardType = parseInt(req.body.boardType);
    const deadlineDateText = req.body.deadlineDate;
    const deadlineTimeText = req.body.deadlineTime;
    const attachmentsList = req.body.attachments;
    const boardType = common_backend.convertStringToBoolean(req.body.canForceBoardType)
        ? typeof (parsedBoardType) === common_backend.variableTypes.NUMBER
            ? parsedBoardType
            : common_backend.boardTypes.UNKNOWN.value
        : common_backend.boardTypes.UNKNOWN.value;
    const deadlineDate = common_backend.convertStringToBoolean(req.body.canForceDeadline)
        ? typeof (deadlineDateText) === common_backend.variableTypes.STRING
            ? deadlineDateText
            : null
        : null;
    const deadlineTime = common_backend.convertStringToBoolean(req.body.canForceDeadline)
        ? typeof (deadlineTimeText) === common_backend.variableTypes.STRING
            ? deadlineTimeText
            : null
        : null;

    const newProject = {
        title: req.body.title,
        description: req.body.description,
        status: common_backend.projectStatus.DRAFT.value,
        admins: [req.session.user._id],
        boardType: boardType,
        deadlineDate: deadlineDate,
        deadlineTime: deadlineTime,
        attachments: attachmentsList
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
 * path to update a project's teams
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const updateProjectTeamsList = function (req, res) {
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
            return res.status(400).send(common_backend.getError(2039));
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value
            && projectObj.status !== common_backend.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common_backend.getError(2048)));
            return res.status(400).send(common_backend.getError(2048));
        }

        let inputTeamsList = req.body.teamsList;
        if (!Array.isArray(inputTeamsList)) {
            try {
                inputTeamsList = JSON.parse(inputTeamsList);
            }
            catch (err) {
                logger.error(JSON.stringify(common_backend.getError(1011)));
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
                    if (projectObj.status === common_backend.projectStatus.ACTIVE.value) {
                        updateActiveTeam();
                    } else {
                        return res.status(200).send('ok');
                    }
                }
                for (let i = 0; i < resolvedTeamsList.length; i++) {
                    let team = resolvedTeamsList[i];
                    projects.getTeamByName(projectId, team.name, function (err, teamObj) {
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
 * path to update a student's team in a  project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const updateProjectTeamsMe = function (req, res) {
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
            return res.status(400).send(common_backend.getError(2012));
        }

        if (projectObj.status === common_backend.projectStatus.CLOSED.value) {
            logger.error(JSON.stringify(common_backend.getError(2013)));
            return res.status(400).send(common_backend.getError(2013));
        }

        if (projectObj.status !== common_backend.projectStatus.DRAFT.value
            && projectObj.teamSelectionType !== common_backend.teamSelectionTypes.USER.value) {
            logger.error(JSON.stringify(common_backend.getError(2014)));
            return res.status(400).send(common_backend.getError(2014));
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

                projects.getTeamByName(projectId, teamName, function (err, teamObjFound) {
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
 * path to update a project teams configuration
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const updateProjectTeamsConfiguration = function (req, res) {
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
        return res.status(400).send(common_backend.getError(1000));
    }

    const projectId = req.body.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.admins.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2037)));
            return res.status(400).send(common_backend.getError(2037));
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value
            && projectObj.status !== common_backend.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common_backend.getError(2048)));
            return res.status(400).send(common_backend.getError(2048));
        }

        let newProject = {
            teamSize: parseInt(req.body.groupSize),
            teamSelectionType: parseInt(req.body.groupSelectType),
            teamPrefix: req.body.groupPrefix
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
 * path to update a project
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const updateDraftProject = function (req, res) {
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
            return res.status(400).send(common_backend.getError(2037));
        }

        if (projectObj.status !== common_backend.projectStatus.DRAFT.value) {
            logger.error(JSON.stringify(common_backend.getError(2042)));
            return res.status(400).send(common_backend.getError(2042));
        }

        const parsedBoardType = parseInt(req.body.boardType);
        const deadlineDateText = req.body.deadlineDate;
        const deadlineTimeText = req.body.deadlineTime;
        const attachmentsList = Array.isArray(req.body.attachments) ? req.body.attachments : []
        const boardType = common_backend.convertStringToBoolean(req.body.canForceBoardType)
            ? typeof (parsedBoardType) === common_backend.variableTypes.NUMBER
                ? parsedBoardType
                : common_backend.boardTypes.UNKNOWN.value
            : common_backend.boardTypes.UNKNOWN.value;
        const deadlineDate = common_backend.convertStringToBoolean(req.body.canForceDeadline)
            ? typeof (deadlineDateText) === common_backend.variableTypes.STRING
                ? deadlineDateText
                : null
            : '';
        const deadlineTime = common_backend.convertStringToBoolean(req.body.canForceDeadline)
            ? typeof (deadlineTimeText) === common_backend.variableTypes.STRING
                ? deadlineTimeText
                : null
            : '';

        let newProject = {
            title: req.body.title,
            description: req.body.description,
            boardType: boardType,
            deadlineDate: deadlineDate,
            deadlineTime: deadlineTime,
            attachments: attachmentsList
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
 * path to get the projects page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const renderProjectsPage = function (req, res) {
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
 * path to get the projects add page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const renderProjectsCreationPage = function (req, res) {
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
        isClosed: false,
        selectedBoardType: common_backend.boardTypes.KANBAN.value,
        forceDeadline: false,
        deadlineDate: '',
        deadlineTime: ''
    });
}

/**
 * path to get the projects user groups list entry
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const getTeamsAssignmentComponent = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type === common_backend.userTypes.MODE_SELECTOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2034)));
        return res.status(400).send(common_backend.getError(2034));
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
            return res.status(400).send(common_backend.getError(2034));
        }

        if (projectObj.status === common_backend.projectStatus.DRAFT.value
            && !userIsAdmin
            && projectObj.teamSelectionType !== common_backend.teamSelectionTypes.USER.value) {
            logger.error(JSON.stringify(common_backend.getError(2034)));
            return res.status(400).send(common_backend.getError(2034));
        }

        if (projectObj.status === common_backend.projectStatus.CLOSED.value && !userIsMember) {
            logger.error(JSON.stringify(common_backend.getError(2034)));
            return res.status(400).send(common_backend.getError(2034));
        }

        if (projectObj.status === common_backend.projectStatus.DELETED.value) {
            logger.error(JSON.stringify(common_backend.getError(2034)));
            return res.status(400).send(common_backend.getError(2034));
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
                isCollabMode: settings.getModeType() === common_backend.modeTypes.COLLABORATORS,
                isReadOnly: projectObj.status === common_backend.projectStatus.CLOSED.value
                    || projectObj.status === common_backend.projectStatus.DELETED.value
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
const getAdminsListComponent = function (req, res) {
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
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
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
            usersEntryHTML: common_api.pugComponents.projectsUserEntryComponent(),
            isReadOnly: projectObj.status === common_backend.projectStatus.CLOSED.value
                || projectObj.status === common_backend.projectStatus.DELETED.value
        });
    });
}

/**
 * path to get the projects list entry
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const getProjectsListComponent = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type === common_backend.userTypes.MODE_SELECTOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2034)));
        return res.status(400).send(common_backend.getError(2034));
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
 * root path to get the projects export form
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const renderProjectsExportPage = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2055)));
        return res.status(404).render(common_api.pugPages.pageNotFound);
    }

    return res.status(200).render(common_api.pugPages.projectsExport, {
        user: req.session.user,
    });
}

/**
 * root path to get the projects import form
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const renderProjectsImportPage = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2057)));
        return res.status(404).render(common_api.pugPages.pageNotFound);
    }

    return res.status(200).render(common_api.pugPages.projectsImport, {
        user: req.session.user,
    });
}


/**
 * path to export projects from a file
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const exportProjectsFile = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2057)));
        return res.status(400).send(common_backend.getError(2057));
    }

    projects.getFullProjectsList(function (err, projectsList) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        let filteredList = [];
        for (let i = 0; i < projectsList.length; i++) {
            let project = projectsList[i];
            filteredList.push({
                title: project.title,
                description: project.description,
                boardType: project.boardType,
                deadlineDate: project.deadlineDate,
                deadlineTime: project.deadlineTime
            });
        }

        const fileData = JSON.stringify(filteredList);
        const fileName = common_backend.getUUID();
        const fileObject = {
            fileId: fileName,
            fileName: fileName,
            filePath: `${common_backend.cfsTree.USERS}/${req.session.user._id}`,
            fileExtension: 'velocity',
            fileData: fileData,
            filePermissions: common_backend.cfsPermission.OWNER,
            fileCreator: req.session.user._id
        };

        cfs.writeFile(fileObject, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            return res.status(200).render(common_api.pugPages.projectsExportComplete, {
                fileName: fileName
            });
        });
    });
}

/**
 * path to download the export projects file
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const exportProjectsFileDownload = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2057)));
        return res.status(400).send(common_backend.getError(2057));
    }

    const fileId = req.query.fileId;
    cfs.fileExists(fileId, function (err, fileObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (fileObj.permission !== common_backend.cfsPermission.OWNER
            || fileObj.creator !== req.session.user._id) {
            logger.error(JSON.stringify(common_backend.getError(2058)));
            return res.status(400).send(common_backend.getError(2058));
        }

        return res.download(fileObj.path, 'Exported Projects List.velocity', function (err) {
            if (err) {
                logger.error(JSON.stringify(err));
            }
        });
    });
}

/**
 * path to import projects from a file
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const importProjectsFile = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2059)));
        return res.status(400).send(common_backend.getError(2059));
    }

    const fileName = common_backend.getUUID();
    const fileExtension = 'velocity';
    const uploadedFile = req.files.projectsImpotFile;
    const fileData = uploadedFile.data;
    const fileObject = {
        fileId: fileName,
        fileName: fileName,
        filePath: `${common_backend.cfsTree.USERS}/${req.session.user._id}`,
        fileExtension: fileExtension,
        fileData: fileData,
        filePermissions: common_backend.cfsPermission.OWNER,
        fileCreator: req.session.user._id
    };

    cfs.writeFile(fileObject, function (err, fileObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        let projectsList = '';
        try {
            projectsList = JSON.parse(fileData);
        } catch (error) {
            logger.error(JSON.stringify(common_backend.getError(1011)));
            return res.status(400).send(common_backend.getError(1011));
        }

        let added = 0;
        let failed = 0;
        let counter = 0;

        if (projectsList.length === 0) {
            return res.status(200).render(common_api.pugPages.projectsImportComplete, {
                added: added,
                failed: failed,
                total: counter
            });
        } else {
            for (let i = 0; i < projectsList.length; i++) {
                let proj = projectsList[i];
                proj.status = common_backend.projectStatus.DRAFT.value;
                proj.admins = [req.session.user._id];
                projects.addProject(proj, function (err, result) {
                    counter++;
                    if (err) {
                        failed++;
                    } else {
                        added++;
                    }

                    if (counter === projectsList.length) {
                        return res.status(200).render(common_api.pugPages.projectsImportComplete, {
                            added: added,
                            failed: failed,
                            total: counter
                        });
                    }
                });
            }
        }
    });
}

// <exports> ------------------------------------------------
exports.activateProject = activateProject;
exports.closeProject = closeProject;
exports.createProject = createProject;
exports.deleteProject = deleteProject;
exports.exportProjectsFile = exportProjectsFile;
exports.exportProjectsFileDownload = exportProjectsFileDownload;
exports.getAdminsListComponent = getAdminsListComponent;
exports.getTeamsAssignmentComponent = getTeamsAssignmentComponent;
exports.getProjectsListComponent = getProjectsListComponent;
exports.importPorjectsFile = importProjectsFile;
exports.renderProjectPage = renderProjectPage;
exports.renderProjectsCreationPage = renderProjectsCreationPage;
exports.renderProjectsExportPage = renderProjectsExportPage;
exports.renderProjectsImportPage = renderProjectsImportPage;
exports.renderProjectsPage = renderProjectsPage;
exports.updateActiveProject = updateActiveProject;
exports.updateDraftProject = updateDraftProject;
exports.updateProjectAdminsList = updateProjectAdminsList;
exports.updateProjectTeamsConfiguration = updateProjectTeamsConfiguration;
exports.updateProjectTeamsList = updateProjectTeamsList;
exports.updateProjectTeamsMe = updateProjectTeamsMe;
// </exports> -----------------------------------------------