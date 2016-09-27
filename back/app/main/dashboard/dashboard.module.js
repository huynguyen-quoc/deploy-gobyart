(function ()
{
    'use strict';

    angular
        .module('app.dashboard', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider
            .state('app.dashboard', {
                url    : '/dashboard',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/dashboard/dashboard.html',
                        controller : 'DashboardController as vm'
                    }
                },
                requiredLogin : true
            });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/dashboard');



        msNavigationServiceProvider.saveItem('dashboard', {
            title    : 'Dashboard',
            icon     : 'icon-tile-four',
            state    : 'app.dashboard',

            translate: 'DASHBOARD.DASHBOARD_NAV',
            weight   : 1
        });
    }
})();