(function(){
    slingo.Views = slingo.Views || {};

    slingo.Views.languageCollection = Backbone.View.extend({
        templatePath: 'app/templates/language-collection.ejs',
        initialize: function(){
            this.render();
        },
        render: function(){
            this.projects = this.options.projects;
            this.urlAttrs = this.options.urlAttrs;
            this.tpl = this.options.tpl;

            this.$el.html( _.template(this.tpl.languageCollectionTpl)() );
            this.init();
            
        },
        events: {
            'submit #language-collection form' : 'fetchLanguage'
        },
        init : function  () {

            var $this = this;
            var project_select = this.$('#project-select').empty();
            var projects = $.each(this.projects.toJSON(), function(index, project){
                project_select.append('<option' + ($this.urlAttrs.proj === project.displayName ? ' selected="selected" ' : '')  + ' >' + project.displayName + '</option>');
            });

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