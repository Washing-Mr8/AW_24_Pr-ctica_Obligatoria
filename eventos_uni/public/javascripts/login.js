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

    $('#loginForm').on('submit', function (event) {
        event.preventDefault();
        console.log('En proceso de Login');
        const loginEmail = $('#loginEmail').val().trim();
        const loginPassword = $('#loginPassword').val().trim();

        if (!loginEmail || !loginPassword) {
            mostrarMensajeModal('Por favor, completa todos los campos.', false);
            return;
        }

        if (checkForSQL(title) || checkForSQL(location) || checkForSQL(description)) {
            $.ajax({
                url: '/user/ban',
                method: 'POST',
                success: function (response) {
                    mostrarMensajeModal(response.message, true);

                    // Redirigir tras un breve retraso
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);

                },
                error: function (xhr, status, error) {
                    console.log(error);
                    mostrarMensajeModal("Error al banear la IP", false);
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
                    mostrarMensajeModal(response.message, true);

                    // Redirigir tras un breve retraso
                    setTimeout(() => {
                        window.location.href = '/user';
                    }, 2000);
                } else {
                    mostrarMensajeModal(response.message, false);
                }
            },
            error: function (xhr, status, error) {
                console.log(error);
                mostrarMensajeModal("Error al iniciar sesión", false);
            }
        });
    });

    // Mostrar el modal con mensaje dinámico
    function mostrarMensajeModal(mensaje, exitoso) {
        const modalElement = new bootstrap.Modal(document.getElementById('mensajeModal'));
        const mensajeModalBody = $('#mensajeModalBody');

        // Cambiar contenido y estilo
        mensajeModalBody.html(`<p class="${exitoso ? 'texto-exito' : 'texto-error'}">${mensaje}</p>`);
        modalElement.show();
    }

    // Cerrar modal al hacer clic en el botón "OK"
    $('#cerrarMensajeModal').on('click', function () {
        $('#mensajeModal').modal('hide');
    });

    function checkForSQL(inputString) {
        const sqlInjectionRegex = /\b(INSERT|DELETE|DROP|UPDATE)\b/i;
        return sqlInjectionRegex.test(inputString);
    }

});
