"use strict"
$(document).ready(function () {
    let formCorreo = $('#resetEmail');
    let formPassword = $('#resetPassword');

    let errorCorreo = $('#email-error');
    let errorPassword = $('#password-error');

    const alertContainer = '#createdAlert';

    // Función para mostrar alertas dinámicas
    function showAlert(message, type, container) {
        const alertHtml = `<div class="alert alert-${type} mt-3" role="alert">${message}</div>`;
        $(container).append(alertHtml);

        // Eliminar alerta automáticamente después de 3 segundos
        setTimeout(() => {
            $(container).find('.alert').first().remove();
        }, 3000);
    }

    function checkForSQL(inputString) {
        const sqlInjectionRegex = /\b(INSERT|DELETE|DROP|UPDATE)\b/i;
        return sqlInjectionRegex.test(inputString);
    }


    $('#resetButton').on('click', function (event) {
        event.preventDefault(); // Evita el envío tradicional del formulario

        const correo = formCorreo.val().trim();
        const password = formPassword.val().trim();


        const data = {
            correo: correo,
            newPassword: password};

        //comprobacion de inyeccion sql
        if (checkForSQL(correo) ||checkForSQL(password)) {
            $.ajax({
                url: '/user/ban',
                method: 'POST',
                success: function (response) {
                    showAlert(response.message, 'danger', alertContainer);

                    // Redirigir tras un breve retraso
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);

                },
                error: function (xhr, status, error) {
                    console.log(error);
                    showAlert("Error al banear la IP", 'danger', alertContainer);
                },
            });
            return;
        }

        $.ajax({
            url: '/user/resetPassword',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (response) {
                showAlert(response.message, 'success', alertContainer);
                //timeout para que le de tiempo a ver el modal
                setTimeout(() => {
                    window.location.href = '/user/editarPerfil';
                }, 2000);
            },
            error: function (xhr) {
                const errorMessage = xhr.responseJSON?.message || 'Error al cambiar la contraseña.';
                console.log(errorMessage);
                showAlert(errorMessage, 'danger', alertContainer);
            }
        });
    });


    formCorreo.on('input', function () {
        const email = $(this).val().trim();
        const emailRegex = /^[^\s@]+@ucm\.es$/;

        if (!email) {
            errorCorreo.text('El correo electrónico es obligatorio.').removeClass('success-message').addClass('error-message');
        } else if (!emailRegex.test(email)) {
            errorCorreo.text('El correo debe ser un correo institucional con el dominio @ucm.es.').removeClass('success-message').addClass('error-message');
        } else {
            errorCorreo.text('Correo válido.').removeClass('error-message').addClass('success-message');
        }
    });

    formPassword.on('input', function () {
        var password = $(this).val();
        var uppercaseRegex = /[A-Z]/;
        var lowercaseRegex = /[a-z]/;
        var numberRegex = /[0-9]/;

        // Verificar si el campo de nombre de usuario está vacío
        if (!password) {
            // Si está vacío, establecer un mensaje predeterminado o realizar alguna acción necesaria
            errorPassword.text('La contraseña es obligatoria.').removeClass('success-message').addClass('error-message');
            return;
        }
        // Verificar que la contraseña tenga al menos 6 caracteres
        if (password.length < 8) {
            errorPassword.text('La contraseña es demasiado corta.').removeClass('success-message').addClass('error-message');
            return;
        }
        //si contiene mayusculas dentro de los caracteres permitidos
        if (!uppercaseRegex.test(password)) {
            errorPassword.text('La contraseña debe contener al menos una letra mayúscula. ').removeClass('success-message').addClass('error-message');
            return;
        }
        //si contiene minusculas dentro de los caracteres permitidos
        if (!lowercaseRegex.test(password)) {
            errorPassword.text('La contraseña debe contener al menos una, una minúscula').removeClass('success-message').addClass('error-message');
            return;
        }
        //si contiene numeros dentro de los caracteres permitidos
        if (!numberRegex.test(password)) {
            errorPassword.text('La contraseña debe contener al menos un número.').removeClass('success-message').addClass('error-message');
            return;
        }
        // Si todas las validaciones pasan, eliminar el mensaje de error
        errorPassword.text('Contraseña correcta').removeClass('error-message').addClass('success-message');
    });



    document.getElementById('mostrarResetPassword').addEventListener('click', function () {
        const passwordInput = document.getElementById('resetPassword');
        const toggleBtn = document.getElementById('mostrarResetPassword');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.textContent = 'Ocultar';
        } else {
            passwordInput.type = 'password';
            toggleBtn.textContent = 'Mostrar';
        }
    });

   
});
