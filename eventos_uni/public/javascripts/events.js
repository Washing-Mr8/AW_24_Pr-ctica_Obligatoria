
function showAlert(message, type,container) {
  const alertHtml = `<div class="alert alert-${type} mt-3" role="alert">${message}</div>`;
  $(container).append(alertHtml);

 
  setTimeout(() => {
    $(container).find('.alert').first().remove(); 
  }, 3000); 
}

function checkForSQL(inputString){
  const sqlInjectionRegex = /\b(INSERT|DELETE|DROP|UPDATE)\b/i;
  return sqlInjectionRegex.test(inputString);
}

$(document).ready(function () {
  
    $('#createEventForm').on('submit', function (e) {
      e.preventDefault(); 
      console.log('Formulario enviado');
      const capacity = parseInt($('#eventCapacity').val(), 10);
      const duration = parseInt($('#eventDuration').val(), 10);
      const title = $('#eventTitle').val();
      const location = $('#eventExact').val();
      const description = $('#eventDescription').val();
      const eventTime = $('#eventTime').val();
      const eventDate = $('#eventDate').val();
      const faculty = $('#eventLocation').val();
      const type = $('#eventType').val();

      if(checkForSQL(title) || checkForSQL(location) || checkForSQL(description)){
        $.ajax({
            url: '/user/ban', 
            method: 'POST',
            success: function (response) {
              alert(response.message); 
            },
            error: function (xhr, status, error) {
              console.error(error); 
              alert('Hubo un problema al crear el evento.'); 
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

      const eventData = {
        eventTitle: title,
        eventType: type,
        eventDate: eventDate,
        eventTime: eventTime,
        eventLocation: faculty,
        eventCapacity: capacity,
        eventDescription: description,
        eventExact: location,
        eventDuration: duration
    };

      $.ajax({
        url:"viewEvents/create",
        type:'POST',
        data:JSON.stringify(eventData),
        contentType:'application/json',
        success:function(response){
            if (response.success) {
                const locations = response.locations;
                const newEvent = response.event;
                const eventHtml = `
                  <li class="list-group-item mb-3" id="event-${newEvent.ID}">
                    <h4 class="mb-1">${newEvent.Titulo}</h4>
                    <p class="mb-2"><strong>Descripción:</strong> ${newEvent.Descripcion}</p>
                    <p class="mb-2"><strong>Fecha:</strong> ${new Date(newEvent.Fecha).toISOString().split('T')[0]} <strong>Hora:</strong> ${newEvent.Hora}</p>
                    <p class="mb-2"><strong>Duración:</strong> ${newEvent.Duracion}</p>
                    <p class="mb-2"><strong>Ubicación:</strong> ${newEvent.Facultad}: ${newEvent.Ubicacion}</p>
                    <p class="mb-1"><strong>Capacidad:</strong> ${newEvent.Capacidad_Actual} / ${newEvent.Capacidad_Maxima} personas</p>
                    <p class="mb-2"><strong>Tipo de Evento:</strong> ${newEvent.Tipo}</p>
                    <button class="btn btn-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#editEventModal${newEvent.ID}">Editar Evento</button>
                    <button class="btn btn-danger btn-sm" data-bs-toggle="modal" data-bs-target="#deleteEventModal${newEvent.ID}">Eliminar Evento</button>
                  </li>
                `
                //inserta el evento en el ejs
                $('#eventList').prepend(eventHtml);

                const deleteModalHtml = `
                  <div class="modal fade" id="deleteEventModal${newEvent.ID}" tabindex="-1" aria-labelledby="deleteEventModalLabel${newEvent.ID}" aria-hidden="true">
                    <div class="modal-dialog">
                      <div class="modal-content">
                        <div class="modal-header">
                          <h6 class="modal-title" id="deleteEventModalLabel${newEvent.ID}">¿Estás seguro de que deseas eliminar el evento ${newEvent.Titulo}?</h6>
                          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-footer">
                          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                          <button type="button" class="btn btn-danger deleteEventButton" data-event-id="${newEvent.ID}">Eliminar Evento</button>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
                //inserta el modal para poder eliminar evento
                $('body').append(deleteModalHtml);

                const modalHTML = `
                  <div class="modal fade" id="editEventModal${newEvent.ID}" tabindex="-1" aria-labelledby="editEventModalLabel${newEvent.ID}" aria-hidden="true">
                    <div class="modal-dialog">
                      <div class="modal-content">
                        <div class="modal-header">
                          <h5 class="modal-title" id="editEventModalLabel${newEvent.ID}">Editar Evento</h5>
                          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                          <form action="/viewEvents/edit/${newEvent.ID}" method="POST" id="editEventForm${newEvent.ID}" class="mb-4">
                            <div class="row mb-3">
                              <div class="col-md-6">
                                <label for="editEventTitle${newEvent.ID}" class="form-label">Título</label>
                                <input type="text" id="editEventTitle${newEvent.ID}" name="eventTitle" class="form-control" value="${newEvent.Titulo}" required>
                              </div>
                              <div class="col-md-6">
                                <label for="editEventType${newEvent.ID}" class="form-label">Tipo de Evento</label>
                                <select id="editEventType${newEvent.ID}" name="eventType" class="form-select" required>
                                  <option value="seminario" ${newEvent.tipo === 'seminario' ? 'selected' : ''}>Seminario</option>
                                  <option value="taller" ${newEvent.tipo === 'taller' ? 'selected' : ''}>Taller</option>
                                  <option value="conferencia" ${newEvent.tipo === 'conferencia' ? 'selected' : ''}>Conferencia</option>
                                </select>
                              </div>
                            </div>
                            <div class="row mb-3">
                              <div class="col-md-6">
                                <label for="editEventDate${newEvent.ID}" class="form-label">Fecha</label>
                                <input type="date" id="editEventDate${newEvent.ID}" name="eventDate" class="form-control" value="${new Date(newEvent.Fecha).toISOString().split('T')[0]}" required>
                              </div>
                              <div class="col-md-6">
                                <label for="editEventTime${newEvent.ID}" class="form-label">Hora</label>
                                <input type="time" id="editEventTime${newEvent.ID}" name="eventTime" class="form-control" value="${newEvent.Hora}" required>
                              </div>
                            </div>
                            <div class="row mb-3">
                              <label for="editEventDuration${newEvent.ID}" class="form-label">Duración</label>
                              <input type="number" id="editEventDuration${newEvent.ID}" name="eventDuration" placeholder="En minutos" class="form-control" value="${newEvent.Duracion}" required>
                            </div>
                            <div class="row mb-3">
                              <div class="col-md-6">
                                <label for="editEventLocation${newEvent.ID}" class="form-label">Ubicación</label>
                                <select id="editEventLocation${newEvent.ID}" name="eventLocation" class="form-select" required>
                                  ${locations.map(location => {
                                    return `<option value="${location.Nombre}" ${newEvent.facultad === location.Nombre ? 'selected' : ''}>${location.Nombre}</option>`;
                                  }).join('')}
                                </select>
                              </div>
                              <div class="col-md-6">
                                <label for="editEventExact${newEvent.ID}" class="form-label">Localización exacta</label>
                                <input type="text" id="editEventExact${newEvent.ID}" name="eventExact" class="form-control" value="${newEvent.Ubicacion}" required>
                              </div>
                            </div>
                            <div class="row mb-3">
                              <label for="editEventCapacity${newEvent.ID}" class="form-label">Capacidad Máxima</label>
                              <input type="number" id="editEventCapacity${newEvent.ID}" name="eventCapacity" class="form-control" value="${newEvent.Capacidad_Maxima}" required>
                            </div>
                            <div class="row mb-3">
                              <label for="editEventDescription${newEvent.ID}" class="form-label">Descripción</label>
                              <textarea id="editEventDescription${newEvent.ID}" name="eventDescription" class="form-control" rows="3" required>${newEvent.Descripcion}</textarea>
                            </div>
                            <button type="submit" class="btn btn-accesibilidad">Guardar Cambios</button>
                            <div id="editAlert"></div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                `;

        
                $('body').append(modalHTML);
                
                showAlert("Evento creado correctamente","success",'#createdAlert');
                $('#createEventModal').modal('hide');
              } else {
                showAlert(response.message,"danger",'#createdAlert');
                $('#createEventModal').modal('hide');
              }
          
        },
        error:function(){
          showAlert("error al crear","danger",'#createdAlert');
        }

      });
      });

      $(document).on('click', '.deleteEventButton', function(e) {
        e.preventDefault();
        const eventId = $(this).data('event-id');

        $.ajax({
            url: `/viewEvents/delete/${eventId}`,
            type: 'POST',
            success: function (response) {
                if (response.success) {
                    $(`#event-${eventId}`).remove();
                    $(`#deleteEventModal${eventId}`).modal('hide');
                    showAlert('Evento eliminado correctamente', 'success', '#createdAlert');
                } else {
                    $(`#deleteEventModal${eventId}`).modal('hide');
                    showAlert('Hubo un problema al eliminar el evento', 'danger', '#createdAlert');
                }
            },
            error: function () {
                $(`#deleteEventModal${eventId}`).modal('hide');
                showAlert('Error al eliminar el evento', 'danger', '#createdAlert');
            }
        });
    });
    $(document).on('submit', 'form[id^="editEventForm"]', function (e) {
      e.preventDefault();
      const formId = $(this).attr('id'); 
      const eventId = formId.replace('editEventForm', '');
      const modalId = `#editEventModal${eventId}`;
      const eventElementId = `#event-${eventId}`; 
      

      const formData = {
          eventTitle: $(`#editEventTitle${eventId}`).val(),
          eventType: $(`#editEventType${eventId}`).val(),
          eventDate: $(`#editEventDate${eventId}`).val(),
          eventTime: $(`#editEventTime${eventId}`).val(),
          eventLocation: $(`#editEventLocation${eventId}`).val(),
          eventExact: $(`#editEventExact${eventId}`).val(),
          eventCapacity: parseInt($(`#editEventCapacity${eventId}`).val(), 10),
          eventDuration: parseInt($(`#editEventDuration${eventId}`).val(), 10),
          eventDescription: $(`#editEventDescription${eventId}`).val(),
      };
    
      if(checkForSQL(formData.eventTitle) || checkForSQL(formData.eventLocation) || checkForSQL(formData.eventDescription)){
        $.ajax({
            url: '/user/ban', 
            method: 'POST',
            success: function (response) {
              alert(response.message); 
            },
            error: function (error) {
              console.error(error); 
              alert('Hubo un problema al editar.'); 
            },
          });
          return;
      }
  
      if (formData.eventCapacity <= 0 || formData.eventDuration <= 0) {
          alert('Hubo un problema al editar.'); 
          return;
      }
  
      $.ajax({
          url: `/viewEvents/edit/${eventId}`, 
          type: 'POST',
          data: JSON.stringify(formData),
          contentType: 'application/json',
          success: function (response) {
              if (response.success) {
                  const newEvent = response.event;
                  const updatedEventHtml = `
                    <h4 class="mb-1">${newEvent.Titulo}</h4>
                    <p class="mb-2"><strong>Descripción:</strong> ${newEvent.Descripcion}</p>
                    <p class="mb-2"><strong>Fecha:</strong> ${new Date(newEvent.Fecha).toISOString().split('T')[0]} <strong>Hora:</strong> ${newEvent.Hora}</p>
                    <p class="mb-2"><strong>Duración:</strong> ${newEvent.Duracion}</p>
                    <p class="mb-2"><strong>Ubicación:</strong> ${newEvent.facultad}: ${newEvent.Ubicacion}</p>
                    <p class="mb-1"><strong>Capacidad:</strong> ${newEvent.Capacidad_Actual} / ${newEvent.Capacidad_Maxima} personas</p>
                    <p class="mb-2"><strong>Tipo de Evento:</strong> ${newEvent.Tipo}</p>
                    <button class="btn btn-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#editEventModal${newEvent.ID}">Editar Evento</button>
                    <button class="btn btn-danger btn-sm" data-bs-toggle="modal" data-bs-target="#deleteEventModal${newEvent.ID}">Eliminar Evento</button>
                  `;
  
                  $(`${eventElementId} h4`).html(formData.eventTitle);
                  $(eventElementId).html(updatedEventHtml);
  
                  $(modalId).modal('hide');
                  showAlert('Evento actualizado correctamente.', 'success', '#createdAlert');
              } else {
                $(modalId).modal('hide');
                  showAlert('No se pudo actualizar el evento. Intenta nuevamente.', 'danger', '#createdAlert');
              }
          },
          error: function () {
              $(modalId).modal('hide');
              showAlert('Ocurrió un error al intentar actualizar el evento.', 'danger', '#createdAlert');
          },
      });
    });

    $(document).on('click', '.joinEvent', function() {
      const eventId = $(this).data('event-id');
      
      $.ajax({
          url: `/viewEvents/join/${eventId}`,
          method: 'POST',
          success: function(response) {
              console.log(response);
              if (response.success) {
                  const eventElementId = `#event-${eventId}`;
                  const totalCapacity = response.totalCapacity;
                  const actualCapacity = response.actualCapacity;
                  const state = response.state;
                  
                  $(`#joinEvent${eventId}`).remove();
                  $(`${eventElementId} p.mb-3 `).html(`<strong>Estado de la inscripción:</strong> ${state} <button class="btn btn-danger btn-sm" data-bs-target="#leaveEventModal${eventId}" id="leaveEvent${eventId}"data-bs-toggle="modal">Desinscribirse</button>`);
                  $(`${eventElementId} p.mb-1`).html(`<strong>Capacidad:</strong> ${actualCapacity}/ ${totalCapacity} personas`);
                  $(`#joinEventModal${eventId}`).modal('hide');
                  showAlert('Tu inscripción ha sido actualizada.', 'success', '#createdAlert');
              } else {
                $(`#joinEventModal${eventId}`).modal('hide');
                  showAlert('Hubo un problema al intentar inscribirte. Intenta nuevamente.', 'danger', '#createdAlert');
              }
          },
          error: function() {
            $(`#joinEventModal${eventId}`).modal('hide');
              showAlert('Hubo un error al intentar inscribirte. Intenta nuevamente.', 'danger', '#createdAlert');
          }
      });
    });

    $(document).on('click', '.leaveEvent', function() {
      const eventId = $(this).data('event-id');
      
      $.ajax({
          url: `/viewEvents/leave/${eventId}`,
          method: 'POST',
          success: function(response) {
              if (response.success) {
                  const eventElementId = `#event-${eventId}`;
                  const totalCapacity = response.totalCapacity;
                  const actualCapacity = response.actualCapacity;
                  $(`#leaveEvent${eventId}`).remove();
                  $(`${eventElementId} p.mb-3 `).html(`<strong>Estado de la inscripción:</strong> No inscrito <button class="btn btn-secondary btn-sm" data-bs-target="#joinEventModal${eventId}" id="joinEvent${eventId}"data-bs-toggle="modal">Inscribirse</button>`);
                  $(`${eventElementId} p.mb-1`).html(`<strong>Capacidad:</strong> ${actualCapacity}/ ${totalCapacity} personas`);
                  $(`#leaveEventModal${eventId}`).modal('hide');
                  showAlert('Tu inscripción ha sido actualizada.', 'success', '#createdAlert');
              } else {
                $(`#leaveEventModal${eventId}`).modal('hide');
                  showAlert('Hubo un problema al intentar inscribirte. Intenta nuevamente.', 'danger', '#createdAlert');
              }
          },
          error: function() {
            $(`#leaveEventModal${eventId}`).modal('hide');
              showAlert('Hubo un error al intentar inscribirte. Intenta nuevamente.', 'danger', '#createdAlert');
          }
      });
    });
  
  });

  

  
  
  