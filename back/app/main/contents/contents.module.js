(function ()
{
    'use strict';

    angular
        .module('app.contents', [
            'app.contents.teams',
            'app.contents.artists',
            'app.contents.gallery',
            'app.contents.news'
        ])
        .config(config);

    /** @ngInject */
    function config(msNavigationServiceProvider, $translatePartialLoaderProvider)
    {
           // Translation
        $translatePartialLoaderProvider.addPart('app/main/contents');
        // Navigation
        msNavigationServiceProvider.saveItem('contents', {
            title : 'Content',
            group : true,
            translate: 'CONTENTS.CONTENTS_NAV',
            weight: 2
        });
    }
})();