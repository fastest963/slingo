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

    <nav id="header" class="navbar navbar-inverse navbar-fixed-top" role="navigation">
        <div class="container">
            <div class="container-fluid">
                <div class="navbar-header">
                  <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
                    <span class="sr-only">Toggle navigation</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                  </button>
                  <a class="navbar-brand" href="#">Grooveshark Translate</a>
                </div>
                <div class="navbar-collapse collapse">
                  <ul class="nav navbar-nav navbar-right">
                    <li><a href="#">Dashboard</a></li>
                    <li><a href="#">Admin</a></li>
                    <li><a href="#">Help</a></li>
                    <li id="login" data-toggle="popover"><a href="#">Login</a></li>
                    <div class="btn-popover-container">
                        <div class="btn-popover-content">
                            <div class="container">
                                <form class="form-signin" role="form">
                                    <h4 class="form-signin-heading">Sign into GrooveShark</h4>
                                    Username or Email
                                    <input type="email" class="form-control" required autofocus>Password
                                    <input type="password" class="form-control" required>
                                    <div>
                                        <button class="btn btn-lg btn-primary btn-block" type="submit">Sign in</button>
                                    </div>
                                    <div class="signup">
                                        <p>No Account? <a href="http://t4.grooveshark.com/#!/signup/user" class="footer-link"> Sign up!</a>
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                  </ul>
                </div>
            </div>
        </div>
    </nav>
    
    <div id="body" class="jumbotron">
        <div class="container">
            <h1>The World's Music Player In Every Language</h1>
            <p>Do you speak multiple languages? Help make Grooveshark even better. Help make a difference right away!</p>
            <p>
                <input type="text" class="span3" style="margin: 0 auto;" data-provide="typeahead" placeholder="select a language" data-items="4" data-source='["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Dakota","North Carolina","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"]'>
                <a class="btn btn-primary btn-lg" role="button">Start</a>
            </p>
        </div>
    </div>

    <div class="container">
        <footer>
            <a href="http://grooveshark.com/#!/about/advertising" class="footer-link">Advertise</a>
            <span class="slash">/</span>
            <a href="http://store.grooveshark.com" class="footer-link" target="_blank">Merch </a>
            <span class="slash">/</span>
            <a href="http://grooveshark.com/#!/press" class="footer-link"> Press</a>
            <span class="slash">/</span>
            <a href="http://grooveshark.com/#!/careers" class="footer-link">Careers</a>
            <span class="slash">/</span>
            <a href="http://grooveshark.com/#!/legal/privacy" class="footer-link">Privacy</a>
            <span class="slash">/</span>
            <a href="http://grooveshark.com/#!/legal/dmca" class="footer-link">Copyrights</a> 
            <span class="slash">/</span>
            <a href="http://grooveshark.com/#!/legal/terms" class="footer-link">Terms</a>
            <span class="slash">/</span>
            <a href="http://help.grooveshark.com" class="footer-link" target="_blank" class="last-child">Help</a>

            <div class="social-links">
                <a href="http://www.supermaneddy.com" class="social-link" target="_blank">
                    <i class="icon icon-star"></i>
                    <span class="social-label" data-translate-text="IN_MEMORY">In memory</span>
                </a>
                <a href="http://www.facebook.com/grooveshark" class="social-link" target="_blank">
                    <i class="icon icon-facebook"></i>
                    <span class="social-label">Facebook</span>
                </a>
                <a class="last-child social-link" href="https://twitter.com/Grooveshark" target="_blank">
                    <i class="icon icon-twitter"></i>
                    <span class="social-label">Twitter</span>
                </a>
            </div>
            <div class="copyright">
                <span>&copy; 2014 Escape Media Group. </span><span> All Rights Reserved.</span>
            </div>
        </footer>
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
    <script type="text/javascript" src="app/views/AppView.js"></script>
    <script type="text/javascript" src="app/resources/slingo.js"></script>
    <script type="text/javascript" src="webincludes/js/bootstrap.min.js"></script>
    <script type="text/javascript" src="webincludes/js/bootstrap-typeahead.js"></script>
</body>
</html>