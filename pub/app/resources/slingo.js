$(document).ready(function  () {
    Backbone.View.prototype.getTemplate = function(url) {
        var defer = $.Deferred();
        var req = function(){
            $.ajax({
                url : url,
                type : 'GET',
                success: function(data){
                    defer.resolve(data);    
                }
            });
        }

        return defer.promise( req() );
    };

	var appView = new slingo.Views.AppView();
    

    /*
    $.ajax({
        url : 'http://translate-james.dev.grooveshark.com/api.php',
        // url : 'api.php',
        type : 'POST',
        data : JSON.stringify({
            'header' : '12',
            'method' : 'listAllProjects',
            'sessionID' : ''
        }),
        success: function(data) {
            slingo.debug(data);
        },

    });
    */

});