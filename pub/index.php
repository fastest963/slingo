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
            function getErrorObject(){
                try { throw Error('') } catch(err) { return err; }
            }

            var err = getErrorObject();
            var caller_line = err.stack.split("\n")[4];
            var index = caller_line.indexOf("(");
            var clean = caller_line.slice(index+1, caller_line.length-1);
            if (window.console && window.console.log && slingo.DEBUG_MODE) {
                for (var i=0; i<arguments.length; i++) {
                    console.log(arguments[i]);
                }
                console.log('%c'+clean, 'background: #46be9c; color: #ff643b')
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
    <script type="text/javascript" src="app/views/project.js"></script>
    <script type="text/javascript" src="app/views/adminProject.js"></script>
    <script type="text/javascript" src="app/views/languageCollection.js"></script>
    <script type="text/javascript" src="app/views/application.js"></script>
    
    <script type="text/javascript" src="app/router.js"></script>
</body>
</html>