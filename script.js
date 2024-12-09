$(document).ready(function() {
    // Initialisation de FullCalendar
    $('#calendar').fullCalendar({
      events: function(start, end, timezone, callback) {
        $.ajax({
          url: '/get-booked-dates',  // Route pour récupérer les dates réservées
          dataType: 'json',
          success: function(data) {
            var events = data.map(function(appointment) {
              return {
                title: 'Réservé',  // Marque l'événement comme réservé
                start: appointment.date_time,  // La date/heure réservée
                allDay: false,
                status: 'reserved'  // Attribuer un statut 'reserved' pour ces dates
              };
            });
            callback(events);
          }
        });
      },
      dayClick: function(date, jsEvent, view) {
        // Si la date est déjà réservée, ne permet pas de la sélectionner
        if (dateHasEvent(date)) {
          alert("Cette date est déjà réservée. Veuillez en choisir une autre.");
          return false;  // Empêche la sélection de la date
        }
        // Sinon, mettre à jour le champ de la date
        var selectedDate = date.format();
        $('#date_time').val(selectedDate);
      },
      validRange: { start: moment().format('YYYY-MM-DD') },  // Empêche la sélection de dates passées
      eventRender: function(event, element) {
        // Si l'événement est réservé, on désactive le clic sur cette date
        if (event.status === 'reserved') {
          element.css('background-color', '#ff0000');  // Optionnel: Change la couleur des dates réservées
          element.css('cursor', 'not-allowed');  // Indique que la date est non-cliquable
          element.prop('title', 'Cette date est déjà réservée');  // Message de survol
          element.on('click', function(e) {
            e.preventDefault();  // Désactive le clic sur la date réservée
          });
        }
      }
    });
  
    // Fonction pour vérifier si une date a un événement réservé
    function dateHasEvent(date) {
      var eventExists = false;
      $('#calendar').fullCalendar('clientEvents', function(event) {
        if (event.start.format() === date.format() && event.status === 'reserved') {
          eventExists = true;
        }
      });
      return eventExists;
    }
  });
  