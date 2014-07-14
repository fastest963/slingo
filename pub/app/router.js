(function(){
    var slingoRouter = Backbone.Router.extend({
        routes : {
            '' : 'home',
            'adminUser' : 'adminUser',
            'adminProject' : 'adminProject',

            'adminProjectForm' : 'adminProjectForm',
            'translate/:proj/:lang' : 'languageTranslation'

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

        adminProjectForm: function(){
            if(!this.application){
                this.application = new slingo.Views.application();
            }
            this.application.renderAdminProjectForm ();
        },

        languageTranslation: function(proj, lang){
            if(!this.application){
                this.application = new slingo.Views.application();
            }
            this.application.renderLanguageCollection(proj, lang);
        }
    });

    slingo.Router = new slingoRouter();
    Backbone.history.start();
})();