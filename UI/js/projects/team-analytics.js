const yourDataId = '#yourData';
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

const teamDataId = '#teamData';
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
const teamBurndownChartId = 'teamBurndownChart';
const teamContentId = '#teamContent';
const teamContentMessageId = '#teamContentMessage';

const releaseDataId = '#releaseData';
const todoReleasePointsId = '#todoReleasePoints';
const todoReleaseTicketsId = '#todoReleaseTickets';
const inProgressReleaseTicketsId = '#inProgressReleaseTickets';
const inProgressReleasePointsId = '#inProgressReleasePoints';
const codeReviewReleaseTicketsId = '#codeReviewReleaseTickets';
const codeReviewReleasePointsId = '#codeReviewReleasePoints';
const readyForTestReleaseTicketsId = '#readyForTestReleaseTickets';
const ReadyForTestReleasePointsId = '#ReadyForTestReleasePoints';
const inTestReleaseTicketsId = '#inTestReleaseTickets';
const inTestReleasePointsId = '#inTestReleasePoints';
const doneReleaseTicketsId = '#doneReleaseTickets';
const doneReleasePointsId = '#doneReleasePoints';
const releaseTicketDivisionId = 'releaseTicketDivision';
const releaseTicketDivisionChartId = 'releaseTicketDivisionChart';
const releaseCumulativeChartId = 'releaseCumulativeChart';
const releaseContentId = '#releaseContent';
const releaseContentMessageId = '#releaseContentMessage';

var globalData = null;
var sprintIdsObj = {};
var selectedSprint = null;
var releaseIdsObj = {};
var selectedRelease = null;

var displayYou = true;
var displayTeam = true;
var displayReleases = true;

