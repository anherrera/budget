$().ready(function() {
	$('.datepicker').datepicker()
        .on('changeDate', function(evt) {
            var elem = $(evt.target);

            elem.datepicker('hide');

            // special handlers for #start and #end
            if (elem.hasClass('session-change')) {
                var id = elem.attr('id');

                switch (id) {
                    case 'start':
                    case 'end':
                        Session.set(id, elem.val());
                        break;

                    default:
                        break;
                }
            }
        });

	//$('#add-event-form').validate();
});
