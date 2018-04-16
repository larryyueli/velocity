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

// common colour varianles
const colours = Object.freeze({
    green: 'green',
    orangeDark: 'orange accent-4',
    red: 'red',
    redDark: 'red darken-4',
    yellow: 'yellow'
});

const snack = Object.freeze({
    success: '<i class="material-icons">check</i>&nbsp&nbsp&nbsp',
    warning: '<i class="material-icons">warning</i>&nbsp&nbsp&nbsp',
    fail: '<i class="material-icons">cancel</i>&nbsp&nbsp&nbsp',
    close: '&nbsp&nbsp&nbsp<i id=closeSnack class="material-icons pointer">close</i>'
});

/* This function slides down a success snakbar */
function successSnackbar(msg) {
    // runs the toast function for 5s with given msg and colour
    Materialize.toast(`${snack.success}${msg}${snack.close}`, 5000, colours.green);
}

/* This function slides down a warning snakbar */
function warningSnackbar(msg) {
    // runs the toast function for 5s with given msg and colour
    Materialize.toast(`${snack.warning}${msg}${snack.close}`, 5000, colours.orangeDark);
}

/* This function slides down a fail snakbar */
function failSnackbar(msg) {
    // runs the toast function for 5s with given msg and colour
    Materialize.toast(`${snack.fail}${msg}${snack.close}`, 5000, colours.redDark);
}

/* Listener for the `x` on the snackbar/toasts */
$(document).on('click', '#closeSnack', function () {
    $(this).parent().fadeOut();
});

