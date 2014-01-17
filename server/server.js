Meteor.publish('events', function() {
    return Events.find({
        userId: this.userId
    });
});

Meteor.startup(function() {
    Events.allow({
        insert: function(userId, evt) {
            return true;
        },
        remove: function(userId, evt) {
            if (evt.userId === userId) {
                return true;
            }
        }
    });
});