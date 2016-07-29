/**
 * Created by dggrir on 16-07-18.
 */


define(function (require) {
    require('ui/modules');
    var getSort = require('ui/doc_table/lib/get_sort');
    var dateMath = require('ui/utils/dateMath');
    var _ = require('lodash');
    var schemaForm = require('ui/modules').get('schemaForm');
    var module = require('ui/modules').get('kibana/schemaform-kibana-plugin', ['kibana' ,'ui.ace','schemaForm']);



    require('plugins/schemaform-kibana-plugin/schemaformVis.less');
    require('plugins/schemaform-kibana-plugin/schemaformVisController');

    module.service('docHelper', function () {
        this.getMappingFromFields = function (fieldsList) {

            var schema = {};
            schema.type = 'object';
            schema.title = 'Angular SchemaForm for kibana';
            schema.properties = {};
            var form = [];
            //form.push({'type': 'fieldset', 'title': 'Formulaire', 'items': []});
            _.forEach(fieldsList,function (value,key) {

                if (value.type === 'string') {
                    schema.properties[value.displayName] = {
                        'title': value.displayName,
                        'type': value.type
                    };
                    /*form[0].items.push({
                        'key': value.displayName,
                        'type': 'string',
                        'notitle': false,
                        'showAdvanced': false,
                        'readonly': false
                    });*/

                }

                if (value.type === 'double' || value.type === 'long') {
                    schema.properties[value.displayName] = {
                        'title': value.displayName,
                        'type': 'number'
                    };
                    form[0].items.push({
                        'key': value.displayName,
                        'type': 'number',
                        'notitle': false,
                        'showAdvanced': false,
                        'readonly': false
                    });


                }
                if (value.type === 'date') {
                    schema.properties[value.displayName] = {
                        'title': value.displayName,
                        'type': 'string',
                        'format': 'date'
                    };
                    form[0].items.push({
                        'key': value.displayName,
                        'notitle': false,
                        'showAdvanced': false,
                        'readonly': false
                    });
                }

            });
            schema.required = [];
            form.push("*");
            form.push({"type":"submit","title":"OK"});
            //form.push({"type":"submit","style":"btn-info","title":"modifier"});
            return {schema: schema, form: form};
        }


        this.getMappingToSchema = function (obj, index, type) {

      var tampon = obj[index].mappings[type];
      var schema = {};
      schema.type = 'object';
      schema.properties = {};
      var form = [];
      form.push({'type': 'fieldset', 'title': 'Formulaire', 'items': []});


      angular.forEach(tampon.properties, function (value, key) {

        if (value.type === 'string') {
          schema.properties[key] = {
            'title': key,
            'type': value.type
          };
          form[0].items.push({
            'key': key,
            'type': 'string',
            'notitle': false,
            'showAdvanced': false,
            'readonly': false
          });

        }

        if (value.type === 'double' || value.type === 'long') {
          schema.properties[key] = {
            'title': key,
            'type': 'number'
          };
          form[0].items.push({
            'key': key,
            'type': 'number',
            'notitle': false,
            'showAdvanced': false,
            'readonly': false
          });


        }
        if (value.type === 'date') {
          schema.properties[key] = {
            'title': key,
            'type': 'string',
            'format': 'date'
          };
          form[0].items.push({
            'key': key,
            'notitle': false,
            'showAdvanced': false,
            'readonly': false
          });
        }
      });


      return {schema: schema, form: form};
    };

        this.elasticHitToDoc = function(hit) {
          var doc = {
              id: hit["_id"],
              fields: {}
          };

          Object.keys(hit._source).forEach(function (field) {
              doc.fields[field] = hit["_source"][field];
          });

          return doc;
      };

    });

    module.controller('SchemaformVisController', ['$scope', function ($scope) {

  }]);


    module.controller('SchemaformVisController', SchemaformVisController);


    function SchemaformVisController ($scope, $compile, $interpolate, $sce,es, courier, Private, Promise, Notifier,
                                      docHelper, savedSearches, timefilter, AppState) {
        var IndexedArray = require('ui/IndexedArray');
        var queryFilter = Private(require('ui/filter_bar/query_filter'));


        require('ui/notify');
        var HitSortFn = Private(require('plugins/kibana/discover/_hit_sort_fn'));
        var notify = new Notifier({location: 'Angular Widget'});
        var rootSearchSource = require('ui/courier/data_source/_root_search_source');
        $scope.aceLoaded = function (_editor) {
            _editor.$blockScrolling = Infinity;
        };
        $scope.html = "";
        $scope.modelDoc = {};
        $scope.hits = 0;
        $scope.docs = [];
        $scope.searchSource = null;
        $scope.indexPattern = $scope.vis.indexPattern;
        $scope.state = new AppState();

        $scope.index = $scope.indexPattern.id;
        $scope.state.sort = getSort.array($scope.state.sort, $scope.indexPattern);

        $scope.res = null;
        savedSearches.get($scope.state.index).then(function (savedSearch) {
                $scope.searchSource = savedSearch.searchSource;
                $scope.searchSource
                    .onResults(function (resp) {
                        if(resp){
                            $scope.res = resp;
                        }
                    });

            }, function (error) {
                console.error(error);
                $scope.searchSource = new courier.SearchSource()
                    .set('index',$scope.vis.indexPattern)
                    .set('size',100);
                $scope.searchSource
                    .onResults(function (resp) {
                        if(resp){
                            $scope.res = resp;
                        }
                    });


        });









        $scope.$watch('res',function (newval,oldval) {
            if(newval){
                var resContainer = newval.hits.hits;
                Object.keys(resContainer).forEach(function (field) {
                    $scope.docs.push(resContainer[field]._source);
                    $scope.modelDoc[resContainer[field]._id] = JSON.stringify(resContainer[field]._source,null,2);

                });
            }

        });

        $scope.opts = {
            sort: getSort.array(["time", "desc"], $scope.indexPattern),
            size: 1000,
            timefield: $scope.indexPattern.timeFieldName
        };

        $scope.updateSearchSource = Promise.method(function () {
            $scope.searchSource
                .set('index', $scope.indexPattern)
                .query(!$scope.state.query ? null : $scope.state.query)
                .set('filter', queryFilter.getFilters())
                .sort(getSort($scope.state.sort, $scope.indexPattern))
                .size($scope.opts.size);
        });





        $scope.index = $scope.vis.indexPattern.id;
        $scope.mapping = null;


        $scope.schema = docHelper.getMappingFromFields($scope.vis.indexPattern.fields);
        $scope.model = {};
        $scope.vis.params.schema_editor = JSON.stringify($scope.schema.schema, null, 2);
        $scope.vis.params.schema = $scope.schema.schema;
        $scope.vis.params.form_editor = JSON.stringify($scope.schema.form, null, 2);
        $scope.vis.params.form = $scope.schema.form;






        $scope.$watch('vis.params.schema_editor', function (newvalue, oldvalue) {
            if (angular.isDefined(newvalue)) {
                $scope.vis.params.schema = JSON.parse(newvalue);
            }

        });

        $scope.$watch('vis.params.form_editor', function (newvalue, oldvalue) {
            if(angular.isDefined(newvalue)){
                $scope.vis.params.form = JSON.parse(newvalue);
            }

        });

        $scope.$watch('vis.indexPattern', function (newvalue, oldvalue) {
            if(newvalue){
                $scope.schema = docHelper.getMappingFromFields($scope.vis.indexPattern.fields);
                $scope.vis.params.schema_editor = JSON.stringify($scope.schema.schema, null, 2);
                $scope.vis.params.schema = $scope.schema.schema;
                $scope.vis.params.form_editor = JSON.stringify($scope.schema.form, null, 2);
                $scope.vis.params.form = $scope.schema.form;




                savedSearches.get($scope.state.index).then(function (savedSearch) {
                    $scope.searchSource = savedSearch.searchSource;
                    $scope.searchSource
                        .onResults(function (resp) {
                            if(resp){
                                $scope.res = resp;
                            }
                        });

                }, function (error) {
                    console.error(error);
                    $scope.searchSource = new courier.SearchSource()
                        .set('index',$scope.vis.indexPattern)
                        .set('size',1000);
                    $scope.searchSource
                        .onResults(function (resp) {
                            if(resp){
                                $scope.res = resp;
                            }
                        });


                });




            }
        });



































    }























});