/*
UI Translations for user display

1000 -> user errors
2000 -> system errors
3000 -> settings errors
4000 -> custom file system errors
8000 -> comments
9000 -> notifications
10000 -> sprints
11000 -> releases
12000 -> tags
*/
const translations = Object.freeze({
    //1000 system errors
    1000: 'Invalid request',
    1009: 'Failed to parse csv file',
    1010: 'Website setup is not complete',

    //2000 user errors
    2000: 'Invalid username or password',
    2001: 'User already exists',
    2002: 'Invalid username or password',
    2003: 'Invalid username or password',
    2004: 'Invalid username or password',
    2005: 'Account is not active',
    2006: 'Session timed out',
    2007: 'Failed to update user, missing information',
    2008: 'Invalid profile picture extension',
    2009: 'Invalid users import file extension',
    2010: 'Permission denied',
    2011: 'Password and confirm password do not match',
    2012: 'Project is already active',
    2013: 'Project is already closed',
    2014: 'Project is not in draft',
    2015: 'Cant update team, invalid action',
    2016: 'User is already in a team',
    2017: 'User is not in a team',
    2020: 'Cant exceed team size',
    2021: 'Mismatching team names',
    2022: 'Permission denied',
    2023: 'Permission denied',
    2024: 'Permission denied',
    2025: 'Permission denied',
    2026: 'Permission denied',
    2027: 'Permission denied',
    2028: 'Permission denied',
    2029: 'Permission denied',
    2030: 'Permission denied',
    2031: 'Permission denied',
    2032: 'Permission denied',
    2033: 'Permission denied',
    2034: 'Permission denied',
    2035: 'Permission denied',
    2036: 'Permission denied',
    2037: 'Permission denied',
    2038: 'Permission denied',
    2039: 'Permission denied',
    2040: 'Permission denied',
    2041: 'Permission denied',
    2042: 'Cant update project, project is in terminal status',
    2043: 'Project is not active',
    2044: 'Project is not active or closed',

    //3000 settings errors
    3005: 'could not update the selected mode',
    3006: 'Invalid mode',
    3007: 'Website is not active',

    //4000 custom file system errors
    4010: 'Permission denied',

    //5000 projects
    5001: 'Failed to add a project',
    5002: 'Failed to get projects list',
    5003: 'Failed to get a project',
    5004: 'Project not found',
    5005: 'Failed to update projects',
    5006: 'Failed to update project',
    5007: 'Project already exists',

    //6000 teams
    6001: 'Failed to add a team',
    6002: 'Failed to get teams list',
    6003: 'Failed to get a team',
    6004: 'Team not found',
    6005: 'Failed to update team',
    6006: 'Failed to create a team',
    6007: 'Failed to update a team',

    //7000 tickets
    7001: 'Failed to add a ticket',
    7002: 'Failed to get tickets list',
    7003: 'Failed to get a ticket',
    7004: 'Ticket not found',
    7005: 'Failed to update ticket',
    7006: 'Failed to create a ticket',
    7007: 'Failed to update a ticket',

    //8000 comment
    8001: 'Failed to add a comment',
    8005: 'Failed to update comment',
    8006: 'Failed to create a comment',
    8007: 'Failed to update a comment',

    //9000 notifications
    9001: 'Failed to add a notification',
    9002: 'Failed to get notifications list',
    9003: 'Failed to get a notification',
    9004: 'Notification not found',
    9005: 'Failed to update notification',
    9006: 'Failed to create a notification',
    9007: 'Failed to update a notification',
    9008: 'Failed to delete a notification',
    9009: 'Failed to delete a notification',
    9010: 'Failed to delete a notification',

    //10,000 sprints
    10001: 'Failed to add a sprint',
    10002: 'Failed to get sprints list',
    10003: 'Failed to get a sprint',
    10004: 'Sprint not found',
    10005: 'Failed to update sprint',
    10006: 'Failed to create a sprint',
    10007: 'Failed to update a sprint',

    //11,000 releases
    11001: 'Failed to add a release',
    11002: 'Failed to get releases list',
    11003: 'Failed to get a release',
    11004: 'Release not found',
    11005: 'Failed to update release',
    11006: 'Failed to create a release',
    11007: 'Failed to update a release',

    //12,000 tags
    12001: 'Failed to add a tag',
    12002: 'Failed to get tags list',
    12003: 'Failed to get a tag',
    12004: 'Tag not found',
    12005: 'Failed to update tag',
    12006: 'Failed to create a tag',
    12007: 'Failed to update a tag',

    activatedProject: 'Project has been activated',
    closedProject: 'Project has been closed',
    activateProjectPrompt: 'Are you sure you want to activate this project?',
    adminConfigurationSuccess: 'Admins have been saved successfully',
    alreadyInGroup: 'This user is already in this group',
    backlog: 'Backlog',
    closeProjectPrompt: 'Are you sure you want to close this project?',
    defaultError: 'Something went wrong, please try again!',
    deleteAllGroupsWarning: 'Are you sure you would like to delete all created groups?',
    deletedProject: 'Project has been deleted',
    deleteProjectPrompt: 'Are you sure you want to delete this project?',
    deletePremadeGroups: 'Would you like to delete the groups that are already made?',
    doneTickets: 'Done Tickets',
    emptyProjectDescription: 'Please enter your description in the editor.',
    groupConfigurationSuccess: 'Groups have been saved successfully',
    groupMembersDelete: 'This group has members, deleting it will make all members go to the unassigned list',
    groupNameAlreadyExists: 'Group name already exists',
    groupNameCantBeEmpty: 'Group name can\'t be empty',
    groupSelectionConfigurationSuccess: 'Group selection has been saved successfully',
    groupSizeCantBeZero: 'Group size must be a positive integer',
    issuesFound: 'issues found',
    members: 'Members',
    mustBeCsv: 'File format must be csv!',
    mustBeVelocity: 'File format must be velocity!',
    mustImportOneFile: 'You can only import one file!',
    na: 'N/A',
    newTickets: 'New Tickets',
    noassignee: 'No Assignee',
    noMembers: 'No Members',
    noResultsFoundBasedOnSearch: 'No results found based on your search',
    notInGroup: 'You are currently not in a group',
    passwordsDontMatch: 'Passwords do not match',
    points: 'Points',
    progressTickets: 'In Development Tickets',
    randomize: 'Randomize',
    randomizeRemainingWarning: 'Are you sure you would like to randomize all unassigned users in new groups?',
    selectGroup: 'Select Group',
    size: 'Size',
    successfulFileUpload: 'File uploaded successfully',
    successfulFileDownload: 'File downloaded successfully',
    tickets: 'Tickets',
    total: 'total',
    uploadOnlyPicture: 'You can only upload one picture!',
    updatedProject: 'Project has been updated',
    updateProjectPrompt: 'Are you sure you want to update the project with this new configuration?',
    alreadyInGroup: 'This user is already in this group',
    groupNameCantBeEmpty: 'Group name can\'t be empty',
    groupNamealreadyExists: 'Group name already exists',
    groupMembersDelete: 'This group has members, deleting it will make all members go to the unassigned list',
    groupSizeCantBeZero: 'Group size must be a positive integer',
    deletePremadeGroups: 'Would you like to delete the groups that are already made?',
    randomizeRemainingWarning: 'Are you sure you would like to randomize all unassigned users in new groups?',
    randomize: 'Randomize',
    saveProjectPrompt: 'Are you sure you want to save the project with the current configurations?',
    groupSelectionConfigurationSuccess: 'Group selection has been saved successfully',
    groupConfigurationSuccess: 'Groups have been saved successfully',
    adminConfigurationSuccess: 'Admins have been saved successfully',
    notInGroup: 'You are currently not in a group',
    deleteAllGroupsWarning: 'Are you sure you would like to delete all created groups?',
    closeReleaseWarning: 'Are you sure you want to close this release?',
    deleteReleaseWarning: 'Are you sure you want to delete this release?',
    activateSprintWarning: 'Are you sure you would like to activate this sprint? It will close any currently active sprint',
    closeSprintWarning: 'Are you sure you would like to close this sprint?',
    deleteSprintWarning: 'Are you sure you would like to delete this sprint?',
    deleteTagWarning: 'Are you sure you would like to delete this tag?',
    titleCanNotBeEmpty: 'Title can not be empty!',
    descriptionCanNotBeEmpty: 'Description can not be empty!',
    commentCanNotBeEmpty: 'Comment can not be empty!',
    saveBoardType: 'BE CAREFUL, this can NOT be changed!',
    updatedTicket: 'Ticket has been updated',
    startDate: 'Start Date: ',
    endDate: 'End Date: ',
    emptyRelease: 'Release field cannot be empty',
    emptyTag: 'Tag field cannot be empty',
    emptySprint: 'Sprint field cannot be empty',
    emptySprintStart: 'Start date cannot be empty',
    emptySprintEnd: 'End date cannot be empty',
    emptyDeadlineDate: 'Deadline Date can not be empty',
    emptyDeadlineTime: 'Deadline Time can not be empty',

    todoTitle: 'TODO',
    inProgressTitle: 'IN DEVELOPMENT',
    codeReviewTitle: 'CODE REVIEW',
    readyForTestTitle: 'READY FOR TEST',
    inTestTitle: 'IN TEST',
    doneTitle: 'DONE',

    user0: 'Mode Selector',
    user1: 'Collaborator Admin',
    user2: 'Collaborator',
    user3: 'Professor',
    user4: 'Teaching Assistant',
    user5: 'Student',

    state0: 'New',
    state1: 'In Development',
    state2: 'Code Review',
    state3: 'Ready For Test',
    state4: 'In Test',
    state5: 'Done',

    projectStatus0: 'Closed',
    projectStatus1: 'Draft',
    projectStatus2: 'Active',

    ok: 'Ok',
    close: 'Close',
    clear: 'Clear',
    cancel: 'Cancel',
    activate: 'Activate',
    delete: 'Delete',
    save: 'Save',
    update: 'Update',

    today: 'Today',
    now: 'Now'
});

