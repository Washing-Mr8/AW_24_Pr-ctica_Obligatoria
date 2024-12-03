
$(document).ready(function(){
    $(document).on('click', '#notificationsButton', function () {
        // Abre el modal
        console.log("TUMAMA");
        const modal = new bootstrap.Modal(document.getElementById('notificationsModal'));
        modal.show();
        
        // Limpia el contenido previo del modal
        $('#notificationsContent').html('<p class="text-muted text-center">Cargando notificaciones...</p>');
        
        // Realiza la solicitud AJAX
        $.ajax({
            url: '/user/notifications',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    const notifications = response.notifications;
    
                    // Verifica si hay notificaciones
                    if (notifications.length > 0) {
                        const notificationsHtml = notifications.map(notification => `
                            <div class="alert alert-info">
                                <p class="mb-0">${notification.mensaje}</p>
                            </div>
                        `).join('');
                        $('#notificationsContent').html(notificationsHtml);
                    } else {
                        $('#notificationsContent').html('<p class="text-muted text-center">No tienes notificaciones.</p>');
                    }
                } else {
                    $('#notificationsContent').html('<p class="text-danger text-center">Error al cargar las notificaciones.</p>');
                }
            },
            error: function () {
                $('#notificationsContent').html('<p class="text-danger text-center">Error al comunicarse con el servidor.</p>');
            }
        });
    });
    
})