const sprintsAutocompleteId = '#sprintsAutocomplete';
const releasesAutocompleteId = '#releasesAutocomplete';

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
            releases:[  
                { releaseId:"84d190e0-3ea6-11e8-8af8-5592838ee8cb", releaseName:"Release numero 0", releaseStatus:1, "history":[ { date:new Date("2018-04-12 07:09:14 PM"), members:[ { _id:"7f4f8051-3ea6-11e8-8af8-5592838ee8cb", fname:"student0", lname:0, username:"student0", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"80372130-3ea6-11e8-8af8-5592838ee8cb", fname:"student1", lname:1, username:"student1", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"80372131-3ea6-11e8-8af8-5592838ee8cb", fname:"student2", lname:2, username:"student2", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"80374840-3ea6-11e8-8af8-5592838ee8cb", fname:"student3", lname:3, username:"student3", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"8036fa20-3ea6-11e8-8af8-5592838ee8cb", fname:"student4", lname:4, username:"student4", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } } ] }, { date: new Date("2018-04-12 07:09:41 PM"), members:[ { _id:"7f4f8051-3ea6-11e8-8af8-5592838ee8cb", fname:"student0", lname:0, username:"student0", states:{ 0:0, 1:0, 2:1, 3:2, 4:1, 5:0 }, points:{ 0:0, 1:0, 2:1, 3:2, 4:1, 5:0 } }, { _id:"80372130-3ea6-11e8-8af8-5592838ee8cb", fname:"student1", lname:1, username:"student1", states:{ 0:0, 1:0, 2:0, 3:1, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:1, 4:0, 5:0 } }, { _id:"80372131-3ea6-11e8-8af8-5592838ee8cb", fname:"student2", lname:2, username:"student2", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"80374840-3ea6-11e8-8af8-5592838ee8cb", fname:"student3", lname:3, username:"student3", states:{ 0:0, 1:1, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:1, 2:0, 3:0, 4:0, 5:0 } }, { _id:"8036fa20-3ea6-11e8-8af8-5592838ee8cb", fname:"student4", lname:4, username:"student4", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } } ] }, { date: new Date("2018-04-12 07:57:28 PM"), members:[ { _id:"7f4f8051-3ea6-11e8-8af8-5592838ee8cb", fname:"student0", lname:0, username:"student0", states:{ 0:0, 1:0, 2:1, 3:2, 4:1, 5:0 }, points:{ 0:0, 1:0, 2:1, 3:2, 4:1, 5:0 } }, { _id:"80372130-3ea6-11e8-8af8-5592838ee8cb", fname:"student1", lname:1, username:"student1", states:{ 0:0, 1:0, 2:0, 3:1, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:1, 4:0, 5:0 } }, { _id:"80372131-3ea6-11e8-8af8-5592838ee8cb", fname:"student2", lname:2, username:"student2", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"80374840-3ea6-11e8-8af8-5592838ee8cb", fname:"student3", lname:3, username:"student3", states:{ 0:0, 1:1, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:1, 2:0, 3:0, 4:0, 5:0 } }, { _id:"8036fa20-3ea6-11e8-8af8-5592838ee8cb", fname:"student4", lname:4, username:"student4", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } } ] }, { date: new Date("2018-04-12 08:30:06 PM"), members:[ { _id:"7f4f8051-3ea6-11e8-8af8-5592838ee8cb", fname:"student0", lname:0, username:"student0", states:{ 0:0, 1:0, 2:1, 3:2, 4:1, 5:0 }, points:{ 0:0, 1:0, 2:1, 3:2, 4:1, 5:0 } }, { _id:"80372130-3ea6-11e8-8af8-5592838ee8cb", fname:"student1", lname:1, username:"student1", states:{ 0:0, 1:0, 2:0, 3:1, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:1, 4:0, 5:0 } }, { _id:"80372131-3ea6-11e8-8af8-5592838ee8cb", fname:"student2", lname:2, username:"student2", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"80374840-3ea6-11e8-8af8-5592838ee8cb", fname:"student3", lname:3, username:"student3", states:{ 0:0, 1:1, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:1, 2:0, 3:0, 4:0, 5:0 } }, { _id:"8036fa20-3ea6-11e8-8af8-5592838ee8cb", fname:"student4", lname:4, username:"student4", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } } ] }, { date: new Date("2018-04-12 08:31:11 PM"), members:[ { _id:"7f4f8051-3ea6-11e8-8af8-5592838ee8cb", fname:"student0", lname:0, username:"student0", states:{ 0:0, 1:0, 2:1, 3:2, 4:1, 5:0 }, points:{ 0:0, 1:0, 2:1, 3:2, 4:1, 5:0 } }, { _id:"80372130-3ea6-11e8-8af8-5592838ee8cb", fname:"student1", lname:1, username:"student1", states:{ 0:0, 1:0, 2:0, 3:1, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:1, 4:0, 5:0 } }, { _id:"80372131-3ea6-11e8-8af8-5592838ee8cb", fname:"student2", lname:2, username:"student2", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"80374840-3ea6-11e8-8af8-5592838ee8cb", fname:"student3", lname:3, username:"student3", states:{ 0:0, 1:1, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:1, 2:0, 3:0, 4:0, 5:0 } }, { _id:"8036fa20-3ea6-11e8-8af8-5592838ee8cb", fname:"student4", lname:4, username:"student4", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } } ] } ], cumulativeflowdiagram:[ [ { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, date: new Date("2018-04-12 07:09:14 PM") } ], [ { 0:0, 1:1, 2:1, 3:3, 4:1, 5:0, date: new Date("2018-04-12 07:09:41 PM") } ], [ { 0:0, 1:1, 2:1, 3:3, 4:1, 5:0, date: new Date("2018-04-12 07:57:28 PM") } ], [ { 0:0, 1:1, 2:1, 3:3, 4:1, 5:0, date: new Date("2018-04-12 08:30:06 PM") } ], [ { 0:0, 1:1, 2:1, 3:3, 4:1, 5:0, date: new Date("2018-04-12 08:31:11 PM") } ] ] }, { releaseId:"84d2a250-3ea6-11e8-8af8-5592838ee8cb", releaseName:"Release numero 1", releaseStatus:2, "history":[ { date: new Date("2018-04-12 07:09:14 PM"), members:[ { _id:"7f4f8051-3ea6-11e8-8af8-5592838ee8cb", fname:"student0", lname:0, username:"student0", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"80372130-3ea6-11e8-8af8-5592838ee8cb", fname:"student1", lname:1, username:"student1", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"80372131-3ea6-11e8-8af8-5592838ee8cb", fname:"student2", lname:2, username:"student2", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"80374840-3ea6-11e8-8af8-5592838ee8cb", fname:"student3", lname:3, username:"student3", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"8036fa20-3ea6-11e8-8af8-5592838ee8cb", fname:"student4", lname:4, username:"student4", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } } ] }, { date: new Date("2018-04-12 07:57:28 PM"), members:[ { _id:"7f4f8051-3ea6-11e8-8af8-5592838ee8cb", fname:"student0", lname:0, username:"student0", states:{ 0:1, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:1, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"80372130-3ea6-11e8-8af8-5592838ee8cb", fname:"student1", lname:1, username:"student1", states:{ 0:1, 1:2, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:1, 1:2, 2:0, 3:0, 4:0, 5:0 } }, { _id:"80372131-3ea6-11e8-8af8-5592838ee8cb", fname:"student2", lname:2, username:"student2", states:{ 0:0, 1:0, 2:0, 3:0, 4:2, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:2, 5:0 } }, { _id:"80374840-3ea6-11e8-8af8-5592838ee8cb", fname:"student3", lname:3, username:"student3", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"8036fa20-3ea6-11e8-8af8-5592838ee8cb", fname:"student4", lname:4, username:"student4", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } } ] }, { date: new Date("2018-04-12 08:30:06 PM"), members:[ { _id:"7f4f8051-3ea6-11e8-8af8-5592838ee8cb", fname:"student0", lname:0, username:"student0", states:{ 0:1, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:1, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"80372130-3ea6-11e8-8af8-5592838ee8cb", fname:"student1", lname:1, username:"student1", states:{ 0:1, 1:2, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:1, 1:2, 2:0, 3:0, 4:0, 5:0 } }, { _id:"80372131-3ea6-11e8-8af8-5592838ee8cb", fname:"student2", lname:2, username:"student2", states:{ 0:0, 1:0, 2:0, 3:0, 4:2, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:2, 5:0 } }, { _id:"80374840-3ea6-11e8-8af8-5592838ee8cb", fname:"student3", lname:3, username:"student3", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"8036fa20-3ea6-11e8-8af8-5592838ee8cb", fname:"student4", lname:4, username:"student4", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } } ] }, { date: new Date("2018-04-12 08:31:11 PM"), members:[ { _id:"7f4f8051-3ea6-11e8-8af8-5592838ee8cb", fname:"student0", lname:0, username:"student0", states:{ 0:1, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:1, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"80372130-3ea6-11e8-8af8-5592838ee8cb", fname:"student1", lname:1, username:"student1", states:{ 0:1, 1:2, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:1, 1:2, 2:0, 3:0, 4:0, 5:0 } }, { _id:"80372131-3ea6-11e8-8af8-5592838ee8cb", fname:"student2", lname:2, username:"student2", states:{ 0:0, 1:0, 2:0, 3:0, 4:2, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:2, 5:0 } }, { _id:"80374840-3ea6-11e8-8af8-5592838ee8cb", fname:"student3", lname:3, username:"student3", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } }, { _id:"8036fa20-3ea6-11e8-8af8-5592838ee8cb", fname:"student4", lname:4, username:"student4", states:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }, points:{ 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 } } ] } ], cumulativeflowdiagram:[ [ { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, date: new Date("2018-04-12 07:09:14 PM") } ], [ { 0:2, 1:2, 2:0, 3:0, 4:2, 5:0, date: new Date("2018-04-12 07:57:28 PM") } ], [ { 0:2, 1:2, 2:0, 3:0, 4:2, 5:0, date: new Date("2018-04-12 08:30:06 PM") } ], [ { 0:2, 1:2, 2:0, 3:0, 4:2, 5:0, date: new Date("2018-04-12 08:31:11 PM") } ] ] }
             ],            sprints: [
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

        globalData = data;

        if (data['sprints'].length === 0) {
            displayTeam = false;
            displayYou = false;
        } else {
            $(teamDataId).removeClass('hidden');
            var currentSprint = data['sprints'].find(sprint => sprint['sprintStatus'] === 2);
            if (!currentSprint) {
                if (data['sprints'].length) {
                    currentSprint = data['sprints'][data['sprints'].length - 1];
                }
                displayYou = false;
            } else {
                $(yourDataId).removeClass('hidden');
            }
            if (currentSprint) {
                $(sprintsAutocompleteId).val(currentSprint['sprintName']);
                selectedSprint = currentSprint['sprintId'];
                $(sprintsAutocompleteId).parent().find('label').addClass('active');
            }

            getListOfSprints();
        }

        if (data['releases'].length === 0) {
            displayReleases = false;
        } else {
            $(releaseDataId).removeClass('hidden');
            var currentRelease = null;
            if (data['releases'].length) {
                currentRelease = data['releases'][data['releases'].length - 1];
            }
            if (currentRelease) {
                $(releasesAutocompleteId).val(currentRelease['releaseName']);
                selectedRelease = currentRelease['releaseId'];
                $(releasesAutocompleteId).parent().find('label').addClass('active');
            }

            getListOfReleases();
        }

        displayScrumCharts(data);
      },
      error: function (data) {
          alert('error');
      }
    });
}

