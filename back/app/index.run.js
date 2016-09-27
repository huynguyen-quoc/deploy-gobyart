(function ()
{
    'use strict';

    angular
        .module('fuse')
        .run(runBlock);

    /** @ngInject */
    function runBlock($window, $rootScope, $timeout, $state, editableThemes, store, $log, ngProgressLite, $mdToast, $translate)
    {
        if(window.activeProfile){
            var parsedBase64 = CryptoJS.enc.Base64.parse(window.activeProfile); //jshint ignore:line
            var data  = angular.fromJson(parsedBase64.toString(CryptoJS.enc.Utf8));
            store.set('user', data);
        }
        $log.debug(data);//jshint ignore:line
        $rootScope.user_profile = angular.fromJson(data); //jshint ignore:line
        $window.onbeforeunload = function() {
            store.remove('user');
        };
        // 3rd Party Dependencies
        editableThemes.default.submitTpl = '<md-button class="md-icon-button" type="submit" aria-label="save"><md-icon md-font-icon="icon-checkbox-marked-circle" class="md-accent-fg md-hue-1"></md-icon></md-button>';
        editableThemes.default.cancelTpl = '<md-button class="md-icon-button" ng-click="$form.$cancel()" aria-label="cancel"><md-icon md-font-icon="icon-close-circle" class="icon-cancel"></md-icon></md-button>';

        // Activate loading indicator
        var stateChangeStartEvent = $rootScope.$on('$stateChangeStart', function (event, toState, toParams)
        {
            $rootScope.loadingProgress = true;
            ngProgressLite.start();
            if (toState.requiredLogin && !store.get('user')) {
                event.preventDefault();
                $state.go('app.auth');
            }else if (toState.name == 'app.auth'){
                if(store.get('user')){
                    event.preventDefault();
                    $state.go('app.dashboard');
                }
            }
        });

        // De-activate loading indicator
        var stateChangeSuccessEvent = $rootScope.$on('$stateChangeSuccess', function ()
        {
            $timeout(function ()
            {
                ngProgressLite.done();
                $rootScope.loadingProgress = false;
            });
        });

        $rootScope.$on("event:error-server", function errorHandler($event, response, deferred) {
    
                // var $log = $injector.get('$log');
                // if(response.data === null) return;
                
                // var msg = response.data.message ? response.data.message : "There are some problems has been occured";

                // var template = ''
                // toastr.error(msg);
                var msg = $translate.instant('APP.ERRORS.INTERNAL');
                if(response.data){
                    var msg = $translate.instant('APP.ERRORS.' + response.data.name);
                }
                if(msg.indexOf('APP.ERRORS') > -1){
                    msg = $translate.instant('APP.ERRORS.INTERNAL_SERVER_ERROR');
                }

                var toast = $mdToast.simple()
                    .textContent(msg)
                    .action($translate.instant('APP.DISMISS'))
                    .highlightAction(true)
                    .position('bottom right');
                    
                $mdToast.show(toast);
    

        });

        $rootScope.$on("event:auth-login", function showLogin(event, response) {
            //   var $http = $injector.get('$http');
            //   var config = response.resp.config;
            //   var deferred = response.deferred;
            //   var opened = angular.element("#login-dialog");
            //   if(opened.length <= 0){
            //     showLoginDialog($http, deferred , config, response.resp.headers("Location"));
            //   }
            if($state.current.name === 'app.auth'){
                var msg = $translate.instant('APP.ERRORS.INTERNAL_SERVER_ERROR');
                if(response.data){
                    var msg = $translate.instant('APP.ERRORS.' + response.data.name);
                }
                if(msg.indexOf('APP.ERRORS') > -1){
                    msg = $translate.instant('APP.ERRORS.INTERNAL_SERVER_ERROR');
                }

                var toast = $mdToast.simple()
                    .textContent(msg)
                    .action($translate.instant('APP.DISMISS'))
                    .highlightAction(true)
                    .position('bottom right');
                    
                $mdToast.show(toast);
            }

           $state.go('app.auth');
            
        });

        // Store state in the root scope for easy access
        $rootScope.state = $state;

        // Cleanup
        $rootScope.$on('$destroy', function ()
        {
            stateChangeStartEvent();
            stateChangeSuccessEvent();
        });
    }
})();