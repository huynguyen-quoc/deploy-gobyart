(function ()
{
    'use strict';

    angular
        .module('app.setting.location')
        .controller('SettingLocationController', controller);

    /** @ngInject */
    function controller($state, uiGmapGoogleMapApi, SiteOption, $log, uiGmapIsReady, $mdDialog, $mdToast, $timeout, $translate, msApi, ngProgressLite)
    {
        var vm = this;

        // Data
        var currentState = 'app.components_maps.simple-marker';

        switch ( currentState )
        {
            case 'app.components_maps.simple-marker':
                vm.selectedNavItem = 'simpleMarkerMap';
                break;
        }
        this.siteOption = SiteOption.items;
        this.siteOptionValue = {};
        this.$log = $log;
        this.$mdDialog = $mdDialog;
        this.$mdToast = $mdToast;
        this.$timeout = $timeout;
        this.$translate = $translate;
        this.msApi = msApi;
        this.ngProgressLite = ngProgressLite;
        $.each(this.siteOption, function(index, item){
            vm.siteOptionValue[item.site_option_name] = item.site_option_value;
        });
        this.map = null;
        // Methods
        uiGmapIsReady.promise(1).then(function(instances) {
                instances.forEach(function(inst) {
                    vm.map = inst.map;
                });
            });
        uiGmapGoogleMapApi.then(function (maps)
        {
            vm.simpleMarkerMap = {
                center: {
                    latitude :  vm.siteOptionValue['LOCATION_LATITUDE'],
                    longitude:  vm.siteOptionValue['LOCATION_LONGITUDE']
                },
                zoom  : 14,
                options : {
                    scrollwheel: false
                },
                marker: {
                    id    : 0,
                    coords: {
                        latitude :vm.siteOptionValue ['LOCATION_LATITUDE'],
                        longitude: vm.siteOptionValue ['LOCATION_LONGITUDE']
                    },
                    options: { draggable: true },
                    events: {
                        dragend: function (marker, eventName, args) {
                            vm.$log.log('marker dragend');
                            var lat = marker.getPosition().lat();
                            var lon = marker.getPosition().lng();
                            vm.$log.log(lat);
                            vm.$log.log(lon);
                            vm.siteOptionValue.LOCATION_LONGITUDE = lon;
                            vm.siteOptionValue.LOCATION_LATITUDE = lat;
                        }
                    }
                }
            };

        });
    }

    controller.prototype.updateMap = function(){
        var self = this;
        var map  = self.map;
        if(!map) return;
        var lng =  self.siteOptionValue.LOCATION_LONGITUDE
        var lat =  self.siteOptionValue.LOCATION_LATITUDE
        self.simpleMarkerMap.marker.coords = {
          latitude: lat,
          longitude: lng
        };
        map.panTo(new google.maps.LatLng(lat,lng));
       
    }

    controller.prototype.save = function(event){
         var self = this;
        if(self.$$submit) return;
        self.$$submit = true;
        var confirm = self.$mdDialog.confirm()
            .title(self.$translate.instant('SETTING_LOCATION.SAVE_CONFIRM_TITLE'))
            .textContent(self.$translate.instant('SETTING_LOCATION.SAVE_CONFIRM_TEXT'))
            .ariaLabel(self.$translate.instant('SETTING_LOCATION.SAVE_CONFIRM_ARIA'))
            .targetEvent(event)
            .hasBackdrop(false)
            .ok(self.$translate.instant('SETTING_LOCATION.YES'))
            .cancel(self.$translate.instant('SETTING_LOCATION.NO'));
        
        self.$mdDialog.show(confirm).then(function() {
            self.ngProgressLite.start();
            var data = $.map(self.siteOptionValue, function(item, key){
                    return {
                        'key' : key,
                        'value' : item.toString()
                    }
            });

            var params = {
                options : data,
                site_option_id : 'SITE_LOCATION'
            }
            self.msApi.request('setting.general@save', params, function(resp){
                 self.team = resp;
                 var toast = self.$mdToast.simple()
                    .textContent(self.$translate.instant('SETTING_LOCATION.EDIT_SUCCESS', { 'team_name' : self.team.team_name }))
                    .action(self.$translate.instant('SETTING_LOCATION.DISMISS'))
                    .highlightAction(true)
                    .position('bottom right');
                    
                self.$mdToast.show(toast);
                self.ngProgressLite.done();
                self.$timeout(function(){
                    self.$$submit = false;
                    self.ngProgressLite.done();
                });
            }, function(err){
                var msg = self.$translate.instant('SETTING_LOCATION.ERRORS.INTERNAL_SERVER_ERROR');
                if(err.data){
                    var msg = self.$translate.instant('SETTING_LOCATION.ERRORS.' + err.data.name);
                }

                var toast = self.$mdToast.simple()
                    .textContent(msg)
                    .action(self.$translate.instant('SETTING_LOCATION.DISMISS'))
                    .highlightAction(true)
                    .position('bottom right');
                    
                self.$mdToast.show(toast);
                self.$timeout(function(){
                    self.$$submit = false;
                    self.ngProgressLite.done();
                });
            });
        }, function(){
             self.$$submit = false;
        });
    }

})();