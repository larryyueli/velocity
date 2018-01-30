const userAddform = $('#userAddform');

$(function () {
    $('select').material_select();
});

userAddform.submit(function (evt) {
    evt.preventDefault();
    alert(JSON.stringify(userAddform.serialize())+'  '+JSON.stringify($('#userType').val()));
    return;
    $.ajax({
        type: 'POST',
        url: '/login',
        data: userAddform.serialize(),
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