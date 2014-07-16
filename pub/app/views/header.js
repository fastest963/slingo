(function(){
    slingo.Views = slingo.Views || {};

    slingo.Views.header = Backbone.View.extend({
        templatePath: 'app/templates/header.ejs',
        initialize: function(){
            this.tpl = this.options.tpl;
            this.user = this.options.user;
            this.deferred = $.Deferred();
            this.render();
        },
        render: function(){

            this.$el.html(_.template( this.tpl.headerTpl )( this.user.toJSON() ) );
            this.init();
            this.delegateEvents();

            return this.el;
        },
        init: function(){

            this.$('#login').popover({
                html : true,
                trigger : 'click',
                placement: 'bottom',
                content : function(){
                   return $('#login-box').html();
                }
            });
        },
        events: {
            'click #login a' : 'stopAction',
            'click #logout' : 'logout',
            'click #profile' : 'profile',
            'click #dashboard, click #logo, click #help' : 'home',
            'submit #login-form' : 'login'
        },
        stopAction: function(e){
            e.preventDefault();
        },
        home: function(e) {
            e.preventDefault();

            slingo.Router.navigate('/', {trigger: true});
        },
        login: function(e){
            e.preventDefault();

            var $this = this;
            var username = this.$('#param-username').val();
            var password = this.$('#param-password').val();
            var error_message = this.$('.form-error-message');
            var submit_button = this.$('button');
            submit_button.attr('disabled', 'disabled');
            error_message.html('');

            $.ajax({
                url : slingo.API_ENDPOINT,
                // url : 'api.php',
                type : 'POST',
                data : JSON.stringify({
                    'header' : {},
                    'params' : {
                        'username': username,
                        'password': password,
                    },
                    'method' : 'login'
                }),
                success: function(data){
                    data = JSON.parse(data);
                    if(data.success === true){
                        $this.user.set(data.user);
                        $this.user.trigger('login');
                    }else{
                        error_message.html('Oh no! Wrong username/password combination.');
                    }
                    submit_button.removeAttr('disabled');
                }
            });
        },

        logout: function(e) {
            e.preventDefault();

            var $this = this;
            $.ajax({
                url : slingo.API_ENDPOINT,
                type : 'POST',
                data : JSON.stringify({
                    'params' : {},
                    'method': 'logout',
                    'header': {}
                }),
                success: function(data) {
                    $this.user.trigger('logout');
                }
            });
        },

        profile: function(e){
            e.preventDefault();

            var $this = this;
            var user = this.user.get("username");
            slingo.Router.navigate('user/' + user, {trigger: true});
        
        }
    });
})();