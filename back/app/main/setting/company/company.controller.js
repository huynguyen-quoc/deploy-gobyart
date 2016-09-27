(function ()
{
    'use strict';

    angular
        .module('app.setting.company')
        .controller('SettingCompanyController', controller);

    /** @ngInject */
    function controller($document, $state, SiteOption, $cookies, $log, $scope, $mdSticky, $mdDialog, $mdToast, $timeout, $translate, msApi, ngProgressLite, $stateParams)
    {

        this.taToolbar = [
            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote', 'bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear']
        ];
        // Variable
        this.$document = $document;
        this.$state = $state;
        this.$cookies = $cookies;
        this.$log = $log;
        this.$mdSticky = $mdSticky;
        this.$mdDialog = $mdDialog;
        this.$mdToast = $mdToast;
        this.$timeout = $timeout;
        this.$translate = $translate;
        this.msApi = msApi;
        this.ngProgressLite = ngProgressLite;
        this.$stateParams = $stateParams;
    
        // Data
        this.siteOption = SiteOption.items;
        this.siteOptionValue = {}
        var self = this;
        $.each(self.siteOption, function(index, item){
            var key =  item['site_option_name'];
            var value =  item['site_option_value'];
            self.siteOptionValue[key] = value;
        });
        
    }

    controller.prototype.save = function(event){
         var self = this;
        if(self.$$submit) return;
        self.$$submit = true;
        var confirm = self.$mdDialog.confirm()
            .title(self.$translate.instant('SETTING_COMPANY.SAVE_CONFIRM_TITLE'))
            .textContent(self.$translate.instant('SETTING_COMPANY.SAVE_CONFIRM_TEXT'))
            .ariaLabel(self.$translate.instant('SETTING_COMPANY.SAVE_CONFIRM_ARIA'))
            .targetEvent(event)
            .hasBackdrop(false)
            .ok(self.$translate.instant('SETTING_COMPANY.YES'))
            .cancel(self.$translate.instant('SETTING_COMPANY.NO'));
        
        self.$mdDialog.show(confirm).then(function() {
            self.ngProgressLite.start();
            var data = $.map(self.siteOptionValue, function(item, key){
                    return {
                        'key' : key,
                        'value' : item
                    }
            });

            var params = {
                options : data,
                site_option_id : 'SITE_DESCRIPTION'
            }
            self.msApi.request('setting.company@save', params, function(resp){
                 self.team = resp;
                 var toast = self.$mdToast.simple()
                    .textContent(self.$translate.instant('SETTING_COMPANY.EDIT_SUCCESS', { 'team_name' : self.team.team_name }))
                    .action(self.$translate.instant('SETTING_COMPANY.DISMISS'))
                    .highlightAction(true)
                    .position('bottom right');
                    
                self.$mdToast.show(toast);
                self.ngProgressLite.done();
                self.$timeout(function(){
                    self.$$submit = false;
                    self.ngProgressLite.done();
                });
            }, function(err){
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