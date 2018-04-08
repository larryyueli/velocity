const todoUserPointsId = '#todoUserPoints';
const todoUserTicketsId = '#todoUserTickets';
const inProgressUserTicketsId = '#inProgressUserTickets';
const inProgressUserPointsId = '#inProgressUserPoints';
const codeReviewUserTicketsId = '#codeReviewUserTickets';
const codeReviewUserPointsId = '#codeReviewUserPoints';
const readyForTestUserTicketsId = '#readyForTestUserTickets';
const ReadyForTestUserPointsId = '#ReadyForTestUserPoints';
const inTestUserTicketsId = '#inTestUserTickets';
const inTestUserPointsId = '#inTestUserPoints';
const doneUserTicketsId = '#doneUserTickets';
const doneUserPointsId = '#doneUserPoints';
const userTicketDivisionId = 'userTicketDivision';

const todoTeamPointsId = '#todoTeamPoints';
const todoTeamTicketsId = '#todoTeamTickets';
const inProgressTeamTicketsId = '#inProgressTeamTickets';
const inProgressTeamPointsId = '#inProgressTeamPoints';
const codeReviewTeamTicketsId = '#codeReviewTeamTickets';
const codeReviewTeamPointsId = '#codeReviewTeamPoints';
const readyForTestTeamTicketsId = '#readyForTestTeamTickets';
const ReadyForTestTeamPointsId = '#ReadyForTestTeamPoints';
const inTestTeamTicketsId = '#inTestTeamTickets';
const inTestTeamPointsId = '#inTestTeamPoints';
const doneTeamTicketsId = '#doneTeamTickets';
const doneTeamPointsId = '#doneTeamPoints';
const teamTicketDivisionId = 'teamTicketDivision';

var globalData = null;
var sprintIdsObj = {};
var selectedSprint = null;

const sprintsAutocompleteId = '#sprintsAutocomplete';

$(function () {
    queryScrumStatistics();
    getListOfSprints();
});


function queryScrumStatistics() {
    $.ajax({
      type: 'GET',
      url: '/project/team/analytics',
      data: {
        projectId: projectId,
        teamId: teamId
      },
      success: function (data) {
          const currentSprint = data['sprints'].find(sprint => sprint['sprintStatus'] === 2);
          if (currentSprint) {
              $(sprintsAutocompleteId).val(currentSprint['sprintName']);
              selectedSprint = currentSprint['sprintId'];
              $(sprintsAutocompleteId).parent().find('label').addClass('active');
          }
          globalData = data;
          displayScrumCharts(data);
      },
      error: function (data) {
          alert('error');
      }
    });
}

function displayScrumCharts(data) {
    const currentUserObject = data['sprints'].find(sprint => sprint['sprintStatus'] === 2)['members'].find(user => user['username'] === meObject['username']);
    const currentUserStates = currentUserObject ? currentUserObject['states'] : null;
    const currentUserPoints = currentUserObject ? currentUserObject['points'] : null;

    displayUserCards(currentUserStates, currentUserPoints);
    displayUserPieDivision(currentUserStates, currentUserPoints);

    displayFilteredTeamData();
}

function displayUserCards(currentUserStates, currentUserPoints) {
    if (currentUserStates) {
        $(todoUserTicketsId).html(currentUserStates[0]);
        $(todoUserPointsId).html(`${currentUserPoints[0]} ${translate('points')}`);
        $(inProgressUserTickets).html(currentUserStates[1]);
        $(inProgressUserPoints).html(`${currentUserPoints[1]} ${translate('points')}`);
        $(codeReviewUserTickets).html(currentUserStates[2]);
        $(codeReviewUserPoints).html(`${currentUserPoints[2]} ${translate('points')}`);
        $(readyForTestUserTickets).html(currentUserStates[3]);
        $(ReadyForTestUserPoints).html(`${currentUserPoints[3]} ${translate('points')}`);
        $(inTestUserTickets).html(currentUserStates[4]);
        $(inTestUserPoints).html(`${currentUserPoints[4]} ${translate('points')}`);
        $(doneUserTickets).html(currentUserStates[5]);
        $(doneUserPoints).html(`${currentUserPoints[5]} ${translate('points')}`);
    } else {
        const filler = translate('na');

        $(todoUserTicketsId).html(filler);
        $(todoUserPointsId).html(`${filler} ${translate('points')}`);
        $(inProgressUserTickets).html(filler);
        $(inProgressUserPoints).html(`${filler} ${translate('points')}`);
        $(codeReviewUserTickets).html(filler);
        $(codeReviewUserPoints).html(`${filler} ${translate('points')}`);
        $(readyForTestUserTickets).html(filler);
        $(ReadyForTestUserPoints).html(`${filler} ${translate('points')}`);
        $(inTestUserTickets).html(filler);
        $(inTestUserPoints).html(`${filler} ${translate('points')}`);
        $(doneUserTickets).html(filler);
        $(doneUserPoints).html(`${filler} ${translate('points')}`);
    }
}

