(function(){
    slingo.Views = slingo.Views || {};

    slingo.Views.application = Backbone.View.extend({
        el : '#main',
        templatePath: 'app/templates/application.ejs',
        initialize: function(options) {

            this.tpl = new slingo.Views.template();

            this.dfd = $.Deferred();
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
                    /*
                    if(!$this.adminUserTemplate){
                        $this.getTemplate('app/templates/admin-user.ejs').done(function(template){
                            $this.adminUserTemplate = template;
                            $this.bodyContainer.html($this.adminUserTemplate());
                        });
                    }else{
                        $this.bodyContainer.html($this.adminUserTemplate());
                    }
                    */
                });
            }else{
                $this.bodyContainer.html( _.template( $this.tpl.adminUserTpl ));
                /*
                if(!this.adminUserTemplate){
                    this.getTemplate('app/templates/admin-user.ejs').done(function(template){
                        $this.adminUserTemplate = template;
                        $this.bodyContainer.html($this.adminUserTemplate());
                    });
                }else{
                    this.bodyContainer.html(this.adminUserTemplate());
                }
                */
            }

        },
        renderAdminProject: function(){ 
            var $this = this;
            var attr = {'projects':this.projects.toJSON() };


            if(!this.bodyContainer){
                this.isDfd = true;
                this.dfd.promise( this.renderHome() ).done(function(){

                    slingo.debug("protein");

                    $this.bodyContainer.html( _.template( $this.tpl.adminProjectTpl )(attr) );
                    /*
>>>>>>> c3f5d59c68587596399d93be1dd830cbc22f59f0
                    if(!$this.adminProjectTemplate){
                        $this.getTemplate('app/templates/admin-project.ejs').done(function(template){
                            $this.adminProjectTemplate = template;
                            slingo.debug(attr);
                            $this.bodyContainer.html($this.adminProjectTemplate(attr));
                        });
                    }else{
                        $this.bodyContainer.html(this.adminProjectTemplate());
                    }
                    */
                });
            }else{
                $this.bodyContainer.html( _.template( this.tpl.adminProjectTpl )() );
                /*
                if(!this.adminProjectTemplate){
                    this.getTemplate('app/templates/admin-project.ejs').done(function(template){
                        $this.adminProjectTemplate = template;
                        $this.bodyContainer.html($this.adminProjectTemplate());
                    });
                }else{
                    this.bodyContainer.html(this.adminProjectTemplate());
                }
                */
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

                    /*
                    if(!$this.adminProjectFormTemplate){
                        $this.getTemplate('app/templates/admin-project-form.ejs').done(function(template){
                            $this.adminProjectFormTemplate = template;
                            $this.bodyContainer.html($this.adminProjectFormTemplate());
                        });
                    }else{
                        $this.bodyContainer.html(this.adminProjectFormTemplate());
                    }
                    */
                });
            }else{

                $this.bodyContainer.html( _.template( this.tpl.adminProjectFormTpl )() );

                /*
                if(!this.adminProjectFormTemplate){
                    this.getTemplate('app/templates/admin-project-form.ejs').done(function(template){
                        $this.adminProjectFormTemplate = template;
                        $this.bodyContainer.html($this.adminProjectFormTemplate());
                    });
                }else{
                    this.bodyContainer.html(this.adminProjectFormTemplate());
                }
                */
            }

        },
        renderAdminProjectEdit: function(){

            var $this = this;

            if(!this.bodyContainer){
                this.isDfd = true;
                this.dfd.promise( this.renderHome() ).done(function(){

                    $this.bodyContainer.html( _.template( this.tpl.adminProjectEditTpl )() );

                    /*
                    if(!$this.adminProjectEditTemplate){
                        $this.getTemplate('app/templates/admin-project-edit.ejs').done(function(template){
                            $this.adminProjectEditTemplate = template;
                            $this.bodyContainer.html($this.adminProjectEditTemplate());
                        });
                    }else{
                        $this.bodyContainer.html(this.adminProjectEditTemplate());
                    }
                    */
                });
            }else{

                $this.bodyContainer.html( _.template( this.tpl.adminProjectEditTpl )() );

                /*
                if(!this.adminProjectEditTemplate){
                    this.getTemplate('app/templates/admin-project-edit.ejs').done(function(template){
                        $this.adminProjectEditTemplate = template;
                        $this.bodyContainer.html($this.adminProjectEditTemplate());
                    });
                }else{
                    this.bodyContainer.html(this.adminProjectEditTemplate());
                }
                */
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
            slingo.debug("bag");

            var $this = this;
            var project_input = this.$('#project-input');

            if(!this.projects || this.projects.length == 0){

                this.projects.fetch({data: JSON.stringify({method: 'listAllProjects', 'header' : '12'}), type: 'POST'}).done(function  (data, success, xhr) {
                    
                    var projs = $.map($this.projects.toJSON(), function(v){return v.displayName;});
                    project_input.data('source', projs);

                    if($this.isDfd){
                        $this.dfd.resolve($this);
                        $this.isDfd = false;
                    }

                });
            }else{
                var projs = $.map($this.projects.toJSON(), function(v){return v.displayName;});
                project_input.data('source', projs);
                if($this.isDfd){
                    slingo.debug("something");
                    slingo.debug($this.projects);
                        $this.dfd.resolve($this);
                        $this.isDfd = false;
                    } 

                if($this.isDfd){
                    $this.dfd.resolve($this);
                    $this.isDfd = false;
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
        
        createLanguage: function() {
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
                    slingo.debug(data);
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
        load: function(view) {
            this.dfdChain.push(view);

            this.dfd.promise( this.renderHome() ).then(function(scope){
                
                if(scope.dfdChain.length > 0){
                    var fn = scope[scope.dfdChain[0]];
                    fn.apply(scope, null);
                    scope.dfdChain = [];
                }
            });

        }

    });
})();