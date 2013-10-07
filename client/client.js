Handlebars.registerHelper('balance', function() {
	return Session.get('balance');
});
Handlebars.registerHelper('start', function() {
	return Session.get('start');
});
Handlebars.registerHelper('end', function() {
	return Session.get('end');
});

Template.events_table.calendar_events = function () {
	var start = moment().startOf('month').subtract('seconds', 1);
	var end = moment().endOf('month');

	if (Session.get('start')) {
		start = moment(Session.get('start'));
	}
	if (Session.get('end')) {
		end = moment(Session.get('end'));
	}

	var events = Events.find({
		date: {
			$gt: start.format('YYYY-MM-DD'),
			$lt: end.format('YYYY-MM-DD')
		}
	}, { sort: { date: 1, type: -1 }}).fetch();

	var run_total = Session.get('balance') ? Session.get('balance') : 0;

	var event_list = [];

	$.each(events, function(idx, e) {
		var original_date = e.date;
		var curr_date = e.date;

		if (typeof e.recurring_interval != 'undefined' && e.recurring_interval != '') {
			while (moment(curr_date).isBefore(end)) {
				var clone = Object.create(e);
				clone.date = curr_date;

				if (curr_date == original_date) {
					clone.is_original = true;
				} else {
					clone._id = new Meteor.Collection.ObjectID();
				}

				event_list.push(clone);
				curr_date = moment(curr_date).add(e.recurring_interval, e.recurring_count).format('YYYY-MM-DD');
			}
		} else {
			var clone = Object.create(e);
			clone.is_original = true;
			event_list.push(clone);
		}
	});

	event_list.sort(function(a,b) {
		if (a.date == b.date) {
			return a.type == 'income' ? -1 : (a.type == b.type) ? 0 : 1;
		}
		return a.date > b.date ? 1 : -1;
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
		f.find('[name=date]').val(moment(this.date).format('mm/dd/yyyy'));
		f.find('[name=amount]').val(this.amount);
		f.find('[name=recurring_interval]').val(this.recurring_interval);
		f.find('[name=recurring_count]').val(this.recurring_count);
		$('#add-event-modal').modal('show');
	}
};

Template.snapshot.total_income = function () {
	var total_income = Session.get('balance') ? Session.get('balance') : 0;
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

Template.snapshot.events = {
	'blur #balance': function() {
		Session.set('balance', parseFloat($('#balance').val()));
	}
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
				recurring_interval: new_event.recurring_interval,
				recurring_count: new_event.recurring_count
			});
		} else {
			Events.insert({
				name: new_event.name,
				type: new_event.type,
				amount: new_event.amount,
				date: moment(new_event.date).format('YYYY-MM-DD'),
				recurring_interval: new_event.recurring_interval,
				recurring_count: new_event.recurring_count
			});
		}

		$('#add-event-form').find('input, select').not('[type=submit]').val('');
		$('#add-event-modal').modal('hide');
	},
	'change #recurring': function() {
		if ($('#recurring').is(':checked')) {
			$('#recurring_fields').find('input,select').removeAttr('disabled');
		} else {
			$('#recurring_fields').find('input,select').attr('disabled', 'disabled');
		}
	}
};

/*
Template.events_dates.events = {
	'blur #start': function() {
		console.log('start');
		Session.set('start', $('#start').val());
	},
	'blur #end': function() {
		console.log('end');
		Session.set('end', $('#end').val());
	}
};*/
