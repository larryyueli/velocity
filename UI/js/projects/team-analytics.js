

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
          // alert('asdf');
      },
      error: function (data) {
          alert('error');
      }
    });
}
