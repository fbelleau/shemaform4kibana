/**
 * Created by dggrir on 16-07-18.
 */


define(function (require) {



    require('mySchemaForm');
    require('plugins/schemaform-kibana-plugin/schemaformVis.less');
    require('plugins/schemaform-kibana-plugin/schemaformVisController');
    require('ui/registry/vis_types').register(schemaformVisProvider);

    function schemaformVisProvider(Private) {

        var TemplateVisType = Private(require('ui/template_vis_type/TemplateVisType'));


        return new TemplateVisType({
            name: 'schemaform4kibana',
            title: 'SchemaForm',
            icon: 'fa-html5',
            description: 'Useful for displaying html in dashboards.',
            template: require('plugins/schemaform-kibana-plugin/views/schemaformVis.html'),
            params: {
              editor: require('plugins/schemaform-kibana-plugin/views/schemaformVisOptions.html')

            }
        });
    }

        return schemaformVisProvider;


});
