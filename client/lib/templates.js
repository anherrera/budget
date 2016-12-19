Template.addEventButton.events = {
    'click .add-event': function () {
        $('#add-event-modal').modal('show');
    }
};

Template.addEventModal.events = {
    'click .save-event': function (e) {
        e.preventDefault();
        var data = $('#add-event-form').serializeArray();

        var newEvent = {};
        $.each(data, function (idx, elem) {
            newEvent[elem.name] = elem.value;
        });

        newEvent.isSavings = $('#is_savings').is(':checked');
        newEvent.isDebt = $('#is_debt').is(':checked');
        newEvent.isAuto = $('#is_auto').is(':checked');

        // if we do not have a recurring event we need to specify...
        if (typeof newEvent.recurringInterval == 'undefined') {
            newEvent.recurringInterval = '';
        }
        if (typeof newEvent.recurringCount == 'undefined') {
            newEvent.recurringCount = '';
        }
        if (typeof newEvent.recurringOrdinal == 'undefined') {
            newEvent.recurringOrdinal = '';
        }
        if (typeof newEvent.recurringDay == 'undefined') {
            newEvent.recurringDay = '';
        }
        if (typeof newEvent.recurringWeekdayOnly == 'undefined') {
            newEvent.recurringWeekdayOnly = '';
        }
        if (typeof newEvent.recurringUntil == 'undefined' || newEvent.recurringUntil == '') {
            newEvent.recurringUntil = '';
        } else {
            newEvent.recurringUntil = moment(newEvent.recurringUntil).format(dateFormatDb);
        }

        newEvent.amount = parseFloat(newEvent.amount);

        if (newEvent._id != "") {
            Events.update(newEvent._id, {
                $set: {
                    name: newEvent.name,
                    type: newEvent.type,
                    amount: parseFloat(newEvent.amount),
                    isSavings: newEvent.isSavings,
                    isDebt: newEvent.isDebt,
                    isAuto: newEvent.isAuto,
                    date: moment(newEvent.date).format(dateFormatDb),
                    recurringInterval: newEvent.recurringInterval,
                    recurringCount: newEvent.recurringCount,
                    recurringOrdinal: newEvent.recurringOrdinal,
                    recurringDay: newEvent.recurringDay,
                    recurringUntil: newEvent.recurringUntil,
                    recurringWeekdayOnly: newEvent.recurringWeekdayOnly,
                    userId: Meteor.userId()
                }
            });
        } else {
            Events.insert({
                name: newEvent.name,
                type: newEvent.type,
                amount: parseFloat(newEvent.amount),
                isSavings: newEvent.isSavings,
                isDebt: newEvent.isDebt,
                isAuto: newEvent.isAuto,
                date: moment(newEvent.date).format(dateFormatDb),
                recurringInterval: newEvent.recurringInterval,
                recurringCount: newEvent.recurringCount,
                recurringOrdinal: newEvent.recurringOrdinal,
                recurringDay: newEvent.recurringDay,
                recurringUntil: newEvent.recurringUntil,
                recurringWeekdayOnly: newEvent.recurringWeekdayOnly,
                userId: Meteor.userId()
            });
        }

        $('#add-event-form').find('input, select').not('[type=submit]').val('');
        $('#add-event-form').find('input[type=checkbox]').prop('checked', false);
        $('#add-event-modal').modal('hide');
    },
    'change #recurring': function () {
        if ($('#recurring').is(':checked')) {
            $('#recurring_fields').find('input,select').removeAttr('disabled');
            $('#recurring_fields_irregular').find('input,select').attr('disabled', 'disabled');
            $('#recurring_irregular').prop('checked', false);
            $('.until_date').find('input,select').removeAttr('disabled');
        } else {
            $('#recurring_fields').find('input,select').attr('disabled', 'disabled');
            $('.until_date').find('input,select').attr('disabled', 'disabled');
        }
    },
    'change #recurring_irregular': function() {
        if ($('#recurring_irregular').is(':checked')) {
            $('#recurring_fields_irregular').find('input,select').removeAttr('disabled');
            $('#recurring_fields').find('input,select').attr('disabled', 'disabled');
            $('#recurring').prop('checked', false);
            $('.until_date').find('input,select').removeAttr('disabled');
        } else {
            $('#recurring_fields_irregular').find('input,select').attr('disabled', 'disabled');
            $('.until_date').find('input,select').attr('disabled', 'disabled');
        }
    }
};

