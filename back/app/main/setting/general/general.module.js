(function ()
{
    'use strict';

    angular
        .module('app.setting.general',
            [
            ]
        )
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {

        $stateProvider.state('app.setting_general', {
            url    : '/setting-general',
            views  : {
                'content@app': {
                    templateUrl: 'app/main/setting/general/general.html',
                    controller : 'SettingGeneralController as vm'
                }
            },
            requiredLogin : true,
            resolve: {
                SiteOption: [ 'msApi', '$stateParams', 'pageSize', function (msApi, $stateParams, pageSize){
                    return msApi.resolve('setting.general@query',  { 'site_option_id' : 'SITE' , page : $stateParams.page, page_size : 150});
                }],
            }
        })   
      

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/setting/general');

        var fileGalleryEditUri = '/site_option/:site_option_id';
        msApiProvider.register('setting.general', [fileGalleryEditUri,  { 'site_option_id' : '@site_option_id' } , {
              query :{
                method : 'GET',
                isArray : false
              },
              save :{
                method : 'PUT',
                isArray : false
              }
        }]);


        // Navigation
        msNavigationServiceProvider.saveItem('setting.general', {
            title : 'General Setting',
            icon  : 'icon-information-outline',
            state : 'app.setting_general',
            translate: 'SETTING_GENERAL.SETTING_GENERAL_NAV',
            weight : 1
        });

    }

})();