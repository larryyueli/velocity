const loginForm = $('#login');
const errorField = $('#invalid');
const passwordField = $('#password');

loginForm.submit(function (evt) {
    evt.preventDefault();
    $.ajax({
        type: 'POST',
        url: '/login',
        data: loginForm.serialize(),
        success: function (data) {
            window.location.href = '/'; // TODO: add a link to the correct path
        },
        error: function (data) {
            const jsonResponse = data.responseJSON;
            errorField.html(getErrorPill(jsonResponse));
        },
        complete: function (data) {
            passwordField.val('').focus();
        }
    });
});
