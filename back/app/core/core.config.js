(function ()
{
    'use strict';

    angular
        .module('app.core')
        .config(config);

    /** @ngInject */
    function config($ariaProvider, $logProvider, msScrollConfigProvider, fuseConfigProvider, msApiProvider, $httpProvider, $resourceProvider, ngProgressLiteProvider)
    {
        // Enable debug logging
        $logProvider.debugEnabled(true);
        msApiProvider.setBaseUrl('api/v1');
        $httpProvider.interceptors.push('interceptor')
        $resourceProvider.defaults.cancellable = true;
        ngProgressLiteProvider.settings.speed = 1500;
        /*eslint-disable */
        
        // ng-aria configuration
        $ariaProvider.config({
            tabindex: false
        });

        // Fuse theme configurations
        fuseConfigProvider.config({
            'disableCustomScrollbars'        : false,
            'disableCustomScrollbarsOnMobile': true,
            'disableMdInkRippleOnMobile'     : true
        });

        // msScroll configuration
        msScrollConfigProvider.config({
            wheelPropagation: true
        });

        /*eslint-enable */
    }
})();