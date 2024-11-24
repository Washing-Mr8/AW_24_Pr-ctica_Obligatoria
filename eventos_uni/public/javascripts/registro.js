"use strict"
$(document).ready(function () {
    let formName = $('#registerName');
    let formCorreo = $('#registerEmail');
    let formPassword = $('#registerPassword');
    let formPhone = $('#registerPhone');

    let errorName = $('#name-error');
    let errorCorreo = $('#email-error');
    let errorPassword = $('#password-error');
    let errorPhone = $('#phone-error');

    var validName = false;
    var validCorreo = false;
    var validPassword = false;
    var validPhone = false;


    // Función para validar los campos antes de enviar el formulario
    function validateForm() {
        const name = formName.val().trim();
        const correo = formCorreo.val().trim();
        const password = formPassword.val().trim();
        const phone = formPhone.val().trim();

        // Verificar si todos los campos tienen datos válidos
        const isValid = name !== '' && validName && correo !== '' && validCorreo && password !== '' && validPassword && phone !== '' && validPhone;

        // Habilitar o deshabilitar el botón de registro según el estado de los campos del formulario
        $('#registerButton').prop('disabled', !isValid);
    }

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

    // Verificar si hay un mensaje de error presente
    if ($('.error-message').length > 0) {
        // Mostrar una alerta con el mensaje de error
        alert($('.error-message').text());
    }

    // Verificar si hay un mensaje de registro presente
    if ($('.registro-message').length > 0) {
        // Mostrar una alerta con el mensaje de error
        alert($('.registro-message').text());
    }

    // Función para validar los campos antes de enviar el formulario
    $('#registerButton').click(function (event) {

        // // Obtener los valores de los campos
        // var firstName = $('#firstName').val();
        // var lastName = $('#lastName').val();
        // var username = $('#username').val();
        // var password = $('#password').val();
        // var confirmPassword = $('#confirmPassword').val();

        // // Verificar que los campos no estén vacíos
        // if (firstName === '' || lastName === '' || username === '' || password === '' || confirmPassword === '') {
        //     alert('Por favor, complete todos los campos.');
        //     return;
        // }

        // // Verificar que las contraseñas coincidan
        // if (password !== confirmPassword) {
        //     alert('Las contraseñas no coinciden.');
        //     return;
        // }
        $('#form-signin').submit();
    });


    $('.roles-container .btn').on('click', function () {
        const selectedRole = $(this).prev('input').val(); // Obtiene el valor del botón seleccionado
        console.log('Rol seleccionado:', selectedRole);
    });
});
