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

var board = null;
var ticketHTML = null;
var outlineHTML = null;

// const searchFilterIssueId = '#searchFilterIssue';
// const typeSelectionIssueId = '#typeSelectionIssue';

const boardsUserListId = '#boardsUserList';
const boardsUserLoadId = '#boardsUserLoad';

const todoTicketsId = '#todoTickets';
const inProgressTicketsId = '#inProgressTickets';
const codeReviewTicketsId = '#codeReviewTickets';
const readyForTestTicketsId = '#readyForTestTickets';
const inTestTicketsId = '#inTestTickets';
const doneTicketsId = '#doneTickets';

const ticketCountId = '#ticketCount';
const displayIdId = '#displayId';
const boardHeaderId = '#boardHeader';
const boardBodyId = '#boardBody';

const todoTitleId = '#todoTitle';
const inProgressTitleId = '#inProgressTitle';
const codeReviewTitleId = '#codeReviewTitle';
const readyForTestTitleId = '#readyForTestTitle';
const inTestTitleId = '#inTestTitle';
const doneTitleId = '#doneTitle';

$(function () {
    // $('select').material_select();
    $('.collapsible').collapsible();

    // $(typeSelectionIssueId).on('change', function () {
    //     startLoad(issuesLoadId, issuesListId);
    //     displayIssuesList();
    // });

    // $(searchFilterIssueId).on('keyup', function () {
    //     startLoad(issuesLoadId, issuesListId);
    //     displayIssuesList();
    // });

    startLoad(boardsUserLoadId, boardsUserListId);
    getBoard();
});

