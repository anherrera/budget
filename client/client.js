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
	},
    'click .edit': function() {
        var f = $('#add-event-form');
        f.find('[name=_id]').val(this._id);
        f.find('[name=name]').val(this.name);
        f.find('[name=type]').val(this.type);
        f.find('[name=date]').val(this.date);
        f.find('[name=amount]').val(this.amount);
        $('#add-event-modal').modal('show');
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

        if (new_event._id) {
            Events.update(new_event._id, {
                name: new_event.name,
                type: new_event.type,
                amount: new_event.amount,
                date: new_event.date
            });
        } else {
            Events.insert(new_event);
        }

		$('#add-event-form').find('input, select').not('[type=submit]').val('');
		$('#add-event-modal').modal('hide');
	}
};