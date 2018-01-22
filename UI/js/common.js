/*
UI errors for user display

1000 -> user errors
2000 -> system errors
*/
const errors = Object.freeze({
    //1000 system errors
    1000: 'Invalid request',

    //2000 user errors
    2000: 'Invalid username or password',
    2001: 'User already exists',
    2002: 'Invalid username or password',
    2003: 'Invalid username or password',
    2004: 'Invalid username or password',
    2005: 'Account is not active',
    2006: 'Session timed out',
    2007: 'failed to update user, missing information'
});
const defaultError = 'Something went wrong, please try again!';

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
    return data ? errors[data['code']] || defaultError : defaultError;
}

/**
 * Returns the HTML for a new notification
 *
 * @param {Object} notification
 * @returns {String} HTML of notification
 */
function getNotification(notification) {
    return `<li>
            <a class="navbarLinkHidden waves-effect" href="${notification.link}">
                <i class="material-icons">${notification.type}</i>
                ${notification.name}
                <span class="right pointer clear-notification" onclick="clearNotification($(this), ${notification.id})">X</span>
            </a>
        </li>`
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