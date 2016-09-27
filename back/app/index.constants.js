(function ()
{
    'use strict';

    angular
        .module('fuse')
        .constant('dateTimeFormat', 'dd/MM/yyyy hh:mm tt')
        .constant('uri', 'api/v1/')
        .constant('pageSize', 20)
        .constant('currentDate', new Date());;
})();