function displayScrumCharts(data) {
    if (displayYou) {
        const currentUserObject = data['sprints'].find(sprint => sprint['sprintStatus'] === 2)['history'].reduce((prev, current) => {
            return (prev.date > current.date) ? prev : current;
        })['members'].find(user => user['username'] === meObject['username']);

        const currentUserStates = currentUserObject ? currentUserObject['states'] : null;
        const currentUserPoints = currentUserObject ? currentUserObject['points'] : null;

        displayUserCards(currentUserStates, currentUserPoints);
        displayUserPieDivision(currentUserStates, currentUserPoints);
        displayUserDateDivision();
    }

    if (displayTeam) {
        displayFilteredTeamData();
    }

    if (displayReleases) {
        displayFilteredReleaseData(true);
    }
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
    var showData = true;

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
    } else {
        showData = false;
    }

    if (showData) {
        $(teamContentId).removeClass('hidden');
        $(teamContentMessageId).addClass('hidden');
        var burndownData = [];
        for (var i = 0; i < dates.length; i++) {
            let tempStorage = 0;

            for (var item in allData) {
                tempStorage += allData[item][i];
            }

            burndownData.push(tempStorage);
        }
        displayteamCards(currentTeamStates, currentTeamPoints);
        displayteamPieDivision(currentTeamStates, currentTeamPoints);

        displayTeamDateDivision(allData, dates);
        displayTeamBurndown(burndownData, dates);
    } else {
        $(teamContentId).addClass('hidden');
        $(teamContentMessageId).removeClass('hidden');
    }

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
            pointBackgroundColor: borderColor[item],
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

