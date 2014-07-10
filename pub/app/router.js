(function(){
    var slingoRouter = Backbone.Router.extend({
        routes : {
            '' : 'home',
            'admin' : 'admin'
        },
        home: function(){
            appView = new slingo.Views.AppView();
        },
        admin: function(){
            appView.renderAdmin();
        }
    });

    slingo.Router = new slingoRouter();
    Backbone.history.start();
})();