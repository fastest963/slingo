(function(){

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

})();