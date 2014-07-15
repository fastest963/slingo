(function(){
    var slingoRouter = Backbone.Router.extend({
        routes : {
            '' : 'home',
            'adminUser' : 'adminUser',
            'adminProject' : 'adminProject',
            'adminProjectEdit' : 'adminProjectEdit',
            'adminProjectForm' : 'adminProjectForm',
            'translate/:proj/:lang' : 'languageTranslation',
            'user/:user' : 'userProfile'

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

        adminProjectEdit: function(){
            if(!this.application){
                this.application = new slingo.Views.application();
            }
            this.application.renderAdminProjectEdit ();
        },


        languageTranslation: function(proj, lang){

            if(!this.application){
                this.application = new slingo.Views.application();
            }
            this.application.renderLanguageCollection(proj, lang);
        },

        userProfile: function(user){
            slingo.debug("what");
            if(!this.application){
                this.application = new slingo.Views.application();
            }
            this.application.renderUserProfile(user);
        

        }
    });

    slingo.Router = new slingoRouter();
    Backbone.history.start();
})();