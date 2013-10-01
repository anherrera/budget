Template.events_table.calendar_events = function() {
	var events = Events.find({}, { sort: { date: 1, type: -1 }}).fetch();
    var run_total = 0;

	$.each(events, function(idx, e) {
        run_total = e.run_total = run_total + e.amount * (e.type == 'bill' ? -1 : 1);
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
	'click .save-event': function(e) {
		e.preventDefault();
		var data = $('#add-event-form').serializeArray();

		var new_event = {};
		$.each(data, function(idx, elem) {
			new_event[elem.name] = elem.value;
		});

        new_event.amount = parseFloat(new_event.amount);

        if (new_event._id != "") {
            Events.update(new_event._id, {
                name: new_event.name,
                type: new_event.type,
                amount: new_event.amount,
                date: new_event.date
            });
        } else {
            Events.insert({
                name: new_event.name,
                type: new_event.type,
                amount: new_event.amount,
                date: new_event.date
            });
        }

		$('#add-event-form').find('input, select').not('[type=submit]').val('');
		$('#add-event-modal').modal('hide');
	}
};