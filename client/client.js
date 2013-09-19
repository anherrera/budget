Template.events_table.calendar_events = function() {
	var events = Events.find({}, { sort: { date: 1 }}).fetch();

	$.each(events, function(idx, e) {
		e.due = moment(e.date).fromNow();
	});

	return events;
};

Template.events_table.events = {
	'click .delete': function() {
		if (confirm('Are you sure you want to delete this?')) {
			Events.remove(this._id);
		}
	}
};

Template.add_event.events = {
	'click .add-event': function() {
		$('#add-event-modal').modal('show');
	},
	'submit #add-event-form': function(e) {
		e.preventDefault();
		var data = $(e.target).serializeArray();
		var new_event = {};
		$.each(data, function(idx, elem) {
			new_event[elem.name] = elem.value;
		});

		Events.insert(new_event);
		$('#add-event-form').find('input, select').not('[type=submit]').val('');
		$('#add-event-modal').modal('hide');
	}
};