(function(){
    Backbone.View.prototype.getTemplate = function(url) {
        var defer = $.Deferred();
        var req = function(){
            $.ajax({
                url : url,
                type : 'GET',
                success: function(data){
                    defer.resolve(_.template(data));
                }
            });
        }

        return defer.promise( req() );
    };

})();