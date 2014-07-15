(function(){

    // send ajax request with cookies
    $.ajaxSetup({xhrFields:{withCredentials: true}});

    Backbone.View.prototype.getTemplate = function(url) {
        var deferred = $.Deferred();
        
        var req = function(){
            $.ajax({
                url : url,
                cache : true,
                type : 'GET',
                success: function(data){
                    deferred.resolve( _.template(data) );
                }
            });
        }
        return deferred.promise( req() );
    };

    Backbone.Collection.prototype.toJSONObject = function(){
        return $.map(this.models, function(model) {
            return model.toJSON();
        })
    };

    slingo.Views = slingo.Views || {};

    slingo.Views.template = Backbone.View.extend({
        el : 'body',

        initialize: function  () {
            this.applicationTpl = this.$('#application_tpl').html();
            this.headerTpl = this.$('#header_tpl').html();
            this.languageCollectionTpl = this.$('#languageCollection_tpl').html();
            this.adminUserTpl = this.$('#adminUser_tpl').html();
            this.adminProjectTpl = this.$('#adminProject_tpl').html();
            this.adminProjectFormTpl = this.$('#adminProjectForm_tpl').html();
            this.adminProjectEditTpl = this.$('#adminProjectEdit_tpl').html();
        }
    })

})();