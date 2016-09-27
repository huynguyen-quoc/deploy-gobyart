(function ()
{
    'use strict';

    angular
        .module('app.setting', [
            'app.setting.general',
            'app.setting.company',
            'app.setting.location',
        ])
        .config(config);

    /** @ngInject */
    function config(msNavigationServiceProvider, $translatePartialLoaderProvider)
    {
           // Translation
        $translatePartialLoaderProvider.addPart('app/main/setting');
        // Navigation
        msNavigationServiceProvider.saveItem('setting', {
            title : 'Setting',
            group : true,
            translate: 'SETTING.SETTING_NAV',
            weight: 1
        });
    }
})();