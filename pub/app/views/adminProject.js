(function(){
    slingo.Views = slingo.Views || {};

    slingo.Views.adminProject = Backbone.View.extend({
        initialize: function(){
            this.render();
        },
        render: function(){

            this.tpl = this.options.tpl;
            this.attrs = this.options.attrs;
            this.projects = this.options.projects;

            this.$el.html( _.template (this.tpl.adminProjectTpl)( this.attrs ) );

            this.projects_table = this.$('table');

            this.getProjects();
            return this.el;
        },
        events: {
            
        },
        getProjects: function() {

            var $this = this;

            if(!this.projects || this.projects.length == 0){

                this.projects.fetch({data: JSON.stringify({method: 'listAllProjects', 'header' : {}}), type: 'POST'}).done(function(data, success, xhr) {
                    var projs = $.map($this.projects.toJSON(), function(v){return v.displayName;});
                    
                });

            }else{
                /*
                var projs = $.map($this.projects.toJSON(), function(v){return v.displayName;});
                //project_input.data('source', projs);
                slingo.debug(projs);
                */
                this.fetchAll();
            }
        },
        fetchAll: function() {
            this.projects_table.empty();

            this.projects.forEach(this.addProject, this);

        },
        addProject: function(project) {
            var projectView = new slingo.Views.project({nextEl : this.$el, model : project, template: this.tpl.projectTpl})
            this.projects_table.append(projectView.el)
        }
    });
})();