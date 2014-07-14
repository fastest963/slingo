(function(){
    
    slingo.Collections = slingo.Collections || {};

    slingo.Collections.projects = Backbone.Collection.extend({

        url : slingo.API_ENDPOINT,

        model : slingo.Models.project,

        parse : function(response) {
            //delete response.errorCode;
            
            var result = [];
            for(var project in response.projects){
                result.push(project);
            }
            
            return result;
        },

    });

})();