(function(){
    slingo.Views = slingo.Views || {};

    slingo.Views.AppView = Backbone.View.extend({
        el : '#body',
        template: 'app/templates/app/AppView.ejs',
        initialize: function(options) {
            this.render();
        },
        render: function() {
            $this = this;
            
            this.getTemplate(this.template).done(function(data){
                $this.$el.html( data );
                $this.init();
            });
        },
        init: function  () {
            this.header = new slingo.Views.header({el : '#header'});
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
                // url : 'api.php',
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
                // url : 'api.php',
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
                // url : 'api.php',
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
                // url : 'api.php',
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
        login: function(){
            alert('will login now');
        }
    });
})();