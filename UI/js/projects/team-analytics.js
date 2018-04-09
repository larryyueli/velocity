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
const userTicketDivisionChartId = 'userTicketDivisionChart';

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
const teamTicketDivisionChartId = 'teamTicketDivisionChart';

var globalData = null;
var sprintIdsObj = {};
var selectedSprint = null;

const sprintsAutocompleteId = '#sprintsAutocomplete';

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

        data = {
            sprints: [
                {
                    sprintId: "s1id",
                    sprintName: "Sprint 1",
                    sprintStatus:2,
                    history: [
                        {
                            date: new Date('December 17, 2017'),
                            members: [
                                {
                                    fname: 'student0',
                                    lname: '0',
                                    username: 'student0',
                                    states: {0:1, 1:1, 2:0, 3:2, 4:0, 5:0},
                                    points: {0:1, 1:4, 2:0, 3:5, 4:0, 5:0},
                                    _id: 1
                                },
                                {
                                    fname: 'student1',
                                    lname: '1',
                                    username: 'student1',
                                    states: {0:1, 1:2, 2:1, 3:2, 4:0, 5:4},
                                    points: {0:1, 1:4, 2:1, 3:5, 4:0, 5:0},
                                    _id: 1
                                },
                                {
                                    fname: 'student2',
                                    lname: '2',
                                    username: 'student2',
                                    states: {0:1, 1:1, 2:0, 3:2, 4:2, 5:0},
                                    points: {0:1, 1:45, 2:0, 3:5, 4:0, 5:0},
                                    _id: 1
                                }
                            ]
                        },
                        {
                            date: new Date('December 18, 2017'),
                            members: [
                                {
                                    fname: 'student0',
                                    lname: '0',
                                    username: 'student0',
                                    states: {0:1, 1:1, 2:0, 3:2, 4:0, 5:0},
                                    points: {0:1, 1:4, 2:0, 3:5, 4:0, 5:0},
                                    _id: 1
                                },
                                {
                                    fname: 'student1',
                                    lname: '1',
                                    username: 'student1',
                                    states: {0:1, 1:2, 2:1, 3:2, 4:0, 5:4},
                                    points: {0:1, 1:4, 2:1, 3:5, 4:0, 5:0},
                                    _id: 1
                                },
                                {
                                    fname: 'student2',
                                    lname: '2',
                                    username: 'student2',
                                    states: {0:1, 1:1, 2:0, 3:2, 4:2, 5:0},
                                    points: {0:1, 1:45, 2:0, 3:5, 4:0, 5:0},
                                    _id: 1
                                }
                            ]
                        },
                        {
                            date: new Date('December 19, 2017'),
                            members: [
                                {
                                    fname: 'student0',
                                    lname: '0',
                                    username: 'student0',
                                    states: {0:2, 1:1, 2:0, 3:2, 4:0, 5:0},
                                    points: {0:1, 1:4, 2:0, 3:5, 4:0, 5:0},
                                    _id: 1
                                },
                                {
                                    fname: 'student1',
                                    lname: '1',
                                    username: 'student1',
                                    states: {0:1, 1:2, 2:1, 3:2, 4:0, 5:4},
                                    points: {0:1, 1:4, 2:1, 3:5, 4:0, 5:0},
                                    _id: 1
                                },
                                {
                                    fname: 'student2',
                                    lname: '2',
                                    username: 'student2',
                                    states: {0:1, 1:1, 2:0, 3:2, 4:2, 5:0},
                                    points: {0:1, 1:45, 2:0, 3:5, 4:0, 5:0},
                                    _id: 1
                                }
                            ]
                        }
                    ]
                }
            ]
        };  

        const currentSprint = data['sprints'].find(sprint => sprint['sprintStatus'] === 2);
        if (currentSprint) {
            $(sprintsAutocompleteId).val(currentSprint['sprintName']);
            selectedSprint = currentSprint['sprintId'];
            $(sprintsAutocompleteId).parent().find('label').addClass('active');
        }
        globalData = data;
        getListOfSprints();
        displayScrumCharts(data);
      },
      error: function (data) {
          alert('error');
      }
    });
}

function displayScrumCharts(data) {
    const currentUserObject = data['sprints'].find(sprint => sprint['sprintStatus'] === 2)['history'].reduce((prev, current) => {
        return (prev.date > current.date) ? prev : current;
    })['members'].find(user => user['username'] === meObject['username']);

    const currentUserStates = currentUserObject ? currentUserObject['states'] : null;
    const currentUserPoints = currentUserObject ? currentUserObject['points'] : null;

    displayUserCards(currentUserStates, currentUserPoints);
    displayUserPieDivision(currentUserStates, currentUserPoints);
    displayUserDateDivision();

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

function displayUserDateDivision() {
    var ctx = document.getElementById(userTicketDivisionChartId).getContext('2d');
    var dates = [];

    backgroundColor = [
        $('.gradient-todo-back').css('background').match(/rgba\(.*?\)/g)[0],
        $('.gradient-in-progress-back').css('background').match(/rgba\(.*?\)/g)[0],
        $('.gradient-code-review-back').css('background').match(/rgba\(.*?\)/g)[0],
        $('.gradient-ready-for-test-back').css('background').match(/rgba\(.*?\)/g)[0],
        $('.gradient-in-test-back').css('background').match(/rgba\(.*?\)/g)[0],
        $('.gradient-done-back').css('background').match(/rgba\(.*?\)/g)[0]
    ];
    borderColor = [
        $('.gradient-todo').css('background').match(/rgb\(.*?\)/g)[1],
        $('.gradient-in-progress').css('background').match(/rgb\(.*?\)/g)[1],
        $('.gradient-code-review').css('background').match(/rgb\(.*?\)/g)[1],
        $('.gradient-ready-for-test').css('background').match(/rgb\(.*?\)/g)[1],
        $('.gradient-in-test').css('background').match(/rgb\(.*?\)/g)[1],
        $('.gradient-done').css('background').match(/rgb\(.*?\)/g)[1]
    ];

    var allData = {};

    globalData['sprints'].find(sprint => sprint['sprintStatus'] === 2)['history'].forEach(sprint => dates.push(sprint['date'].toDateString()));
    globalData['sprints'].find(sprint => sprint['sprintStatus'] === 2)['history'].forEach(sprint => {
        const states = sprint['members'].find(user => user['username'] === meObject['username'])['states'];
        for (var item in states) {
            allData[item] ? allData[item].push(states[item]) : allData[item] = [states[item]];
        }
    });

    data = {
        datasets: [],
        labels: dates
    };

    for (var item in allData) {
        data['datasets'].push({
            label: translate(`state${item}`),
            data: allData[item],
            backgroundColor: backgroundColor[item],
            borderColor: borderColor[item],
            pointBorderColor: borderColor[item],
            borderWidth: 4,
            pointHoverBackgroundColor: 'white',
            pointHoverBorderColor: borderColor[item],
            pointRadius: 4,
        });
    }
    options = {};
    
    var chart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });   
}

