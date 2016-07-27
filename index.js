/**
 * Created by dggrir on 16-07-18.
 */
'use strict';

module.exports = function (kibana) {
 return new kibana.Plugin({
   name: 'schemaform_kibana_plugin',
   require: ['kibana','elasticsearch'],
   uiExports : {
     visTypes: ['plugins/schemaform-kibana-plugin/schemaformVis']
   }
 });

};