function displayTeamBurndown(burndownData, dates) {
    var ctx = document.getElementById(teamBurndownChartId).getContext('2d');
    const color = $('.gradient-code-review').css('background').match(/rgb\(.*?\)/g)[1];

    data = {
        datasets: [
            {
                label: translate('TODO something about burndown'),
                data: burndownData,
                fill: false,
                borderColor: color,
                pointBorderColor: color,
                pointBackgroundColor: color,
                borderWidth: 4,
                pointHoverBackgroundColor: 'white',
                pointHoverBorderColor: color,
                pointRadius: 4,
            }
        ],
        labels: dates
    };

    options = {
        legend: {
            display: false
        },
        scales: {
            yAxes: [{
                display: true,
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    };

    var chart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });   
}

function displayFilteredReleaseData(didReleaseChange = false) {
    //TODO: explain why you need a sprint
    var dummyObject = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0};
    var currentReleaseStates = null;
    var currentReleasePoints = null;
    var currentReleaseStatesC = null;
    var currentReleasePointsC = null;
    var didntJustCalculate = true;
    var showData = true;

    var dates = [];
    var allData = {};
    var allDataC = {};

    if (selectedRelease && releaseFilterUser) {
        const currentReleaseObject = globalData['releases'].find(release => release['releaseId'] === selectedRelease)['history'].reduce((prev, current) => {
            return (prev.date > current.date) ? prev : current;
        })['members'].find(user => user['username'] === releaseFilterUser);
        currentReleaseStates = currentReleaseObject ? currentReleaseObject['states'] : null;
        currentReleasePoints = currentReleaseObject ? currentReleaseObject['points'] : null;

        globalData['releases'].find(release => release['releaseId'] === selectedRelease)['history'].forEach(release => dates.push(release['date'].toDateString()));
        globalData['releases'].find(release => release['releaseId'] === selectedRelease)['history'].forEach(release => {
            const states = release['members'].find(user => user['username'] === releaseFilterUser)['states'];
            for (var item in states) {
                allData[item] ? allData[item].push(states[item]) : allData[item] = [states[item]];
            }
        });
    } else if (selectedRelease && $(releaseFilterUserAutocompleteId).val().trim() === '') {
        didntJustCalculate = false;
        const tempRelease = globalData['releases'].find(release => release['releaseId'] === selectedRelease)['history'].reduce((prev, current) => {
            return (prev.date > current.date) ? prev : current;
        })['members'];
        var newPointsObject = Object.create( dummyObject );
        tempRelease.forEach(user => {
            for (var point in user['points']) {
                newPointsObject[point] += user['points'][point];
            }
        });
        var newStatsObject = Object.create( dummyObject );
        tempRelease.forEach(user => {
            for (var state in user['states']) {
                newStatsObject[state] += user['states'][state];
            }
        });
        currentReleaseStates = newStatsObject;
        currentReleasePoints = newPointsObject;

        globalData['releases'].find(release => release['releaseId'] === selectedRelease)['history'].forEach(release => dates.push(release['date'].toDateString()));

        var tempData = {};    
        globalData['releases'].find(release => release['releaseId'] === selectedRelease)['history'].forEach(release => {
            release['members'].forEach(user => {
                for (var item in user['states']) {
                    tempData[item] ? tempData[item] +=user['states'][item] : tempData[item] = user['states'][item];
                }
            })
    
            for (var item in tempData) {
                allData[item] ? allData[item].push(tempData[item]) : allData[item] = [tempData[item]];	
            }
    
            tempData = {};
        });
    } else {
        showData = false;
    }

    if (selectedRelease && didReleaseChange && didntJustCalculate) {
        const tempReleaseC = globalData['releases'].find(release => release['releaseId'] === selectedRelease)['history'].reduce((prev, current) => {
            return (prev.date > current.date) ? prev : current;
        })['members'];
        var newPointsObjectC = Object.create( dummyObject );
        tempReleaseC.forEach(user => {
            for (var point in user['points']) {
                newPointsObjectC[point] += user['points'][point];
            }
        });
        var newStatsObjectC = Object.create( dummyObject );
        tempReleaseC.forEach(user => {
            for (var state in user['states']) {
                newStatsObjectC[state] += user['states'][state];
            }
        });
        currentReleaseStatesC = newStatsObjectC;
        currentReleasePointsC = newPointsObjectC;

        var tempDataC = {};    
        globalData['releases'].find(release => release['releaseId'] === selectedRelease)['history'].forEach(release => {
            release['members'].forEach(user => {
                for (var item in user['states']) {
                    tempDataC[item] ? tempDataC[item] +=user['states'][item] : tempDataC[item] = user['states'][item];
                }
            })
    
            for (var item in tempDataC) {
                allDataC[item] ? allDataC[item].push(tempDataC[item]) : allDataC[item] = [tempDataC[item]];	
            }
    
            tempDataC = {};
        });
    } else if (!didntJustCalculate) {
        allDataC = allData;
    }

    if (showData) {
        $(releaseContentId).removeClass('hidden');
        $(releaseContentMessageId).addClass('hidden');
        var burndownData = [];
        for (var i = 0; i < dates.length; i++) {
            let tempStorage = 0;
    
            for (var item in allData) {
                tempStorage += allData[item][i];
            }
    
            burndownData.push(tempStorage);
        }
        displayReleaseCards(currentReleaseStates, currentReleasePoints);
        displayReleasePieDivision(currentReleaseStates, currentReleasePoints);
    
        displayReleaseDateDivision(allData, dates);
    
        if (didReleaseChange) {
            displayReleaseCumulative(allDataC, dates);
        }
    } else {
        $(releaseContentId).addClass('hidden');
        $(releaseContentMessageId).removeClass('hidden');
    }
    
}

