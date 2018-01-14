
$('#login').submit(function(evt) {
    evt.preventDefault();
    $.ajax({
        type: 'POST',
        url: '/login',
        data: $('#login').serialize(),
        success: function(data) {
            window.location.href = '/'; // TODO: add a link to the correct path
        },
        error: function(data) {
            var jsonResponse = data.responseJSON;
            $('#invalid').html(`<div class="chip white-text red darken-4">${getErrorFromResponse(jsonResponse)}<i class="close material-icons">close</i></div>`);
        },
        complete: function(data) {
            $('#password').val('').focus();
        }
    });
});
