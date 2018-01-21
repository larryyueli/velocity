const loginForm = $('#loginForm');
const errorField = $('#loginForm_invalid');
const passwordField = $('#loginForm_password');

loginForm.submit(function (evt) {
    evt.preventDefault();
    $.ajax({
        type: 'POST',
        url: '/login',
        data: loginForm.serialize(),
        success: function (data) {
            window.location.href = '/';
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
