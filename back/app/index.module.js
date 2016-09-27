(function ()
{
    'use strict';

    /**
     * Main module of the Fuse
     */
    angular
        .module('fuse', [

            // Common 3rd Party Dependencies
            'uiGmapgoogle-maps',
            'textAngular',
            'xeditable',

            // Core
            'app.core',

            // Navigation
            'app.navigation',

            // Toolbar
            'app.toolbar',
            
            'app.quick-panel',
            'app.dashboard',
            'app.auth',
            'app.contents',
            'app.setting'
        ]).config(config);

    /** @ngInject */
    function config($translatePartialLoaderProvider)
    {
           // Translation
        $translatePartialLoaderProvider.addPart('app');
       
    };
})();
