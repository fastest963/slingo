(function(){
    slingo.Views = slingo.Views || {};

    slingo.Views.application = Backbone.View.extend({
        el : '#main',
        templatePath: 'app/templates/application.ejs',
        initialize: function(options) {

            this.dfd = $.Deferred();
            this.isDfd = false;

            this.user = new slingo.Models.user();
            this.user.on('login', this.onLogin, this);

            /*
            var $this = this;
            this.dfd.promise( this.renderHome() ).then(function(scope){
                
                if(scope.dfdChain.length > 0){
                    var fn = scope[scope.dfdChain[0]];
                    fn.apply(scope, null);
                    scope.dfdChain = [];
                }
            });
            */ 

        },
        renderHome: function() {

            var $this = this;
            
            if(!this.template){
                this.getTemplate(this.templatePath).done(function(template){
                    $this.template = template;
                    $this.$el.html(template($this.user.toJSON()));
                    $this.init();
                });
            }else{
                this.$el.html(this.template(this.user.toJSON()));
                $this.init();
            }

            if(this.isDfd){
                this.dfd.resolve();
                this.isDfd = false;
            }

        },
        renderAdminUser: function(){

            var $this = this;

            if(!this.bodyContainer){
                this.isDfd = true;
                this.dfd.promise( this.renderHome() ).done(function(){
                    if(!$this.adminUserTemplate){
                        $this.getTemplate('app/templates/admin-user.ejs').done(function(template){
                            $this.adminUserTemplate = template;
                            $this.bodyContainer.html($this.adminUserTemplate());
                        });
                    }else{
                        $this.bodyContainer.html($this.adminUserTemplate());
                    }
                });
            }else{
                if(!this.adminUserTemplate){
                    this.getTemplate('app/templates/admin-user.ejs').done(function(template){
                        $this.adminUserTemplate = template;
                        $this.bodyContainer.html($this.adminUserTemplate());
                    });
                }else{
                    this.bodyContainer.html(this.adminUserTemplate());
                }
            }

        },

        renderAdminProject: function(){

            var $this = this;


            if(!this.bodyContainer){
                this.isDfd = true;
                this.dfd.promise( this.renderHome() ).done(function(){
                    if(!$this.adminProjectTemplate){
                        $this.getTemplate('app/templates/admin-project.ejs').done(function(template){
                            $this.adminProjectTemplate = template;
                            $this.bodyContainer.html($this.adminProjectTemplate());
                        });
                    }else{
                        $this.bodyContainer.html(this.adminProjectTemplate());
                    }
                });
            }else{
                if(!this.adminProjectTemplate){
                    this.getTemplate('app/templates/admin-project.ejs').done(function(template){
                        $this.adminProjectTemplate = template;
                        $this.bodyContainer.html($this.adminProjectTemplate());
                    });
                }else{
                    this.bodyContainer.html(this.adminProjectTemplate());
                }
            }

            

            
        },

        renderAdminProjectForm: function(){

            var $this = this;

            if(!this.bodyContainer){
                this.isDfd = true;
                this.dfd.promise( this.renderHome() ).done(function(){
                    if(!$this.adminProjectFormTemplate){
                        $this.getTemplate('app/templates/admin-project-form.ejs').done(function(template){
                            $this.adminProjectFormTemplate = template;
                            $this.bodyContainer.html($this.adminProjectFormTemplate());
                        });
                    }else{
                        $this.bodyContainer.html(this.adminProjectFormTemplate());
                    }
                });
            }else{
                if(!this.adminProjectFormTemplate){
                    this.getTemplate('app/templates/admin-project-form.ejs').done(function(template){
                        $this.adminProjectFormTemplate = template;
                        $this.bodyContainer.html($this.adminProjectFormTemplate());
                    });
                }else{
                    this.bodyContainer.html(this.adminProjectFormTemplate());
                }
            }

            

            
        },

        renderHeader: function(){
            this.header.render();
        },
        init: function  () {
            
            if(!this.header){
              this.header = new slingo.Views.header({el : '#header', user: this.user});
             }else{
                 $('#header').html(this.header.el);
             }
            this.bodyContainer = this.$('#body');
            this.footerContainer = this.$('#footer');

            //this.dfd.resolve(this);
        },
        events: {
            'click #getProjects' : 'getProjects',
            'click #logout' : 'logout',
            'click #createProject' : 'createProject',
            'click #createLanguage' : 'createLanguage'
        },
        getProjects: function() {
            $.ajax({
                url : slingo.API_ENDPOINT,
                type : 'POST',
                data : JSON.stringify({
                    'header' : '12',
                    'method' : 'listAllProjects'
                }),
                success: function(data) {
                    slingo.debug(data);
                }
            });
        },
        logout: function() {
            $.ajax({
                url : slingo.API_ENDPOINT,
                type : 'POST',
                data : JSON.stringify({
                    'sessionID': '1234',
                    'submitType': 'call',
                    'method': 'logout',
                    'header': '1233'
                }),
                success: function(data) {
                    slingo.debug(data);
                }
            });
        },
        createProject: function(e) {
            e.preventDefault();

            var $this = this;
            var name = this.$('#param-name').val();
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
                        $this.user.set(data.project);
                        // $this.user.trigger('login');
                    }else{
                        error_message.html('No project was created');
                    }
                    submit_button.removeAttr('disabled');
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