$(document).ready(function () {
    // Función para mostrar alertas
    function showAlert(message, type,container) {
      const alertHtml = `<div class="alert alert-${type} mt-3" role="alert">${message}</div>`;
      $(container).append(alertHtml);
  
      // Ocultar la alerta después de 5 segundos
      setTimeout(() => {
        $('#alertContainer .alert').fadeOut(500, function () {
          $(this).remove();
        });
      }, 5000);
    }

    function checkForSQL(inputString){
        const sqlInjectionRegex = /\b(INSERT|DELETE|DROP|UPDATE)\b/i;
        return sqlInjectionRegex.test(inputString);
    }
  
    // Validación del formulario
    $('#createEventForm').on('submit', function (e) {
      e.preventDefault(); // Detener envío para validación
      const capacity = parseInt($('#eventCapacity').val(), 10);
      const duration = parseInt($('#eventDuration').val(), 10);
      const title = $('#eventTitle').val();
      const location = $('#eventExact').val();
      const description = $('#eventDescription').val();
      const eventTime = $('#eventTime').val();
      const eventDate = $('#eventDate').val();

      if(checkForSQL(title) || checkForSQL(location) || checkForSQL(description)){
        $.ajax({
            url: '/user/ban', // Ruta del backend
            method: 'POST',
            success: function (response) {
              alert(response.message); // Mensaje en caso de éxito
            },
            error: function (xhr, status, error) {
              console.error(error); // Mostrar el error en consola
              alert('Hubo un problema al crear el evento.'); // Mensaje en caso de error
            },
          });
          return;
      }
  
      if (capacity <= 0) {
        showAlert('Capacidad debe de ser mayor que 0', 'danger',"#createAlert");
        return;
      }
      if(duration <= 0){
        showAlert('Duración debe de ser mayor que 0', 'danger',"#createAlert");
        return;
      }

      const [hours, minutes] = eventTime.split(':').map(Number);
      const eventHour = hours + minutes / 60;
      
      if (eventHour < 7 || eventHour > 22) {
        showAlert('La hora debe estar entre las 7:00 AM y las 10:00 PM.', 'danger',"#createAlert");
        return;
      }
      
      const today = new Date();
      const selectedDate = new Date(eventDate);
    
      if(selectedDate < today){
        showAlert('No puedes crear eventos en fechas anteriores a la actual', 'danger',"#createAlert");
        return;
      }


        
        this.submit();
      });
  });
  
  
  