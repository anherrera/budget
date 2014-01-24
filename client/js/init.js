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

    $('#interval').change(function() {
        var interval = $(this).val().split(' ');
        var amount = interval[0];
        var time = interval[1];

        var start = moment().hour(0).minute(0).second(0).format('MM/DD/YYYY');
        var end = moment().add(time, amount).format('MM/DD/YYYY');

        $('#start').val(start);
        $('#end').val(end).triggerHandler('changeDate');
    });

	//$('#add-event-form').validate();
});
