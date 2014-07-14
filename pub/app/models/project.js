(function(){
    
    slingo.Models = slingo.Models || {};

    slingo.Models.project = Backbone.Model.extend({

        defaults: {
            'name':'',
            'projectID':'',
            'languageID':'',
            'file':''

        },

        initialize: function(){
            // what ever you want to do when the model is created

        }

    });

})();