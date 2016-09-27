(function ()
{
    'use strict';

    angular
        .module('app.contents.teams')
        .controller('TeamsController', controller);

    /** @ngInject */
    function controller($scope, Teams, msUtils, $mdDialog, $document, msApi, ngProgressLite, $stateParams, $translate, $timeout, $mdToast, $state, pageSize, $log)
    {
        this.$scope = $scope;

        this.teams = Teams.items;

        this.total = Teams.total_items;

        this.$mdDialog = $mdDialog;

        this.$document = $document;

        this.filterIds = null;

        this.pageSize = pageSize;

        this.toggleInArray = msUtils.toggleInArray;

        this.exists = msUtils.exists;

        this.msApi = msApi;

        this.ngProgressLite  = ngProgressLite;

        this.$stateParams = $stateParams;

        this.selectedTeams = [];

        this.$translate  = $translate;

        this.$timeout = $timeout;

        this.$mdToast = $mdToast;

        this.$state  = $state;

        this.page = !$stateParams.page ? 1  : parseInt($stateParams.page)

        this.$log = $log;
        
    
        

    }

    

    controller.prototype.toggleSelect = function(data, event){
            if(event){
                event.stopPropagation();
            }

            if( this.selectedTeams.indexOf(data) > -1){
                this.selectedTeams.splice(this.selectedTeams.indexOf(data), 1);
            }else{
                this.selectedTeams.push(data);
            }
    }

    controller.prototype.searchData = function(){
        var self = this;
        if(self.$$submit) return false;
        self.$$submit = true;
        self.ngProgressLite.start();
        self.page = 1;
          var params = {
            page : self.page,
            page_size : self.pageSize,
            keywords  : self.keywords
        }
        self.$state.go('app.contents_teams', {page : self.page}, {notify:false});
          self.msApi.request('teams.teams@query', params, function(resp){
          self.total = resp.total_items;
          self.teams = resp.items;
          self.$timeout(function(){
              self.$$submit = false;
              self.ngProgressLite.done();
          });
        }, function(err){
           self.total = resp.total_items;
           self.teams = resp.items;
           var msg = self.$translate.instant('TEAMS.ERRORS.INTERNAL');
            if(error.data){
                var msg = self.$translate.instant('TEAMS.ERRORS.' + error.data.name);
            }

            var toast = self.$mdToast.simple()
                .textContent(msg)
                .action(self.$translate.instant('TEAMS.DISMISS'))
                .highlightAction(true)
                .position('bottom right');
                
            self.$mdToast.show(toast);
            self.$timeout(function(){
                self.$$submit = false;
                self.ngProgressLite.done();
            });
       });
    }
    
    controller.prototype.next = function(event){
        var self = this;
        if(event){
            event.stopPropagation();
        }
        if(self.$$submit) return false;
        if(self.page >= self.total / self.pageSize) return false;
        self.$$submit = true;
        self.ngProgressLite.start();
        self.page += 1;
        var params = {
            page : self.page,
            page_size : self.pageSize
        }
        self.$state.go('app.contents_teams', {page : self.page}, {notify:false});
        self.msApi.request('teams.teams@query', params, function(resp){
          self.total = resp.total_items;
          self.teams = resp.items;
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
    }

    controller.prototype.prev = function(event){
        var self = this;
        if(event){
            event.stopPropagation();
        }
        if(self.$$submit) return false;
        if(self.page <= 1) return false;
        self.$$submit = true;
        self.ngProgressLite.start();
        self.page -= 1;
        var params = {
            page : self.page,
            page_size : self.pageSize
        }
        self.$state.go('app.contents_teams', {page : self.page}, {notify:false});
        self.msApi.request('teams.teams@query', params, function(resp){
          self.total = resp.total_items;
          self.teams = resp.items;
          self.$timeout(function(){
              self.$$submit = false;
              self.ngProgressLite.done();
          });
       }, function(err){
           var msg = self.$translate.instant('TEAMS.ERRORS.INTERNAL');
            if(err.data){
                var msg = self.$translate.instant('TEAMS.ERRORS.' + err.data.name);
            }
            var toast = self.$mdToast.simple()
                .textContent(msg)
                .action(self.$translate.instant('TEAMS.DISMISS'))
                .highlightAction(true)
                .position('bottom right');
                
            self.$mdToast.show(toast);
            self.$timeout(function(){
                self.$$submit = false;
                self.ngProgressLite.done();
            });
       });
    }
    
    controller.prototype.openDialog = function(event, team){
         var self = this;
        if(self.$$submit) return false;
        self.$$submit = true;
        self.$state.go('app.contents_teams.detail', { team_id : team.team_id});
        // var self = this;
        // if(self.$$submit) return false;
        // self.$$submit = true;
        // var modal = self.$mdDialog.show({
        //     controller         : 'TeamDialogController',
        //     controllerAs       : 'vm',
        //     templateUrl        : 'app/main/contents/teams/dialogs/team/team-dialog.html',
        //     parent             : angular.element(self.$document.find('body')),
        //     targetEvent        : event,
        //     clickOutsideToClose: true,
        //     locals             : {
        //         Team : team
        //     }
        // });

        // modal.then(function(resp){
        //     self.$log.debug(resp);
        //     self.$$submit = false;
        //     if(resp){
        //         if(resp.action === 'add'){
        //             self.teams.unshift(resp.team);
        //             self.total += 1;
        //         }else if(resp.action === 'remove'){
        //             self.total -= 1;
        //             $.each(self.teams, function(index, item){
        //                 if(item.team_id === resp.team.team_id){
        //                     self.teams.splice(index, 1);
        //                     return false;
        //                 }
        //             });
                 
        //         }else if(resp.action === 'update'){
        //              $.each(self.teams, function(index, item){
        //                 if(item.team_id === resp.team.team_id){
        //                     item['team_name'] = resp.team.team_name;
        //                     item['position'] = resp.team.position;
        //                     item['avatar'] = resp.team.avatar;
        //                     return false;
        //                 }
        //             });

        //         }
        //     }
        // }, function(err){
        //     self.$$submit = false;
        //     self.$log.debug(err);
        // })
    }

     controller.prototype.remove = function(event, team, index){
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
            var params = { team_id : team.team_id };
            self.msApi.request('teams.teams@remove', params, function(resp){
                 var toast = self.$mdToast.simple()
                    .textContent(self.$translate.instant('TEAMS.REMOVE_SUCCESS', { 'team_name' : team.team_name }))
                    .action(self.$translate.instant('TEAMS.DISMISS'))
                    .highlightAction(true)
                    .position('bottom right');
                    
                self.$mdToast.show(toast);
                self.ngProgressLite.done();
                self.teams.splice(index, 1);
                self.$timeout(function(){
                    self.$$submit = false;
                    self.ngProgressLite.done();
                });
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

     controller.prototype.openNew = function(event){
        var self = this;
        if(self.$$submit) return false;
        self.$$submit = true;
        self.$state.go('app.contents_teams.new');
       
    }

})();