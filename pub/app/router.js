(function(){
    var slingoRouter = Backbone.Router.extend({
        routes : {
            '' : 'home',
            'adminUser' : 'adminUser',
            'adminProject' : 'adminProject',
            'translate/:lang' : 'languageTranslation'
        },
        home: function(){
            if(!this.application){
                this.application = new slingo.Views.application();
            }
            this.application.renderHome();
        },
        adminUser: function(){
            if(!this.application){
                this.application = new slingo.Views.application();
            }
            this.application.renderAdminUser();
        },
        adminProject: function(){
            if(!this.application){
                this.application = new slingo.Views.application();
            }
            this.application.renderAdminProject();
        },
        languageTranslation: function(lang){
            if(!this.application){
                this.application = new slingo.Views.application();
            }
            this.application.renderLanguageCollection(lang);
        }
    });

    slingo.Router = new slingoRouter();
    Backbone.history.start();
})();