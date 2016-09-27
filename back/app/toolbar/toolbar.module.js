(function ()
{
    'use strict';

    angular
        .module('app.toolbar', [])
        .config(config);

    /** @ngInject */
    function config($translatePartialLoaderProvider, msApiProvider)
    {
        $translatePartialLoaderProvider.addPart('app/toolbar');

        var uri = '/session';
        msApiProvider.register('app.logout', [uri,  {} , {
              logout :{
                method : 'DELETE'
              }
        }]);
    }
})();