const userIcons = Object.freeze({
    0: 'security',
    1: 'security',
    2: 'people',
    3: 'security',
    4: 'people',
    5: 'person'
});

var meObject;

$(function () {
    getMeObject();
});

/**
 * get the me object
 */
function getMeObject() {
    $.ajax({
        type: 'GET',
        url: '/me',
        async: false,
        success: function (data) {
            meObject = data;
        },
        error: function (data) {
        }
    });
}

/**
 * Returns the correct error message to use, if no errors match returns
 * the default error message
 *
 * @param {Object} data
 * @returns {String} Error message
 */
function getErrorMessageFromResponse(data) {
    return data ? translations[data['code']] || translations['defaultError'] : translations['defaultError'];
}

/**
 * Returns the correct translation based on the passed parameter
 *
 * @param {String} data
 * @returns {String} translated text
 */
function translate(data) {
    return translations[data];
}

/**
 * Returns the HTML for a new notification
 *
 * @param {Object} notification
 * @returns {String} HTML of notification
 */
function getNotification(notification) {
    return `<span>
                <li>
                    <a class="navbarLinkHidden waves-effect padding-right-0 truncate" href="${notification.link}">
                        <i class="material-icons margin-right-10">${notification.type}</i>
                        ${notification.name}
                    </a>
                    <span class="right right-icons">
                        <i class="pointer padding-right-5 material-icons md-22 visibility-icon" onclick="viewFullNotificationToggle($(this), '${notification._id}')">keyboard_arrow_down</i>
                        <span class="pointer clear-notification padding-right-10" id="${notification._id}-clear" onclick="clearNotification($(this), '${notification._id}')">X</span>
                    </span>
                </li>
                <li class="full-description hidden" id="${notification._id}-desc">
                    ${notification.name}
                </li>
            </span>`;
}

