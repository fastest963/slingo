(function(){
    
    slingo.Collections = slingo.Collections || {};

    slingo.Collections.projects = Backbone.Collection.extend({

        url : slingo.API_ENDPOINT,

        model : slingo.Models.project,

        parse : function(response) {
            var result = [];
            for(var project in response.projects){
                var p = response.projects[project];
                p.permissions = [];
                result.push(p);
            }
            
            return result;
        },

    });

})();