(function ()
{
    'use strict';

    angular
        .module('app.contents.artists',
            [
                'flow',
                'ngCropper'
            ]
        )
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {

        $stateProvider.state('app.contents_artists', {
            url    : '/artists/:page',
            params: {
                page: "1", 
                squash: true
            },
            views  : {
                'content@app': {
                    templateUrl: 'app/main/contents/artists/artists.html',
                    controller : 'ArtistsController as vm'
                }
            },
            requiredLogin : true,
            resolve: {
                Artists: function (msApi, $stateParams, pageSize){
                    return msApi.resolve('artists.artist@query',  { page : $stateParams.page, page_size : pageSize});
                },
            }
        })   
        .state('app.contents_artists.detail', {
                url      : '/artist/:artist_id',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/contents/artists/artist/artist.html',
                        controller : 'ArtistController as vm'
                    }
                },
                requiredLogin : true,
                resolve  : {
                    Artist: ['msApi', '$stateParams',  function (msApi, $stateParams)
                    {
                        return msApi.resolve('artists.artist@get', { artist_id : $stateParams.artist_id});
                    }],
                    Images: ['msApi', '$stateParams', 'pageSize',  function (msApi, $stateParams, pageSize)
                    {
                        return msApi.resolve('artists.files@get', { artist_id : $stateParams.artist_id, type : 'all_file_artist', page_size : pageSize});
                    }],
                    ArtistTypes : ['msApi', '$stateParams', 'pageSize',  function (msApi, $stateParams, pageSize)
                    {
                        return msApi.resolve('artists.artistType@get', { page_size : pageSize});
                    }],
                    MusicCategories : ['msApi', '$stateParams', 'pageSize',  function (msApi, $stateParams, pageSize)
                    {
                        return msApi.resolve('artists.musicCategory@query', { page_size : pageSize + 10});
                    }],
                    ArtistOptions : ['msApi', '$stateParams', 'pageSize',  function (msApi, $stateParams, pageSize)
                    {
                        return msApi.resolve('artists.siteOption@query', { site_type : 'ARTIST_OPTIONS', page_size : pageSize + 10});
                    }]

                },
                bodyClass: 'artist'
        })
        .state('app.contents_artists.new', {
                url      : '/new',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/contents/artists/artist/artist.html',
                        controller : 'ArtistController as vm'
                    }
                },
                requiredLogin : true,
                resolve  : {
                    Artist : function(){
                        return null;
                    },
                    Images : function(){
                        return null;
                    },
                    ArtistTypes :['msApi', '$stateParams', 'pageSize',  function (msApi, $stateParams, pageSize)
                    {
                        return msApi.resolve('artists.artistType@get', { page_size : pageSize});
                    }],
                    MusicCategories :['msApi', '$stateParams', 'pageSize',   function (msApi, $stateParams, pageSize)
                    {
                        return msApi.resolve('artists.musicCategory@query', { page_size : pageSize + 10});
                    }],
                    ArtistOptions :['msApi', '$stateParams', 'pageSize',   function (msApi, $stateParams, pageSize)
                    {
                        return msApi.resolve('artists.siteOption@query', { site_type : 'ARTIST_OPTIONS', page_size : pageSize + 10});
                    }]

                },
                bodyClass: 'artist'
        });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/contents/artists');

        // Api
         var uri = '/artists/:artist_id';
        msApiProvider.register('artists.artist', [uri,  { 'artist_id' : '@artist_id' } , {
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
        msApiProvider.register('artists.files', [fileUri,  { 'file_id' : '@file_id' } , {
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

        var artistTypeUri = '/artist_type';
        msApiProvider.register('artists.artistType', [artistTypeUri,  {  } , {
              query : {
                method : 'GET',
                cache : true
              }
        }]);

        var musicCategoryUri = '/music_category';
        msApiProvider.register('artists.musicCategory', [musicCategoryUri,  {  } , {
              query : {
                method : 'GET',
                cache : true
              }
        }]);

        var siteOptionUri = '/site_option/:site_type';
        msApiProvider.register('artists.siteOption', [siteOptionUri,  {  'site_type' : '@site_type' } , {
              query : {
                method : 'GET',
                cache : true
              }
        }]);
     
        // Navigation
        msNavigationServiceProvider.saveItem('contents.artists', {
            title : 'Artists',
            icon  : 'icon-account-box',
            state : 'app.contents_artists',
            translate: 'ARTISTS.ARTIST_NAV',
            weight : 1
        });

    }

})();