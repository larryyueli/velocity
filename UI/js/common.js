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
    close: '&nbsp&nbsp&nbsp<i id=closeSnack class="material-icons">close</i>'
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

    //8000 comment
    8001: 'Failed to add a comment',
    8005: 'Failed to update comment',
    8006: 'Failed to create a comment',
    8007: 'Failed to update a comment',

    activate: 'Activate',
    activatedProject: 'Project has been activated',
    closedProject: 'Project has been closed',
    activateProjectPrompt: 'Are you sure you want to activate this project?',
    adminConfigurationSuccess: 'Admins have been saved successfully',
    alreadyInGroup: 'This user is already in this group',
    cancel: 'Cancel',
    close: 'Close',
    closeProjectPrompt: 'Are you sure you want to close this project?',
    defaultError: 'Something went wrong, please try again!',
    delete: 'Delete',
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
    mustImportOneFile: 'You can only import one file!',
    newTickets: 'New Tickets',
    noMembers: 'No Members',
    noResultsFoundBasedOnSearch: 'No results found based on your search',
    notInGroup: 'You are currently not in a group',
    passwordsDontMatch: 'Passwords do not match',
    progressTickets: 'In Progress Tickets',
    randomize: 'Randomize',
    randomizeRemainingWarning: 'Are you sure you would like to randomize all unassigned users in new groups?',
    selectGroup: 'Select Group',
    size: 'Size',
    successfulFileUpload: 'File uploaded successfully',
    tickets: 'Tickets',
    total: 'total',
    uploadOnlyPicture: 'You can only upload one picture!',
    update: 'Update',
    updatedProject: 'Project has been updated',
    updateProjectPrompt: 'Are you sure you want to update the project with this new configuration?',
    alreadyInGroup: 'This user is already in this group',
    groupNameCantBeEmpty: 'Group name can\'t be empty',
    groupNamealreadyExists: 'Group name already exists',
    groupMembersDelete: 'This group has members, deleting it will make all members go to the unassigned list',
    groupSizeCantBeZero: 'Group size must be a positive integer',
    deletePremadeGroups: 'Would you like to delete the groups that are already made?',
    randomizeRemainingWarning: 'Are you sure you would like to randomize all unassigned users in new groups?',
    delete: 'Delete',
    cancel: 'Cancel',
    randomize: 'Randomize',
    save: 'Save',
    saveProjectPrompt: 'Are you sure you want to save the project with the current configurations?',
    groupSelectionConfigurationSuccess: 'Group selection has been saved successfully',
    groupConfigurationSuccess: 'Groups have been saved successfully',
    adminConfigurationSuccess: 'Admins have been saved successfully',
    notInGroup: 'You are currently not in a group',
    deleteAllGroupsWarning: 'Are you sure you would like to delete all created groups?',
    titleCanNotBeEmpty: 'Title can not be empty!',
    descriptionCanNotBeEmpty: 'Description can not be empty!',
    commentCanNotBeEmpty: 'Comment can not be empty!',

    todoTitle: 'TODO',
    inProgressTitle: 'IN PROGRESS',
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
    projectStatus2: 'Active'
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

    $(descriptionId).summernote('code', $(descriptionId)[0].textContent)
}
