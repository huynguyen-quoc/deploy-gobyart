(function ()
{
    'use strict';

    angular
        .module('app.auth')
        .controller('AuthController', controller);

    /** @ngInject */
    function controller($window, $document, $rootScope, $scope, $log, msApi, store, $state,  $mdToast, $translate, $filter, ngProgressLite, $timeout)
    {
        // Data
        var vm = this;

        vm.$window = $window;

        vm.$document = $document;

        vm.$rootScope = $rootScope;

        vm.$scope = $scope;

        vm.$log = $log;

        vm.msApi = msApi;

        vm.store = store;

        vm.$state = $state;

        vm.$$submit = false;

        vm.$mdToast = $mdToast;

        vm.$translate =  $filter('translate');

        vm.$filter = $filter;

        vm.$timeout =$timeout;

        vm.ngProgressLite = ngProgressLite;
        // Methods
    }

    /**
     * LOGIN ACTION
     */
    controller.prototype.login = function(){
        var self = this;
        var param = self.form
        if(self.$$submit) return;
        self.$$submit = true;
        self.ngProgressLite.start();
        self.msApi.request('auth.login@session', param,
            function (response)
            {
                self.$$submit = false;
                self.store.set('user', JSON.parse(angular.toJson(response)));
                self.$log.debug(JSON.parse(angular.toJson(response)));
                self.ngProgressLite.done();
                self.$state.go('app.dashboard');
                
            },
            // ERROR
            function (error)
            {
                self.$$submit = false;
                // self.$log.debug(error);
                // var msg = self.$translate('LOGIN.ERRORS.INTERNAL');
                // if(error.status === 401){
                //      var msg = self.$translate('LOGIN.ERRORS.' + error.data.name);
                // }

                // var toast = self.$mdToast.simple()
                //     .textContent(msg)
                //     .action(self.$translate('LOGIN.DISMISS'))
                //     .highlightAction(true)
                //     .position('top right');
                    
                // self.$mdToast.show(toast);
                self.$timeout(function ()
                {
                    self.ngProgressLite.done();
                })
            }
        );
    }
})();