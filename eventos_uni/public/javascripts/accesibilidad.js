$(document).ready(function () {
    // BOTONES DEL FONDO O TEMA
    let oscuro = $("#b-oscuro");
    let claro = $("#b-claro");
    let botonDefault = $("#b-default");

    // BOTONES PARA LA FUENTE
    let normal = $("#f-normal");
    let grande = $("#f-grande");
    let muyGrande = $("#f-muygrande");

    // Modal
    let modalContent = $(".modal-content");
    //Formularios
    let formContent = $(".form-content");

    const body = $('body');
    var userTheme = body.attr('data-theme'); // Tema actual
    var userFontSize = body.attr('data-font-size'); // Tamaño de fuente actual

    const logoImg = document.querySelector('.navbar-brand img');


    // Inicialización: sincronizar estados de botones
    cambiarTema(userTheme);
    cambiarFuente(userFontSize);


    // Cambiar el tema visual y sincronizar botones
    function cambiarTema(tema) {
        console.log("Tema cambiado a: " + tema);

        if (logoImg) {
            logoImg.src = "/images/AW_logo_white.svg"; // logo blanco
        }

        if(tema === "default" || tema === undefined){
            body.addClass("default");
            body.attr('data-bs-theme', "dark");
            modalContent.addClass("modal-default")
            formContent.addClass("form-default");
        }
        else{
            body.removeClass("default");
            body.attr('data-bs-theme', tema);
            modalContent.removeClass("modal-default")
            formContent.removeClass("form-default");

            if(tema === "light"){
                if (logoImg) {
                    logoImg.src = "/images/AW_logo.svg"; // Logo oscuro para el tema claro
                }
            }
        }
        body.attr('data-theme', tema);
        sincronizarBotonesTema(); // Actualiza el estado de los botones
    }

    // Cambiar el tamaño de fuente y sincronizar botones
    function cambiarFuente(fuente) {
        console.log("Tamaño de texto: " + fuente);
        body.removeClass('fuente-normal fuente-grande fuente-muy-grande');
        if(fuente === undefined){
            fuente = "fuente-normal";
        }
        body.addClass(fuente);
        body.attr('data-font-size', fuente);
        sincronizarBotonesFuente(); // Actualiza el estado de los botones
    }

        // Desactivar todos los botones de tema y activar el correcto
        function sincronizarBotonesTema() {
            oscuro.removeClass('active');
            claro.removeClass('active');
            desactivarBotonCustom(botonDefault);
    
            userTheme = body.attr('data-theme');
    
            if (userTheme === 'light') {
                claro.addClass('active');
            } else if (userTheme === 'dark') {
                oscuro.addClass('active');
            } else {
                activarBotonCustom(botonDefault);
            }
        }
    
        // Desactivar todos los botones de fuente y activar el correcto
        function sincronizarBotonesFuente() {
            desactivarBotonCustom(normal);
            desactivarBotonCustom(grande);
            desactivarBotonCustom(muyGrande);
            
            userFontSize = body.attr('data-font-size'); 
    
            if (userFontSize === 'fuente-grande') {
                activarBotonCustom(grande);
            } else if (userFontSize === 'fuente-muy-grande') {
                activarBotonCustom(muyGrande);
            } else {
                activarBotonCustom(normal);
            }
        }

        function desactivarBotonCustom(boton) {
            boton.removeClass('active');
            boton.addClass('outline');
        }
    
        function activarBotonCustom(boton) {
            boton.removeClass('outline');
            boton.addClass('active');
        }

    // Evento para guardar configuración
    $('#guardar-config').click(function () {
        const temaSeleccionado = body.attr('data-theme');
        const fuenteSeleccionada = body.attr('data-font-size');

        const data = {
            tema: temaSeleccionado,
            fuente: fuenteSeleccionada
        };

        $.ajax({
            url: '/user/accesibilidad',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (response) {
                console.log("Configuración guardada con éxito:", response);
                alert("Configuración de accesibilidad guardada correctamente");
            },
            error: function (error) {
                console.error("Error al guardar la configuración:", error);
                alert("Hubo un error al guardar la configuración. Por favor, inténtalo de nuevo.");
            }
        });
    });

    // Eventos de clic para los botones de tema
    claro.click(function () {
        cambiarTema('light');
    });

    oscuro.click(function () {
        cambiarTema('dark');
    });

    botonDefault.click(function () {
        cambiarTema('default');
    });

    // Eventos de clic para los botones de fuente
    normal.click(function () {
        cambiarFuente('fuente-normal');
    });

    grande.click(function () {
        cambiarFuente('fuente-grande');
    });

    muyGrande.click(function () {
        cambiarFuente('fuente-muy-grande');
    });


});

