(function ()
{
    'use strict';

    angular
        .module('app.contents.news',
            [
                'flow',
                'ngCropper'
            ]
        )
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {
       

        $stateProvider.state('app.contents_news', {
            url    : '/news/:page',
            params: {
                page: "1", 
                squash: true
            },
            views  : {
                'content@app': {
                    templateUrl: 'app/main/contents/news/news.html',
                    controller : 'NewsController as vm'
                }
            },
            requiredLogin : true,
            resolve: {
                News: function (msApi, $stateParams, pageSize){
                    return msApi.resolve('news.news@query',  { page : $stateParams.page, page_size : pageSize});
                },
            }
        })   
        .state('app.contents_news.detail', {
                url      : '/news/:news_id',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/contents/news/news/news.html',
                        controller : 'NewsDetailController as vm'
                    }
                },
                requiredLogin : true,
                resolve  : {
                    News: ['msApi', '$stateParams',  function (msApi, $stateParams)
                    {
                        return msApi.resolve('news.news@get', { news_id : $stateParams.news_id});
                    }]
                },
                bodyClass: 'news'
        })
        .state('app.contents_news.new', {
                url      : '/new',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/contents/news/news/news.html',
                        controller : 'NewsDetailController as vm'
                    }
                },
                requiredLogin : true,
                resolve  : {
                    News : function(){
                        return null;
                    }
                },
                bodyClass: 'news'
        });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/contents/news');

        // Api
         var uri = '/news/:news_id';
        msApiProvider.register('news.news', [uri,  { 'news_id' : '@news_id' } , {
              query :{
                method : 'GET',
                isArray : false
              },
              get :{
                method : 'GET',
                isArray : false
              },
              add :{
                method : 'POST'
              },
              edit :{
                method : 'PUT'
              },
              remove :{
                method : 'DELETE'
              }
        }]);

        var fileUri = '/files/:file_id';
        msApiProvider.register('news.files', [fileUri,  { 'file_id' : '@file_id' } , {
              update :{
                method : 'PUT',
                isArray : false
              },
              query : {
                method : 'GET'
              },
              delete :{
                method : 'DELETE',
                isArray : false
              }
        }]);

       
        // Navigation
        msNavigationServiceProvider.saveItem('contents.news', {
            title : 'News',
            icon  : 'icon-window-restore',
            state : 'app.contents_news',
            translate: 'NEWS.NEWS_NAV',
            weight : 1
        });

    }

})();