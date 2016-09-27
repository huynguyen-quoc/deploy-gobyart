(function ()
{
    'use strict';

    angular
        .module('app.contents.teams')
        .controller('TeamDialogController', controller);

    /** @ngInject */
    function controller($mdDialog, Team, msUtils, $translate, msApi, ngProgressLite, $mdToast, $timeout, $document, $log)
    {
        var vm = this;

        // Data
       
        vm.team = angular.copy(Team);
        vm.title = vm.team &&  vm.team.team_name ? vm.team.team_name : '';
        vm.isNew = false;

        if (!vm.team )
        {
            vm.team = {
                'team_name'    : '',
                'position'  : ''
            };
            vm.isNew = true;
        }

        vm.$mdDialog = $mdDialog;
        vm.$translate = $translate;
        vm.ngProgressLite = ngProgressLite;
        vm.msApi = msApi;
        vm.$mdToast = $mdToast;
        vm.$timeout = $timeout;
        vm.$document = $document;
        vm.$log = $log;
        vm.currentTab = 0;
   

    }
    
    controller.prototype.openImageDialog = function(){
        var self = this;
        var modal = self.$mdDialog.show({
            controller         : 'TeamImageDialogController',
            controllerAs       : 'vm',
            templateUrl        : 'app/main/contents/teams/dialogs/image/team-image-dialog.html',
            parent             : angular.element(self.$document.find('body')),
            targetEvent        : event,
            clickOutsideToClose: true,
            locals             : {
                Avatar : self.team.avatar
            }
        });

        modal.then(function(resp){
            self.$log.debug(resp);
            if(resp){
               self.team.avatar = resp;
              self.team.avatar.changed = true;
            }
        }, function(err){
            self.$log.debug(err);
        })
    }

    controller.prototype.closeDialog = function(){
        this.$mdDialog.hide();
    }

    controller.prototype.save = function(event){
        var self = this;
        if(self.$$submit) return;
        self.$$submit = true;
        var confirm = self.$mdDialog.confirm()
            .title(self.$translate.instant('TEAMS.SAVE_CONFIRM_TITLE'))
            .textContent(self.$translate.instant('TEAMS.SAVE_CONFIRM_TEXT'))
            .ariaLabel(self.$translate.instant('TEAMS.SAVE_CONFIRM_ARIA'))
            .targetEvent(event)
            .hasBackdrop(false)
            .ok(self.$translate.instant('TEAMS.YES'))
            .cancel(self.$translate.instant('TEAMS.NO'));
        
        self.$mdDialog.show(confirm).then(function() {
            self.ngProgressLite.start();
            var params = self.team;
            self.msApi.request('teams.teams@edit', params, function(resp){
                 self.team = resp;
                 var toast = self.$mdToast.simple()
                    .textContent(self.$translate.instant('TEAMS.EDIT_SUCCESS', { 'team_name' : self.team.team_name }))
                    .action(self.$translate.instant('TEAMS.DISMISS'))
                    .highlightAction(true)
                    .position('bottom right');
                    
                self.$mdToast.show(toast);
                 self.ngProgressLite.done();
                var returnValue = { action : 'update', team : self.team};
                self.$mdDialog.hide(returnValue);
            }, function(err){
                var msg = self.$translate.instant('TEAMS.ERRORS.INTERNAL');
                if(err.data){
                    var msg = self.$translate.instant('TEAMS.ERRORS.' + err.data.name);
                }

                var toast = self.$mdToast.simple()
                    .textContent(msg)
                    .action(self.$translate.instant('TEAMS.DISMISS'))
                    .highlightAction(true)
                    .position('top right');
                    
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

    controller.prototype.add = function(event){
        var self = this;
        if(self.$$submit) return;
        self.$$submit = true;
        var confirm = self.$mdDialog.confirm()
            .title(self.$translate.instant('TEAMS.ADD_CONFIRM_TITLE'))
            .textContent(self.$translate.instant('TEAMS.ADD_CONFIRM_TEXT'))
            .ariaLabel(self.$translate.instant('TEAMS.ADD_CONFIRM_ARIA'))
            .targetEvent(event)
            .hasBackdrop(false)
            .ok(self.$translate.instant('TEAMS.YES'))
            .cancel(self.$translate.instant('TEAMS.NO'));
        
        self.$mdDialog.show(confirm).then(function() {
            self.ngProgressLite.start();
            var params = self.team;
            self.msApi.request('teams.teams@add', params, function(resp){
                 self.team = resp;
                 var toast = self.$mdToast.simple()
                    .textContent(self.$translate.instant('TEAMS.ADD_SUCCESS'))
                    .action(self.$translate.instant('TEAMS.DISMISS'))
                    .highlightAction(true)
                    .position('bottom right');
                    
                self.$mdToast.show(toast);
                 self.ngProgressLite.done();
                var returnValue = { action : 'add', team : self.team};
                self.$mdDialog.hide(returnValue);
              
            }, function(err){
                var msg = self.$translate.instant('TEAMS.ERRORS.INTERNAL');
                if(err.data){
                    var msg = self.$translate.instant('TEAMS.ERRORS.' + err.data.name);
                }

                var toast = self.$mdToast.simple()
                    .textContent(msg)
                    .action(self.$translate.instant('TEAMS.DISMISS'))
                    .highlightAction(true)
                    .position('top right');
                    
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

     controller.prototype.remove = function(event){
        var self = this;
        if(self.$$submit) return;
        self.$$submit = true;
        var confirm = self.$mdDialog.confirm()
            .title(self.$translate.instant('TEAMS.DELETE_CONFIRM_TITLE'))
            .textContent(self.$translate.instant('TEAMS.DELETE_CONFIRM_TEXT'))
            .ariaLabel(self.$translate.instant('TEAMS.DELETE_CONFIRM_ARIA'))
            .targetEvent(event)
            .hasBackdrop(false)
            .ok(self.$translate.instant('TEAMS.YES'))
            .cancel(self.$translate.instant('TEAMS.NO'));
        
        self.$mdDialog.show(confirm).then(function() {
            self.ngProgressLite.start();
            var params = { team_id : self.team.team_id };
            self.msApi.request('teams.teams@remove', params, function(resp){
                 var toast = self.$mdToast.simple()
                    .textContent(self.$translate.instant('TEAMS.REMOVE_SUCCESS', { 'team_name' : self.team.team_name }))
                    .action(self.$translate.instant('TEAMS.DISMISS'))
                    .highlightAction(true)
                    .position('bottom right');
                    
                self.$mdToast.show(toast);
                self.ngProgressLite.done();
                var returnValue = { action : 'remove', team : self.team };
                self.$mdDialog.hide(returnValue);
            }, function(err){
                var msg = self.$translate.instant('TEAMS.ERRORS.INTERNAL');
                if(err.data){
                    var msg = self.$translate.instant('TEAMS.ERRORS.' + err.data.name);
                }

                var toast = self.$mdToast.simple()
                    .textContent(msg)
                    .action(self.$translate.instant('TEAMS.DISMISS'))
                    .highlightAction(true)
                    .position('top right');
                    
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