function displayReleaseCards(currentReleaseStates, currentReleasePoints) {
    if (currentReleaseStates) {
        $(todoReleaseTicketsId).html(currentReleaseStates[0]);
        $(todoReleasePointsId).html(`${currentReleasePoints[0]} ${translate('points')}`);
        $(inProgressReleaseTickets).html(currentReleaseStates[1]);
        $(inProgressReleasePoints).html(`${currentReleasePoints[1]} ${translate('points')}`);
        $(codeReviewReleaseTickets).html(currentReleaseStates[2]);
        $(codeReviewReleasePoints).html(`${currentReleasePoints[2]} ${translate('points')}`);
        $(readyForTestReleaseTickets).html(currentReleaseStates[3]);
        $(ReadyForTestReleasePoints).html(`${currentReleasePoints[3]} ${translate('points')}`);
        $(inTestReleaseTickets).html(currentReleaseStates[4]);
        $(inTestReleasePoints).html(`${currentReleasePoints[4]} ${translate('points')}`);
        $(doneReleaseTickets).html(currentReleaseStates[5]);
        $(doneReleasePoints).html(`${currentReleasePoints[5]} ${translate('points')}`);
    } else {
        const filler = translate('na');

        $(todoReleaseTicketsId).html(filler);
        $(todoReleasePointsId).html(`${filler} ${translate('points')}`);
        $(inProgressReleaseTickets).html(filler);
        $(inProgressReleasePoints).html(`${filler} ${translate('points')}`);
        $(codeReviewReleaseTickets).html(filler);
        $(codeReviewReleasePoints).html(`${filler} ${translate('points')}`);
        $(readyForTestReleaseTickets).html(filler);
        $(ReadyForTestReleasePoints).html(`${filler} ${translate('points')}`);
        $(inTestReleaseTickets).html(filler);
        $(inTestReleasePoints).html(`${filler} ${translate('points')}`);
        $(doneReleaseTickets).html(filler);
        $(doneReleasePoints).html(`${filler} ${translate('points')}`);
    }
}

