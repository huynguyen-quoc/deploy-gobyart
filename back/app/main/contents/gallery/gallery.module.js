(function ()
{
    'use strict';

    angular
        .module('app.contents.gallery',
            [
                'flow',
            ]
        )
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {

        $stateProvider.state('app.contents_gallery', {
            url    : '/gallery/:page',
            params: {
                page: "1", 
                squash: true
            },
            views  : {
                'content@app': {
                    templateUrl: 'app/main/contents/gallery/gallery.html',
                    controller : 'GalleryController as vm'
                }
            },
            requiredLogin : true,
            resolve: {
                Images: function (msApi, $stateParams, pageSize){
                    return msApi.resolve('gallery.files@query',  { page : $stateParams.page, page_size : pageSize});
                },
            }
        })   
      

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/contents/gallery');


        var fileGalleryUri = '/files/gallery/:file_id';
        msApiProvider.register('gallery.files', [fileGalleryUri,  { 'file_id' : '@file_id' } , {
              query : {
                method : 'GET'
              },
              delete :{
                method : 'DELETE',
                isArray : false
              }
        }]);

        var fileGalleryEditUri = '/files/:file_id';
        msApiProvider.register('gallery.file.edit', [fileGalleryEditUri,  { 'file_id' : '@file_id' } , {
              delete :{
                method : 'DELETE',
                isArray : false
              }
        }]);


        // Navigation
        msNavigationServiceProvider.saveItem('contents.gallery', {
            title : 'Gallery',
            icon  : 'icon-camera-iris',
            state : 'app.contents_gallery',
            translate: 'GALLERY.GALLERY_NAV',
            weight : 1
        });

    }

})();