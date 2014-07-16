(function(){
    slingo.Views = slingo.Views || {};

    slingo.Views.application = Backbone.View.extend({
        el : '#main',
        templatePath: 'app/templates/application.ejs',
        initialize: function(options) {

            this.tpl = new slingo.Views.template();

            this.dfd = $.Deferred();
            this.dfd2 = $.Deferred();
            this.isDfd = false;
            this.user = new slingo.Models.user();
            this.project = new slingo.Models.project();

            this.projects = new slingo.Collections.projects();

            this.user.on('login', this.onLogin, this);
            this.user.on('logout', this.onLogout, this);

        },
        events: {
            'click #getProjects' : 'getProjects',
            'click #createLanguage' : 'createLanguage',
            'click #translate-submit' : 'translate',
            'submit #project-form' : 'createProject',

        },
        translate: function(e){
            e.preventDefault();

            var proj = this.$('#project-input').val();
            var lang = this.$('#language-input').val();

            slingo.Router.navigate('translate/' + proj + '/' + lang, {trigger: true});
        },
        renderHome: function(obj) {

            var $this = this;
            var attrs = $this.user.toJSON();
            
            if(obj){
                for(key in obj){
                   if (obj.hasOwnProperty(key)) {
                       attrs[key] = obj[key];
                   }
                }
            }else{
                attrs['proj'] = '';
                attrs['lang'] = '';
            }
            
            this.$el.html(_.template( this.tpl.applicationTpl )(attrs))
            this.init();

        },
        renderAdminUser: function(){

            var $this = this;
            
            if(!this.bodyContainer){
                this.isDfd = true;
                this.dfd.promise( this.renderHome() ).done(function(){
                    $this.bodyContainer.html( _.template( $this.tpl.adminUserTpl ));
                });
            }else{
                $this.bodyContainer.html( _.template( $this.tpl.adminUserTpl ));
            }

        },
        renderAdminProject: function(){ 

            var $this = this;
            
            if(!this.bodyContainer){
                this.isDfd = true;
                this.dfd.promise( this.renderHome() ).done(function(data){

                    /* new view */

                    if(!$this.adminProject){
                        $this.adminProject = new slingo.Views.adminProject({ el: $this.bodyContainer, tpl: $this.tpl, projects : $this.projects});
                    }else{
                        $this.adminProject.render();
                    }

                    //$this.bodyContainer.html( _.template( $this.tpl.adminProjectTpl )(attrs) );


                    //attrs.projects = $this.projects.toJSONObject();
                    //$this.bodyContainer.html( _.template( $this.tpl.adminProjectTpl )(attrs) );
                });
            }else{
                this.isDfd = true;
                this.dfd.promise( this.getProjects() ).done(function() {
                    attrs.projects = $this.projects.toJSONObject();
                    $this.bodyContainer.html( _.template( $this.tpl.adminProjectTpl )() );                    
                })
            }
            
        },
        renderLanguageCollection: function(proj, lang){

            var $this = this;
            var attrs = {'proj': proj, 'lang': lang};

            if(!this.bodyContainer){
                this.isDfd = true;
                this.dfd.promise( this.renderHome(attrs) ).done(function(){
                    if(!$this.languageCollection){
                        $this.languageCollection = new slingo.Views.languageCollection({ projects : $this.projects, urlAttrs : attrs, tpl : $this.tpl});
                        $this.bodyContainer.append($this.languageCollection.el);
                    }else{
                        $this.languageCollection.options.projects = $this.projects;
                        $this.languageCollection.options.urlAttrs = attrs;
                        this.languageCollection.render();
                        $this.bodyContainer.append(this.languageCollection.el);
                    }
                });
            }else{
                if(!$this.languageCollection){
                    $this.languageCollection = new slingo.Views.languageCollection({ projects : $this.projects, urlAttrs : attrs, tpl : $this.tpl});
                    $this.bodyContainer.append($this.languageCollection.el);
                }else{
                    $this.languageCollection.options.projects = $this.projects;
                    $this.languageCollection.options.urlAttrs = attrs;
                    this.languageCollection.render();
                    $this.bodyContainer.append($this.languageCollection.el);
                }
            }
        },


        renderAdminProjectForm: function(){

            var $this = this;

            if(!this.bodyContainer){
                this.isDfd = true;
                this.dfd.promise( this.renderHome() ).done(function(){
                    $this.bodyContainer.html( _.template( this.tpl.adminProjectFormTpl )() );
                });
            }else{
                $this.bodyContainer.html( _.template( this.tpl.adminProjectFormTpl )() );
            }

        },
        renderAdminProjectEdit: function(){

            var $this = this;

            if(!this.bodyContainer){
                this.isDfd = true;
                this.dfd.promise( this.renderHome() ).done(function(){
                    $this.bodyContainer.html( _.template( this.tpl.adminProjectEditTpl )() );
                });
            }else{
                $this.bodyContainer.html( _.template( this.tpl.adminProjectEditTpl )() );
            }

        },

        renderHeader: function(){
            this.header.render();
        },

        init: function  () {
            var $this = this;

            this.bodyContainer = this.$('#body');
            this.footerContainer = this.$('#footer');

            if(!$this.header){
                this.header = new slingo.Views.header({el : '#header', user: $this.user, tpl: this.tpl}); 
            }else{
                $('#header').html($this.header.el);
            }

            this.getProjects();

        },
        getProjects: function() {

            var $this = this;
            var project_input = this.$('#project-input');

            if(!this.projects || this.projects.length == 0){

                this.projects.fetch({data: JSON.stringify({method: 'listAllProjects', 'header' : {}}), type: 'POST'}).done(function  (data, success, xhr) {
                    
                    var projs = $.map($this.projects.toJSON(), function(v){return v.displayName;});
                    project_input.data('source', projs);

                    if($this.isDfd){
                        $this.isDfd = false;
                        $this.dfd.resolve($this);
                    }

                });
            }else{
                
                var projs = $.map($this.projects.toJSON(), function(v){return v.displayName;});
                project_input.data('source', projs);
                
                if($this.isDfd){
                    $this.isDfd = false;
                    $this.dfd.resolve($this);
                }
            }
            
        },

        createProject: function(e) {
            e.preventDefault();

            var $this = this;
            var name = this.$('#param-projectname').val();
            var error_message = this.$('.form-error-message');
            var submit_button = this.$('button');
            submit_button.attr('disabled', 'disabled');
            error_message.html('');
            $.ajax({
                url : slingo.API_ENDPOINT,
                type : 'POST',
                data : JSON.stringify({
                    'sessionID': '1234',
                    'submitType': 'call',
                    'method': 'createProject',
                    'header': '1233',
                    'params': {
                        'name' : 'Name of project',
                        'everyonePermissions' : 'permissions'
                    }
                }),
                    success: function(data){
                    data = JSON.parse(data);
                    if(data.success === true){
                        alert (name + " has been created ");
                        slingo.Router.navigate('adminProject', {trigger: true});


                    }else{
                        error_message.html('No project was created');
                    }
                    submit_button.removeAttr('disabled');
             }
            });
        
        },
        
        createLanguage: function(e) {
            e.preventDefault();

            var $this = this;
            var name = this.$('#param-languagename').val();
            var error_message = this.$('.form-error-message');
            var submit_button = this.$('button');
            submit_button.attr('disabled', 'disabled');
            error_message.html('');
            $.ajax({
                url : slingo.API_ENDPOINT,
                type : 'POST',
                data : JSON.stringify({
                    'sessionID': '1234',
                    'submitType': 'call',
                    'method': 'createLanguage',
                    'header': '1233',
                    'params': {
                        'name' : 'Name of language',
                        'projectID' : 'projectID',
                        'everyonePermission' : 'everyonePermission'
                    }
                }),
                success: function(data) {
                data = JSON.parse(data);
                if(data.success === true){
                    alert (name + " has been created ");
                    slingo.Router.navigate('adminProjectEdit', {trigger: true});


                }else{
                    error_message.html('No project was created');
                }
                submit_button.removeAttr('disabled');
                }
            });
        },
        onLogin: function(){
            this.renderHeader();
        },

        onLogout: function(){
            this.user.clear().set(this.user.defaults);
            this.renderHeader();
            slingo.Router.navigate('/', {trigger : true});
        },
        load: function(view, options) {
            var $this = this;
            this.isDfd = true;
            this.dfd.promise( this.checkLogin() ).then(function(data) {

                $this.dfd = $.Deferred();

                if(data.userID == null){
                    slingo.Router.navigate('/');
                    $this.renderHome();
                }else{
                    $this.user.set(data);
                    $this[view].call($this, options);
                }
            });

        },


        renderProfile: function(user){
            
            var $this = this;

            if(!this.bodyContainer){
                this.isDfd = true;
                this.dfd.promise( this.renderHome() ).done(function(){

                    $this.bodyContainer.html( _.template( $this.tpl.profileTpl )(user) );

                });
            }else{

                $this.bodyContainer.html( _.template( $this.tpl.profileTpl  )(user) );

            }

        },

        renderProject: function(project){
            
            var $this = this;

            if(!this.bodyContainer){
                this.isDfd = true;
                this.dfd.promise( this.renderHome() ).done(function(){

                    $this.bodyContainer.html( _.template( $this.tpl.adminProjectEditTpl )(profile) );

                });
            }else{

                $this.bodyContainer.html( _.template( $this.tpl.adminProjectEditTpl  )(profile) );

            }

        },

        fetchProject: function(e){
            e.preventDefault();

            var $this = this;
            var project = this.project.get("displayName");
            slingo.Router.navigate('project/' + project, {trigger: true});
        
        },

        checkLogin: function() {

            var $this = this;
            $.ajax({
                url : slingo.API_ENDPOINT,
                type : 'POST',
                data : JSON.stringify({
                    'method': 'getLoggedInUser',
                    'header' : {},
                    'params' : {}
                }),
                success: function(data) {
                    data = JSON.parse(data);
                    $this.isDfd = false;
                    $this.dfd.resolve(data);
                }
            });
        }

    });
})();