Template.eventsDates.rendered = function() {
    $('.datepicker').datepicker({
        format: dateFormatDb
    }).on('changeDate', function(evt) {
        var elem = $(evt.target);

        elem.datepicker('hide');

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
};

Template.eventsDates.events = {
    'change #interval': function(evt) {
        var elem = $(evt.target);

        var interval = elem.val().split(' ');
        var amount = interval[0];
        var time = interval[1];

        var start = moment().startOf('day').format(dateFormatDb);
        var end = moment().add(amount, time).format(dateFormatDb);

        $('#start').val(start);
        $('#end').val(end);

        Session.set('start', start);
        Session.set('end', end);
    }
};

Template.eventsDates.helpers({
    start: function() {
        return Session.get('start');
    },
    end: function() {
        return Session.get('end');
    }
});

Template.eventsTable.events = {
    'click .delete': function () {
        if (confirm('Are you sure you want to delete this?')) {
            Events.remove(this._id);
        }
    },
    'click .edit': function () {
        var f = $('#add-event-form');
        var eventToEdit = Events.find({ _id: this._id}).fetch().shift();

        f.find('input, select').not('[type=submit]').val('');
        f.find('input[type=checkbox]').prop('checked', false);

        f.find('[name=_id]').val(eventToEdit._id);
        f.find('[name=name]').val(eventToEdit.name);
        f.find('[name=type]').val(eventToEdit.type);
        f.find('[name=date]').val(moment(eventToEdit.date).format(dateFormatDb));
        f.find('[name=amount]').val(eventToEdit.amount);

        if (eventToEdit.recurringInterval && eventToEdit.recurringCount) {
            $('#recurring').prop('checked', true);
            $('#recurring_fields').find('input,select').removeAttr('disabled');
            $('#recurring_fields_irregular').find('input,select').attr('disabled', 'disabled');
            $('#recurring_irregular').prop('checked', false);
            $('.until_date').find('input,select').removeAttr('disabled');
        }

        if (eventToEdit.recurringOrdinal && eventToEdit.recurringDay) {
            $('#recurring_irregular').prop('checked', true);
            $('#recurring_fields_irregular').find('input,select').removeAttr('disabled');
            $('#recurring_fields').find('input,select').attr('disabled', 'disabled');
            $('#recurring').prop('checked', false);
            $('.until_date').find('input,select').removeAttr('disabled');
        }

        if (eventToEdit.isSavings == true) {
            f.find('#is_savings').prop('checked', true);
        }

        if (eventToEdit.isDebt == true) {
            f.find('#is_debt').prop('checked', true);
        }

        if (eventToEdit.isAuto == true) {
            f.find('#is_auto').prop('checked', true);
        }

        f.find('[name=recurringCount]').val(eventToEdit.recurringCount);
        f.find('[name=recurringInterval]').val(eventToEdit.recurringInterval);
        f.find('[name=recurringOrdinal]').val(eventToEdit.recurringOrdinal);
        f.find('[name=recurringDay]').val(eventToEdit.recurringDay);
        f.find('[name=recurringUntil]').val(eventToEdit.recurringUntil);
        f.find('[name=recurringWeekdayOnly]').val(eventToEdit.recurringWeekdayOnly);
        $('#add-event-modal').modal('show');
    }
};

Template.eventsTable.helpers({
    calendarEvents: function() {
        return prettyAmounts(getEvents());
    }
});

Template.runTotalLineGraph.rendered = function() {
    Deps.autorun(function () {
        drawLineChart();
    });
};

Template.runTotalStats.helpers({
    lowestRunTotal: function() {
        return getStats()[0];
    },
    highestRunTotal: function() {
        return getStats()[1];
    },
    savings: function() {
        return getTotals()['savings'].toFixed(0);
    },
    debt: function() {
        return getTotals()['debt'].toFixed(0);
    },
    savingsPercent: function() {
        return getTotals()['savingsPercent'];
    },
    debtPercent: function() {
        return getTotals()['debtPercent'];
    }
});

Template.snapshot.events = {
    'blur #balance': function () {
        var value = $('#balance').val();

        // If an expression has been filled in (+/-) evaluate it
        if (value.indexOf('+') !== -1 || value.indexOf('-') !== -1) {
            value = eval(value);
        }

        if (isNaN(parseFloat(value))) {
            value = 0;
        } else {
            value = parseFloat(value);
        }

        // fix rounding errors - stupid floating point numbers...
        value = Math.round(value * 100) / 100;

        Session.set('balance', value);
    },
    'keydown #balance': function(e) {
        var isEnter = e.keyCode === 13;
        if (isEnter) {
            $(e.target).blur();
        }
    }
};

Template.snapshot.helpers({
    balance: function() {
        return Session.get('balance');
    },
    totalIncome: function () {
        return getTotals()['income'].toFixed(2);
    },
    totalExpenses: function () {
        return getTotals()['expenses'].toFixed(2);
    },
    difference: function () {
        var difference = getTotals()['income'] - getTotals()['expenses'];
        return difference.toFixed(2);
    }
});
