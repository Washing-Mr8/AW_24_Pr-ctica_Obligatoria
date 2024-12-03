"use strict"
$(document).ready(function () {
    let formName = $('#editName');
    let formCorreo = $('#editEmail');
    let formPhone = $('#editPhone');
    let formRol = $('#rol');


    let errorName = $('#name-error');
    let errorPhone = $('#phone-error');

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
            registerName: name,
            registerEmail: correo,
            registerPassword: password,
            registerPhone: phone,
            facultad: facultad,
            role: rol
        };

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
                    window.location.href = '/user/login'; // Redirigir al login
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
            errorName.text('El nombre es obligatorio.').removeClass('success-message').addClass('error-message');
            validName = false;
        }
        else{
            errorName.text('Nombre válido.').removeClass('error-message').addClass('success-message');
            validName = true;
        }

    });


    formCorreo.on('input', function () {
        const email = $(this).val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            errorCorreo.text('El correo electrónico es obligatorio.').removeClass('success-message').addClass('error-message');
            validCorreo = false;
        } else if (!emailRegex.test(email)) {
            errorCorreo.text('El correo electrónico no tiene un formato válido.').removeClass('success-message').addClass('error-message');
            validCorreo = false;
        } else {
            errorCorreo.text('Correo válido.').removeClass('error-message').addClass('success-message');
            validCorreo = true;
        }

        validateForm(); // Actualizar el estado del botón de envío
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
            validPassword = false;
            return;
        }
        // Verificar que la contraseña tenga al menos 6 caracteres
        if (password.length < 8) {
            errorPassword.text('La contraseña es demasiado corta.').removeClass('success-message').addClass('error-message');
            validPassword = false;
            return;
        }
        //si contiene mayusculas dentro de los caracteres permitidos
        if (!uppercaseRegex.test(password)) {
            errorPassword.text('La contraseña debe contener al menos una letra mayúscula. ').removeClass('success-message').addClass('error-message');
            validPassword = false;
            return;
        }
        //si contiene minusculas dentro de los caracteres permitidos
        if (!lowercaseRegex.test(password)) {
            errorPassword.text('La contraseña debe contener al menos una, una minúscula').removeClass('success-message').addClass('error-message');
            validPassword = false;
            return;
        }
        //si contiene numeros dentro de los caracteres permitidos
        if (!numberRegex.test(password)) {
            errorPassword.text('La contraseña debe contener al menos un número.').removeClass('success-message').addClass('error-message');
            validPassword = false;
            return;
        }
        // Si todas las validaciones pasan, eliminar el mensaje de error
        errorPassword.text('Contraseña correcta').removeClass('error-message').addClass('success-message');
        validPassword = true;

        validateForm();
    });



    document.getElementById('mostrarRegisterPassword').addEventListener('click', function () {
        const passwordInput = document.getElementById('registerPassword');
        const toggleBtn = document.getElementById('mostrarRegisterPassword');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.textContent = 'Ocultar';
        } else {
            passwordInput.type = 'password';
            toggleBtn.textContent = 'Mostrar';
        }
    });

    formPhone.on('input', function () {
        const phone = $(this).val().trim();
        const phoneRegex = /^\+\d{1,3}\s\d{3}\s\d{3}\s\d{3}$/;

        if (!phone) {
            errorPhone.text('El número de teléfono es opcional.').removeClass('error-message').addClass('success-message');
            validPhone = true;
        } else if (!phoneRegex.test(phone)) {
            errorPhone.text('El número de teléfono debe tener el formato +34 123 456 789.').removeClass('success-message').addClass('error-message');
            validPhone = false;
        } else {
            errorPhone.text('Número de teléfono válido.').removeClass('error-message').addClass('success-message');
            validPhone = true;
        }

        validateForm(); // Actualizar el estado del botón de envío
    });

    // Función para validar los campos antes de enviar el formulario
    $('#registerButton').click(function (event) {

        $('#form-signin').submit();
    });

});
