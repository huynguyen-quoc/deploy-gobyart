(function ()
{
    'use strict';

    angular
        .module('app.dashboard')
        .controller('DashboardController', controller);

   /** @ngInject */
    function controller($scope, $interval, $mdSidenav, $translate, store)
    {
       this.$scope = $scope;
       this.$interval = $interval;
       this.$mdSidenav = $mdSidenav;
       this.$translate = $translate;
       this.user_profile = store.get('user');
       this.initWidgetTime();


    }

    controller.prototype.toggleSidenav = function(sidenavId){
      var vm = this;
      vm.$mdSidenav(sidenavId).toggle();
    }
    
    controller.prototype.wellcomeMessage = function(){
            var self = this;
            var day = new Date();
            var hr = day.getHours();
            if (hr >= 0 && hr <= 11) {
                return self.$translate.instant('DASHBOARD.MORNING');
            }
           
            if (hr >= 12 && hr <= 17) {
                return self.$translate.instant('DASHBOARD.AFTERNOON');
            }
            
            if (hr >= 17 && hr <= 23) {
               return self.$translate.instant('DASHBOARD.EVENING');
            }
           
    }

    controller.prototype.initWidgetTime = function(){
      var vm = this;
      // Now widget
      vm.nowWidget = {
          now   : {
              second: '',
              minute: '',
              hour  : '',
              day   : '',
              month : '',
              year  : ''
          },
          ticker: function ()
          {
              var now = moment();
              vm.nowWidget.now = {
                  second : now.format('ss'),
                  minute : now.format('mm'),
                  hour   : now.format('HH'),
                  day    : now.format('D'),
                  weekDay: now.format('dddd'),
                  month  : now.format('MMMM'),
                  year   : now.format('YYYY')
              };
          }
      };

      // Now widget ticker
      vm.nowWidget.ticker();

      var nowWidgetTicker = vm.$interval(vm.nowWidget.ticker, 1000);

      vm.$scope.$on('$destroy', function ()
      {
          vm.$interval.cancel(nowWidgetTicker);
      });

    }
})();
