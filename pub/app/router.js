(function(){
    var slingoRouter = Backbone.Router.extend({
        routes : {
            '' : 'home',
            'adminUser' : 'adminUser',
            'adminProject' : 'adminProject',
            'adminProjectEdit' : 'adminProjectEdit',
            'adminProjectForm' : 'adminProjectForm',
            'translate/:proj/:lang' : 'languageTranslation',
            'user/:user' : 'profile',
            'project/:project' : 'projectDetails'

        },
        home: function(){
            if(!this.application){
                this.application = new slingo.Views.application();
                this.application.load('renderHome');
            }else{
                this.application.renderHome();
            }
        },
        adminUser: function(){
            if(!this.application){
                this.application = new slingo.Views.application();
                this.application.load('renderAdminUser');
            }else{
                this.application.renderAdminUser();
            }
        },
        adminProject: function(){
            if(!this.application){
                this.application = new slingo.Views.application();
                this.application.load('renderAdminProject');
            }else{
                this.application.renderAdminProject();
            }
        },

        adminProjectForm: function(){
            if(!this.application){
                this.application = new slingo.Views.application();
                this.application.load('renderAdminProjectForm');
            }else{
                this.application.renderAdminProjectForm ();
            }
        },

        adminProjectEdit: function(){
            if(!this.application){
                this.application = new slingo.Views.application();
                this.application.load('renderAdminProjectEdit');
            }else{
                this.application.renderAdminProjectEdit ();
            }
        },

        languageTranslation: function(proj, lang){

            if(!this.application){
                this.application = new slingo.Views.application();
                this.application.load('renderLanguageCollection', [proj, lang]);
            }else{
                this.application.renderLanguageCollection(proj, lang);

            }
        },
        
        profile: function(user){

            if(!this.application){
                this.application = new slingo.Views.application();
                this.application.load('renderProfile' , user);
            }else{
            this.application.renderProfile(user);

            }

        },
        projectDetails: function(project){
  

            if(!this.application){
                this.application = new slingo.Views.application();
                this.application.load('renderProject', project);
            }else{
            this.application.renderProject(project);

            }

        }
    });

    slingo.Router = new slingoRouter();
    Backbone.history.start();
})();