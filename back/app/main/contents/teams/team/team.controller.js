(function ()
{
    'use strict';

    angular
        .module('app.contents.teams')
        .controller('TeamDetailController', controller);

    /** @ngInject */
    function controller($document, $state, Team, $cookies, $log, $scope, $mdSticky, $mdDialog, $mdToast, $timeout, $translate, msApi, ngProgressLite, $stateParams)
    {

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
        this.team = Team;
        this.isNew = false;

        if(this.team){
        }else{
         this.isNew = true;
          this.team = {
                'title' : '',
                'subject' : '',
                'news' :'',
                'image' : {
                    file_id : ''
                }
            }
        }
        
    }

     controller.prototype.openImageDialog = function(){
        var self = this;
        var modal = self.$mdDialog.show({
            controller         : 'TeamImageDialogController',
            controllerAs       : 'vm',
            templateUrl        : 'app/main/contents/teams/team/image/team-image-dialog.html',
            parent             : angular.element(self.$document.find('body')),
            targetEvent        : event,
            clickOutsideToClose: true
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



    controller.prototype.update = function(event){
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

    controller.prototype.insert = function(event){
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

    controller.prototype.goBack = function(event){
        var self  = this;
        if(self.$$submit) return;
        self.$state.go('app.contents_teams', {  page : self.$stateParams.page}, { reload:true });
    }
})();