function displayUserPieDivision(currentUserStates, currentUserPoints) {
    var ctx = document.getElementById(userTicketDivisionId).getContext('2d');
    var data = {
        datasets: [{
            data: Object.values(currentUserStates),
            backgroundColor: [
                $('.gradient-todo').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-in-progress').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-code-review').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-ready-for-test').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-in-test').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-done').css('background').match(/rgb\(.*?\)/g)[1]
            ],
            borderColor: [
                $('.gradient-todo').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-in-progress').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-code-review').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-ready-for-test').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-in-test').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-done').css('background').match(/rgb\(.*?\)/g)[0]
            ],
            borderWidth: 2,
            label: "TODO1"
        },
        {
            data: Object.values(currentUserPoints),
            backgroundColor: [
                $('.gradient-todo').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-in-progress').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-code-review').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-ready-for-test').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-in-test').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-done').css('background').match(/rgb\(.*?\)/g)[1]
            ],
            borderColor: [
                $('.gradient-todo').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-in-progress').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-code-review').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-ready-for-test').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-in-test').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-done').css('background').match(/rgb\(.*?\)/g)[0]
            ],
            borderWidth: 2,
            label: "TODO2"
        }],
        labels: [ 'a', 'b', 'c', 'd', 'e', 'f']
    };

    var options = {
        legend: {
            display: true,
            position: 'right'
        },
        tooltips: {
            callbacks: {
                label: function(item, data) {
                    return data.datasets[item.datasetIndex].label+ ": "+ data.labels[item.index]+ ": "+ data.datasets[item.datasetIndex].data[item.index];
                }
            }
        },
        cutoutPercentage: 40
    }

    var myDoughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: options
    });
}

function displayFilteredTeamData() {
    //TODO: explain why you need a sprint
    var dummyObject = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0};
    var currentTeamStates = null;
    var currentTeamPoints = null;

    if (selectedSprint && sprintFilterUser) {
        const currentTeamObject = globalData['sprints'].find(sprint => sprint['sprintId'] === selectedSprint)['members'].find(user => user['username'] === sprintFilterUser);
        currentTeamStates = currentTeamObject ? currentTeamObject['states'] : null;
        currentTeamPoints = currentTeamObject ? currentTeamObject['points'] : null;
    } else if (selectedSprint) {
        const tempSprint = globalData['sprints'].find(sprint => sprint['sprintId'] === selectedSprint)['members'];
        var newPointsObject = Object.create( dummyObject );
        tempSprint.forEach(user => {
            for (var point in user['points']) {
                newPointsObject[point] += user['points'][point];
            }
        });
        var newStatsObject = Object.create( dummyObject );
        tempSprint.forEach(user => {
            for (var state in user['states']) {
                newStatsObject[state] += user['states'][state];
            }
        });
        currentTeamStates = newStatsObject;
        currentTeamPoints = newPointsObject;
    }

    displayteamCards(currentTeamStates, currentTeamPoints);
    displayteamPieDivision(currentTeamStates, currentTeamPoints);

}

