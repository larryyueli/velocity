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

const common_backend = require('../../Backend/common.js');
const logger = require('../../Backend/logger.js');
const projects = require('../../Backend/projects.js');
const settings = require('../../Backend/settings.js');
const users = require('../../Backend/users.js');

/**
 * root path to get the backlog
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const getBacklogComponents = function (req, res) {
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

            projects.getTicketsInBacklog(projectId, teamId, function (err, ticketsInBacklog) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                let limitedTicketsInBacklog = [];
                for (let i = 0; i < ticketsInBacklog.length; i++) {
                    let ticket = ticketsInBacklog[i];
                    let ticketAssignee = usersObj[ticket.assignee];
                    let ticketReporter = usersObj[ticket.reporter];
                    limitedTicketsInBacklog.push({
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

                projects.getAvailableSprintsByTeamId(projectId, teamId, function (err, sprintsObjList) {
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
                            tickets: limitedTicketsInBacklog
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
                                    tickets: limitedTicketsInBacklog
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
 * root path to get the list of components for the team management
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const getManagementComponents = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    return res.status(200).send({
        releaseEntryComponent: common_api.pugComponents.teamManagementReleaseEntryComponent(),
        sprintEntryComponent: common_api.pugComponents.teamManagementSprintEntryComponent(),
        tagEntryComponent: common_api.pugComponents.teamManagementTagEntryComponent()
    });
}

/**
 * path to get the tickets list in active sprint
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const getBoardComponents = function (req, res) {
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

            let processTickets = function (ticketsObjList) {
                const usersObj = common_backend.convertListToJason('_id', users.getActiveUsersList());
                let board = {};
                for (let i = 0; i < ticketsObjList.length; i++) {
                    let ticket = ticketsObjList[i];
                    let ticketAssignee = usersObj[ticket.assignee];
                    let ticketReporter = usersObj[ticket.reporter];
                    let resolvedTicketAssignee = ticketAssignee ? `${ticketAssignee.fname} ${ticketAssignee.lname}` : common_backend.noAssignee;
                    let resolvedTicketReporter = ticketReporter ? `${ticketReporter.fname} ${ticketReporter.lname}` : common_backend.noAssignee;

                    if (!board[resolvedTicketAssignee]) {
                        board[resolvedTicketAssignee] = {
                            new: [],
                            inDevelopment: [],
                            codeReview: [],
                            readyForTest: [],
                            inTest: [],
                            done: []
                        };
                    }

                    let limitedTicket = {
                        _id: ticket._id,
                        ctime: ticket.ctime,
                        mtime: ticket.mtime,
                        displayId: ticket.displayId,
                        title: ticket.title,
                        state: ticket.state,
                        type: ticket.type,
                        assignee: resolvedTicketAssignee,
                        reporter: resolvedTicketReporter,
                        assigneePicture: ticketAssignee ? ticketAssignee.picture : null,
                        reporterPicture: ticketReporter ? ticketReporter.picture : null,
                        priority: ticket.priority,
                        points: ticket.points
                    };

                    switch (limitedTicket.state) {
                        case common_backend.ticketStates.NEW.value:
                            board[resolvedTicketAssignee].new.push(limitedTicket);
                            break;
                        case common_backend.ticketStates.IN_DEVELOPMENT.value:
                            board[resolvedTicketAssignee].inDevelopment.push(limitedTicket);
                            break;
                        case common_backend.ticketStates.CODE_REVIEW.value:
                            board[resolvedTicketAssignee].codeReview.push(limitedTicket);
                            break;
                        case common_backend.ticketStates.READY_FOR_TEST.value:
                            board[resolvedTicketAssignee].readyForTest.push(limitedTicket);
                            break;
                        case common_backend.ticketStates.IN_TEST.value:
                            board[resolvedTicketAssignee].inTest.push(limitedTicket);
                            break;
                        case common_backend.ticketStates.DONE.value:
                            if (board[resolvedTicketAssignee].done.length < 20) {
                                board[resolvedTicketAssignee].done.push(limitedTicket);
                            }
                            break;
                        default:
                            break;
                    }
                }

                return res.status(200).send({
                    boardTicketEntryHTML: common_api.pugComponents.boardTicketEntryComponent(),
                    userOutlineEntryHTML: common_api.pugComponents.boardUserOutlineComponent(),
                    board: board
                });
            }

            if (teamObj.boardType === common_backend.boardTypes.SCRUM.value) {
                projects.getActiveSprintByTeamId(projectId, teamId, function (err, activeSprintObj) {
                    if (err && err.code !== 10004) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    let activeSprintTickets = activeSprintObj ? activeSprintObj.tickets : [];
                    projects.getTicketsByIds(projectId, teamId, activeSprintTickets, function (err, ticketsObjList) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            return res.status(500).send(err);
                        }

                        processTickets(ticketsObjList);
                    });
                });
            } else if (teamObj.boardType === common_backend.boardTypes.KANBAN.value) {
                projects.getTicketsByTeamId(projectId, teamId, function (err, ticketsObjList) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    processTickets(ticketsObjList);
                });
            } else {
                processTickets([]);
            }
        });
    });
}

/**
 * path to update user's team board type
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const updateBoardType = function (req, res) {
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
            return res.status(400).send(common_backend.getError(2012));
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
 * root path to render the team's project page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const renderTeamPage = function (req, res) {
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

            projects.getSprintsByTeamId(projectId, teamId, function (err, sprintsObjList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                projects.getReleasesByTeamId(projectId, teamId, function (err, releasesObjList) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(404).render(common_api.pugPages.pageNotFound);
                    }

                    projects.getTagsByTeamId(projectId, teamId, function (err, tagsObjList) {
                        if (err) {
                            logger.error(JSON.stringify(err));
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
                                        username: member.username,
                                        email: member.email,
                                        picture: member.picture
                                    });
                                }
                            }
                            let resolvedTeamObj = {
                                _id: teamObj._id,
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
                                canSearch: true,
                                sprintsList: sprintsObjList,
                                releasesList: releasesObjList,
                                tagsList: tagsObjList,
                                isUnKnownBoardType: teamObj.boardType === common_backend.boardTypes.UNKNOWN.value,
                                isKanbanBoardType: teamObj.boardType === common_backend.boardTypes.KANBAN.value,
                                isScrumBoardType: teamObj.boardType === common_backend.boardTypes.SCRUM.value,
                                isProjectClosed: projectObj.status === common_backend.projectStatus.CLOSED.value,
                                forceDeadline: projectObj.deadlineDate && projectObj.deadlineTime && projectObj.deadlineDate !== '' && projectObj.deadlineTime !== '',
                                deadlineDate: projectObj.deadlineDate,
                                deadlineTime: projectObj.deadlineTime,
                                commonSprintStatus: common_backend.sprintStatus,
                                commonReleaseStatus: common_backend.releaseStatus
                            });
                        });
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
const getMembersList = function (req, res) {
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
                        _id: memberObj._id,
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
 * path to get the teams list component
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const getTeamsListComponent = function (req, res) {
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
            if (teamsList.length !== 0) {
                let finishedTeamsCount = 0;
                for (let i = 0; i < teamsList.length; i++) {
                    let team = teamsList[i];
                    let resolvedMembers = [];
                    for (let j = 0; j < team.members.length; j++) {
                        let member = usersIdObj[team.members[j]];
                        if (member) {
                            resolvedMembers.push(`${member.fname} ${member.lname} - ${member.username}`);
                        }
                    }
                    projects.getTicketsByTeamId(projectId, team._id, function (err, ticketsList) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            return res.status(500).send(err);
                        }

                        let newCount = 0;
                        let progressCount = 0;
                        let doneCount = 0;
                        for (let k = 0; k < ticketsList.length; k++) {
                            let ticket = ticketsList[k];
                            switch (ticket.state) {
                                case common_backend.ticketStates.NEW.value:
                                    newCount++;
                                    break;
                                case common_backend.ticketStates.DONE.value:
                                    doneCount++;
                                    break;
                                default:
                                    progressCount++;
                                    break;
                            }
                        }

                        resolvedTeamsList.push({
                            teamId: team._id,
                            projectId: team.projectId,
                            ctime: team.ctime,
                            mtime: team.mtime,
                            name: team.name,
                            members: resolvedMembers,
                            newTickets: newCount,
                            progressTickets: progressCount,
                            doneTickets: doneCount
                        });

                        finishedTeamsCount++;
                        if (finishedTeamsCount === teamsList.length) {
                            return res.status(200).send({
                                teamsList: resolvedTeamsList,
                                teamRowHTML: common_api.pugComponents.teamEntryComponent()
                            });
                        }
                    });
                }
            } else {
                return res.status(200).send({
                    teamsList: resolvedTeamsList,
                    teamRowHTML: common_api.pugComponents.teamEntryComponent()
                });
            }
        });
    });
}

/**
 * path to get the teams analytics data
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const getAnalyticsData = function (req, res) {
    return res.status(200).send('ok');
}

// <exports> ------------------------------------------------
exports.getBacklogComponents = getBacklogComponents;
exports.getBoardComponents = getBoardComponents;
exports.getManagementComponents = getManagementComponents;
exports.getMembersList = getMembersList;
exports.getTeamsListComponent = getTeamsListComponent;
exports.renderTeamPage = renderTeamPage;
exports.updateBoardType = updateBoardType;
exports.getAnalyticsData = getAnalyticsData;
// </exports> -----------------------------------------------