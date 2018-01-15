const loginForm = $('#login');
const errorField = $('#invalid');
const passwordField = $('#password');

loginForm.submit(function(evt) {
    evt.preventDefault();
    $.ajax({
        type: 'POST',
        url: '/login',
        data: loginForm.serialize(),
        success: function(data) {
            window.location.href = '/'; // TODO: add a link to the correct path
        },
        error: function(data) {
            var jsonResponse = data.responseJSON;
            errorField.html(`<div class="chip white-text red darken-4">${getErrorMessageFromResponse(jsonResponse)}<i class="close material-icons">close</i></div>`);
        },
        complete: function(data) {
            passwordField.val('').focus();
        }
    });
});
