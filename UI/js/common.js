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
*/
const translations = Object.freeze({
    //1000 system errors
    1000: 'Invalid request',
    1009: 'Failed to parse csv file',

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

    //3000 settings errors
    3005: 'could not update the selected mode',
    3006: 'Invalid mode',
    3007: 'Website is not active',

    //4000 custom file system errors
    4010: 'Permission denied',

    defaultError: 'Something went wrong, please try again!',
    passwordsDontMatch: 'Passwords do not match',
    uploadOnlyPicture: 'You can only upload one picture!',
    noResultsFoundBasedOnSearch: 'No results found based on your search',
    mustBeCsv: 'File format must be csv!',
    mustImportOneFile: 'You can only import one file!',
    successfulFileUpload: 'File uploaded successfully',
    emptyProjectDescription: 'Please enter your description in the editor.',
    selectGroup: 'Select Group',
    size: 'Size',
    activatedProject: 'Project has been activated',
    deletedProject: 'Project has been deleted',
    updatedProject: 'Project has been updated',
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
    groupSelectionConfigurationSuccess: 'Group selection has been saved successfully',
    groupConfigurationSuccess: 'Groups have been saved successfully',
    notInGroup: 'You are currently not in a group',
    deleteAllGroupsWarning: 'Are you sure you would like to delete all created groups?',

    user0: 'Mode Selector',
    user1: 'Collaborator Admin',
    user2: 'Collaborator',
    user3: 'Professor',
    user4: 'Teaching Assistant',
    user5: 'Student',

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
                        <i class="pointer padding-right-5 material-icons md-22 visibility-icon" onclick="viewFullNotificationToggle($(this), ${notification.id})">keyboard_arrow_down</i>
                        <span class="pointer clear-notification padding-right-10" id="${notification.id}-clear" onclick="clearNotification($(this), ${notification.id})">X</span>
                    </span>
                </li>
                <li class="full-description hidden" id="${notification.id}-desc">
                    ${notification.name}
                </li>
            </span>`;
}

/**
 * Returns the HTML for an error pill
 *
 * @param {Object} jsonResponse
 * @returns {String} HTML of error pill
 */
function getErrorPill(jsonResponse) {
    return `<div class="chip white-text red darken-4">${getErrorMessageFromResponse(jsonResponse)}<i class="close material-icons">close</i></div>`
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
