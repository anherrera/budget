adjustCanvasDimensions = function() {
    var c = $('#runTotalLineGraphCanvas');
    var parent = c.parent();

    c.attr('height', parent.height());
    c.attr('width', parent.width());
};

drawLineChart = function() {
    adjustCanvasDimensions();

    var eventList = getEvents();
    var eventListCount = eventList.length;

    var labels = [];
    var data = [];
    for (var i = 0; i < eventListCount; i++) {
        var evt = eventList[i];

        labels.push('');
        data.push(evt.runTotal);
    }

    if (data.length) {

        var chartData = {
            labels: labels,
            responsive: true,
            scaleBeginAtZero: true,
            datasets: [
                {
                    fillColor: "rgba(55,220,55,0.5)",
                    strokeColor: "rgba(220,220,220,1)",
                    pointColor: "rgba(220,220,220,0)",
                    pointStrokeColor: "rgba(0,0,0,0)",
                    data: data
                }
            ]
        };

        var ctx = document.getElementById('runTotalLineGraphCanvas').getContext('2d');
        chartObj = new Chart(ctx).Line(chartData);
    }
};

/* pass in moment objects */
getEvents = function() {
    var events = Events.find({}).fetch();
    var runTotal = Session.get('balance') ? Session.get('balance') : 0;
    var eventList = [];

    var start = Session.get('start');
    var end = Session.get('end');
    start = moment(start);
    end = moment(end);

    $.each(events, function (idx, e) {
        var eventDate = moment(e.date);
        var untilDate = e.recurringUntil != '' ? moment(e.recurringUntil) : moment().endOf('year').add(1, 'year');
        var firstRun = true;

        if (typeof e.recurringInterval == 'undefined') {
            e.recurringInterval = '';
        }
        if (typeof e.recurringOrdinal == 'undefined') {
            e.recurringOrdinal = '';
        }
        if (typeof e.recurringOrdinal == 'undefined') {
            e.recurringOrdinal = '';
        }
        if (typeof e.recurringDay == 'undefined') {
            e.recurringDay = '';
        }

        if (typeof e.isAuto == 'undefined') {
            e.isAuto = false;
        }

        if (e.recurringInterval === '' && e.recurringOrdinal === '') {
            if (eventDate.isAfter(start) && eventDate.isBefore(end)) {
                var clone = Object.create(e);
                clone.isOriginal = true;
                eventList.push(clone);
            }
        }

        if (e.recurringOrdinal !== '' && e.recurringDay !== '') {
            var pointerDate = moment(eventDate).hours(0).minutes(0).seconds(0);

            while (pointerDate.isBefore(start)) {
                pointerDate = moment(pointerDate).add(1, 'days');
            }

            while (pointerDate.isBefore(end) && (pointerDate.isBefore(untilDate) || pointerDate.isSame(untilDate, 'day'))) {
                var matchDate = {};
                var year = pointerDate.year();
                var month = pointerDate.month();

                switch (e.recurringOrdinal) {
                    case 'First':

                        if (e.recurringDay === 'Day') {
                            matchDate = moment(new Date(year, month, 1));
                        } else if (e.recurringDay === 'Weekday') {
                            matchDate = moment(new Date(year, month, 1));
                            if (matchDate.day() === 0) {
                                matchDate = moment(matchDate).add(1, 'days');
                            }
                            if (matchDate.day() === 6) {
                                matchDate = moment(matchDate).add(2, 'days');
                            }
                        }

                        break;

                    case 'Last':

                        if (e.recurringDay === 'Day') {
                            matchDate = moment(new Date(year, month, 1)).endOf('month').hours(0).minutes(0).seconds(0);
                        } else if (e.recurringDay === 'Weekday') {
                            matchDate = moment(new Date(year, month, 1)).endOf('month').hours(0).minutes(0).seconds(0);
                            if (matchDate.day() === 0) {
                                matchDate = moment(matchDate).subtract('days', 2);
                            }
                            if (matchDate.day() === 6) {
                                matchDate = moment(matchDate).subtract('days', 1);
                            }
                        }

                        break;
                }

                if (pointerDate.isSame(matchDate, 'day')) {
                    var clone = Object.create(e);
                    clone.date = matchDate;

                    if (firstRun) {
                        clone.isOriginal = true;
                    } else {
                        clone._id = null;
                    }

                    eventList.push(clone);
                    firstRun = false;
                }

                pointerDate = moment(pointerDate).add(1, 'days');
            }
        } else if (e.recurringInterval !== '' && e.recurringCount !== '') {
            var pointerDate = moment(eventDate);

            while (pointerDate.isBefore(start)) {
                pointerDate = moment(pointerDate).add(e.recurringCount, e.recurringInterval);
            }

            while ((pointerDate.isBefore(end, 'day') || pointerDate.isSame(end, 'day')) && (pointerDate.isBefore(untilDate, 'day') || pointerDate.isSame(untilDate, 'day'))) {
                var matchDate = moment(pointerDate);

                if (e.recurringWeekdayOnly) {
                    if (matchDate.day() === 0) {
                        matchDate = moment(matchDate).subtract('days', 2);
                    }
                    if (matchDate.day() === 6) {
                        matchDate = moment(matchDate).subtract('days', 1);
                    }
                }

                if ((matchDate.isSame(start, 'day') || matchDate.isAfter(start)) && (matchDate.isSame(end, 'day') || matchDate.isBefore(end))) {
                    var clone = Object.create(e);
                    clone.date = matchDate;

                    if (firstRun) {
                        clone.isOriginal = true;
                    } else {
                        clone._id = null;
                    }

                    eventList.push(clone);

                    firstRun = false;
                }

                pointerDate = moment(pointerDate).add(e.recurringCount, e.recurringInterval);
            }
        }
    });

    eventList.sort(function (a, b) {
        if (moment(a.date).isSame(moment(b.date), 'day')) {
            return a.type == 'income' ? -1 : (a.type == b.type) ? 0 : 1;
        }
        return moment(a.date).isAfter(moment(b.date), 'day') ? 1 : -1;
    });

    $.each(eventList, function (idx, e) {
        runTotal = e.runTotal = runTotal + e.amount * (e.type == 'bill' ? -1 : 1);

        if (runTotal <= 0) {
            e.negativeRunTotal = true;
        }

        if (runTotal > 100 && runTotal <= 200) {
            e.warnRunTotal = true;
        }

        if (runTotal > 0 && runTotal <= 100) {
            e.lowRunTotal = true;
        }

        e.due = moment(e.date).fromNow();
        e.date = moment(e.date).format(dateFormatDb);
    });

    return eventList;
};

