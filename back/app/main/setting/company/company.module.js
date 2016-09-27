(function ()
{
    'use strict';

    angular
        .module('app.setting.company',
            [
            ]
        )
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {

        $stateProvider.state('app.setting_company', {
            url    : '/setting-company',
            views  : {
                'content@app': {
                    templateUrl: 'app/main/setting/company/company.html',
                    controller : 'SettingCompanyController as vm'
                }
            },
            requiredLogin : true,
            resolve: {
                SiteOption: [ 'msApi', '$stateParams', 'pageSize', function (msApi, $stateParams, pageSize){
                    return msApi.resolve('setting.company@query',  { 'site_option_id' : 'SITE_DESCRIPTION' , page : $stateParams.page, page_size : 150});
                }],
            }
        })   
      

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/setting/company');

        var fileGalleryEditUri = '/site_option/:site_option_id';
        msApiProvider.register('setting.company', [fileGalleryEditUri,  { 'site_option_id' : '@site_option_id' } , {
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
        msNavigationServiceProvider.saveItem('setting.company', {
            title : 'Company Setting',
            icon  : 'icon-information-outline',
            state : 'app.setting_company',
            translate: 'SETTING_COMPANY.SETTING_COMPANY_NAV',
            weight : 1
        });

    }

})();