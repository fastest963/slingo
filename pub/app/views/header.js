Skip to content
 
This repository 
Explore
Gist
Blog
Help
Sangha Lee sanghal
 
 
1  Unwatch 
  Star 0
 Fork 2PUBLICsanghal/slingo
forked from fastest963/slingo
 branch: master   slingo / pub / app / views / application.js
Dhiraj Bodicherla dhirajbodicherla an hour ago 1. header improvements
1 contributor
 file  135 lines (123 sloc)  4.214 kb  Open EditRawBlameHistory Delete
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
88
89
90
91
92
93
94
95
96
97
98
99
100
101
102
103
104
105
106
107
108
109
110
111
112
113
114
115
116
117
118
119
120
121
122
123
124
125
126
127
128
129
130
131
132
133
134
135
(function(){
    slingo.Views = slingo.Views || {};

    slingo.Views.application = Backbone.View.extend({
        el : '#main',
        templatePath: 'app/templates/application.ejs',
        initialize: function(options) {

            this.user = new slingo.Models.user();
            this.user.on('login', this.onLogin, this);

        },
        renderHome: function() {

            $this = this;
            
            if(!this.template){
                this.getTemplate(this.templatePath).done(function(template){
                    $this.template = template;
                    $this.$el.html(template($this.user.toJSON()));
                    $this.init();
                });
            }else{
                this.$el.html(this.template(this.user.toJSON()));
                $this.init();
            }

        },
        renderAdmin: function(){

            $this = this;

            if(!this.adminTemplate){
                this.getTemplate('app/templates/admin.ejs').done(function(template){
                    $this.adminTemplate = template;
                    $this.body.html(template());
                });
            }else{
                this.body.html(this.adminTemplate());
            }

        },
        renderHeader: function(){
            this.header.render();
        },
        init: function  () {

            if(!this.header){
                this.header = new slingo.Views.header({el : '#header', user: this.user});
            }else{
                $('#header').html(this.header.el);
            }
            
            this.body = this.$('#body');
            this.footer = this.$('#footer');
        },
        events: {
            'click #getProjects' : 'getProjects',
            'click #logout' : 'logout',
            'click #createProject' : 'createProject',
            'click #createLanguage' : 'createLanguage'
        },
        getProjects: function() {
            $.ajax({
                url : slingo.API_ENDPOINT,
                type : 'POST',
                data : JSON.stringify({
                    'header' : '12',
                    'method' : 'listAllProjects'
                }),
                success: function(data) {
                    slingo.debug(data);
                }
            });
        },
        logout: function() {
            $.ajax({
                url : slingo.API_ENDPOINT,
                type : 'POST',
                data : JSON.stringify({
                    'sessionID': '1234',
                    'submitType': 'call',
                    'method': 'logout',
                    'header': '1233'
                }),
                success: function(data) {
                    slingo.debug(data);
                }
            });
        },
        createProject: function() {
            $.ajax({
                url : slingo.API_ENDPOINT,
                type : 'POST',
                data : JSON.stringify({
                    'sessionID': '1234',
                    'submitType': 'call',
                    'method': 'createProject',
                    'header': '1233',
                    'params': {
                        'name' : 'Name of project',
                        'everyonePermissions' : 'permissions'
                    }
                }),
                success: function(data) {
                    slingo.debug(data);
                }
            });
        },
        createLanguage: function() {
            $.ajax({
                url : slingo.API_ENDPOINT,
                type : 'POST',
                data : JSON.stringify({
                    'sessionID': '1234',
                    'submitType': 'call',
                    'method': 'createLanguage',
                    'header': '1233',
                    'params': {
                        'name' : 'Name of language',
                        'projectID' : 'projectID',
                        'everyonePermission' : 'everyonePermission'
                    }
                }),
                success: function(data) {
                    slingo.debug(data);
                }
            });
        },
        onLogin: function(){
            this.renderHeader();
        }

    });
})();
Status API Training Shop Blog About © 2014 GitHub, Inc. Terms Privacy Security Contact 