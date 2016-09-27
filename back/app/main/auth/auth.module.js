(function ()
{
    'use strict';

    angular
        .module('app.auth', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msNavigationServiceProvider, msApiProvider)
    {
        // State
        $stateProvider.state('app.auth', {
            url      : '/auth',
            views    : {
                'main@' : {
                    templateUrl: 'app/core/layouts/content-only.html',
                    controller : 'MainController as vMain'
                },
                'content@app.auth': {
                    templateUrl: 'app/main/auth/auth.html',
                    controller : 'AuthController as vm'
                }
            },
            bodyClass: 'login'
        });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/auth');
        var uri = '/sessions';
        msApiProvider.register('auth.login', [uri,  {  } , {
              session :{
                method : 'POST'
              }
        }]);
        
    }   

})();