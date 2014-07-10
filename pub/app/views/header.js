(function(){
    slingo.Views = slingo.Views || {};

    slingo.Views.header = Backbone.View.extend({
        initialize: function(){
            this.user = this.options.user;

            $('#login').popover({
                html : true,
                placement: 'bottom',
                content : function(){
                   return $('#login-box').html()
                }
            });

        },
        events: {
            'submit #login-form' : 'login'
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
                    'header' : '12',
                    'params' : {
                        'username': username,
                        'password': password,
                    },
                    'submitType' : 'call',
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
        }
    });
})();