function displayReleasePieDivision(currentReleaseStates, currentReleasePoints) {
    //TODO: draw no data if null
    var ctx = document.getElementById(releaseTicketDivisionId).getContext('2d');
    var data = {
        datasets: [{
            data: Object.values(currentReleaseStates),
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
            data: Object.values(currentReleasePoints),
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

function displayReleaseDateDivision(allData, dates) {
    var ctx = document.getElementById(releaseTicketDivisionChartId).getContext('2d');

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
            pointBackgroundColor: borderColor[item],
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

function displayReleaseCumulative(allData, dates) {
    var ctx = document.getElementById(releaseCumulativeChartId).getContext('2d');

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
            pointBackgroundColor: borderColor[item],
            pointBorderColor: borderColor[item],
            borderWidth: 4,
            pointHoverBackgroundColor: 'white',
            pointHoverBorderColor: borderColor[item],
            pointRadius: 4,
        });
    }
    options = {
        scales: {
            yAxes: [{
                stacked: true,
            }],
            xAxes: [{
                display: false
            }]
        },
    };
    
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

function getListOfReleases() {
    let releasesObj = {};

    globalData['releases'].forEach(release => {
        releasesObj[`${release['releaseName']}`] = null;
        releaseIdsObj[`${release['releaseName']}`] = release['releaseId'];
    });

    $(releasesAutocompleteId).autocomplete({
        data: releasesObj,
        limit: 20,
        onAutocomplete: function (val) {
            selectedRelease = releaseIdsObj[val];
            // TODO loader
            displayFilteredReleaseData(true);
        },
        minLength: 0,
    });

    $(releasesAutocompleteId).on('keyup', function () {
        selectedRelease = releaseIdsObj[$(releasesAutocompleteId).val()];
        // TODO loader
        displayFilteredReleaseData(true);
    });
}
