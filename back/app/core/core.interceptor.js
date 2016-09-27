(function ()
{
    'use strict';
    var sequenceId = 0;
    angular
        .module('app.core')
        .factory('interceptor', interceptor);

    /** @ngInject */
    function interceptor($rootScope, $log, $q, uri, $timeout, msPending)
    {
        $log.debug('---------- begin interceptor http request ---------------');
        var httpInterceptor =  {
              request: function(config) {

                  config = config || {};

                 
                  if(/^.*\.(html|html|js)$/.test(config.url)) {
                  //  var canceller = $q.defer();
                    //config.timeout =  $q.defer().promise;
                  }else{
                        if(sequenceId === ''){
                            var randomnumber = Math.floor(Math.random()*11)
                            sequenceId = randomnumber;
                        }
                        config.headers['X-Request-Id'] = CryptoJS.SHA256(sequenceId + "" + new Date().getTime()).toString().substr(0,32).toUpperCase();

                        
                        if(config.timeout && !config.noCancelOnRouteChange) {
                            config.timeout = msPending.newTimeout(config.headers['X-Request-Id']);
                        }
                        if(!$rootScope.queryProgress){
                            $rootScope.queryProgress = true;
                        }
                  //  if(!$rootScope.changeState) {

                    //}
                  }
                  
                  $log.debug('-----' + config.url + '---------');
                
                  sequenceId += 1;
                  return config;

              },
              response: function(response) {
                    $log.debug('---------- end interceptor http request success---------------');
                    sequenceId = '';
                      if(!/^.*\.(html|html|js)$/.test(response.config.url)) {
                            msPending.remove(response.config.headers['X-Request-Id']);
                            if(msPending.length() <= 0){
                                $rootScope.queryProgress = false;
                            }
                      }
                    $q.resolve(response);

                    return response;
              },
              responseError: function(response) {
                    var header = response.config.headers.Accept;
                    if(!/^.*\.(html|html|js)$/.test(response.config.url)) {
                            msPending.remove(response.config.headers['X-Request-Id']);
                            if(msPending.length() <= 0){
                                $rootScope.queryProgress = false;
                            }
                      }
                    if(response.status === 401){
                        $rootScope.$broadcast('event:auth-login', response);
                    //   if(response.headers('Location')){
                    //     //$rootScope.showLoginDialog(response.config, response.data.url);
                    //     var deferred = $q.defer();
                    //     //httpBuffer.append(rejection.config, deferred);
                    //     $rootScope.$broadcast('event:auth-login', {resp:  response, deferred : deferred });
                    //     return deferred.promise;
                    //   }
                    }else{
                        $rootScope.$broadcast('event:error-server', response);
                    }

                   $log.debug('---------- end interceptor http request error ---------------');
                   return $q.reject(response);
                  }
          };

          return httpInterceptor;

        //////////

    }

})();
