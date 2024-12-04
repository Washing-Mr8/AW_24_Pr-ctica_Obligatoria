$(document).on('submit', 'form[id^="commentForm"]', function (e) {
    e.preventDefault(); 
    console.log("PUTA");
    const formId = $(this).attr('id');
    const eventId = formId.replace('commentForm', ''); 
    const modalId = `#commentEventModal${eventId}`;

    const formData = {
        comment: $(`#comment${eventId}`).val(),
        rating: $(`input[name="rating${eventId}"]:checked`).val(), 
    };

    if (!formData.rating) {
        alert('Por favor, selecciona una valoración.');
        return;
    }

    if (checkForSQL(formData.comment)) {
        $.ajax({
            url: '/users/ban', 
            method: 'POST',
            success: function (response) {
                alert(response.message);
            },
            error: function (error) {
                console.error(error);
                alert('Ocurrió un problema al enviar el comentario.');
            },
        });
        return;
    }

    $.ajax({
        url: `/viewEvents/comment/${eventId}`, 
        type: 'POST',
        data: JSON.stringify(formData),
        contentType: 'application/json',
        success: function (response) {
            if (response.success) {
                $(modalId).modal('hide');
                showAlert('Comentario enviado correctamente.', 'success', '#createdAlert');
                $(`#comment${eventId}`).val('');
                $(`input[name="rating${eventId}"]`).prop('checked', false);
            } else {
                $(modalId).modal('hide');
                showAlert('No se pudo enviar el comentario. Intenta nuevamente.', 'danger', '#createdAlert');
            }
        },
        error: function () {
            $(modalId).modal('hide');
            showAlert('Ocurrió un error al intentar enviar el comentario.', 'danger', '#createdAlert');
        },
    });
});
