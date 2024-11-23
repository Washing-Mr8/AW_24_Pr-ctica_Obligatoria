"use strict"
$(document).ready(function() {
    document.getElementById('mostrarLoginPassword').addEventListener('click', function() {
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


});
