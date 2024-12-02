"use strict"
$(document).ready(function () {
    document.getElementById('mostrarLoginPassword').addEventListener('click', function () {
        const passwordInput = document.getElementById('loginPassword');
        const toggleBtn = document.getElementById('mostrarLoginPassword');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.textContent = 'Ocultar';
        } else {
            passwordInput.type = 'password';
            toggleBtn.textContent = 'Mostrar';
        }
    });

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


    $('.form-signin').on('submit', function (event) {
        event.preventDefault();
        console.log('En proceso de Login');
        const loginEmail = $('#loginEmail').val().trim();
        const loginPassword = $('#loginPassword').val().trim();

        if (!loginEmail || !loginPassword) {
            showAlert('Por favor, completa todos los campos.', 'danger', alertContainer);
            return;
        }

        if (checkForSQL(loginEmail) || checkForSQL(loginPassword)) {
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
            url: '/login',
            method: 'POST',
            data: { loginEmail, loginPassword },
            success: function (response) {
                if (response.success) {
                    showAlert(response.message, 'success', alertContainer);

                    // Redirigir tras un breve retraso
                    setTimeout(() => {
                        window.location.href = '/user';
                    }, 2000);
                } else {
                    showAlert(response.message, 'danger', alertContainer);
                }
            },
            error: function (xhr, status, error) {
                console.log(error);
                showAlert("Error al iniciar sesión", 'danger', alertContainer);
            }
        });
    });

});
