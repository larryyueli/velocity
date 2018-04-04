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

var notifCount = $('#notifCount');
var mobileNotifCount = $('#mobileNotifCount');
var notificationList = $('#notifications_nav');
var noNotifications = $('#noNotifications');
var clearNotifications = $('#clearNotifications');
var navSearchField = $('#navSearchField');

const logoutButton = $('#nav-logout');

$('.button-collapse').sideNav({
    closeOnClick: true
});

$('.button-collapse.right').sideNav({
    edge: 'right',
    closeOnClick: true
});

$('.button-collapse-open.right').sideNav({
    edge: 'right',
});

function viewFullNotificationToggle(item, id, action = true) {
    const description = $(`#${id}-desc`);

    if (action) {
        description.toggleClass('hidden');

        if (description.hasClass('hidden')) {
            item[0].innerHTML = 'keyboard_arrow_down';
        } else {
            item[0].innerHTML = 'keyboard_arrow_up';
        }
    } else {
        description.addClass('hidden');
    }
}

/**
 * Removes a notification from view and clears it
 *
 * @param {object} item 
 * @param {String} id 
 */
function clearNotification(item, id) {
    // Remove the notification from view
    const itemToRemove = item.parent().parent();
    viewFullNotificationToggle(item, id, false);

    itemToRemove.animateCss('fadeOutRight', function () {
        itemToRemove.remove();

        // Updating the count
        notifCount[0].innerText = parseInt(notifCount[0].innerText) - 1;
        mobileNotifCount[0].innerText = parseInt(mobileNotifCount[0].innerText) - 1;

        // Removing the notification number if no more new notifications are found
        if (parseInt(notifCount[0].innerText) === 0) {
            notificationList.sideNav('hide');
            notifCount.addClass('hidden');
            mobileNotifCount.addClass('hidden');
            clearNotifications.addClass('hidden');
            noNotifications.removeClass('hidden');
        }
    });

    $.ajax({
        type: 'DELETE',
        url: '/notification/delete',
        data: {
            notificationId: id
        },
        success: function (data) {
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}

/**
 * Clears all notifications
 */
function clearAllNotifications() {
    const items = notificationList[0].getElementsByTagName('li');
    var outer = null;
    var inner = null;

    for (i = 0; i < items.length; i++) {
        outer = items[i].getElementsByTagName('span')[0];

        if (outer) {
            inner = outer.getElementsByTagName('span');

            if (inner) {
                inner[0].onclick();
            }
        }
    }

    $.ajax({
        type: 'DELETE',
        url: '/notifications/delete/all', // TODO: see if this still applies
        success: function (data) {
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}

/**
 * Adds a list of notifications in view
 * 
 * @param {Array} notifList list of notifications
 */
function addNotification(notifList) {
    if (notifList.length > 0) {
        if (parseInt(notifCount[0].innerText) === 0) {
            notifCount.removeClass('hidden');
            mobileNotifCount.removeClass('hidden');
            clearNotifications.removeClass('hidden');
            noNotifications.addClass('hidden');
        }

        notifCount[0].innerText = parseInt(notifCount[0].innerText) + notifList.length;
        mobileNotifCount[0].innerText = parseInt(mobileNotifCount[0].innerText) + notifList.length;

        // Adding all new notifications
        notifList.forEach(notification => {
            notificationList.append(getNotification(notification));
        });
    }
}

logoutButton.click(function () {
    $.ajax({
        type: 'DELETE',
        url: '/logout',
        success: function (data) {
            window.location.href = '/';
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
});

$(function () {
    var socket = new WebSocket(`ws://${window.location.hostname}:8001`);
    socket.onmessage = function (event) {
        addNotification(JSON.parse(event.data)['notifList']);
    }

    if (navSearchField) {
        navSearchField.on('keyup', function (event) {
            if (event.keyCode === 13) {
                const splithref = window.location.href.split('/');
                const projectId = splithref[4];
                const teamId = splithref[6];
                window.location = `/project/${projectId}/team/${teamId}/search?criteria=${navSearchField.val()}`;
            }
        });
    }
});