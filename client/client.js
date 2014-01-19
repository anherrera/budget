/**
 * This work is licensed under the Creative Commons Attribution-NonCommercial
 * 4.0 International License. To view a copy of this license, visit
 * http://creativecommons.org/licenses/by-nc/4.0/ or send a letter to
 * Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
 */

Handlebars.registerHelper('balance', function () {
    return Session.get('balance');
});
Handlebars.registerHelper('start', function () {
    return Session.get('start');
});
Handlebars.registerHelper('end', function () {
    return Session.get('end');
});

Handlebars.registerHelper('isLoggedIn', function() {
    return Meteor.userId() !== null;
});

Meteor.subscribe('events');

/* pass in moment objects */
function getEvents(start, end) {
    var events = Events.find({}).fetch();
    var runTotal = Session.get('balance') ? Session.get('balance') : 0;
    var eventList = [];

    if (typeof start === 'undefined') {
        start = moment().hour(0).minute(0).second(0);
    }
    if (typeof end === 'undefined') {
        end = moment().add('month', 1);
    }

    $.each(events, function (idx, e) {

        var currDate = e.date;

        if (typeof e.recurringInterval != 'undefined' && e.recurringInterval != '') {
            while (moment(currDate).isBefore(start)) {
                currDate = moment(currDate).add(e.recurringInterval, e.recurringCount).format('YYYY-MM-DD');
            }

            var firstRun = true;
            while (moment(currDate).isBefore(end)) {
                var clone = Object.create(e);
                clone.date = currDate;

                if (firstRun) {
                    clone.isOriginal = true;
                } else {
                    clone._id = new Meteor.Collection.ObjectID();
                }

                eventList.push(clone);
                firstRun = false;
                currDate = moment(currDate).add(e.recurringInterval, e.recurringCount).format('YYYY-MM-DD');
            }
        } else {
            var clone = Object.create(e);
            clone.isOriginal = true;
            eventList.push(clone);
        }
    });

    eventList.sort(function (a, b) {
        if (a.date == b.date) {
            return a.type == 'income' ? -1 : (a.type == b.type) ? 0 : 1;
        }
        return a.date > b.date ? 1 : -1;
    });

    $.each(eventList, function (idx, e) {
        runTotal = e.runTotal = runTotal + e.amount * (e.type == 'bill' ? -1 : 1);
        e.due = moment(e.date).fromNow();
    });

    return eventList;
}

Template.eventsTable.calendarEvents = function () {
    var start = moment().hour(0).minute(0).second(0);
    var end = moment().add('month', 1);

    if (Session.get('start')) {
        start = moment(Session.get('start'));
    }
    if (Session.get('end')) {
        end = moment(Session.get('end'));
    }

    return getEvents(start, end);
};

Template.addEvent.events = {
    'click .add-event': function () {
        $('#add-event-modal').modal('show');
    },
    'click .save-event': function (e) {
        e.preventDefault();
        var data = $('#add-event-form').serializeArray();

        var newEvent = {};
        $.each(data, function (idx, elem) {
            newEvent[elem.name] = elem.value;
        });

        newEvent.amount = parseFloat(newEvent.amount);

        if (newEvent._id != "") {
            Events.update(newEvent._id, {
                $set: {
                    name: newEvent.name,
                    type: newEvent.type,
                    amount: parseFloat(newEvent.amount),
                    date: moment(newEvent.date).format('YYYY-MM-DD'),
                    recurringInterval: newEvent.recurringInterval,
                    recurringCount: newEvent.recurringCount,
                    userId: Meteor.userId()
                }
            });
        } else {
            Events.insert({
                name: newEvent.name,
                type: newEvent.type,
                amount: parseFloat(newEvent.amount),
                date: moment(newEvent.date).format('YYYY-MM-DD'),
                recurringInterval: newEvent.recurringInterval,
                recurringCount: newEvent.recurringCount,
                userId: Meteor.userId()
            });
        }

        $('#add-event-form').find('input, select').not('[type=submit]').val('');
        $('#add-event-modal').modal('hide');
    },
    'change #recurring': function () {
        if ($('#recurring').is(':checked')) {
            $('#recurring_fields').find('input,select').removeAttr('disabled');
        } else {
            $('#recurring_fields').find('input,select').attr('disabled', 'disabled');
        }
    }
};

Template.eventsTable.events = {
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
        f.find('[name=date]').val(moment(this.date).format('MM/DD/YYYY'));
        f.find('[name=amount]').val(this.amount);

        if (this.recurringInterval && this.recurringCount) {
            f.find('#recurring').attr('checked', true);
            f.find('#recurring_fields').find('input,select').removeAttr('disabled');
        }

        f.find('[name=recurringCount]').val(this.recurringCount);
        f.find('[name=recurringInterval]').val(this.recurringInterval);
        $('#add-event-modal').modal('show');
    }
};

Template.snapshot.totalIncome = function () {
    var totalIncome = Session.get('balance') ? Session.get('balance') : 0;
    var events = getEvents();

    $.each(events, function (idx, e) {
        if (e.type == 'income') {
            totalIncome += parseFloat(e.amount);
        }
    });

    return totalIncome.toFixed(2);
};

Template.snapshot.totalExpenses = function () {
    var totalExpenses = 0;
    var events = getEvents();

    $.each(events, function (idx, e) {
        if (e.type == 'bill') {
            totalExpenses += parseFloat(e.amount);
        }
    });

    return totalExpenses.toFixed(2);
};

Template.snapshot.difference = function () {
    var difference = parseFloat(Template.snapshot.totalIncome()) - parseFloat(Template.snapshot.totalExpenses());
    return difference.toFixed(2);
};

Template.snapshot.events = {
    'blur #balance': function () {
        Session.set('balance', parseFloat($('#balance').val()));
    }
};
