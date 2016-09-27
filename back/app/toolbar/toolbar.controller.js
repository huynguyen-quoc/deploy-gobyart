(function ()
{
    'use strict';

    angular
        .module('app.toolbar')
        .controller('ToolbarController', controller);

    /** @ngInject */
    function controller($rootScope, $scope, $q, $state, $timeout, $mdSidenav, $translate, $mdToast, msNavigationService, store, msApi, ngProgressLite)
    {
        var vm = this;

        vm.$rootScope = $rootScope;

        vm.$q = $q;
        
        vm.$state = $state;

        vm.$timeout = $timeout;

        vm.$mdSidenav = $mdSidenav;

        vm.$translate = $translate;

        vm.$mdToast = $mdToast;

        vm.msNavigationService = msNavigationService;

        vm.store = store;

        vm.$scope = $scope;

        vm.msApi = msApi;

        vm.ngProgressLite = ngProgressLite;

        vm.initData();
    }

    controller.prototype.logout = function(){
        var self = this;
        if(self.$$submit) return;
        self.$$submit = true;
        self.ngProgressLite.start();
        self.msApi.request('app.logout@logout', {}, function(resp){
            self.store.remove('user');
            self.$timeout(function(){
                self.$$submit = false;
                self.ngProgressLite.done();
                self.$state.go('app.auth');
            });
        }, function(err){
            self.$timeout(function(){
                self.$$submit = false;
                self.ngProgressLite.done();
            });
        });
    }

    controller.prototype.initData = function(){
        var self = this;

        self.$scope.user = self.store.get('user');
    }

    controller.prototype.toggleSideNav = function(id){
         this.$mdSidenav(id).toggle();
    }


})();