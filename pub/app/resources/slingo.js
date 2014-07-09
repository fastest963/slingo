
(function  () {
	var slingo = window.slingo = {
		DEBUG_MODE : true
	};

	slingo.debug = window.debug = function()
    {
        if (window.console && window.console.log && slingo.DEBUG_MODE) {
            for (var i=0; i<arguments.length; i++) {
                console.log(arguments[i]);
            }
        }
    }

    var slingoRouter = Bedrock.Router.extend({
		routes : {
			"" : "home"
		}
	});

	slingo.Router = new slingoRouter();

	slingo.Views = slingo.Views || {};

    slingo.Views.AppView = Backbone.View.extend({
    	el : document.body,
    	templatePath : 'app',
    	initialize: function(options) {
    		this.render();
    	},
    	render: function() {
    		this.$el.html( $('#appTpl').html() );
    	}
	});
   
    $(document).ready(function  () {
    	slingo.debug("document ready");
    	var appView = new slingo.Views.AppView();

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

        })

    });

})();