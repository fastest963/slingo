(function(){
    slingo.Views = slingo.Views || {};

    slingo.Views.userProfile = Backbone.View.extend({
        templatePath: 'app/templates/language-collection.ejs',
        initialize: function(){
            this.render();
        },
        render: function(){
            this.urlAttrs = this.options.urlAttrs;
            this.tpl = this.options.tpl;

            this.$el.html( _.template(this.tpl.languageCollectionTpl)() );
            this.init();
            
        },
        events: {
            'click #profile' : 'fetch'
        },

        fetch: function(e){
            e.preventDefault();

            var $this = this;
            var user = this.user.getCached(username);
            slingo.Router.navigate('user/' + user);
        }
    });
})();