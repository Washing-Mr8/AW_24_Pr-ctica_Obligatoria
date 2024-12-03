"use strict"
$(document).ready(function () {
    let formName = $('#editName');
    let formCorreo = $('#editEmail');
    let formPhone = $('#editPhone');
    let formRol = $('#rol');


    let errorName = $('#name-error');
    let errorPhone = $('#phone-error');
    let errorCorreo = $('#email-error');

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


    $('#editButton').on('click', function (event) {
        event.preventDefault(); // Evita el envío tradicional del formulario

        const name =  formName.val().trim();
        const correo = formCorreo.val().trim();
        const phone = formPhone.val().trim();
        const facultad =  $('#facultad').val();
        const rol = formRol.val().trim();

        const data = {
            editNombre: name,
            editCorreo: correo,
            editTelefono: phone,
            editFacultad: facultad};

        //comprobacion de inyeccion sql
        if (checkForSQL(name) ||checkForSQL(correo) ||checkForSQL(phone) || checkForSQL(rol)) {
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
            url: '/user/editarPerfil',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (response) {
                showAlert(response.message, 'success', alertContainer);
                //timeout para que le de tiempo a ver el modal
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            },
            error: function (xhr) {
                const errorMessage = xhr.responseJSON?.message || 'Error al registrar el usuario.';
                console.log(errorMessage);
                showAlert(errorMessage, 'danger', alertContainer);
            }
        });
    });




    formName.on('input',function(){
        const name = $(this).val().trim();

        if(!name){
            errorName.text('No puedes dejar el nombre vacío.').removeClass('success-message').addClass('error-message');
        }
        else{
            errorName.text('Nombre válido.').removeClass('error-message').addClass('success-message');
        }

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

    formPhone.on('input', function () {
        const phone = $(this).val().trim();
        const phoneRegex = /^\+\d{1,3}\s\d{3}\s\d{3}\s\d{3}$/;

        if (!phone) {
            errorPhone.text('El número de teléfono es opcional.').removeClass('error-message').addClass('success-message');
        } else if (!phoneRegex.test(phone)) {
            errorPhone.text('El número de teléfono debe tener el formato +34 123 456 789.').removeClass('success-message').addClass('error-message');
        } else {
            errorPhone.text('Número de teléfono válido.').removeClass('error-message').addClass('success-message');
        }
    });

});
