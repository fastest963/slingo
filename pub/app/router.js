(function(){
    var slingoRouter = Backbone.Router.extend({
        routes : {
            '' : 'home',
            'admin' : 'admin'
        },
        home: function(){
            this.application = new slingo.Views.application();
        },
        admin: function(){
            this.application.renderAdmin();
        }
    });

    slingo.Router = new slingoRouter();
    Backbone.history.start();
})();