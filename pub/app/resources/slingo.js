$(document).ready(function  () {

    $(".btn-popover-container").each(function() {
        var btn = $(this).children(".popover-btn");
        var titleContainer = $(this).children(".btn-popover-title");
        var contentContainer = $(this).children(".btn-popover-content");

        var title = $(titleContainer).html();
        var content = $(contentContainer).html();

        $(btn).popover({
            html: true,
            title: title,
            content: content,
            placement: 'bottom'
        });
    });

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