function displayteamCards(currentTeamStates, currentTeamPoints) {
    if (currentTeamStates) {
        $(todoTeamTicketsId).html(currentTeamStates[0]);
        $(todoTeamPointsId).html(`${currentTeamPoints[0]} ${translate('points')}`);
        $(inProgressTeamTickets).html(currentTeamStates[1]);
        $(inProgressTeamPoints).html(`${currentTeamPoints[1]} ${translate('points')}`);
        $(codeReviewTeamTickets).html(currentTeamStates[2]);
        $(codeReviewTeamPoints).html(`${currentTeamPoints[2]} ${translate('points')}`);
        $(readyForTestTeamTickets).html(currentTeamStates[3]);
        $(ReadyForTestTeamPoints).html(`${currentTeamPoints[3]} ${translate('points')}`);
        $(inTestTeamTickets).html(currentTeamStates[4]);
        $(inTestTeamPoints).html(`${currentTeamPoints[4]} ${translate('points')}`);
        $(doneTeamTickets).html(currentTeamStates[5]);
        $(doneTeamPoints).html(`${currentTeamPoints[5]} ${translate('points')}`);
    } else {
        const filler = translate('na');

        $(todoTeamTicketsId).html(filler);
        $(todoTeamPointsId).html(`${filler} ${translate('points')}`);
        $(inProgressTeamTickets).html(filler);
        $(inProgressTeamPoints).html(`${filler} ${translate('points')}`);
        $(codeReviewTeamTickets).html(filler);
        $(codeReviewTeamPoints).html(`${filler} ${translate('points')}`);
        $(readyForTestTeamTickets).html(filler);
        $(ReadyForTestTeamPoints).html(`${filler} ${translate('points')}`);
        $(inTestTeamTickets).html(filler);
        $(inTestTeamPoints).html(`${filler} ${translate('points')}`);
        $(doneTeamTickets).html(filler);
        $(doneTeamPoints).html(`${filler} ${translate('points')}`);
    }
}

function displayteamPieDivision(currentTeamStates, currentTeamPoints) {
    //TODO: draw no data if null
    var ctx = document.getElementById(teamTicketDivisionId).getContext('2d');
    var data = {
        datasets: [{
            data: Object.values(currentTeamStates),
            backgroundColor: [
                $('.gradient-todo').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-in-progress').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-code-review').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-ready-for-test').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-in-test').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-done').css('background').match(/rgb\(.*?\)/g)[1]
            ],
            borderColor: [
                $('.gradient-todo').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-in-progress').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-code-review').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-ready-for-test').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-in-test').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-done').css('background').match(/rgb\(.*?\)/g)[0]
            ],
            borderWidth: 2,
            label: "TODO1"
        },
        {
            data: Object.values(currentTeamPoints),
            backgroundColor: [
                $('.gradient-todo').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-in-progress').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-code-review').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-ready-for-test').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-in-test').css('background').match(/rgb\(.*?\)/g)[1],
                $('.gradient-done').css('background').match(/rgb\(.*?\)/g)[1]
            ],
            borderColor: [
                $('.gradient-todo').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-in-progress').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-code-review').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-ready-for-test').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-in-test').css('background').match(/rgb\(.*?\)/g)[0],
                $('.gradient-done').css('background').match(/rgb\(.*?\)/g)[0]
            ],
            borderWidth: 2,
            label: "TODO2"
        }],
        labels: [ 'a', 'b', 'c', 'd', 'e', 'f']
    };

    var options = {
        legend: {
            display: true,
            position: 'right'
        },
        tooltips: {
            callbacks: {
                label: function(item, data) {
                    return data.datasets[item.datasetIndex].label+ ": "+ data.labels[item.index]+ ": "+ data.datasets[item.datasetIndex].data[item.index];
                }
            }
        },
        cutoutPercentage: 40
    }

    var myDoughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: options
    });
}


function getListOfSprints() {
    $.ajax({
        type: 'GET',
        url: '/project/team/sprints/list',
        data: {
            projectId: projectId,
            teamId: teamId
        },
        success: function (data) {
            let sprintsObj = {};

            for (let i = 0; i < data.sprintsList.length; i++) {
                let sprint = data.sprintsList[i];
                sprintsObj[`${sprint.name}`] = null;
                sprintIdsObj[`${sprint.name}`] = sprint._id;
            }
            $(sprintsAutocompleteId).autocomplete({
                data: sprintsObj,
                limit: 20,
                onAutocomplete: function (val) {
                    selectedSprint = sprintIdsObj[val];
                    // TODO loader
                    displayFilteredTeamData();
                },
                minLength: 0,
            });
            $(sprintsAutocompleteId).on('keyup', function () {
                selectedSprint = sprintIdsObj[$(sprintsAutocompleteId).val()];
                // TODO loader
                displayFilteredTeamData();
            });
        },
        error: function (data) {
            handle401And404(data);

            const jsonResponse = data.responseJSON;
            failSnackbar(getErrorMessageFromResponse(jsonResponse));
        }
    });
}
