(function ()
{
    'use strict';

    angular
        .module('app.contents.artists')
        .controller('ArtistsController', controller);

    /** @ngInject */
    function controller($scope, Artists, msUtils, $mdDialog, $document, msApi, ngProgressLite, $stateParams, $translate, $timeout, $mdToast, $state, pageSize, $log)
    {
        this.$scope = $scope;

        this.artists = Artists.items;

        this.total = Artists.total_items;

        this.$mdDialog = $mdDialog;

        this.$document = $document;

        this.filterIds = null;

        this.pageSize = pageSize;

        this.toggleInArray = msUtils.toggleInArray;

        this.exists = msUtils.exists;

        this.msApi = msApi;

        this.ngProgressLite  = ngProgressLite;

        this.$stateParams = $stateParams;

        this.selectedData = [];

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

            if( this.selectedData.indexOf(data) > -1){
                this.selectedData.splice(this.selectedData.indexOf(data), 1);
            }else{
                this.selectedData.push(data);
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
        self.$state.go('app.contents_artists', {page : self.page}, {notify:false});
          self.msApi.request('artists.artist@query', params, function(resp){
          self.total = resp.total_items;
          self.artists = resp.items;
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
        self.$state.go('app.contents_artists', {page : self.page}, {notify:false});
        self.msApi.request('artists.artist@query', params, function(resp){
          self.total = resp.total_items;
          self.artists = resp.items;
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
       self.$state.go('app.contents_artists', {page : self.page}, {notify:false});
        self.msApi.request('artists.artist@query', params, function(resp){
          self.total = resp.total_items;
          self.artists = resp.items;
          self.$timeout(function(){
              self.$$submit = false;
              self.ngProgressLite.done();
          });
       }, function(err){
           var msg = self.$translate.instant('ARTISTS.ERRORS.INTERNAL_SERVER_ERROR');
            if(err.data){
                var msg = self.$translate.instant('ARTISTS.ERRORS.' + err.data.name);
            }
            var toast = self.$mdToast.simple()
                .textContent(msg)
                .action(self.$translate.instant('ARTISTS.DISMISS'))
                .highlightAction(true)
                .position('bottom right');
                
            self.$mdToast.show(toast);
            self.$timeout(function(){
                self.$$submit = false;
                self.ngProgressLite.done();
            });
       });
    }

    controller.prototype.openDetail = function(event, artist){
        var self = this;
        if(self.$$submit) return false;
        self.$$submit = true;
        self.$state.go('app.contents_artists.detail', { artist_id : artist.artist_id});
       
    }

     controller.prototype.openNew = function(event){
        var self = this;
        if(self.$$submit) return false;
        self.$$submit = true;
        self.$state.go('app.contents_artists.new');
       
    }



})();