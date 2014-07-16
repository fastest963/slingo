(function(){
    
    slingo.Models = slingo.Models || {};

    slingo.Models.language = Backbone.Model.extend({

        idAttribute : 'languageID',

        defaults: {
            'name':'',
            'languageID' : '',
            'projectID':'',
            'displayName' : '',
            'permissions' : [],
            'id' : ''

        },

        initialize: function(){
            // what ever you want to do when the model is created

        }

    });

})();