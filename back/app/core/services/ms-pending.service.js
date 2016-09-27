(function ()
{
    'use strict';

angular.module('app.core')
  .service('msPending', function ($q) {
    var cancelPromises = [];
    var listRequest = [];
    function newTimeout(requestId) {
      var cancelPromise = $q.defer();
      cancelPromises.push(cancelPromise);
    
      listRequest.push(requestId);
      return cancelPromise.promise;
    }
 
    function cancelAll() {
      angular.forEach(cancelPromises, function (cancelPromise) {
        cancelPromise.promise.isGloballyCancelled = true;
        cancelPromise.resolve();
      });
      listRequest.length = 0;
      cancelPromises.length = 0;
    }
    
    function length(){
        return listRequest.length;
    }
    
    function remove(requestId){
       
        var list = angular.copy(listRequest);
        angular.forEach(listRequest, function(item, index){
            if(item === requestId){
                list.splice(index , 1)
                //return false;
            }
        });
         listRequest = list;
    }
 
    return {
      newTimeout: newTimeout,
      cancelAll: cancelAll,
      length : length,
      remove : remove
    };
  });
  
 })();