function getBoard() {
    $.ajax({
        type: 'GET',
        url: '/components/team/board',
        data: {
            projectId: projectId,
            teamId: teamId
        },
        success: function (data) {
            board = data.board;
            ticketHTML = $(data.boardTicketEntryHTML);
            outlineHTML = $(data.userOutlineEntryHTML);
            isReadonly = data.isReadOnly;

            for (var user in board) {
                board[user].isActive = true;
            }

            displayBoard();
        },
        error: function (data) {
            handle401And404(data);

            endLoad(boardsUserLoadId, boardsUserListId);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}

function displayBoard() {
    $(boardsUserListId).html('');
    var rowPopulate = '';

    for (var user in board) {
        if (passBoardFilter(user)) {
            $(boardsUserListId).append(fillUserBoardRow(user, board[user]));
        }
    }

    if ($(boardsUserListId).find('li').length === 0) {
        $(boardsUserListId).append(`<p class="center"><i>${translate('noResultsFoundBasedOnSearch')}</i></p>`)
    }

    endLoad(boardsUserLoadId, boardsUserListId);
}

function fillUserBoardRow(user, statuses) {
    var bindedRow = outlineHTML;
    var isActive = false;

    bindedRow.find(todoTicketsId).html('');
    bindedRow.find(inProgressTicketsId).html('');
    bindedRow.find(codeReviewTicketsId).html('');
    bindedRow.find(readyForTestTicketsId).html('');
    bindedRow.find(inTestTicketsId).html('');
    bindedRow.find(doneTicketsId).html('');

    bindedRow.find(todoTitleId).html(translate('todoTitle'));
    bindedRow.find(inProgressTitleId).html(translate('inProgressTitle'));
    bindedRow.find(codeReviewTitleId).html(translate('codeReviewTitle'));
    bindedRow.find(readyForTestTitleId).html(translate('readyForTestTitle'));
    bindedRow.find(inTestTitleId).html(translate('inTestTitle'));
    bindedRow.find(doneTitleId).html(translate('doneTitle'));

    statuses['new'].forEach(ticket => {
        bindedRow.find(todoTicketsId).append(fillBoardTicketRow(ticket));
    });

    statuses['inDevelopment'].forEach(ticket => {
        bindedRow.find(inProgressTicketsId).append(fillBoardTicketRow(ticket));
    });

    statuses['codeReview'].forEach(ticket => {
        bindedRow.find(codeReviewTicketsId).append(fillBoardTicketRow(ticket));
    });

    statuses['readyForTest'].forEach(ticket => {
        bindedRow.find(readyForTestTicketsId).append(fillBoardTicketRow(ticket));
    });

    statuses['inTest'].forEach(ticket => {
        bindedRow.find(inTestTicketsId).append(fillBoardTicketRow(ticket));
    });

    statuses['done'].forEach(ticket => {
        bindedRow.find(doneTicketsId).append(fillBoardTicketRow(ticket));
    });

    if (statuses.isActive) {
        bindedRow.find(boardHeaderId).addClass('active');
        bindedRow.find(boardBodyId)[0].style.display = 'block';
    } else {
        bindedRow.find(boardHeaderId).removeClass('active');
        bindedRow.find(boardBodyId)[0].style.display = 'none';
    }

    bindedRow.find(titleId).html(user);
    bindedRow.find(ticketCountId).html(`(${statuses['new'].length +
        statuses['inDevelopment'].length +
        statuses['codeReview'].length +
        statuses['readyForTest'].length +
        statuses['inTest'].length +
        statuses['done'].length} ${translate('tickets')})`);
    // bindedRow.find(imageId).html(`<img class="circle" src="/profilePicture/${issue.assigneePicture}" alt="" height="25" width="25">`);

    return bindedRow[0].outerHTML;
}

function fillBoardTicketRow(issue) {
    var bindedRow = ticketHTML;

    if (issue.type === 0) {
        bindedRow.find(typeIconId).html('<img src="/img/icon-ladybird.png" alt="" height="25" width="25" class="margin-right-5">');
    } else if (issue.type === 1) {
        bindedRow.find(typeIconId).html('<img src="/img/icon-code-file.png" alt="" height="25" width="25" class="margin-right-5">');
    } else if (issue.type === 2) {
        bindedRow.find(typeIconId).html('<img src="/img/icon-purchase-order.png" alt="" height="25" width="25" class="margin-right-5">');
    }

    if (issue.priority === 0) {
        bindedRow.find(priorityIconId).html('<img src="/img/icon-low-priority.png" alt="" height="25" width="25" class="margin-right-5">');
    } else if (issue.priority === 1) {
        bindedRow.find(priorityIconId).html('<img src="/img/icon-medium-priority.png" alt="" height="25" width="25" class="margin-right-5">');
    } else if (issue.priority === 2) {
        bindedRow.find(priorityIconId).html('<img src="/img/icon-high-priority.png" alt="" height="25" width="25" class="margin-right-5">');
    }

    bindedRow.attr('id', issue._id)
    bindedRow.find(displayIdId).html(issue.displayId);
    bindedRow.find(nameId).html(issue.title);
    bindedRow.find(estimateId).html(issue.points);
    bindedRow.find(imageId).html(`<img class="circle" src="/profilePicture/${issue.assigneePicture}" width="40" height="40" alt="">`);

    return bindedRow[0].outerHTML;
}

/**
 * Filters a ticket object to match filter parameters
 *
 * @param {Object} group
 */
function passBoardFilter(user) {
    const assignee = selectedAssigneeBoard;

    // Ticket assignee filter
    if (assignee && assignee !== '' && assignee !== user) {
        return false;
    }

    return true;
}

/**
 * Sets the status of a sprint to opened or closed to save in memory
 *
 * @param {Object} clicked
 */
function setActive(clicked) {
    const userName = clicked.parent().find('#title').text();

    for (var user in board) {
        if (user === userName) {
            board[user].isActive = !clicked.hasClass('active');
        }
    }
}































function ticketDragStartHandler(ev, from) {
    const statuses = ['new', 'inDevelopment', 'codeReview', 'readyForTest', 'inTest', 'done'];

    const ticketId = $(ev.srcElement).attr('id');
    var username = null;

    for (user in board) {
        for (status in statuses) {
            if (board[user][status].find(ticket => ticket._id === ticketId)) {
                username = user;
                break;
            }
        }
    }

    ev.dataTransfer.setData("text/ticketId", ticketId);
    ev.dataTransfer.setData("text/from", user);
}

function dragover_handler(ev) {
    ev.preventDefault();
    // Set the dropEffect to move
    ev.dataTransfer.dropEffect = "move"
}
function drop_handler(ev, to) {
    ev.preventDefault();
    // Get the id of the target and add the moved element to the target's DOM
    var data = ev.dataTransfer.getData("text/ticketId");
    var username = ev.dataTransfer.getData("text/from");
    debugger;
    const ticket = board[username][from].find(ticket => ticket._id === data);
}

function dragover_handler(ev) {
    ev.preventDefault();
    // Set the dropEffect to move
    ev.dataTransfer.dropEffect = "move"
}


/* flow
  save info I need
  set the border on the others and make it an overlay ontop of the other tickets
  drag over make it a different color
  when dropped move the element and refresh
  make sure to add the loader lol (looks broken)
  */
