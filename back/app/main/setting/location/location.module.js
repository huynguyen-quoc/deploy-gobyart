(function ()
{
    'use strict';

    angular
        .module('app.setting.location',
            [
                // 3rd Party Dependencies
                'uiGmapgoogle-maps'
            ]
        )
        .config(config);

    /** @ngInject */
    function config($stateProvider, msNavigationServiceProvider, $translatePartialLoaderProvider, msApiProvider)
    {
        $stateProvider
            .state('app.setting_location', {
                url  : '/setting-location',
                views: {
                    'content@app'                   : {
                        templateUrl: 'app/main/setting/location/location.html',
                        controller : 'SettingLocationController as vm'
                    },
                    'tabContent@app.setting_location': {
                        templateUrl: 'app/main/setting/location/tabs/maps.html'
                    }
                },
                resolve: {
                    SiteOption: [ 'msApi', '$stateParams', 'pageSize', function (msApi, $stateParams, pageSize){
                        return msApi.resolve('setting.location@query',  { 'site_option_id' : 'SITE_LOCATION' , page : $stateParams.page, page_size : 150});
                    }],
                }
            });
        var uri = '/site_option/:site_option_id';
        msApiProvider.register('setting.location', [uri,  { 'site_option_id' : '@site_option_id' } , {
              query :{
                method : 'GET',
                isArray : false
              },
              save :{
                method : 'PUT',
                isArray : false
              }
        }]);

        $translatePartialLoaderProvider.addPart('app/main/setting/location');
              // Navigation
        msNavigationServiceProvider.saveItem('setting.location', {
            title : 'Location Setting',
            icon  : 'icon-map-marker',
            state : 'app.setting_location',
            translate: 'SETTING_LOCATION.SETTING_LOCATION_NAV',
            weight : 1
        });
    }

})();