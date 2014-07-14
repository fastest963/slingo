(function(){
    slingo.Views = slingo.Views || {};

    slingo.Views.languageCollection = Backbone.View.extend({
        templatePath: 'app/templates/language-collection.ejs',
        initialize: function(){
            var $this = this;
            //setTimeout(function  () {
                $this.render();
            //},0);
            //this.render();
        },
        render: function(){
            $this = this;
            if(!this.template){
                this.getTemplate(this.templatePath).done(function(template){
                    //alert('called this ');
                    $this.template = template;
                    $this.$el.html( template() );
                    console.debug($this.el);
                });
             }else{
                this.$el.html(this.template());
             }
        },
        events: {
            'submit #language-collection form' : 'fetchLanguage'
        },
        fetchLanguage: function(e){
            e.preventDefault();

            var $this = this;
            var proj = this.$('#project-select').val();
            var lang = this.$('#language-select').val();
            /*
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
            */
            slingo.Router.navigate('translate/' + proj + '/' + lang);
        }
    });
})();