/**
 * Returns the HTML for an error pill
 *
 * @param {String} text
 * @returns {String} HTML of error pill
 */
function getErrorPill(text) {
    return `<div class="chip white-text red darken-4">${text}<i class="close material-icons">close</i></div>`
}

/**
 * Returns the HTML for the loading animation
 *
 * @returns {String} HTML of loading animation
 */
function getLoading() {
    return '<div class="progress loaderBackgroundColour-background-colour"><div class="indeterminate primaryColour-background-colour"></div></div>';
}

/**
 * starts the loader
 *
 * @param {String} loading id of loader
 * @param {String} hiding section to be loaded
 */
function startLoad(loading, hiding) {
    $(loading).html(getLoading());
    $(hiding).addClass('hidden');
}

/**
 * ends the loader
 *
 * @param {String} loading id of loader
 * @param {String} showing section to be loaded
 */
function endLoad(loading, showing) {
    $(loading).html('');
    $(showing).removeClass('hidden');
}

/**
 * Allows us to call an animate function with a callback
 */
$.fn.extend({
    animateCss: function (animationName, callback) {
        var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
        this.addClass('animated ' + animationName).one(animationEnd, function () {
            $(this).removeClass('animated ' + animationName);
            if (callback) {
                callback();
            }
        });
        return this;
    }
});

/**
 * handle 401 and 404 erros
 *
 * @param {String} data response data
 */
function handle401And404(data) {
    if (data['status'] === 401) {
        window.location.href = '/';
    } else if (data['status'] === 404) {
        window.location.href = '/pageNotFound';
    }
}


/**
 * toggle visibility
 *
 * @param {Object} element element
 */
function toggleVisibility(element) {
    if (element.hasClass('hidden')) {
        element.removeClass('hidden');
        element.animateCss('fadeIn');
    } else {
        element.addClass('hidden');
    }
}

/**
 * Initialize the summernote and all its sub modal
 *
 * @param {Object} element element
 */
const initSummernote = function (descriptionId) {
    $(descriptionId).summernote({ height: 200 });
    $('div.note-btn-group.btn-group button').unbind('mouseenter mouseleave').addClass('customSummernoteButton');
    $('div.note-btn-group.btn-group.note-insert button').unbind();
    $('div.note-btn-group.btn-group.note-view button:nth-child(3)').unbind();
    $('div.note-btn-group.btn-group.note-insert button:nth-child(1) i').removeClass('note-icon-link');
    $('div.note-btn-group.btn-group.note-insert button:nth-child(1) i').addClass('material-icons');
    $('div.note-btn-group.btn-group.note-insert button:nth-child(1) i').html('cloud_upload');
    $('div.note-btn-group.btn-group.note-insert button:nth-child(1)').click(function () {
        $('#uploadModal').modal('open');
    });
    $('div.note-btn-group.btn-group.note-insert button:nth-child(3)').remove();
    $('div.note-btn-group.btn-group.note-insert button:nth-child(2)').remove();
    $('div.note-btn-group.btn-group.note-view button:nth-child(3)').remove();
    $('.modal').modal({
        dismissible: false
    });
    if ($(descriptionId) && $(descriptionId))
    $(descriptionId).summernote('code', $(descriptionId)[0].textContent)
}
