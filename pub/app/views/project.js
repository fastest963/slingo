(function(){
    slingo.Views = slingo.Views || {};

    slingo.Views.project = Backbone.View.extend({
        tagName : 'tr',
        initialize: function() {
            this.nextEl = this.options.nextEl;
            this.template = this.options.template;
            this.render();
        },
        render: function() {
            this.$el.html( _.template( this.template )( this.model.toJSON() ) );
        },
        events: {
            'click' : 'showProjectDetails'
        },
        showProjectDetails: function() {
            slingo.Router.navigate(this.model.id);
        }
    });
})();