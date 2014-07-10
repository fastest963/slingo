<?php
	
?>
<html>
<head>
    <title></title>
</head>
<body>
    <link rel="stylesheet" href="//fonts.googleapis.com/css?family=Open+Sans:400,600,700">
    <link href="webincludes/css/bootstrap.min.css" rel="stylesheet">
    <link href="webincludes/css/bootstrap.css" rel="stylesheet">
    <link href="webincludes/css/style.css" rel="stylesheet">
    <div id="body">
    </div>
    <script>
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
        slingo.API_ENDPOINT = 'http://translate-james.dev.grooveshark.com/api.php';
        // slingo.API_ENDPOINT = 'api.php';
    </script>
    <script type="text/javascript" src="app/resources/jquery.js"></script>
    <script type="text/javascript" src="app/resources/underscore.js"></script>
    <script type="text/javascript" src="app/resources/lodash.js"></script>
    <script type="text/javascript" src="app/resources/bedrock.js"></script>
    <script type="text/javascript" src="app/resources/backbone.js"></script>
    <script type="text/javascript" src="app/views/header.js"></script>
    <script type="text/javascript" src="app/views/AppView.js"></script>
    <script type="text/javascript" src="app/resources/slingo.js"></script>
    <script type="text/javascript" src="webincludes/js/bootstrap.min.js"></script>
    <script type="text/javascript" src="webincludes/js/bootstrap-typeahead.js"></script>
</body>
</html>