getTotals = function() {
    var totalIncome = Session.get('balance') ? Session.get('balance') : 0;
    var totalExpenses = 0;
    var totalDebtPayoff = 0;
    var totalSavings = 0;

    var events = getEvents();

    $.each(events, function(idx, e) {
        if (e.type == 'income') {
            totalIncome += parseFloat(e.amount);
        }

        if (e.type == 'bill') {
            totalExpenses += parseFloat(e.amount);
        }

        if (e.isSavings) {
            totalSavings += parseFloat(e.amount);
        }

        if (e.isDebt) {
            totalDebtPayoff += parseFloat(e.amount);
        }
    });

    return {
        'income': totalIncome,
        'expenses': totalExpenses,
        'savings': totalSavings,
        'debt': totalDebtPayoff,
        'savingsPercent': ((totalSavings / totalIncome) * 100).toFixed(1),
        'debtPercent': ((totalDebtPayoff / totalIncome) * 100).toFixed(1)
    }
};

getStats = function() {
    var min = 0;
    var max = 0;

    var runTotals = [];
    var events = getEvents();

    $.each(events, function(idx, e) {
        runTotals.push(e.runTotal);
    });

    min = Math.round(parseFloat(Math.min.apply(null, runTotals)) * 100) / 100;
    max = Math.round(parseFloat(Math.max.apply(null, runTotals)) * 100) / 100;

    return [min, max];
};

prettyAmounts = function(eventList) {
    $.each(eventList, function(idx, event) {
        eventList[idx]['amount'] = event.amount.toFixed(2);
        eventList[idx]['runTotal'] = event.runTotal.toFixed(2);
    });
    return eventList;
};
