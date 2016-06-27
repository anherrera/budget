/* Global Variables and Functions */
chartObj = {};
dateFormatDb = 'YYYY-MM-DD';
eventsSubscription = Meteor.subscribe('events');

Session.set('start', moment().startOf('day').format(dateFormatDb));
Session.set('end', moment().endOf('day').add(1, 'months').format(dateFormatDb));

$(window).resize(function() {
    adjustCanvasDimensions();
    drawLineChart();
});