(function(){
    slingo.Views = slingo.Views || {};

    slingo.Views.application = Backbone.View.extend({
        el : '#main',
        templatePath: 'app/templates/application.ejs',
        initialize: function(options) {

            this.user = new slingo.Models.user();
            this.user.on('login', this.onLogin, this);

        },
        renderHome: function() {

            $this = this;
            
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

        },
        renderAdmin: function(){

            $this = this;

            this.getTemplate('app/templates/admin.ejs').done(function(template){
                $this.body.html(template());
            });
        },
        renderHeader: function(){
            this.header.render();
        },
        init: function  () {
            
            this.header = new slingo.Views.header({el : '#header', user: this.user});
            this.body = this.$('#body');
            this.footer = this.$('#footer');
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
        createProject: function() {
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
                success: function(data) {
                    slingo.debug(data);
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
        }

    });
})();