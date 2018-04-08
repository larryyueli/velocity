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

$(function () {
    queryScrumStatistics();
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
          displayScrumCharts(data);
      },
      error: function (data) {
          alert('error');
      }
    });
}

function displayScrumCharts(data) {
    const currentUserObject = data['sprints'].find(sprint => sprint['sprintStatus'] === 2)['members'].find(user => user['username'] === meObject['username']);
    const currentUserStates = currentUserObject['states'];
    const currentUserPoints = currentUserObject['points'];
    displayUserCards(currentUserStates, currentUserPoints);
    displayUserPieDivision(currentUserStates, currentUserPoints);
}

function displayUserCards(currentUserStates, currentUserPoints) {
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
}

function displayUserPieDivision(currentUserStates, currentUserPoints) {
    var ctx = document.getElementById("myChart").getContext('2d');
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
