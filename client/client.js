Template.events_table.calendar_events = function () {
	var start = moment("2013/10/01");
	var end = moment("2013/10/31");

	var events = Events.find({}, { sort: { date: 1, type: -1 }}).fetch();
	var run_total = 0;

	var event_list = [];

	$.each(events, function(idx, e) {
		event_list.push(e);

		/*if (e.recurring != '') {
			switch (e.recurring) {
				case 'weekly':
					var curr_date = e.date;
					//console.log(curr_date);

					//console.log(curr_date.add('week', 1).isBefore(end));

					//while (curr_date.add('week', 1).isBefore(end)) {
						//console.log(curr_date);
					//}

					break;

				case 'monthly':
					break;

				case 'bimonthly':
					break;

				case 'yearly':
					break;
			}
		}*/
	});

	$.each(event_list, function (idx, e) {
		run_total = e.run_total = run_total + e.amount * (e.type == 'bill' ? -1 : 1);
		e.due = moment(e.date).fromNow();
	});

	return event_list;
};

Template.events_table.events = {
	'click .delete': function () {
		if (confirm('Are you sure you want to delete this?')) {
			Events.remove(this._id);
		}
	},
	'click .edit': function () {
		var f = $('#add-event-form');
		f.find('[name=_id]').val(this._id);
		f.find('[name=name]').val(this.name);
		f.find('[name=type]').val(this.type);
		f.find('[name=date]').val(this.date.format('mm/dd/yyyy'));
		f.find('[name=amount]').val(this.amount);
		f.find('[name=recurring]').val(this.recurring);
		$('#add-event-modal').modal('show');
	}
};

Template.snapshot.total_income = function () {
	var total_income = 0;
	var events = Template.events_table.calendar_events();

	$.each(events, function(idx, e) {
		if (e.type =='income') {
			total_income += parseFloat(e.amount);
		}
	});

	return total_income.toFixed(2);
};

Template.snapshot.total_expenses = function() {
	var total_expenses = 0;
	var events = Template.events_table.calendar_events();

	$.each(events, function(idx, e) {
		if (e.type =='bill') {
			total_expenses += parseFloat(e.amount);
		}
	});

	return total_expenses.toFixed(2);
};

Template.snapshot.difference = function() {
	var difference = parseFloat(Template.snapshot.total_income()) - parseFloat(Template.snapshot.total_expenses());
	return difference.toFixed(2);
};

Template.add_event.events = {
	'click .add-event': function () {
		$('#add-event-modal').modal('show');
	},
	'click .save-event': function (e) {
		e.preventDefault();
		var data = $('#add-event-form').serializeArray();

		var new_event = {};
		$.each(data, function (idx, elem) {
			new_event[elem.name] = elem.value;
		});

		new_event.amount = parseFloat(new_event.amount);

		if (new_event._id != "") {
			Events.update(new_event._id, {
				name: new_event.name,
				type: new_event.type,
				amount: new_event.amount,
				date: moment(new_event.date).format('YYYY-MM-DD'),
				recurring: new_event.recurring
			});
		} else {
			Events.insert({
				name: new_event.name,
				type: new_event.type,
				amount: new_event.amount,
				date: moment(new_event.date).format('YYYY-MM-DD'),
				recurring: new_event.recurring
			});
		}

		$('#add-event-form').find('input, select').not('[type=submit]').val('');
		$('#add-event-modal').modal('hide');
	}
};