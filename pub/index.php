<html>
<head>
    <title></title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body>
    <link rel="stylesheet" href="//fonts.googleapis.com/css?family=Open+Sans:400,600,700">
    <link href="webincludes/css/bootstrap.min.css" rel="stylesheet">
    <link href="webincludes/css/bootstrap.css" rel="stylesheet">
    <link href="webincludes/css/style.css" rel="stylesheet">
    <div id="main">
    </div>
    
    <?php
    include_once('app/templates/global-template.html');
    ?>

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

    <script type="text/javascript" src="webincludes/js/bootstrap.min.js"></script>
    <script type="text/javascript" src="webincludes/js/bootstrap-typeahead.js"></script>

    <script type="text/javascript" src="app/resources/slingo.js"></script>
    <script type="text/javascript" src="app/models/user.js"></script>
    <script type="text/javascript" src="app/models/project.js"></script>
    <script type="text/javascript" src="app/collection/projects.js"></script>
    <script type="text/javascript" src="app/views/header.js"></script>
    <script type="text/javascript" src="app/views/languageCollection.js"></script>
    <script type="text/javascript" src="app/views/application.js"></script>
    
    <script type="text/javascript" src="app/router.js"></script>
</body>
</html>