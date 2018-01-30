const userAddform = $('#userAddform');
const fname = $('#fname');
const lname = $('#lname');
const username = $('#username');
const passwword = $('#passwword');
const email = $('#email');
const userType = $('#userType');

$(function () {
    $('select').material_select();
});

userAddform.submit(function (evt) {
    evt.preventDefault();
    $.ajax({
        type: 'POST',
        url: '/users/create',
        data: {
            fname: fname.val(),
            lname: lname.val(),
            username: username.val(),
            password: passwword.val(),
            email: email.val(),
            type: userType.val()
        },
        success: function (data) {
            //window.location.href = '/';
        },
        error: function (data) {
            if (data['status'] === 401) {
                window.location.href = '/';
            } else if (data['status'] === 404) {
                window.location.href = '/pageNotFound';
            }

            const jsonResponse = data.responseJSON;
            errorField.html(getErrorPill(jsonResponse));
        }
    });
});