(function(){
    var slingoRouter = Backbone.Router.extend({
        routes : {
            '' : 'home',
            'admin' : 'admin'
        },
        home: function(){
            if(!this.application){
                this.application = new slingo.Views.application();
            }
            this.application.renderHome();
        },
        admin: function(){
            if(!this.application){
                this.application = new slingo.Views.application();
            }
            this.application.renderAdmin();
        }
    });

    slingo.Router = new slingoRouter();
    Backbone.history.start();
})();