function displayFilteredTeamData() {
    //TODO: explain why you need a sprint
    var dummyObject = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0};
    var currentTeamStates = null;
    var currentTeamPoints = null;

    var dates = [];
    var allData = {};

    if (selectedSprint && sprintFilterUser) {
        const currentTeamObject = globalData['sprints'].find(sprint => sprint['sprintId'] === selectedSprint)['history'].reduce((prev, current) => {
            return (prev.date > current.date) ? prev : current;
        })['members'].find(user => user['username'] === sprintFilterUser);
        currentTeamStates = currentTeamObject ? currentTeamObject['states'] : null;
        currentTeamPoints = currentTeamObject ? currentTeamObject['points'] : null;

        globalData['sprints'].find(sprint => sprint['sprintId'] === selectedSprint)['history'].forEach(sprint => dates.push(sprint['date'].toDateString()));
        globalData['sprints'].find(sprint => sprint['sprintId'] === selectedSprint)['history'].forEach(sprint => {
            const states = sprint['members'].find(user => user['username'] === sprintFilterUser)['states'];
            for (var item in states) {
                allData[item] ? allData[item].push(states[item]) : allData[item] = [states[item]];
            }
        });
    } else if (selectedSprint && $(sprintFilterUserAutocompleteId).val().trim() === '') {
        const tempSprint = globalData['sprints'].find(sprint => sprint['sprintId'] === selectedSprint)['history'].reduce((prev, current) => {
            return (prev.date > current.date) ? prev : current;
        })['members'];
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

        globalData['sprints'].find(sprint => sprint['sprintId'] === selectedSprint)['history'].forEach(sprint => dates.push(sprint['date'].toDateString()));

        var tempData = {};    
        globalData['sprints'].find(sprint => sprint['sprintId'] === selectedSprint)['history'].forEach(sprint => {
            sprint['members'].forEach(user => {
                for (var item in user['states']) {
                    tempData[item] ? tempData[item] +=user['states'][item] : tempData[item] = user['states'][item];
                }
            })
    
            for (var item in tempData) {
                allData[item] ? allData[item].push(tempData[item]) : allData[item] = [tempData[item]];	
            }
    
            tempData = {}
        });
    }

    displayteamCards(currentTeamStates, currentTeamPoints);
    displayteamPieDivision(currentTeamStates, currentTeamPoints);

    displayTeamDateDivision(allData, dates);

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

function displayTeamDateDivision(allData, dates) {
    var ctx = document.getElementById(teamTicketDivisionChartId).getContext('2d');

    backgroundColor = [
        $('.gradient-todo-back').css('background').match(/rgba\(.*?\)/g)[0],
        $('.gradient-in-progress-back').css('background').match(/rgba\(.*?\)/g)[0],
        $('.gradient-code-review-back').css('background').match(/rgba\(.*?\)/g)[0],
        $('.gradient-ready-for-test-back').css('background').match(/rgba\(.*?\)/g)[0],
        $('.gradient-in-test-back').css('background').match(/rgba\(.*?\)/g)[0],
        $('.gradient-done-back').css('background').match(/rgba\(.*?\)/g)[0]
    ];
    borderColor = [
        $('.gradient-todo').css('background').match(/rgb\(.*?\)/g)[1],
        $('.gradient-in-progress').css('background').match(/rgb\(.*?\)/g)[1],
        $('.gradient-code-review').css('background').match(/rgb\(.*?\)/g)[1],
        $('.gradient-ready-for-test').css('background').match(/rgb\(.*?\)/g)[1],
        $('.gradient-in-test').css('background').match(/rgb\(.*?\)/g)[1],
        $('.gradient-done').css('background').match(/rgb\(.*?\)/g)[1]
    ];

    data = {
        datasets: [],
        labels: dates
    };

    for (var item in allData) {
        data['datasets'].push({
            label: translate(`state${item}`),
            data: allData[item],
            backgroundColor: backgroundColor[item],
            borderColor: borderColor[item],
            pointBorderColor: borderColor[item],
            borderWidth: 4,
            pointHoverBackgroundColor: 'white',
            pointHoverBorderColor: borderColor[item],
            pointRadius: 4,
        });
    }
    options = {};
    
    var chart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });   
}

function getListOfSprints() {
    let sprintsObj = {};

    globalData['sprints'].forEach(sprint => {
        sprintsObj[`${sprint['sprintName']}`] = null;
        sprintIdsObj[`${sprint['sprintName']}`] = sprint['sprintId'];
    });

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
}
