(function ()
{
    'use strict';

    config.$inject = ["$stateProvider", "$translatePartialLoaderProvider", "msApiProvider", "msNavigationServiceProvider"];
    angular
        .module('app.contents.news',
            [
                'flow',
                'ngCropper'
            ]
        )
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {
       

        $stateProvider.state('app.contents_news', {
            url    : '/news/:page',
            params: {
                page: "1", 
                squash: true
            },
            views  : {
                'content@app': {
                    templateUrl: 'app/main/contents/news/news.html',
                    controller : 'NewsController as vm'
                }
            },
            requiredLogin : true,
            resolve: {
                News: ["msApi", "$stateParams", "pageSize", function (msApi, $stateParams, pageSize){
                    return msApi.resolve('news.news@query',  { page : $stateParams.page, page_size : pageSize});
                }],
            }
        })   
        .state('app.contents_news.detail', {
                url      : '/news/:news_id',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/contents/news/news/news.html',
                        controller : 'NewsDetailController as vm'
                    }
                },
                requiredLogin : true,
                resolve  : {
                    News: ['msApi', '$stateParams',  function (msApi, $stateParams)
                    {
                        return msApi.resolve('news.news@get', { news_id : $stateParams.news_id});
                    }]
                },
                bodyClass: 'news'
        })
        .state('app.contents_news.new', {
                url      : '/new',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/contents/news/news/news.html',
                        controller : 'NewsDetailController as vm'
                    }
                },
                requiredLogin : true,
                resolve  : {
                    News : function(){
                        return null;
                    }
                },
                bodyClass: 'news'
        });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/contents/news');

        // Api
         var uri = '/news/:news_id';
        msApiProvider.register('news.news', [uri,  { 'news_id' : '@news_id' } , {
              query :{
                method : 'GET',
                isArray : false
              },
              get :{
                method : 'GET',
                isArray : false
              },
              add :{
                method : 'POST'
              },
              edit :{
                method : 'PUT'
              },
              remove :{
                method : 'DELETE'
              }
        }]);

        var fileUri = '/files/:file_id';
        msApiProvider.register('news.files', [fileUri,  { 'file_id' : '@file_id' } , {
              update :{
                method : 'PUT',
                isArray : false
              },
              query : {
                method : 'GET'
              },
              delete :{
                method : 'DELETE',
                isArray : false
              }
        }]);

       
        // Navigation
        msNavigationServiceProvider.saveItem('contents.news', {
            title : 'News',
            icon  : 'icon-window-restore',
            state : 'app.contents_news',
            translate: 'NEWS.NEWS_NAV',
            weight : 1
        });

    }

})();
(function ()
{
    'use strict';

    controller.$inject = ["$mdDialog", "msUtils", "$translate", "msApi", "ngProgressLite", "$mdToast", "$timeout", "$cookies", "$log", "$scope", "Cropper"];
    angular
        .module('app.contents.news')
        .controller('NewsImageDialogController', controller);

    /** @ngInject */
    function controller($mdDialog, msUtils, $translate, msApi, ngProgressLite, $mdToast, $timeout, $cookies, $log, $scope, Cropper)
    {
        var vm = this;

        // Data
        vm.title = '';
        vm.$mdDialog = $mdDialog;
        vm.$translate = $translate;
        vm.ngProgressLite = ngProgressLite;
        vm.msApi = msApi;
        vm.$mdToast = $mdToast;
        vm.$timeout = $timeout;
        
        vm.ngFlowOptions = {
             target                   : 'api/v1/files?type=temp',
             chunkSize                : 15 * 1024 * 1024,
             maxChunkRetries          : 0,
             simultaneousUploads      : 1,
             testChunks               : false,
             singleFile               : true,
             progressCallbacksInterval: 1000
        };
        vm.ngFlow = {
            flow: {}
        };
        vm.dropping = false;
        vm.image = null;
        vm.$cookies = $cookies;
        vm.$log = $log;
        vm.$scope = $scope;
        $scope.cropper = {};
        vm.Cropper = Cropper;
        vm.cropper = {
            options : {
                maximize: true,
                zoomable : false,
                zoomOnTouch :false,
                zoomOnWheel : false,
                aspectRatio: 16 / 9,
                toggleDragModeOnDblclick : false

            },
            show : 'show',
            hide : 'hide'
        }
        vm.ngProgressLite = ngProgressLite;

    
    }

    controller.prototype.closeDialog = function(){
        this.$mdDialog.hide();
    }

    controller.prototype.save = function(event){
      
    }

    controller.prototype.fileAdded = function(file){
        var vm  = this;
        var uploadingFile = {
            id  : file.uniqueIdentifier,
            file: file,
            type: 'uploading'
        };
        vm.image = uploadingFile;
    }

    controller.prototype.upload = function(file){
        var vm  = this;
        vm.ngFlow.flow.opts.headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN'    : vm.$cookies.get('XSRF-TOKEN')
        };

        vm.ngFlow.flow.upload();
    }

    controller.prototype.uploadError = function(file, message, flow){
        this.$log.debug(message);

    }

     controller.prototype.fileSuccess = function(file, message){
        this.$log.debug(file);
        this.$log.debug(message);
        var self = this;
        var json = JSON.parse(message);
        self.image.file_id = json['file_id'];
        self.image.extension = json['extension'];
        self.image.name = json['name'];
        self.Cropper.encode((file = file.file)).then(function(dataUrl) {
            self.image.type = 'image';
            self.image.url = dataUrl;
            self.$timeout(function(){
                self.$scope.$broadcast(self.cropper.show);
            });
        });
       
       
    }

    controller.prototype.setImage = function(event){
        var self = this;
        if(self.$$submit) return;
        self.$$submit = true;
        var data = $('#img-cropper').cropper('getData');
        self.$log.debug(data);
        var param = data;
        self.ngProgressLite.start();
        param['file_id'] = self.image.file_id;
        param['extension'] = self.image.extension;
        param['name'] = self.image.name;
        self.msApi.request('news.files@update', param, function(resp){
            var data = {
                file_id : param['file_id'],
                extension : param['extension'],
                width: param['width'],
                height: param['height'],
                name : param['name']
            }
            self.ngProgressLite.done();
            self.$mdDialog.hide(data);
        }, function(err){
            var msg = self.$translate.instant('TEAMS.ERRORS.INTERNAL_SERVER_ERROR');
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
    }

  

})();
(function ()
{
    'use strict';

    config.$inject = ["$stateProvider", "$translatePartialLoaderProvider", "msApiProvider", "msNavigationServiceProvider"];
    angular
        .module('app.contents.teams',
            [
                'flow',
                'ngCropper'
            ]
        )
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {

        $stateProvider.state('app.contents_teams', {
            url    : '/teams/:page',
            params: {
                page: "1", 
                squash: true
            },
            views  : {
                'content@app': {
                    templateUrl: 'app/main/contents/teams/teams.html',
                    controller : 'TeamsController as vm'
                }
            },
            requiredLogin : true,
            resolve: {
                Teams: ["msApi", "$stateParams", "pageSize", function (msApi, $stateParams, pageSize){
                    return msApi.resolve('teams.teams@query',  { page : $stateParams.page, page_size : pageSize});
                }],
            }
        }) .state('app.contents_teams.detail', {
                url      : '/team/:team_id',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/contents/teams/team/team.html',
                        controller : 'TeamDetailController as vm'
                    }
                },
                requiredLogin : true,
                resolve  : {
                    Team: ['msApi', '$stateParams',  function (msApi, $stateParams)
                    {
                        return msApi.resolve('teams.teams@get', { team_id : $stateParams.team_id});
                    }]
                },
                bodyClass: 'team'
        })
        .state('app.contents_teams.new', {
                url      : '/new',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/contents/teams/team/team.html',
                        controller : 'TeamDetailController as vm'
                    }
                },
                requiredLogin : true,
                resolve  : {
                    Team : function(){
                        return null;
                    }
                },
                bodyClass: 'team'
        });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/contents/teams');

        // Api
         var uri = '/teams/:team_id';
        msApiProvider.register('teams.teams', [uri,  { 'team_id' : '@team_id' } , {
              query :{
                method : 'GET',
                isArray : false
              },
              add :{
                method : 'POST'
              },
              edit :{
                method : 'PUT'
              },
              remove :{
                method : 'DELETE'
              }
        }]);

        var fileUri = '/files/:file_id';
        msApiProvider.register('teams.files', [fileUri,  { 'file_id' : '@file_id' } , {
              update :{
                method : 'PUT',
                isArray : false
              },
              delete :{
                method : 'DELETE',
                isArray : false
              }
        }]);
     
        // Navigation
        msNavigationServiceProvider.saveItem('contents.teams', {
            title : 'Teams',
            icon  : 'icon-account-box',
            state : 'app.contents_teams',
            translate: 'TEAMS.TEAMS_NAV',
            weight : 1
        });

    }

})();
(function ()
{
    'use strict';

    controller.$inject = ["$mdDialog", "msUtils", "$translate", "msApi", "ngProgressLite", "$mdToast", "$timeout", "$cookies", "$log", "$scope", "Cropper"];
    angular
        .module('app.contents.teams')
        .controller('TeamImageDialogController', controller);

    /** @ngInject */
    function controller($mdDialog, msUtils, $translate, msApi, ngProgressLite, $mdToast, $timeout, $cookies, $log, $scope, Cropper)
    {
        var vm = this;

        // Data
        vm.title = '';
        vm.$mdDialog = $mdDialog;
        vm.$translate = $translate;
        vm.ngProgressLite = ngProgressLite;
        vm.msApi = msApi;
        vm.$mdToast = $mdToast;
        vm.$timeout = $timeout;
        
        vm.ngFlowOptions = {
             target                   : 'api/v1/files?type=temp',
             chunkSize                : 15 * 1024 * 1024,
             maxChunkRetries          : 0,
             simultaneousUploads      : 1,
             testChunks               : false,
             singleFile               : true,
             progressCallbacksInterval: 1000
        };
        vm.ngFlow = {
            flow: {}
        };
        vm.dropping = false;
        vm.image = null;
        vm.$cookies = $cookies;
        vm.$log = $log;
        vm.$scope = $scope;
        $scope.cropper = {};
        vm.Cropper = Cropper;
        vm.cropper = {
            options : {
                maximize: true,
                zoomable : false,
                zoomOnTouch :false,
                zoomOnWheel : false,
                aspectRatio: 3 / 4,
                toggleDragModeOnDblclick : false

            },
            show : 'show',
            hide : 'hide'
        }
        vm.ngProgressLite = ngProgressLite;

    
    }

    controller.prototype.closeDialog = function(){
        this.$mdDialog.hide();
    }

    controller.prototype.save = function(event){
      
    }

    controller.prototype.fileAdded = function(file){
        var vm  = this;
        var uploadingFile = {
            id  : file.uniqueIdentifier,
            file: file,
            type: 'uploading'
        };
        vm.image = uploadingFile;
    }

    controller.prototype.upload = function(file){
        var vm  = this;
        vm.ngFlow.flow.opts.headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN'    : vm.$cookies.get('XSRF-TOKEN')
        };

        vm.ngFlow.flow.upload();
    }

    controller.prototype.uploadError = function(file, message, flow){
        this.$log.debug(message);

    }

     controller.prototype.fileSuccess = function(file, message){
        this.$log.debug(file);
        this.$log.debug(message);
        var self = this;
        var json = JSON.parse(message);
        self.image.file_id = json['file_id'];
        self.image.extension = json['extension'];
        self.image.name = json['name'];
        self.Cropper.encode((file = file.file)).then(function(dataUrl) {
            self.image.type = 'image';
            self.image.url = dataUrl;
            self.$timeout(function(){
                self.$scope.$broadcast(self.cropper.show);
            });
        });
       
       
    }

    controller.prototype.setImage = function(event){
        var self = this;
        if(self.$$submit) return;
        self.$$submit = true;
        var data = $('#img-cropper').cropper('getData');
        self.$log.debug(data);
        var param = data;
        self.ngProgressLite.start();
        param['file_id'] = self.image.file_id;
        param['extension'] = self.image.extension;
        param['name'] = self.image.name;
        self.msApi.request('teams.files@update', param, function(resp){
            var data = {
                file_id : param['file_id'],
                extension : param['extension'],
                width: param['width'],
                height: param['height'],
                name : param['name']
            }
            self.ngProgressLite.done();
            self.$mdDialog.hide(data);
        }, function(err){
        
            self.$timeout(function(){
                self.$$submit = false;
                self.ngProgressLite.done();
            });
        });
    }

  

})();
(function ()
{
    'use strict';

    controller.$inject = ["$document", "$state", "Team", "$cookies", "$log", "$scope", "$mdSticky", "$mdDialog", "$mdToast", "$timeout", "$translate", "msApi", "ngProgressLite", "$stateParams"];
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
(function ()
{
    'use strict';

    controller.$inject = ["$document", "$state", "News", "$cookies", "$log", "$scope", "$mdSticky", "$mdDialog", "$mdToast", "$timeout", "$translate", "msApi", "ngProgressLite", "$stateParams"];
    angular
        .module('app.contents.news')
        .controller('NewsDetailController', controller);

    /** @ngInject */
    function controller($document, $state, News, $cookies, $log, $scope, $mdSticky, $mdDialog, $mdToast, $timeout, $translate, msApi, ngProgressLite, $stateParams)
    {

        this.taToolbar = [
            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote', 'bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
            ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull', 'indent', 'outdent', 'html', 'insertImage', 'insertLink', 'insertVideo', 'wordcount', 'charcount']
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
        this.news = News;
        this.isNew = false;

        if(this.news){
        }else{
         this.isNew = true;
          this.news = {
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
            controller         : 'NewsImageDialogController',
            controllerAs       : 'vm',
            templateUrl        : 'app/main/contents/news/news/dialogs/image/news-image-dialog.html',
            parent             : angular.element(self.$document.find('body')),
            targetEvent        : event,
            clickOutsideToClose: true
        });

        modal.then(function(resp){
            self.$log.debug(resp);
            if(resp){
              self.news.image = resp;
              self.news.image.changed = true;
            }
        }, function(err){
            self.$log.debug(err);
        })
    }

    controller.prototype.initImage = function(){
        var self = this;
        var uploadingFile = {
            "default" : true,
            "file_id" : 1,
            "id": 1,
            "url": "assets/images/ecommerce/product-image-placeholder.png",
            "type": "image"
        };
        self.images.push(uploadingFile);
    }

    controller.prototype.fileAdded = function(file, type){
        var ext = file.getExtension();
        if(ext != 'jpg' && ext != 'png') return false;
        var vm  = this;
        var uploadingFile = {
            id  : file.uniqueIdentifier,
            file: file,
            file_type : type !== 'video_link' ? 'image' : 'video_link', 
            uploading  : true
        };
        vm.images.unshift(uploadingFile);
    }

    controller.prototype.upload = function(file, type){
        var vm  = this;
       
        if(type === 'video_link'){
             vm.ngFlow.flowVideo.opts.headers = {
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN'    : vm.$cookies.get('XSRF-TOKEN')
            };
            vm.ngFlow.flowVideo.upload();
        }else{
             vm.ngFlow.flow.opts.headers = {
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN'    : vm.$cookies.get('XSRF-TOKEN')
            };
             vm.ngFlow.flow.upload();
        }
    }
    

    controller.prototype.uploadError = function(file, message, flow){
        this.$log.debug(message);

    }

     controller.prototype.fileSuccess = function(file, message, type){
        this.$log.debug(file);
        this.$log.debug(message);
        var self = this;
        var json = JSON.parse(message);
      
        $.each(self.images, function (index, media)
        {
            if ( media.id === file.uniqueIdentifier )
            {
                var imageUploadUri = (self.isNew) ? 'api/v1/temp/' : 'api/v1/upload/';
                media.url = imageUploadUri + json['file_id'] + '.' +  json['extension'];
                media.file_id = json['file_id'];
                media.extension = json['extension'];
                media.file_type = json['file_type'] !== 'video_link' ? 'image' : 'video_link';
                media.name = json['name'];
                media.uploading  = false;
                return false;
            }
        });
    }


    controller.prototype.update = function(event){
        var self = this;
        if(self.$$submit) return;
        self.$$submit = true;

         var confirm = self.$mdDialog.confirm()
            .title(self.$translate.instant('NEWS.UPDATE_NEWS_TITLE'))
            .textContent(self.$translate.instant('NEWS.UPDATE_NEWS_TEXT', { artist_name : self.news.title }))
            .ariaLabel(self.$translate.instant('NEWS.UPDATE_NEWS_ARIA'))
            .targetEvent(event)
            .hasBackdrop(false)
            .ok(self.$translate.instant('NEWS.YES'))
            .cancel(self.$translate.instant('NEWS.NO'));

            self.$mdDialog.show(confirm).then(function() {
                self.ngProgressLite.start();
                var dataUpdate = angular.copy(self.news);
                var params = dataUpdate;
                self.msApi.request('news.news@edit', params, function(resp){
                    self.artist = resp;
                    var toast = self.$mdToast.simple()
                        .textContent(self.$translate.instant('NEWS.UPDATE_SUCCESS', { artist_name : self.news.title }))
                        .action(self.$translate.instant('NEWS.DISMISS'))
                        .highlightAction(true)
                        .position('bottom right');
                        
                    self.$mdToast.show(toast);
                    self.ngProgressLite.done();
                    self.$timeout(function(){
                        self.$$submit = false;
                        self.ngProgressLite.done();
                    });
                
                }, function(err){
                    var msg = self.$translate.instant('NEWS.ERRORS.INTERNAL_SERVER_ERROR');
                    if(err.data){
                        var msg = self.$translate.instant('NEWS.ERRORS.' + err.data.name);
                    }

                    var toast = self.$mdToast.simple()
                        .textContent(msg)
                        .action(self.$translate.instant('NEWS.DISMISS'))
                        .highlightAction(true)
                        .position('top right');
                        
                    self.$mdToast.show(toast);
                    self.$timeout(function(){
                        self.$$submit = false;
                        self.ngProgressLite.done();
                    });
                });
        }, function(err){
            self.$$submit = false;
        });
    }

       controller.prototype.insert = function(event){
        var self = this;
        if(self.$$submit) return;
        self.$$submit = true;

         var confirm = self.$mdDialog.confirm()
            .title(self.$translate.instant('NEWS.INSERT_TITLE'))
            .textContent(self.$translate.instant('NEWS.INSERT_TEXT'))
            .ariaLabel(self.$translate.instant('NEWS.INSERT_ARIA'))
            .targetEvent(event)
            .hasBackdrop(false)
            .ok(self.$translate.instant('ARTISTS.YES'))
            .cancel(self.$translate.instant('ARTISTS.NO'));

            self.$mdDialog.show(confirm).then(function() {
                self.ngProgressLite.start();
                var dataUpdate = angular.copy(self.news);
                var params = dataUpdate;
                self.msApi.request('news.news@add', params, function(resp){
                    self.artist = resp;
                    var toast = self.$mdToast.simple()
                        .textContent(self.$translate.instant('NEWS.UPDATE_SUCCESS', { artist_name : self.artist.full_name }))
                        .action(self.$translate.instant('NEWS.DISMISS'))
                        .highlightAction(true)
                        .position('bottom right');
                        
                    self.$mdToast.show(toast);
                    self.ngProgressLite.done();
                    self.$timeout(function(){
                        self.$$submit = false;
                        self.ngProgressLite.done();
                    });
                
                }, function(err){
                    var msg = self.$translate.instant('NEWS.ERRORS.INTERNAL_SERVER_ERROR');
                    if(err.data){
                        var msg = self.$translate.instant('NEWS.ERRORS.' + err.data.name);
                    }

                    var toast = self.$mdToast.simple()
                        .textContent(msg)
                        .action(self.$translate.instant('NEWS.DISMISS'))
                        .highlightAction(true)
                        .position('top right');
                        
                    self.$mdToast.show(toast);
                    self.$timeout(function(){
                        self.$$submit = false;
                        self.ngProgressLite.done();
                    });
                });
        }, function(err){
            self.$$submit = false;
        });
    }

    controller.prototype.goBack = function(event){
        var self  = this;
        if(self.$$submit) return;
        self.$state.go('app.contents_news', {  page : self.$stateParams.page}, { reload:true });
    }
})();
(function ()
{
    'use strict';

    config.$inject = ["$stateProvider", "$translatePartialLoaderProvider", "msApiProvider", "msNavigationServiceProvider"];
    angular
        .module('app.contents.artists',
            [
                'flow',
                'ngCropper'
            ]
        )
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {

        $stateProvider.state('app.contents_artists', {
            url    : '/artists/:page',
            params: {
                page: "1", 
                squash: true
            },
            views  : {
                'content@app': {
                    templateUrl: 'app/main/contents/artists/artists.html',
                    controller : 'ArtistsController as vm'
                }
            },
            requiredLogin : true,
            resolve: {
                Artists: ["msApi", "$stateParams", "pageSize", function (msApi, $stateParams, pageSize){
                    return msApi.resolve('artists.artist@query',  { page : $stateParams.page, page_size : pageSize});
                }],
            }
        })   
        .state('app.contents_artists.detail', {
                url      : '/artist/:artist_id',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/contents/artists/artist/artist.html',
                        controller : 'ArtistController as vm'
                    }
                },
                requiredLogin : true,
                resolve  : {
                    Artist: ['msApi', '$stateParams',  function (msApi, $stateParams)
                    {
                        return msApi.resolve('artists.artist@get', { artist_id : $stateParams.artist_id});
                    }],
                    Images: ['msApi', '$stateParams', 'pageSize',  function (msApi, $stateParams, pageSize)
                    {
                        return msApi.resolve('artists.files@get', { artist_id : $stateParams.artist_id, type : 'all_file_artist', page_size : pageSize});
                    }],
                    ArtistTypes : ['msApi', '$stateParams', 'pageSize',  function (msApi, $stateParams, pageSize)
                    {
                        return msApi.resolve('artists.artistType@get', { page_size : pageSize});
                    }],
                    MusicCategories : ['msApi', '$stateParams', 'pageSize',  function (msApi, $stateParams, pageSize)
                    {
                        return msApi.resolve('artists.musicCategory@query', { page_size : pageSize + 10});
                    }],
                    ArtistOptions : ['msApi', '$stateParams', 'pageSize',  function (msApi, $stateParams, pageSize)
                    {
                        return msApi.resolve('artists.siteOption@query', { site_type : 'ARTIST_OPTIONS', page_size : pageSize + 10});
                    }]

                },
                bodyClass: 'artist'
        })
        .state('app.contents_artists.new', {
                url      : '/new',
                views    : {
                    'content@app': {
                        templateUrl: 'app/main/contents/artists/artist/artist.html',
                        controller : 'ArtistController as vm'
                    }
                },
                requiredLogin : true,
                resolve  : {
                    Artist : function(){
                        return null;
                    },
                    Images : function(){
                        return null;
                    },
                    ArtistTypes :['msApi', '$stateParams', 'pageSize',  function (msApi, $stateParams, pageSize)
                    {
                        return msApi.resolve('artists.artistType@get', { page_size : pageSize});
                    }],
                    MusicCategories :['msApi', '$stateParams', 'pageSize',   function (msApi, $stateParams, pageSize)
                    {
                        return msApi.resolve('artists.musicCategory@query', { page_size : pageSize + 10});
                    }],
                    ArtistOptions :['msApi', '$stateParams', 'pageSize',   function (msApi, $stateParams, pageSize)
                    {
                        return msApi.resolve('artists.siteOption@query', { site_type : 'ARTIST_OPTIONS', page_size : pageSize + 10});
                    }]

                },
                bodyClass: 'artist'
        });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/contents/artists');

        // Api
         var uri = '/artists/:artist_id';
        msApiProvider.register('artists.artist', [uri,  { 'artist_id' : '@artist_id' } , {
              query :{
                method : 'GET',
                isArray : false
              },
              get :{
                method : 'GET',
                isArray : false
              },
              add :{
                method : 'POST'
              },
              edit :{
                method : 'PUT'
              },
              remove :{
                method : 'DELETE'
              }
        }]);

        var fileUri = '/files/:file_id';
        msApiProvider.register('artists.files', [fileUri,  { 'file_id' : '@file_id' } , {
              update :{
                method : 'PUT',
                isArray : false
              },
              query : {
                method : 'GET'
              },
              delete :{
                method : 'DELETE',
                isArray : false
              }
        }]);

        var artistTypeUri = '/artist_type';
        msApiProvider.register('artists.artistType', [artistTypeUri,  {  } , {
              query : {
                method : 'GET',
                cache : true
              }
        }]);

        var musicCategoryUri = '/music_category';
        msApiProvider.register('artists.musicCategory', [musicCategoryUri,  {  } , {
              query : {
                method : 'GET',
                cache : true
              }
        }]);

        var siteOptionUri = '/site_option/:site_type';
        msApiProvider.register('artists.siteOption', [siteOptionUri,  {  'site_type' : '@site_type' } , {
              query : {
                method : 'GET',
                cache : true
              }
        }]);
     
        // Navigation
        msNavigationServiceProvider.saveItem('contents.artists', {
            title : 'Artists',
            icon  : 'icon-account-box',
            state : 'app.contents_artists',
            translate: 'ARTISTS.ARTIST_NAV',
            weight : 1
        });

    }

})();
(function ()
{
    'use strict';

    controller.$inject = ["$document", "$state", "Artist", "Images", "$cookies", "$log", "ArtistTypes", "MusicCategories", "$scope", "ArtistOptions", "$mdSticky", "$mdDialog", "$mdToast", "$timeout", "$translate", "msApi", "ngProgressLite", "$stateParams"];
    angular
        .module('app.contents.artists')
        .controller('ArtistController', controller);

    /** @ngInject */
    function controller($document, $state, Artist, Images, $cookies, $log, ArtistTypes, MusicCategories, $scope, ArtistOptions, $mdSticky, $mdDialog, $mdToast, $timeout, $translate, msApi, ngProgressLite, $stateParams)
    {
        var vm = this;

        // Data
        vm.artist = Artist;
      
        vm.images = [];
        vm.isNew = true;
        if(vm.artist){
            
            if(vm.artist.birth_day !== '') {
                vm.artist.birth_day_date =  new Date(vm.artist.birth_day);
            }
            vm.images = !Images.items ? [] : $.map(Images.items, function(media,index){
                return {
                        "id": media.file_id,
                        "file_id" : media.file_id,
                        "extension" : media.extension,
                        "file_type" : media.file_type,
                        'link'  : media.link,
                        uploading  : false,
                        "name" : media.name,
                        "url": 'api/v1/upload/' + media['file_id'] + '.' +  media['extension'],
                        "type": "image"
                    };
            });
            vm.isNew = false;
        }else{
            vm.artist = {
                first_name : '',
                last_name : '',
                full_name : '',
                description : '',
                artist_information : '',
                birth_day : null,
                seo : {
                    meta : '',
                    keywords : ''
                },
                avatar : {
                    file_id : '',
                    extension : '',
                    file_type : ''
                }
            }
        }
        vm.categoriesSelectFilter = '';
       
        //console.log(  vm.images );
        vm.extraOptions = ArtistOptions.items;
        var imageUploadUri = (vm.isNew) ? 'api/v1/files?type=temp&file_type=image' : 'api/v1/files?type=artist&file_type=image&artist_id=' + vm.artist.artist_id;
        vm.ngFlowOptions = {
             target                   : imageUploadUri,
             chunkSize                : 15 * 1024 * 1024,
             maxChunkRetries          : 0,
             simultaneousUploads      : 3,
             testChunks               : false,
             singleFile               : false,
             progressCallbacksInterval: 1000
        };

        var videoUploadUri = (vm.isNew) ? 'api/v1/files?type=temp&file_type=video_link' : 'api/v1/files?type=artist&file_type=video_link&artist_id=' + vm.artist.artist_id;
        vm.ngFlowVideoOptions = {
             target                   : videoUploadUri,
             chunkSize                : 15 * 1024 * 1024,
             maxChunkRetries          : 0,
             simultaneousUploads      : 3,
             testChunks               : false,
             singleFile               : false,
             progressCallbacksInterval: 1000
        };
        
        vm.ngFlow = {
            flow: {},
            flowVideo: {}
        };
        vm.dropping = false;

        vm.$cookies = $cookies;
        vm.$log = $log;
        vm.currentTab = 0;
        vm.artistTypes = ArtistTypes.items;
        vm.musicCategories = MusicCategories.items;
        vm.$mdDialog = $mdDialog;
        vm.$mdToast = $mdToast;
        vm.$timeout = $timeout;
        vm.$translate = $translate;
        vm.msApi = msApi;
        vm.ngProgressLite = ngProgressLite;
        vm.$stateParams = $stateParams;
        vm.$state = $state;
        vm.urlRegex = '/^https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,}$/i';
        vm.initImage();

       // $mdSticky($scope, $('#artist .header'));
    
    }

    controller.prototype.initImage = function(){
        var self = this;
        var uploadingFile = {
            "default" : true,
            "file_id" : 1,
            "id": 1,
            "url": "assets/images/ecommerce/product-image-placeholder.png",
            "type": "image"
        };
        self.images.push(uploadingFile);
    }

    controller.prototype.fileAdded = function(file, type){
        var ext = file.getExtension();
        if(ext != 'jpg' && ext != 'png') return false;
        var vm  = this;
        var uploadingFile = {
            id  : file.uniqueIdentifier,
            file: file,
            file_type : type !== 'video_link' ? 'image' : 'video_link', 
            uploading  : true
        };
        vm.images.unshift(uploadingFile);
    }

    controller.prototype.upload = function(file, type){
        var vm  = this;
       
        if(type === 'video_link'){
             vm.ngFlow.flowVideo.opts.headers = {
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN'    : vm.$cookies.get('XSRF-TOKEN')
            };
            vm.ngFlow.flowVideo.upload();
        }else{
             vm.ngFlow.flow.opts.headers = {
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN'    : vm.$cookies.get('XSRF-TOKEN')
            };
             vm.ngFlow.flow.upload();
        }
    }
    

    controller.prototype.uploadError = function(file, message, flow){
        this.$log.debug(message);

    }

     controller.prototype.fileSuccess = function(file, message, type){
        this.$log.debug(file);
        this.$log.debug(message);
        var self = this;
        var json = JSON.parse(message);
      
        $.each(self.images, function (index, media)
        {
            if ( media.id === file.uniqueIdentifier )
            {
                var imageUploadUri = (self.isNew) ? 'api/v1/temp/' : 'api/v1/upload/';
                media.url = imageUploadUri + json['file_id'] + '.' +  json['extension'];
                media.file_id = json['file_id'];
                media.extension = json['extension'];
                media.file_type = json['file_type'] !== 'video_link' ? 'image' : 'video_link';
                media.name = json['name'];
                media.uploading  = false;
                return false;
            }
        });
    }

    controller.prototype.filterMusicCategory = function(data){
		return function(item){
         return (data  && item.artist_type.artist_type_id === data);
       };
	}

    controller.prototype.selectImage = function(event, image){
        var self = this;
        if(image.default) return;
        $.each(self.images, function(index, item){
            item.selected = false;
        })
        image.selected = true;
        self.selectedImage = image;
    }

    controller.prototype.setAsNewAvatar = function(event){
        var self = this;
        var image = self.selectedImage;
        if(!image) return;
        //var imageUploadUri = (!self.artist) ? 'api/v1/temp/' : 'api/v1/upload/';
        self.artist.avatar = image;
        self.selectedImage = undefined;
    }

    controller.prototype.deleteImage = function(event){
        var self = this;
        var image = self.selectedImage;
        if(!image) return;
        if(self.$$submit) return;
        self.$$submit = true;

       var confirm = self.$mdDialog.confirm()
            .title(self.$translate.instant('ARTISTS.REMOVE_IMAGE_TITLE'))
            .textContent(self.$translate.instant('ARTISTS.REMOVE_IMAGE_TEXT', { image_name : image.name }))
            .ariaLabel(self.$translate.instant('ARTISTS.REMOVE_IMAGE_ARIA'))
            .targetEvent(event)
            .hasBackdrop(false)
            .ok(self.$translate.instant('ARTISTS.YES'))
            .cancel(self.$translate.instant('ARTISTS.NO'));
        self.$mdDialog.show(confirm).then(function() {
            self.ngProgressLite.start();
            if(self.isNew){
                $.each(self.images, function(index ,item){
                    if(item.file_id === image.file_id){
                        self.images.splice(index, 1);
                        return false;
                    }
                });
                self.selectedImage = undefined;
            }else{
                var params = {
                    file_id : image.file_id,
                    type: 'artist'
                }
                self.msApi.request('artists.files@delete', params, function(resp){
                     $.each(self.images, function(index ,item){
                        if(item.file_id === image.file_id){
                            self.images.splice(index, 1);
                            return false;
                        }
                    });
                    var toast = self.$mdToast.simple()
                        .textContent(self.$translate.instant('ARTISTS.REMOVE_IMAGE_SUCCESS'))
                        .action(self.$translate.instant('ARTISTS.DISMISS'))
                        .highlightAction(true)
                        .position('bottom right');
                        
                    self.$mdToast.show(toast);
                    self.ngProgressLite.done();
                    self.$timeout(function(){
                        self.$$submit = false;
                        self.ngProgressLite.done();
                        self.selectedImage = undefined;
                    });
                
                }, function(err){
                  
                    self.$timeout(function(){
                        self.$$submit = false;
                        self.ngProgressLite.done();
                    });
                });
            }
        }, function(err){
            self.$$submit = false;
        });   
    }

    controller.prototype.update = function(event){
        var self = this;
        if(self.$$submit) return;
        self.$$submit = true;

         var confirm = self.$mdDialog.confirm()
            .title(self.$translate.instant('ARTISTS.UPDATE_ARTIST_TITLE'))
            .textContent(self.$translate.instant('ARTISTS.UPDATE_ARTIST_TEXT', { artist_name : self.artist.full_name }))
            .ariaLabel(self.$translate.instant('ARTISTS.UPDATE_ARTIST_ARIA'))
            .targetEvent(event)
            .hasBackdrop(false)
            .ok(self.$translate.instant('ARTISTS.YES'))
            .cancel(self.$translate.instant('ARTISTS.NO'));

            self.$mdDialog.show(confirm).then(function() {
                self.ngProgressLite.start();
                var dataUpdate = angular.copy(self.artist);
                dataUpdate.artist_information = JSON.stringify(dataUpdate.artist_information);
                delete dataUpdate.avatar.file;
                var params = {
                    artist_id : dataUpdate.artist_id,
                    artist : JSON.parse(angular.toJson(dataUpdate)),
                    artist_video : $.map(self.images, function(item, index){
                        if(item.file_type === 'video_link'){
                            return {
                                file_id : item.file_id,
                                link : item.link
                            }
                        }  
                    })
                }
                self.msApi.request('artists.artist@edit', params, function(resp){
                    self.artist = resp;
                    var toast = self.$mdToast.simple()
                        .textContent(self.$translate.instant('ARTISTS.UPDATE_ARTIST_SUCCESS', { artist_name : self.artist.full_name }))
                        .action(self.$translate.instant('ARTISTS.DISMISS'))
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
        }, function(err){
            self.$$submit = false;
        });
    }

       controller.prototype.insert = function(event){
        var self = this;
        if(self.$$submit) return;
        self.$$submit = true;

         var confirm = self.$mdDialog.confirm()
            .title(self.$translate.instant('ARTISTS.INSERT_ARTIST_TITLE'))
            .textContent(self.$translate.instant('ARTISTS.INSERT_ARTIST_TEXT'))
            .ariaLabel(self.$translate.instant('ARTISTS.INSERT_ARTIST_ARIA'))
            .targetEvent(event)
            .hasBackdrop(false)
            .ok(self.$translate.instant('ARTISTS.YES'))
            .cancel(self.$translate.instant('ARTISTS.NO'));

            self.$mdDialog.show(confirm).then(function() {
                self.ngProgressLite.start();
                var dataUpdate = angular.copy(self.artist);
                dataUpdate.artist_information = JSON.stringify(dataUpdate.artist_information);
                delete dataUpdate.avatar.file;
                var params = {
                    artist : JSON.parse(angular.toJson(dataUpdate)),
                    artist_video : $.map(self.images, function(item, index){
                        if(item.file_type === 'video_link'){
                            return {
                                file_id : item.file_id,
                                link : item.link,
                                name : item.name,
                                extension : item.extension
                            }
                        }  
                    }),
                    artist_image : $.map(self.images, function(item, index){
                        if(item.file_type === 'image'){
                            return {
                                file_id : item.file_id,
                                link : item.link,
                                name : item.name,
                                extension : item.extension
                            }
                        }  
                    })
                }
                self.msApi.request('artists.artist@add', params, function(resp){
                    self.artist = resp;
                    var toast = self.$mdToast.simple()
                        .textContent(self.$translate.instant('ARTISTS.UPDATE_ARTIST_SUCCESS', { artist_name : self.artist.full_name }))
                        .action(self.$translate.instant('ARTISTS.DISMISS'))
                        .highlightAction(true)
                        .position('bottom right');
                        
                    self.$mdToast.show(toast);
                    self.ngProgressLite.done();
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
                        .position('top right');
                        
                    self.$mdToast.show(toast);
                    self.$timeout(function(){
                        self.$$submit = false;
                        self.ngProgressLite.done();
                    });
                });
        }, function(err){
            self.$$submit = false;
        });
    }

    controller.prototype.goBack = function(event){
        var self  = this;
        if(self.$$submit) return;
        self.$state.go('app.contents_artists', {  page : self.$stateParams.page}, { reload:true });
    }
})();
(function ()
{
    'use strict';

    config.$inject = ["$translatePartialLoaderProvider", "msApiProvider"];
    angular
        .module('app.quick-panel', [])
        .config(config);

    /** @ngInject */
    function config($translatePartialLoaderProvider, msApiProvider)
    {
        // Translation
        $translatePartialLoaderProvider.addPart('app/quick-panel');

        // Api
        msApiProvider.register('quickPanel.activities', ['/app/data/quick-panel/activities.json']);
        msApiProvider.register('quickPanel.contacts', ['/app/data/quick-panel/contacts.json']);
        msApiProvider.register('quickPanel.events', ['/app/data/quick-panel/events.json']);
        msApiProvider.register('quickPanel.notes', ['/app/data/quick-panel/notes.json']);
    }
})();

(function ()
{
    'use strict';

    ChatTabController.$inject = ["msApi", "$timeout"];
    angular
        .module('app.quick-panel')
        .controller('ChatTabController', ChatTabController);

    /** @ngInject */
    function ChatTabController(msApi, $timeout)
    {
        var vm = this;

        // Data
        vm.chat = {};
        vm.chatActive = false;
        vm.replyMessage = '';

        msApi.request('quickPanel.contacts@get', {},
            // Success
            function (response)
            {
                vm.contacts = response.data;
            }
        );

        // Methods
        vm.toggleChat = toggleChat;
        vm.reply = reply;

        //////////

        function toggleChat(contact)
        {
            vm.chatActive = !vm.chatActive;

            if ( vm.chatActive )
            {
                vm.replyMessage = '';
                vm.chat.contact = contact;
                scrollToBottomOfChat(0);
            }
        }

        function reply()
        {
            if ( vm.replyMessage === '' )
            {
                return;
            }

            if ( !vm.chat.contact.dialog )
            {
                vm.chat.contact.dialog = [];
            }

            vm.chat.contact.dialog.push({
                who    : 'user',
                message: vm.replyMessage,
                time   : 'Just now'
            });

            vm.replyMessage = '';

            scrollToBottomOfChat(400);
        }

        function scrollToBottomOfChat(speed)
        {
            var chatDialog = angular.element('#chat-dialog');

            $timeout(function ()
            {
                chatDialog.animate({
                    scrollTop: chatDialog[0].scrollHeight
                }, speed);
            }, 0);

        }
    }

})();
(function ()
{
    'use strict';

    config.$inject = ["$stateProvider", "msNavigationServiceProvider", "$translatePartialLoaderProvider", "msApiProvider"];
    angular
        .module('app.setting.location',
            [
                // 3rd Party Dependencies
                'uiGmapgoogle-maps'
            ]
        )
        .config(config);

    /** @ngInject */
    function config($stateProvider, msNavigationServiceProvider, $translatePartialLoaderProvider, msApiProvider)
    {
        $stateProvider
            .state('app.setting_location', {
                url  : '/setting-location',
                views: {
                    'content@app'                   : {
                        templateUrl: 'app/main/setting/location/location.html',
                        controller : 'SettingLocationController as vm'
                    },
                    'tabContent@app.setting_location': {
                        templateUrl: 'app/main/setting/location/tabs/maps.html'
                    }
                },
                resolve: {
                    SiteOption: [ 'msApi', '$stateParams', 'pageSize', function (msApi, $stateParams, pageSize){
                        return msApi.resolve('setting.location@query',  { 'site_option_id' : 'SITE_LOCATION' , page : $stateParams.page, page_size : 150});
                    }],
                }
            });
        var uri = '/site_option/:site_option_id';
        msApiProvider.register('setting.location', [uri,  { 'site_option_id' : '@site_option_id' } , {
              query :{
                method : 'GET',
                isArray : false
              },
              save :{
                method : 'PUT',
                isArray : false
              }
        }]);

        $translatePartialLoaderProvider.addPart('app/main/setting/location');
              // Navigation
        msNavigationServiceProvider.saveItem('setting.location', {
            title : 'Location Setting',
            icon  : 'icon-map-marker',
            state : 'app.setting_location',
            translate: 'SETTING_LOCATION.SETTING_LOCATION_NAV',
            weight : 1
        });
    }

})();
(function ()
{
    'use strict';

    controller.$inject = ["$state", "uiGmapGoogleMapApi", "SiteOption", "$log", "uiGmapIsReady", "$mdDialog", "$mdToast", "$timeout", "$translate", "msApi", "ngProgressLite"];
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
(function ()
{
    'use strict';

    config.$inject = ["$stateProvider", "$translatePartialLoaderProvider", "msApiProvider", "msNavigationServiceProvider"];
    angular
        .module('app.setting.general',
            [
            ]
        )
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {

        $stateProvider.state('app.setting_general', {
            url    : '/setting-general',
            views  : {
                'content@app': {
                    templateUrl: 'app/main/setting/general/general.html',
                    controller : 'SettingGeneralController as vm'
                }
            },
            requiredLogin : true,
            resolve: {
                SiteOption: [ 'msApi', '$stateParams', 'pageSize', function (msApi, $stateParams, pageSize){
                    return msApi.resolve('setting.general@query',  { 'site_option_id' : 'SITE' , page : $stateParams.page, page_size : 150});
                }],
            }
        })   
      

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/setting/general');

        var fileGalleryEditUri = '/site_option/:site_option_id';
        msApiProvider.register('setting.general', [fileGalleryEditUri,  { 'site_option_id' : '@site_option_id' } , {
              query :{
                method : 'GET',
                isArray : false
              },
              save :{
                method : 'PUT',
                isArray : false
              }
        }]);


        // Navigation
        msNavigationServiceProvider.saveItem('setting.general', {
            title : 'General Setting',
            icon  : 'icon-information-outline',
            state : 'app.setting_general',
            translate: 'SETTING_GENERAL.SETTING_GENERAL_NAV',
            weight : 1
        });

    }

})();
(function ()
{
    'use strict';

    controller.$inject = ["$document", "$state", "SiteOption", "$cookies", "$log", "$scope", "$mdSticky", "$mdDialog", "$mdToast", "$timeout", "$translate", "msApi", "ngProgressLite", "$stateParams"];
    angular
        .module('app.setting.general')
        .controller('SettingGeneralController', controller);

    /** @ngInject */
    function controller($document, $state, SiteOption, $cookies, $log, $scope, $mdSticky, $mdDialog, $mdToast, $timeout, $translate, msApi, ngProgressLite, $stateParams)
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
            .title(self.$translate.instant('SETTING_GENERAL.SAVE_CONFIRM_TITLE'))
            .textContent(self.$translate.instant('SETTING_GENERAL.SAVE_CONFIRM_TEXT'))
            .ariaLabel(self.$translate.instant('SETTING_GENERAL.SAVE_CONFIRM_ARIA'))
            .targetEvent(event)
            .hasBackdrop(false)
            .ok(self.$translate.instant('SETTING_GENERAL.YES'))
            .cancel(self.$translate.instant('SETTING_GENERAL.NO'));
        
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
                site_option_id : 'SITE'
            }
            self.msApi.request('setting.general@save', params, function(resp){
                 self.team = resp;
                 var toast = self.$mdToast.simple()
                    .textContent(self.$translate.instant('SETTING_GENERAL.EDIT_SUCCESS', { 'team_name' : self.team.team_name }))
                    .action(self.$translate.instant('SETTING_GENERAL.DISMISS'))
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
(function ()
{
    'use strict';

    config.$inject = ["$stateProvider", "$translatePartialLoaderProvider", "msApiProvider", "msNavigationServiceProvider"];
    angular
        .module('app.setting.company',
            [
            ]
        )
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {

        $stateProvider.state('app.setting_company', {
            url    : '/setting-company',
            views  : {
                'content@app': {
                    templateUrl: 'app/main/setting/company/company.html',
                    controller : 'SettingCompanyController as vm'
                }
            },
            requiredLogin : true,
            resolve: {
                SiteOption: [ 'msApi', '$stateParams', 'pageSize', function (msApi, $stateParams, pageSize){
                    return msApi.resolve('setting.company@query',  { 'site_option_id' : 'SITE_DESCRIPTION' , page : $stateParams.page, page_size : 150});
                }],
            }
        })   
      

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/setting/company');

        var fileGalleryEditUri = '/site_option/:site_option_id';
        msApiProvider.register('setting.company', [fileGalleryEditUri,  { 'site_option_id' : '@site_option_id' } , {
              query :{
                method : 'GET',
                isArray : false
              },
              save :{
                method : 'PUT',
                isArray : false
              }
        }]);


        // Navigation
        msNavigationServiceProvider.saveItem('setting.company', {
            title : 'Company Setting',
            icon  : 'icon-information-outline',
            state : 'app.setting_company',
            translate: 'SETTING_COMPANY.SETTING_COMPANY_NAV',
            weight : 1
        });

    }

})();
(function ()
{
    'use strict';

    controller.$inject = ["$document", "$state", "SiteOption", "$cookies", "$log", "$scope", "$mdSticky", "$mdDialog", "$mdToast", "$timeout", "$translate", "msApi", "ngProgressLite", "$stateParams"];
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
(function ()
{
    'use strict';

    controller.$inject = ["$scope", "Teams", "msUtils", "$mdDialog", "$document", "msApi", "ngProgressLite", "$stateParams", "$translate", "$timeout", "$mdToast", "$state", "pageSize", "$log"];
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
(function ()
{
    'use strict';

    controller.$inject = ["$scope", "News", "msUtils", "$mdDialog", "$document", "msApi", "ngProgressLite", "$stateParams", "$translate", "$timeout", "$mdToast", "$state", "pageSize", "$log"];
    angular
        .module('app.contents.artists')
        .controller('NewsController', controller);

    /** @ngInject */
    function controller($scope, News, msUtils, $mdDialog, $document, msApi, ngProgressLite, $stateParams, $translate, $timeout, $mdToast, $state, pageSize, $log)
    {
        this.$scope = $scope;

        this.news = News.items;

        this.total = News.total_items;

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
           self.total = resp.total_items;
           self.teams = resp.items;
           var msg = self.$translate.instant('ARTISTS.ERRORS.INTERNAL_SERVER_ERROR');
            if(error.data){
                var msg = self.$translate.instant('ARTISTS.ERRORS.' + error.data.name);
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
           
            self.$timeout(function(){
                self.$$submit = false;
                self.ngProgressLite.done();
            });
       });
    }

    controller.prototype.openDetail = function(event, news){
        var self = this;
        if(self.$$submit) return false;
        self.$$submit = true;
        self.$state.go('app.contents_news.detail', { news_id : news.news_id});
       
    }

     controller.prototype.openNew = function(event){
        var self = this;
        if(self.$$submit) return false;
        self.$$submit = true;
        self.$state.go('app.contents_news.new');
       
    }



})();
(function ()
{
    'use strict';

    config.$inject = ["$stateProvider", "$translatePartialLoaderProvider", "msApiProvider", "msNavigationServiceProvider"];
    angular
        .module('app.contents.gallery',
            [
                'flow',
            ]
        )
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {

        $stateProvider.state('app.contents_gallery', {
            url    : '/gallery/:page',
            params: {
                page: "1", 
                squash: true
            },
            views  : {
                'content@app': {
                    templateUrl: 'app/main/contents/gallery/gallery.html',
                    controller : 'GalleryController as vm'
                }
            },
            requiredLogin : true,
            resolve: {
                Images: ["msApi", "$stateParams", "pageSize", function (msApi, $stateParams, pageSize){
                    return msApi.resolve('gallery.files@query',  { page : $stateParams.page, page_size : pageSize});
                }],
            }
        })   
      

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/contents/gallery');


        var fileGalleryUri = '/files/gallery/:file_id';
        msApiProvider.register('gallery.files', [fileGalleryUri,  { 'file_id' : '@file_id' } , {
              query : {
                method : 'GET'
              },
              delete :{
                method : 'DELETE',
                isArray : false
              }
        }]);

        var fileGalleryEditUri = '/files/:file_id';
        msApiProvider.register('gallery.file.edit', [fileGalleryEditUri,  { 'file_id' : '@file_id' } , {
              delete :{
                method : 'DELETE',
                isArray : false
              }
        }]);


        // Navigation
        msNavigationServiceProvider.saveItem('contents.gallery', {
            title : 'Gallery',
            icon  : 'icon-camera-iris',
            state : 'app.contents_gallery',
            translate: 'GALLERY.GALLERY_NAV',
            weight : 1
        });

    }

})();
(function ()
{
    'use strict';

    controller.$inject = ["$document", "$state", "Images", "$cookies", "$log", "$scope", "$mdDialog", "$mdToast", "$timeout", "$translate", "msApi", "ngProgressLite", "$stateParams", "pageSize"];
    angular
        .module('app.contents.gallery')
        .controller('GalleryController', controller);

    /** @ngInject */
    function controller($document, $state, Images, $cookies, $log, $scope, $mdDialog, $mdToast, $timeout, $translate, msApi, ngProgressLite, $stateParams ,pageSize)
    {
        var vm = this;
      
        vm.images = !Images.items ? [] : $.map(Images.items, function(media,index){
                return {
                        "id": media.file_id,
                        "file_id" : media.file_id,
                        "extension" : media.extension,
                        "file_type" : media.file_type,
                        'link'  : media.link,
                        uploading  : false,
                        "name" : media.name,
                        "url": 'api/v1/upload/' + media['file_id'] + '.' +  media['extension'],
                        "type": "image"
                    };
            });
        vm.total = Images.total_items;
        vm.pageSize = pageSize;
        vm.ngFlowOptions = {
             target                   : 'api/v1/files?type=gallery&file_type=image',
             chunkSize                : 15 * 1024 * 1024,
             maxChunkRetries          : 0,
             simultaneousUploads      : 3,
             testChunks               : false,
             singleFile               : false,
             progressCallbacksInterval: 1000
        };

        vm.page = !$stateParams.page ? 1  : parseInt($stateParams.page);
        vm.ngFlow = {
            flow: {},
        };
        vm.dropping = false;

        vm.$cookies = $cookies;
        vm.$log = $log;
        vm.currentTab = 0;
        vm.$mdDialog = $mdDialog;
        vm.$mdToast = $mdToast;
        vm.$timeout = $timeout;
        vm.$translate = $translate;
        vm.msApi = msApi;
        vm.ngProgressLite = ngProgressLite;
        vm.$stateParams = $stateParams;
        vm.$state = $state;
        
        vm.initImage();

    
    }

    controller.prototype.initImage = function(){
        var self = this;
        var uploadingFile = {
            "default" : true,
            "file_id" : 1,
            "id": 1,
            "url": "assets/images/ecommerce/product-image-placeholder.png",
            "type": "image"
        };
        self.images.push(uploadingFile);
    }

    controller.prototype.fileAdded = function(file, type){
        var ext = file.getExtension();
        if(ext != 'jpg' && ext != 'png') return false;
        var vm  = this;
        var uploadingFile = {
            id  : file.uniqueIdentifier,
            file: file,
            file_type : type,
            uploading  : true
        };
        vm.images.unshift(uploadingFile);
    }

    controller.prototype.upload = function(file, type){
        var vm  = this;
       
            vm.ngFlow.flow.opts.headers = {
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN'    : vm.$cookies.get('XSRF-TOKEN')
            };
             vm.ngFlow.flow.upload();
    }

    controller.prototype.selectImage = function(event, image){
        var self = this;
        if(image.default) return;
        $.each(self.images, function(index, item){
            item.selected = false;
        })
        image.selected = true;
        self.selectedImage = image;
    }
    

    controller.prototype.uploadError = function(file, message, flow){
        this.$log.debug(message);

    }

     controller.prototype.fileSuccess = function(file, message, type){
        this.$log.debug(file);
        this.$log.debug(message);
        var self = this;
        var json = JSON.parse(message);
      
        $.each(self.images, function (index, media)
        {
            if ( media.id === file.uniqueIdentifier )
            {
                var imageUploadUri = 'api/v1/upload/';
                media.url = imageUploadUri + json['file_id'] + '.' +  json['extension'];
                media.file_id = json['file_id'];
                media.extension = json['extension'];
                media.file_type = json['file_type'];
                media.name = json['name'];
                media.uploading  = false;
                return false;
            }
        });
    }



    controller.prototype.deleteImage = function(event){
        var self = this;
        var image = self.selectedImage;
        if(!image) return;
        if(self.$$submit) return;
        self.$$submit = true;

       var confirm = self.$mdDialog.confirm()
            .title(self.$translate.instant('ARTISTS.REMOVE_IMAGE_TITLE'))
            .textContent(self.$translate.instant('ARTISTS.REMOVE_IMAGE_TEXT', { image_name : image.name }))
            .ariaLabel(self.$translate.instant('ARTISTS.REMOVE_IMAGE_ARIA'))
            .targetEvent(event)
            .hasBackdrop(false)
            .ok(self.$translate.instant('ARTISTS.YES'))
            .cancel(self.$translate.instant('ARTISTS.NO'));
        self.$mdDialog.show(confirm).then(function() {
            self.ngProgressLite.start();
    
                var params = {
                    file_id : image.file_id,
                    type: 'gallery'
                }
                self.msApi.request('gallery.file.edit@delete', params, function(resp){
                     $.each(self.images, function(index ,item){
                        if(item.file_id === image.file_id){
                            self.images.splice(index, 1);
                            return false;
                        }
                    });
                    var toast = self.$mdToast.simple()
                        .textContent(self.$translate.instant('ARTISTS.REMOVE_IMAGE_SUCCESS'))
                        .action(self.$translate.instant('ARTISTS.DISMISS'))
                        .highlightAction(true)
                        .position('bottom right');
                        
                    self.$mdToast.show(toast);
                    self.ngProgressLite.done();
                    self.$timeout(function(){
                        self.$$submit = false;
                        self.ngProgressLite.done();
                        self.selectedImage = undefined;
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
                        .position('top right');
                        
                    self.$mdToast.show(toast);
                    self.$timeout(function(){
                        self.$$submit = false;
                        self.ngProgressLite.done();
                    });
                });
        }, function(err){
            self.$$submit = false;
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
        self.$state.go('app.contents_gallery', {page : self.page}, {notify:false});
        self.msApi.request('gallery.files@query', params, function(resp){
          self.total = resp.total_items;
          self.selectedImage = null;
          self.images = $.map(resp.items, function(media,index){
                return {
                        "id": media.file_id,
                        "file_id" : media.file_id,
                        "extension" : media.extension,
                        "file_type" : media.file_type,
                        'link'  : media.link,
                        uploading  : false,
                        "name" : media.name,
                        "url": 'api/v1/upload/' + media['file_id'] + '.' +  media['extension'],
                        "type": "image"
                    };
            });
            self.initImage();
            self.$timeout(function(){
                self.$$submit = false;
                self.ngProgressLite.done();
            });
       }, function(err){
        //    self.total = resp.total_items;
        //    self.teams = resp.items;
           
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
       self.$state.go('app.contents_gallery', {page : self.page}, {notify:false});
        self.msApi.request('gallery.files@query', params, function(resp){
           self.total = resp.total_items;
           self.selectedImage = null;
           self.images = $.map(resp.items, function(media,index){
                return {
                        "id": media.file_id,
                        "file_id" : media.file_id,
                        "extension" : media.extension,
                        "file_type" : media.file_type,
                        'link'  : media.link,
                        uploading  : false,
                        "name" : media.name,
                        "url": 'api/v1/upload/' + media['file_id'] + '.' +  media['extension'],
                        "type": "image"
                    };
            });
            self.initImage();
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


  
})();
(function ()
{
    'use strict';

    controller.$inject = ["$scope", "Artists", "msUtils", "$mdDialog", "$document", "msApi", "ngProgressLite", "$stateParams", "$translate", "$timeout", "$mdToast", "$state", "pageSize", "$log"];
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
(function ()
{
    'use strict';

    angular
        .module('app.core',
            [
                'ngAnimate',
                'ngAria',
                'angular-storage',
                'ngMessages',
                'ngResource',
                'ngSanitize',
                'ngMaterial',
                'pascalprecht.translate',
                'ui.router',
                'ngProgressLite',
                'ngCookies'
            ]);
})();
(function ()
{
    'use strict';

    MsWidgetController.$inject = ["$scope", "$element"];
    angular
        .module('app.core')
        .controller('MsWidgetController', MsWidgetController)
        .directive('msWidget', msWidgetDirective)
        .directive('msWidgetFront', msWidgetFrontDirective)
        .directive('msWidgetBack', msWidgetBackDirective);

    /** @ngInject */
    function MsWidgetController($scope, $element)
    {
        var vm = this;

        // Data
        vm.flipped = false;

        // Methods
        vm.flip = flip;

        //////////

        /**
         * Flip the widget
         */
        function flip()
        {
            if ( !isFlippable() )
            {
                return;
            }

            // Toggle flipped status
            vm.flipped = !vm.flipped;

            // Toggle the 'flipped' class
            $element.toggleClass('flipped', vm.flipped);
        }

        /**
         * Check if widget is flippable
         *
         * @returns {boolean}
         */
        function isFlippable()
        {
            return (angular.isDefined($scope.flippable) && $scope.flippable === true);
        }
    }

    /** @ngInject */
    function msWidgetDirective()
    {
        return {
            restrict  : 'E',
            scope     : {
                flippable: '=?'
            },
            controller: 'MsWidgetController',
            transclude: true,
            compile   : function (tElement)
            {
                tElement.addClass('ms-widget');

                return function postLink(scope, iElement, iAttrs, MsWidgetCtrl, transcludeFn)
                {
                    // Custom transclusion
                    transcludeFn(function (clone)
                    {
                        iElement.empty();
                        iElement.append(clone);
                    });

                    //////////
                };
            }
        };
    }

    /** @ngInject */
    function msWidgetFrontDirective()
    {
        return {
            restrict  : 'E',
            require   : '^msWidget',
            transclude: true,
            compile   : function (tElement)
            {
                tElement.addClass('ms-widget-front');

                return function postLink(scope, iElement, iAttrs, MsWidgetCtrl, transcludeFn)
                {
                    // Custom transclusion
                    transcludeFn(function (clone)
                    {
                        iElement.empty();
                        iElement.append(clone);
                    });

                    // Methods
                    scope.flipWidget = MsWidgetCtrl.flip;
                };
            }
        };
    }

    /** @ngInject */
    function msWidgetBackDirective()
    {
        return {
            restrict  : 'E',
            require   : '^msWidget',
            transclude: true,
            compile   : function (tElement)
            {
                tElement.addClass('ms-widget-back');

                return function postLink(scope, iElement, iAttrs, MsWidgetCtrl, transcludeFn)
                {
                    // Custom transclusion
                    transcludeFn(function (clone)
                    {
                        iElement.empty();
                        iElement.append(clone);
                    });

                    // Methods
                    scope.flipWidget = MsWidgetCtrl.flip;
                };
            }
        };
    }

})();
(function ()
{
    'use strict';

    msTimelineItemDirective.$inject = ["$timeout", "$q"];
    angular
        .module('app.core')
        .controller('MsTimelineController', MsTimelineController)
        .directive('msTimeline', msTimelineDirective)
        .directive('msTimelineItem', msTimelineItemDirective);

    /** @ngInject */
    function MsTimelineController()
    {
        var vm = this;

        // Data
        vm.scrollEl = undefined;

        // Methods
        vm.setScrollEl = setScrollEl;
        vm.getScrollEl = getScrollEl;

        //////////

        /**
         * Set scroll element
         *
         * @param scrollEl
         */
        function setScrollEl(scrollEl)
        {
            vm.scrollEl = scrollEl;
        }

        /**
         * Get scroll element
         *
         * @returns {undefined|*}
         */
        function getScrollEl()
        {
            return vm.scrollEl;
        }
    }

    /** @ngInject */
    function msTimelineDirective()
    {
        return {
            scope     : {
                msTimeline: '=?',
                loadMore  : '&?msTimelineLoadMore'
            },
            controller: 'MsTimelineController',
            compile   : function (tElement)
            {
                tElement.addClass('ms-timeline');

                return function postLink(scope, iElement, iAttrs, MsTimelineCtrl)
                {
                    // Create an element for triggering the load more action and append it
                    var loadMoreEl = angular.element('<div class="ms-timeline-loader md-accent-bg md-whiteframe-4dp"><span class="spinner animate-rotate"></span></div>');
                    iElement.append(loadMoreEl);

                    // Default config
                    var config = {
                        scrollEl: '#content'
                    };

                    // Extend the configuration
                    config = angular.extend(config, scope.msTimeline, {});
                    
                    // Grab the scrollable element and store it in the controller for general use
                    var scrollEl = angular.element(config.scrollEl);
                    MsTimelineCtrl.setScrollEl(scrollEl);

                    // Threshold
                    var threshold = 144;

                    // Register onScroll event for the first time
                    registerOnScroll();

                    /**
                     * onScroll Event
                     */
                    function onScroll()
                    {
                        if ( scrollEl.scrollTop() + scrollEl.height() + threshold > loadMoreEl.position().top )
                        {
                            // Show the loader
                            loadMoreEl.addClass('show');

                            // Unregister scroll event to prevent triggering the function over and over again
                            unregisterOnScroll();

                            // Trigger load more event
                            scope.loadMore().then(
                                // Success
                                function ()
                                {
                                    // Hide the loader
                                    loadMoreEl.removeClass('show');

                                    // Register the onScroll event again
                                    registerOnScroll();
                                },

                                // Error
                                function ()
                                {
                                    // Remove the loader completely
                                    loadMoreEl.remove();
                                }
                            );
                        }
                    }

                    /**
                     * onScroll event registerer
                     */
                    function registerOnScroll()
                    {
                        scrollEl.on('scroll', onScroll);
                    }

                    /**
                     * onScroll event unregisterer
                     */
                    function unregisterOnScroll()
                    {
                        scrollEl.off('scroll', onScroll);
                    }

                    // Cleanup
                    scope.$on('$destroy', function ()
                    {
                        unregisterOnScroll();
                    });
                };
            }
        };
    }

    /** @ngInject */
    function msTimelineItemDirective($timeout, $q)
    {
        return {
            scope  : true,
            require: '^msTimeline',
            compile: function (tElement)
            {
                tElement.addClass('ms-timeline-item').addClass('hidden');

                return function postLink(scope, iElement, iAttrs, MsTimelineCtrl)
                {
                    var threshold = 72,
                        itemLoaded = false,
                        itemInViewport = false,
                        scrollEl = MsTimelineCtrl.getScrollEl();

                    //////////

                    init();

                    /**
                     * Initialize
                     */
                    function init()
                    {
                        // Check if the timeline item has ms-card
                        if ( iElement.find('ms-card') )
                        {
                            // If the ms-card template loaded...
                            scope.$on('msCard::cardTemplateLoaded', function (event, args)
                            {
                                var cardEl = angular.element(args[0]);

                                // Test the card to see if there is any image on it
                                testForImage(cardEl).then(function ()
                                {
                                    $timeout(function ()
                                    {
                                        itemLoaded = true;
                                    });
                                });
                            });
                        }
                        else
                        {
                            // Test the element to see if there is any image on it
                            testForImage(iElement).then(function ()
                            {
                                $timeout(function ()
                                {
                                    itemLoaded = true;
                                });
                            });
                        }

                        // Check if the loaded element also in the viewport
                        scrollEl.on('scroll', testForVisibility);

                        // Test for visibility for the first time without waiting for the scroll event
                        testForVisibility();
                    }

                    // Item ready watcher
                    var itemReadyWatcher = scope.$watch(
                        function ()
                        {
                            return itemLoaded && itemInViewport;
                        },
                        function (current, old)
                        {
                            if ( angular.equals(current, old) )
                            {
                                return;
                            }

                            if ( current )
                            {
                                iElement.removeClass('hidden').addClass('animate');

                                // Unbind itemReadyWatcher
                                itemReadyWatcher();
                            }
                        }, true);

                    /**
                     * Test the given element for image
                     *
                     * @param element
                     * @returns promise
                     */
                    function testForImage(element)
                    {
                        var deferred = $q.defer(),
                            imgEl = element.find('img');

                        if ( imgEl.length > 0 )
                        {
                            imgEl.on('load', function ()
                            {
                                deferred.resolve('Image is loaded');
                            });
                        }
                        else
                        {
                            deferred.resolve('No images');
                        }

                        return deferred.promise;
                    }

                    /**
                     * Test the element for visibility
                     */
                    function testForVisibility()
                    {
                        if ( scrollEl.scrollTop() + scrollEl.height() > iElement.position().top + threshold )
                        {
                            $timeout(function ()
                            {
                                itemInViewport = true;
                            });

                            // Unbind the scroll event
                            scrollEl.off('scroll', testForVisibility);
                        }
                    }
                };
            }
        };
    }
})();
(function ()
{
    'use strict';

    MsStepperController.$inject = ["$timeout"];
    msVerticalStepperDirective.$inject = ["$timeout"];
    angular
        .module('app.core')
        .controller('MsStepperController', MsStepperController)
        .directive('msHorizontalStepper', msHorizontalStepperDirective)
        .directive('msHorizontalStepperStep', msHorizontalStepperStepDirective)
        .directive('msVerticalStepper', msVerticalStepperDirective)
        .directive('msVerticalStepperStep', msVerticalStepperStepDirective);

    /** @ngInject */
    function MsStepperController($timeout)
    {
        var vm = this;

        // Data
        vm.mainForm = undefined;

        vm.orientation = 'horizontal';
        vm.steps = [];
        vm.currentStep = undefined;
        vm.currentStepNumber = 1;

        // Methods
        vm.setOrientation = setOrientation;
        vm.registerMainForm = registerMainForm;
        vm.registerStep = registerStep;
        vm.setupSteps = setupSteps;
        vm.resetForm = resetForm;

        vm.setCurrentStep = setCurrentStep;

        vm.gotoStep = gotoStep;
        vm.gotoPreviousStep = gotoPreviousStep;
        vm.gotoNextStep = gotoNextStep;
        vm.gotoFirstStep = gotoFirstStep;
        vm.gotoLastStep = gotoLastStep;

        vm.isFirstStep = isFirstStep;
        vm.isLastStep = isLastStep;

        vm.isStepCurrent = isStepCurrent;
        vm.isStepDisabled = isStepDisabled;
        vm.isStepOptional = isStepOptional;
        vm.isStepHidden = isStepHidden;
        vm.filterHiddenStep = filterHiddenStep;
        vm.isStepValid = isStepValid;
        vm.isStepNumberValid = isStepNumberValid;

        vm.isFormValid = isFormValid;

        //////////

        /**
         * Set the orientation of the stepper
         *
         * @param orientation
         */
        function setOrientation(orientation)
        {
            vm.orientation = orientation || 'horizontal';
        }

        /**
         * Register the main form
         *
         * @param form
         */
        function registerMainForm(form)
        {
            vm.mainForm = form;
        }

        /**
         * Register a step
         *
         * @param element
         * @param scope
         * @param form
         */
        function registerStep(element, scope, form)
        {
            var step = {
                element           : element,
                scope             : scope,
                form              : form,
                stepNumber        : scope.step || (vm.steps.length + 1),
                stepTitle         : scope.stepTitle,
                stepTitleTranslate: scope.stepTitleTranslate
            };

            // Push the step into steps array
            vm.steps.push(step);

            // Sort steps by stepNumber
            vm.steps.sort(function (a, b)
            {
                return a.stepNumber - b.stepNumber;
            });

            return step;
        }

        /**
         * Setup steps for the first time
         */
        function setupSteps()
        {
            vm.setCurrentStep(vm.currentStepNumber);
        }

        /**
         * Reset steps and the main form
         */
        function resetForm()
        {
            // Timeout is required here because we need to
            // let form model to reset before setting the
            // statuses
            $timeout(function ()
            {
                // Reset all the steps
                for ( var x = 0; x < vm.steps.length; x++ )
                {
                    vm.steps[x].form.$setPristine();
                    vm.steps[x].form.$setUntouched();
                }

                // Reset the main form
                vm.mainForm.$setPristine();
                vm.mainForm.$setUntouched();

                // Go to first step
                gotoFirstStep();
            });
        }

        /**
         * Set current step
         *
         * @param stepNumber
         */
        function setCurrentStep(stepNumber)
        {
            // If the stepNumber is not a valid step number, bail...
            if ( !isStepNumberValid(stepNumber) )
            {
                return;
            }

            // Update the current step number
            vm.currentStepNumber = stepNumber;

            if ( vm.orientation === 'horizontal' )
            {
                // Hide all steps
                for ( var i = 0; i < vm.steps.length; i++ )
                {
                    vm.steps[i].element.hide();
                }

                // Show the current step
                vm.steps[vm.currentStepNumber - 1].element.show();
            }
            else if ( vm.orientation === 'vertical' )
            {
                // Hide all step content
                for ( var j = 0; j < vm.steps.length; j++ )
                {
                    vm.steps[j].element.find('.ms-stepper-step-content').hide();
                }

                // Show the current step content
                vm.steps[vm.currentStepNumber - 1].element.find('.ms-stepper-step-content').show();
            }
        }

        /**
         * Go to a step
         *
         * @param stepNumber
         */
        function gotoStep(stepNumber)
        {
            // If the step we are about to go
            // is hidden, bail...
            if ( isStepHidden(stepNumber) )
            {
                return;
            }

            vm.setCurrentStep(stepNumber);
        }

        /**
         * Go to the previous step
         */
        function gotoPreviousStep()
        {
            var stepNumber = vm.currentStepNumber - 1;

            // Test the previous steps and make sure we
            // will land to the one that is not hidden
            for ( var s = stepNumber; s >= 1; s-- )
            {
                if ( !isStepHidden(s) )
                {
                    stepNumber = s;
                    break;
                }
            }

            vm.setCurrentStep(stepNumber);
        }

        /**
         * Go to the next step
         */
        function gotoNextStep()
        {
            var stepNumber = vm.currentStepNumber + 1;

            // Test the following steps and make sure we
            // will land to the one that is not hidden
            for ( var s = stepNumber; s <= vm.steps.length; s++ )
            {
                if ( !isStepHidden(s) )
                {
                    stepNumber = s;
                    break;
                }
            }

            vm.setCurrentStep(stepNumber);
        }

        /**
         * Go to the first step
         */
        function gotoFirstStep()
        {
            vm.setCurrentStep(1);
        }

        /**
         * Go to the last step
         */
        function gotoLastStep()
        {
            vm.setCurrentStep(vm.steps.length);
        }

        /**
         * Check if the current step is the first step
         *
         * @returns {boolean}
         */
        function isFirstStep()
        {
            return vm.currentStepNumber === 1;
        }

        /**
         * Check if the current step is the last step
         *
         * @returns {boolean}
         */
        function isLastStep()
        {
            return vm.currentStepNumber === vm.steps.length;
        }

        /**
         * Check if the given step is the current one
         *
         * @param stepNumber
         * @returns {null|boolean}
         */
        function isStepCurrent(stepNumber)
        {
            // If the stepNumber is not a valid step number, bail...
            if ( !isStepNumberValid(stepNumber) )
            {
                return null;
            }

            return vm.currentStepNumber === stepNumber;
        }

        /**
         * Check if the given step should be disabled
         *
         * @param stepNumber
         * @returns {null|boolean}
         */
        function isStepDisabled(stepNumber)
        {
            // If the stepNumber is not a valid step number, bail...
            if ( !isStepNumberValid(stepNumber) )
            {
                return null;
            }

            var disabled = false;

            for ( var i = 1; i < stepNumber; i++ )
            {
                if ( !isStepValid(i) )
                {
                    disabled = true;
                    break;
                }
            }

            return disabled;
        }

        /**
         * Check if the given step is optional
         *
         * @param stepNumber
         * @returns {null|boolean}
         */
        function isStepOptional(stepNumber)
        {
            // If the stepNumber is not a valid step number, bail...
            if ( !isStepNumberValid(stepNumber) )
            {
                return null;
            }

            return vm.steps[stepNumber - 1].scope.optionalStep;
        }

        /**
         * Check if the given step is hidden
         *
         * @param stepNumber
         * @returns {null|boolean}
         */
        function isStepHidden(stepNumber)
        {
            // If the stepNumber is not a valid step number, bail...
            if ( !isStepNumberValid(stepNumber) )
            {
                return null;
            }

            return !!vm.steps[stepNumber - 1].scope.hideStep;
        }

        /**
         * Check if the given step is hidden as a filter
         *
         * @param step
         * @returns {boolean}
         */
        function filterHiddenStep(step)
        {
            return !isStepHidden(step.stepNumber);
        }

        /**
         * Check if the given step is valid
         *
         * @param stepNumber
         * @returns {null|boolean}
         */
        function isStepValid(stepNumber)
        {
            // If the stepNumber is not a valid step number, bail...
            if ( !isStepNumberValid(stepNumber) )
            {
                return null;
            }

            // If the step is optional, always return true
            if ( isStepOptional(stepNumber) )
            {
                return true;
            }

            return vm.steps[stepNumber - 1].form.$valid;
        }

        /**
         * Check if the given step number is a valid step number
         *
         * @param stepNumber
         * @returns {boolean}
         */
        function isStepNumberValid(stepNumber)
        {
            return !(angular.isUndefined(stepNumber) || stepNumber < 1 || stepNumber > vm.steps.length);
        }

        /**
         * Check if the entire form is valid
         *
         * @returns {boolean}
         */
        function isFormValid()
        {
            return vm.mainForm.$valid;
        }
    }

    /** @ngInject */
    function msHorizontalStepperDirective()
    {
        return {
            restrict        : 'A',
            scope           : {},
            require         : ['form', 'msHorizontalStepper'],
            priority        : 1001,
            controller      : 'MsStepperController as MsStepper',
            bindToController: {
                model: '=ngModel'
            },
            transclude      : true,
            templateUrl     : 'app/core/directives/ms-stepper/templates/horizontal/horizontal.html',
            compile         : function (tElement)
            {
                tElement.addClass('ms-stepper');

                return function postLink(scope, iElement, iAttrs, ctrls)
                {
                    var FormCtrl = ctrls[0],
                        MsStepperCtrl = ctrls[1];

                    // Register the main form and setup
                    // the steps for the first time
                    MsStepperCtrl.setOrientation('horizontal');
                    MsStepperCtrl.registerMainForm(FormCtrl);
                    MsStepperCtrl.setupSteps();
                };
            }
        };
    }

    /** @ngInject */
    function msHorizontalStepperStepDirective()
    {
        return {
            restrict: 'E',
            require : ['form', '^msHorizontalStepper'],
            priority: 1000,
            scope   : {
                step              : '=?',
                stepTitle         : '=?',
                stepTitleTranslate: '=?',
                optionalStep      : '=?',
                hideStep          : '=?'
            },
            compile : function (tElement)
            {
                tElement.addClass('ms-stepper-step');

                return function postLink(scope, iElement, iAttrs, ctrls)
                {
                    var FormCtrl = ctrls[0],
                        MsStepperCtrl = ctrls[1];

                    // Is it an optional step?
                    scope.optionalStep = angular.isDefined(iAttrs.optionalStep);

                    // Register the step
                    MsStepperCtrl.registerStep(iElement, scope, FormCtrl);

                    // Hide the step by default
                    iElement.hide();
                };
            }
        };
    }

    /** @ngInject */
    function msVerticalStepperDirective($timeout)
    {
        return {
            restrict        : 'A',
            scope           : {},
            require         : ['form', 'msVerticalStepper'],
            priority        : 1001,
            controller      : 'MsStepperController as MsStepper',
            bindToController: {
                model: '=ngModel'
            },
            transclude      : true,
            templateUrl     : 'app/core/directives/ms-stepper/templates/vertical/vertical.html',
            compile         : function (tElement)
            {
                tElement.addClass('ms-stepper');

                return function postLink(scope, iElement, iAttrs, ctrls)
                {
                    var FormCtrl = ctrls[0],
                        MsStepperCtrl = ctrls[1];

                    // Register the main form and setup
                    // the steps for the first time

                    // Timeout is required in vertical stepper
                    // as we are using transclusion in steps.
                    // We have to wait for them to be transcluded
                    // and registered to the controller
                    $timeout(function ()
                    {
                        MsStepperCtrl.setOrientation('vertical');
                        MsStepperCtrl.registerMainForm(FormCtrl);
                        MsStepperCtrl.setupSteps();
                    });
                };
            }
        };
    }

    /** @ngInject */
    function msVerticalStepperStepDirective()
    {
        return {
            restrict   : 'E',
            require    : ['form', '^msVerticalStepper'],
            priority   : 1000,
            scope      : {
                step              : '=?',
                stepTitle         : '=?',
                stepTitleTranslate: '=?',
                optionalStep      : '=?',
                hideStep          : '=?'
            },
            transclude : true,
            templateUrl: 'app/core/directives/ms-stepper/templates/vertical/step/vertical-step.html',
            compile    : function (tElement)
            {
                tElement.addClass('ms-stepper-step');

                return function postLink(scope, iElement, iAttrs, ctrls)
                {
                    var FormCtrl = ctrls[0],
                        MsStepperCtrl = ctrls[1];

                    // Is it an optional step?
                    scope.optionalStep = angular.isDefined(iAttrs.optionalStep);

                    // Register the step
                    scope.stepInfo = MsStepperCtrl.registerStep(iElement, scope, FormCtrl);

                    // Expose the controller to the scope
                    scope.MsStepper = MsStepperCtrl;

                    // Hide the step content by default
                    iElement.find('.ms-stepper-step-content').hide();
                };
            }
        };
    }
})();
(function ()
{
    'use strict';

    msSplashScreenDirective.$inject = ["$animate"];
    angular
        .module('app.core')
        .directive('msSplashScreen', msSplashScreenDirective);

    /** @ngInject */
    function msSplashScreenDirective($animate)
    {
        return {
            restrict: 'E',
            link    : function (scope, iElement)
            {
                var splashScreenRemoveEvent = scope.$on('msSplashScreen::remove', function ()
                {
                    $animate.leave(iElement).then(function ()
                    {
                        // De-register scope event
                        splashScreenRemoveEvent();

                        // Null-ify everything else
                        scope = iElement = null;
                    });
                });
            }
        };
    }
})();
(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('msSidenavHelper', msSidenavHelperDirective);

    /** @ngInject */
    function msSidenavHelperDirective()
    {
        return {
            restrict: 'A',
            require : '^mdSidenav',
            link    : function (scope, iElement, iAttrs, MdSidenavCtrl)
            {
                // Watch md-sidenav open & locked open statuses
                // and add class to the ".page-layout" if only
                // the sidenav open and NOT locked open
                scope.$watch(function ()
                {
                    return MdSidenavCtrl.isOpen() && !MdSidenavCtrl.isLockedOpen();
                }, function (current)
                {
                    if ( angular.isUndefined(current) )
                    {
                        return;
                    }

                    iElement.parent().toggleClass('full-height', current);
                    angular.element('html').toggleClass('sidenav-open', current);
                });
            }
        };
    }
})();
(function ()
{
    'use strict';

    MsShortcutsController.$inject = ["$scope", "store", "$document", "$timeout", "$q", "msNavigationService"];
    angular
        .module('app.core')
        .controller('MsShortcutsController', MsShortcutsController)
        .directive('msShortcuts', msShortcutsDirective);

    /** @ngInject */
    function MsShortcutsController($scope, store, $document, $timeout, $q, msNavigationService)
    {
        var vm = this;

        // Data
        vm.query = '';
        vm.queryOptions = {
            debounce: 300
        };
        vm.resultsLoading = false;
        vm.selectedResultIndex = 0;
        vm.ignoreMouseEvents = false;
        vm.mobileBarActive = false;

        vm.results = null;
        vm.shortcuts = [];

        vm.sortableOptions = {
            ghostClass   : 'ghost',
            forceFallback: true,
            fallbackClass: 'dragging',
            onSort       : function ()
            {
                vm.saveShortcuts();
            }
        };

        // Methods
        vm.populateResults = populateResults;
        vm.loadShortcuts = loadShortcuts;
        vm.saveShortcuts = saveShortcuts;
        vm.addShortcut = addShortcut;
        vm.removeShortcut = removeShortcut;
        vm.handleResultClick = handleResultClick;

        vm.absorbEvent = absorbEvent;
        vm.handleKeydown = handleKeydown;
        vm.handleMouseenter = handleMouseenter;
        vm.temporarilyIgnoreMouseEvents = temporarilyIgnoreMouseEvents;
        vm.ensureSelectedResultIsVisible = ensureSelectedResultIsVisible;
        vm.toggleMobileBar = toggleMobileBar;

        //////////

        init();

        function init()
        {
            // Load the shortcuts
            vm.loadShortcuts().then(
                // Success
                function (response)
                {
                    vm.shortcuts = response;

                    // Add shortcuts as results by default
                    if ( vm.shortcuts.length > 0 )
                    {
                        vm.results = response;
                    }
                }
            );

            // Watch the model changes to trigger the search
            $scope.$watch('MsShortcuts.query', function (current, old)
            {
                if ( angular.isUndefined(current) )
                {
                    return;
                }

                if ( angular.equals(current, old) )
                {
                    return;
                }

                // Show the loader
                vm.resultsLoading = true;

                // Populate the results
                vm.populateResults().then(
                    // Success
                    function (response)
                    {
                        vm.results = response;
                    },
                    // Error
                    function ()
                    {
                        vm.results = [];
                    }
                ).finally(
                    function ()
                    {
                        // Hide the loader
                        vm.resultsLoading = false;
                    }
                );
            });
        }

        /**
         * Populate the results
         */
        function populateResults()
        {
            var results = [],
                flatNavigation = msNavigationService.getFlatNavigation(),
                deferred = $q.defer();

            // Iterate through the navigation array and
            // make sure it doesn't have any groups or
            // none ui-sref items
            for ( var x = 0; x < flatNavigation.length; x++ )
            {
                if ( flatNavigation[x].uisref )
                {
                    results.push(flatNavigation[x]);
                }
            }

            // If there is a query, filter the results
            if ( vm.query )
            {
                results = results.filter(function (item)
                {
                    if ( angular.lowercase(item.title).search(angular.lowercase(vm.query)) > -1 )
                    {
                        return true;
                    }
                });

                // Iterate through one last time and
                // add required properties to items
                for ( var i = 0; i < results.length; i++ )
                {
                    // Add false to hasShortcut by default
                    results[i].hasShortcut = false;

                    // Test if the item is in the shortcuts list
                    for ( var y = 0; y < vm.shortcuts.length; y++ )
                    {
                        if ( vm.shortcuts[y]._id === results[i]._id )
                        {
                            results[i].hasShortcut = true;
                            break;
                        }
                    }
                }
            }
            else
            {
                // If the query is empty, that means
                // there is nothing to search for so
                // we will populate the results with
                // current shortcuts if there is any
                if ( vm.shortcuts.length > 0 )
                {
                    results = vm.shortcuts;
                }
            }

            // Reset the selected result
            vm.selectedResultIndex = 0;

            // Fake the service delay
            $timeout(function ()
            {
                // Resolve the promise
                deferred.resolve(results);
            }, 250);

            // Return a promise
            return deferred.promise;
        }

        /**
         * Load shortcuts
         */
        function loadShortcuts()
        {
            var deferred = $q.defer();

            // For the demo purposes, we will
            // load the shortcuts from the cookies.
            // But here you can make an API call
            // to load them from the DB.
            var shortcuts = angular.fromJson(store.get('FUSE.shortcuts'));

            // No cookie available. Generate one
            // for the demo purposes...
            if ( angular.isUndefined(shortcuts) )
            {
                shortcuts = [
                    {
                        'title'      : 'Chat',
                        'icon'       : 'icon-hangouts',
                        'state'      : 'app.chat',
                        'badge'      : {
                            'content': 13,
                            'color'  : '#09d261'
                        },
                        'weight'     : 5,
                        'children'   : [],
                        '_id'        : 'chat',
                        '_path'      : 'apps.chat',
                        'uisref'     : 'app.chat',
                        'hasShortcut': true
                    }, {
                        'title'      : 'Contacts',
                        'icon'       : 'icon-account-box',
                        'state'      : 'app.contacts',
                        'weight'     : 10,
                        'children'   : [],
                        '_id'        : 'contacts',
                        '_path'      : 'apps.contacts',
                        'uisref'     : 'app.contacts',
                        'hasShortcut': true
                    }, {
                        'title'      : 'Notes',
                        'icon'       : 'icon-lightbulb',
                        'state'      : 'app.notes',
                        'weight'     : 11,
                        'children'   : [],
                        '_id'        : 'notes',
                        '_path'      : 'apps.notes',
                        'uisref'     : 'app.notes',
                        'hasShortcut': true
                    }
                ];

                store.set('FUSE.shortcuts', angular.toJson(shortcuts));
            }

            // Resolve the promise
            deferred.resolve(shortcuts);

            return deferred.promise;
        }

        /**
         * Save the shortcuts
         */
        function saveShortcuts()
        {
            var deferred = $q.defer();

            // For the demo purposes, we will
            // keep the shortcuts in the cookies.
            // But here you can make an API call
            // to save them to the DB.
            store.set('FUSE.shortcuts', angular.toJson(vm.shortcuts));

            // Fake the service delay
            $timeout(function ()
            {
                deferred.resolve({'success': true});
            }, 250);

            return deferred.promise;
        }

        /**
         * Add item as shortcut
         *
         * @param item
         */
        function addShortcut(item)
        {
            // Update the hasShortcut status
            item.hasShortcut = true;

            // Add as a shortcut
            vm.shortcuts.push(item);

            // Save the shortcuts
            vm.saveShortcuts();
        }

        /**
         * Remove item from shortcuts
         *
         * @param item
         */
        function removeShortcut(item)
        {
            // Update the hasShortcut status
            item.hasShortcut = false;

            // Remove the shortcut
            for ( var x = 0; x < vm.shortcuts.length; x++ )
            {
                if ( vm.shortcuts[x]._id === item._id )
                {
                    // Remove the x-th item from the array
                    vm.shortcuts.splice(x, 1);

                    // If we aren't searching for anything...
                    if ( !vm.query )
                    {
                        // If all the shortcuts have been removed,
                        // null-ify the results
                        if ( vm.shortcuts.length === 0 )
                        {
                            vm.results = null;
                        }
                        // Otherwise update the selected index
                        else
                        {
                            if ( x >= vm.shortcuts.length )
                            {
                                vm.selectedResultIndex = vm.shortcuts.length - 1;
                            }
                        }
                    }
                }
            }

            // Save the shortcuts
            vm.saveShortcuts();
        }

        /**
         * Handle the result click
         *
         * @param item
         */
        function handleResultClick(item)
        {
            // Add or remove the shortcut
            if ( item.hasShortcut )
            {
                vm.removeShortcut(item);
            }
            else
            {
                vm.addShortcut(item);
            }
        }

        /**
         * Absorb the given event
         *
         * @param event
         */
        function absorbEvent(event)
        {
            event.preventDefault();
        }

        /**
         * Handle keydown
         *
         * @param event
         */
        function handleKeydown(event)
        {
            var keyCode = event.keyCode,
                keys = [38, 40];

            // Prevent the default action if
            // one of the keys are pressed that
            // we are listening
            if ( keys.indexOf(keyCode) > -1 )
            {
                event.preventDefault();
            }

            switch ( keyCode )
            {
                // Enter
                case 13:

                    // Trigger result click
                    vm.handleResultClick(vm.results[vm.selectedResultIndex]);

                    break;

                // Up Arrow
                case 38:

                    // Decrease the selected result index
                    if ( vm.selectedResultIndex - 1 >= 0 )
                    {
                        // Decrease the selected index
                        vm.selectedResultIndex--;

                        // Make sure the selected result is in the view
                        vm.ensureSelectedResultIsVisible();
                    }

                    break;

                // Down Arrow
                case 40:

                    // Increase the selected result index
                    if ( vm.selectedResultIndex + 1 < vm.results.length )
                    {
                        // Increase the selected index
                        vm.selectedResultIndex++;

                        // Make sure the selected result is in the view
                        vm.ensureSelectedResultIsVisible();
                    }

                    break;

                default:
                    break;
            }
        }

        /**
         * Handle mouseenter
         *
         * @param index
         */
        function handleMouseenter(index)
        {
            if ( vm.ignoreMouseEvents )
            {
                return;
            }

            // Update the selected result index
            // with the given index
            vm.selectedResultIndex = index;
        }

        /**
         * Set a variable for a limited time
         * to make other functions to ignore
         * the mouse events
         */
        function temporarilyIgnoreMouseEvents()
        {
            // Set the variable
            vm.ignoreMouseEvents = true;

            // Cancel the previous timeout
            $timeout.cancel(vm.mouseEventIgnoreTimeout);

            // Set the timeout
            vm.mouseEventIgnoreTimeout = $timeout(function ()
            {
                vm.ignoreMouseEvents = false;
            }, 250);
        }

        /**
         * Ensure the selected result will
         * always be visible on the results
         * area
         */
        function ensureSelectedResultIsVisible()
        {
            var resultsEl = $document.find('#ms-shortcut-add-menu').find('.results'),
                selectedItemEl = angular.element(resultsEl.find('.result')[vm.selectedResultIndex]);

            if ( resultsEl && selectedItemEl )
            {
                var top = selectedItemEl.position().top - 8,
                    bottom = selectedItemEl.position().top + selectedItemEl.outerHeight() + 8;

                // Start ignoring mouse events
                vm.temporarilyIgnoreMouseEvents();

                if ( resultsEl.scrollTop() > top )
                {
                    resultsEl.scrollTop(top);
                }

                if ( bottom > (resultsEl.height() + resultsEl.scrollTop()) )
                {
                    resultsEl.scrollTop(bottom - resultsEl.height());
                }
            }
        }

        /**
         * Toggle mobile bar
         */
        function toggleMobileBar()
        {
            vm.mobileBarActive = !vm.mobileBarActive;
        }
    }

    /** @ngInject */
    function msShortcutsDirective()
    {
        return {
            restrict        : 'E',
            scope           : {},
            require         : 'msShortcuts',
            controller      : 'MsShortcutsController as MsShortcuts',
            bindToController: {},
            templateUrl     : 'app/core/directives/ms-shortcuts/ms-shortcuts.html',
            compile         : function (tElement)
            {
                // Add class
                tElement.addClass('ms-shortcuts');

                return function postLink(scope, iElement)
                {
                    // Data

                };
            }
        };
    }
})();
(function ()
{
    'use strict';

    MsSearchBarController.$inject = ["$scope", "$element", "$timeout"];
    msSearchBarDirective.$inject = ["$document"];
    angular
        .module('app.core')
        .controller('MsSearchBarController', MsSearchBarController)
        .directive('msSearchBar', msSearchBarDirective);

    /** @ngInject */
    function MsSearchBarController($scope, $element, $timeout)
    {
        var vm = this;

        // Data
        vm.collapsed = true;
        vm.query = '';
        vm.queryOptions = {
            debounce: vm.debounce || 0
        };
        vm.resultsLoading = false;
        vm.results = null;
        vm.selectedResultIndex = 0;
        vm.ignoreMouseEvents = false;

        // Methods
        vm.populateResults = populateResults;

        vm.expand = expand;
        vm.collapse = collapse;

        vm.absorbEvent = absorbEvent;
        vm.handleKeydown = handleKeydown;
        vm.handleMouseenter = handleMouseenter;
        vm.temporarilyIgnoreMouseEvents = temporarilyIgnoreMouseEvents;
        vm.handleResultClick = handleResultClick;
        vm.ensureSelectedResultIsVisible = ensureSelectedResultIsVisible;

        //////////

        init();

        function init()
        {
            // Watch the model changes to trigger the search
            $scope.$watch('MsSearchBar.query', function (current, old)
            {
                if ( angular.isUndefined(current) )
                {
                    return;
                }

                if ( angular.equals(current, old) )
                {
                    return;
                }

                if ( vm.collapsed )
                {
                    return;
                }

                // Evaluate the onSearch function to access the
                // function itself
                var onSearchEvaluated = $scope.$parent.$eval(vm.onSearch, {query: current}),
                    isArray = angular.isArray(onSearchEvaluated),
                    isPromise = (onSearchEvaluated && !!onSearchEvaluated.then);

                if ( isArray )
                {
                    // Populate the results
                    vm.populateResults(onSearchEvaluated);
                }

                if ( isPromise )
                {
                    // Show the loader
                    vm.resultsLoading = true;

                    onSearchEvaluated.then(
                        // Success
                        function (response)
                        {
                            // Populate the results
                            vm.populateResults(response);
                        },
                        // Error
                        function ()
                        {
                            // Assign an empty array to show
                            // the no-results screen
                            vm.populateResults([]);
                        }
                    ).finally(function ()
                        {
                            // Hide the loader
                            vm.resultsLoading = false;
                        }
                    );
                }
            });
        }

        /**
         * Populate the results
         *
         * @param results
         */
        function populateResults(results)
        {
            // Before doing anything,
            // make sure the search bar is expanded
            if ( vm.collapsed )
            {
                return;
            }

            var isArray = angular.isArray(results),
                isNull = results === null;

            // Only accept arrays and null values
            if ( !isArray && !isNull )
            {
                return;
            }

            // Reset the selected result
            vm.selectedResultIndex = 0;

            // Populate the results
            vm.results = results;
        }

        /**
         * Expand
         */
        function expand()
        {
            // Set collapsed status
            vm.collapsed = false;

            // Call expand on scope
            $scope.expand();

            // Callback
            if ( vm.onExpand && angular.isFunction(vm.onExpand) )
            {
                vm.onExpand();
            }
        }

        /**
         * Collapse
         */
        function collapse()
        {
            // Empty the query
            vm.query = '';

            // Empty results to hide the results view
            vm.populateResults(null);

            // Set collapsed status
            vm.collapsed = true;

            // Call collapse on scope
            $scope.collapse();

            // Callback
            if ( vm.onCollapse && angular.isFunction(vm.onCollapse) )
            {
                vm.onCollapse();
            }
        }

        /**
         * Absorb the given event
         *
         * @param event
         */
        function absorbEvent(event)
        {
            event.preventDefault();
        }

        /**
         * Handle keydown
         *
         * @param event
         */
        function handleKeydown(event)
        {
            var keyCode = event.keyCode,
                keys = [27, 38, 40];

            // Prevent the default action if
            // one of the keys are pressed that
            // we are listening
            if ( keys.indexOf(keyCode) > -1 )
            {
                event.preventDefault();
            }

            switch ( keyCode )
            {
                // Enter
                case 13:

                    // Trigger result click
                    vm.handleResultClick(vm.results[vm.selectedResultIndex]);

                    break;

                // Escape
                case 27:

                    // Collapse the search bar
                    vm.collapse();

                    break;

                // Up Arrow
                case 38:

                    // Decrease the selected result index
                    if ( vm.selectedResultIndex - 1 >= 0 )
                    {
                        // Decrease the selected index
                        vm.selectedResultIndex--;

                        // Make sure the selected result is in the view
                        vm.ensureSelectedResultIsVisible();
                    }

                    break;

                // Down Arrow
                case 40:

                    if ( !vm.results )
                    {
                        return;
                    }

                    // Increase the selected result index
                    if ( vm.selectedResultIndex + 1 < vm.results.length )
                    {
                        // Increase the selected index
                        vm.selectedResultIndex++;

                        // Make sure the selected result is in the view
                        vm.ensureSelectedResultIsVisible();
                    }

                    break;

                default:
                    break;
            }
        }

        /**
         * Handle mouseenter
         *
         * @param index
         */
        function handleMouseenter(index)
        {
            if ( vm.ignoreMouseEvents )
            {
                return;
            }

            // Update the selected result index
            // with the given index
            vm.selectedResultIndex = index;
        }

        /**
         * Set a variable for a limited time
         * to make other functions to ignore
         * the mouse events
         */
        function temporarilyIgnoreMouseEvents()
        {
            // Set the variable
            vm.ignoreMouseEvents = true;

            // Cancel the previous timeout
            $timeout.cancel(vm.mouseEventIgnoreTimeout);

            // Set the timeout
            vm.mouseEventIgnoreTimeout = $timeout(function ()
            {
                vm.ignoreMouseEvents = false;
            }, 250);
        }

        /**
         * Handle the result click
         *
         * @param item
         */
        function handleResultClick(item)
        {
            if ( vm.onResultClick )
            {
                vm.onResultClick({item: item});
            }

            // Collapse the search bar
            vm.collapse();
        }

        /**
         * Ensure the selected result will
         * always be visible on the results
         * area
         */
        function ensureSelectedResultIsVisible()
        {
            var resultsEl = $element.find('.ms-search-bar-results'),
                selectedItemEl = angular.element(resultsEl.find('.result')[vm.selectedResultIndex]);

            if ( resultsEl && selectedItemEl )
            {
                var top = selectedItemEl.position().top - 8,
                    bottom = selectedItemEl.position().top + selectedItemEl.outerHeight() + 8;

                // Start ignoring mouse events
                vm.temporarilyIgnoreMouseEvents();

                if ( resultsEl.scrollTop() > top )
                {
                    resultsEl.scrollTop(top);
                }

                if ( bottom > (resultsEl.height() + resultsEl.scrollTop()) )
                {
                    resultsEl.scrollTop(bottom - resultsEl.height());
                }
            }
        }
    }

    /** @ngInject */
    function msSearchBarDirective($document)
    {
        return {
            restrict        : 'E',
            scope           : {},
            require         : 'msSearchBar',
            controller      : 'MsSearchBarController as MsSearchBar',
            bindToController: {
                debounce     : '=?',
                onSearch     : '@',
                onResultClick: '&?',
                onExpand     : '&?',
                onCollapse   : '&?'
            },
            templateUrl     : 'app/core/directives/ms-search-bar/ms-search-bar.html',
            compile         : function (tElement)
            {
                // Add class
                tElement.addClass('ms-search-bar');

                return function postLink(scope, iElement)
                {
                    // Data
                    var inputEl,
                        bodyEl = $document.find('body');

                    // Methods
                    scope.collapse = collapse;
                    scope.expand = expand;

                    //////////

                    // Initialize
                    init();

                    /**
                     * Initialize
                     */
                    function init()
                    {
                        // Grab the input element
                        inputEl = iElement.find('#ms-search-bar-input');
                    }

                    /**
                     * Expand action
                     */
                    function expand()
                    {
                        // Add expanded class
                        iElement.addClass('expanded');

                        // Add helper class to the body
                        bodyEl.addClass('ms-search-bar-expanded');

                        // Focus on the input
                        inputEl.focus();
                    }

                    /**
                     * Collapse action
                     */
                    function collapse()
                    {
                        // Remove expanded class
                        iElement.removeClass('expanded');

                        // Remove helper class from the body
                        bodyEl.removeClass('ms-search-bar-expanded');
                    }
                };
            }
        };
    }
})();
(function ()
{
    'use strict';

    msScrollDirective.$inject = ["$timeout", "msScrollConfig", "msUtils", "fuseConfig"];
    angular
        .module('app.core')
        .provider('msScrollConfig', msScrollConfigProvider)
        .directive('msScroll', msScrollDirective);

    /** @ngInject */
    function msScrollConfigProvider()
    {
        // Default configuration
        var defaultConfiguration = {
            wheelSpeed            : 1,
            wheelPropagation      : false,
            swipePropagation      : true,
            minScrollbarLength    : null,
            maxScrollbarLength    : null,
            useBothWheelAxes      : false,
            useKeyboard           : true,
            suppressScrollX       : false,
            suppressScrollY       : false,
            scrollXMarginOffset   : 0,
            scrollYMarginOffset   : 0,
            stopPropagationOnClick: true
        };

        // Methods
        this.config = config;

        //////////

        /**
         * Extend default configuration with the given one
         *
         * @param configuration
         */
        function config(configuration)
        {
            defaultConfiguration = angular.extend({}, defaultConfiguration, configuration);
        }

        /**
         * Service
         */
        this.$get = function ()
        {
            var service = {
                getConfig: getConfig
            };

            return service;

            //////////

            /**
             * Return the config
             */
            function getConfig()
            {
                return defaultConfiguration;
            }
        };
    }

    /** @ngInject */
    function msScrollDirective($timeout, msScrollConfig, msUtils, fuseConfig)
    {
        return {
            restrict: 'AE',
            compile : function (tElement)
            {
                // Do not replace scrollbars if
                // 'disableCustomScrollbars' config enabled
                if ( fuseConfig.getConfig('disableCustomScrollbars') )
                {
                    return;
                }

                // Do not replace scrollbars on mobile devices
                // if 'disableCustomScrollbarsOnMobile' config enabled
                if ( fuseConfig.getConfig('disableCustomScrollbarsOnMobile') && msUtils.isMobile() )
                {
                    return;
                }

                // Add class
                tElement.addClass('ms-scroll');

                return function postLink(scope, iElement, iAttrs)
                {
                    var options = {};

                    // If options supplied, evaluate the given
                    // value. This is because we don't want to
                    // have an isolated scope but still be able
                    // to use scope variables.
                    // We don't want an isolated scope because
                    // we should be able to use this everywhere
                    // especially with other directives
                    if ( iAttrs.msScroll )
                    {
                        options = scope.$eval(iAttrs.msScroll);
                    }

                    // Extend the given config with the ones from provider
                    options = angular.extend({}, msScrollConfig.getConfig(), options);

                    // Initialize the scrollbar
                    $timeout(function ()
                    {
                        PerfectScrollbar.initialize(iElement[0], options);
                    }, 0);

                    // Update the scrollbar on element mouseenter
                    iElement.on('mouseenter', updateScrollbar);

                    // Watch scrollHeight and update
                    // the scrollbar if it changes
                    scope.$watch(function ()
                    {
                        return iElement.prop('scrollHeight');
                    }, function (current, old)
                    {
                        if ( angular.isUndefined(current) || angular.equals(current, old) )
                        {
                            return;
                        }

                        updateScrollbar();
                    });

                    // Watch scrollWidth and update
                    // the scrollbar if it changes
                    scope.$watch(function ()
                    {
                        return iElement.prop('scrollWidth');
                    }, function (current, old)
                    {
                        if ( angular.isUndefined(current) || angular.equals(current, old) )
                        {
                            return;
                        }

                        updateScrollbar();
                    });

                    /**
                     * Update the scrollbar
                     */
                    function updateScrollbar()
                    {
                        PerfectScrollbar.update(iElement[0]);
                    }

                    // Cleanup on destroy
                    scope.$on('$destroy', function ()
                    {
                        iElement.off('mouseenter');
                        PerfectScrollbar.destroy(iElement[0]);
                    });
                };
            }
        };
    }
})();
(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('msResponsiveTable', msResponsiveTableDirective);

    /** @ngInject */
    function msResponsiveTableDirective()
    {
        return {
            restrict: 'A',
            link    : function (scope, iElement)
            {
                // Wrap the table
                var wrapper = angular.element('<div class="ms-responsive-table-wrapper"></div>');
                iElement.after(wrapper);
                wrapper.append(iElement);

                //////////
            }
        };
    }
})();
(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('msRandomClass', msRandomClassDirective);

    /** @ngInject */
    function msRandomClassDirective()
    {
        return {
            restrict: 'A',
            scope   : {
                msRandomClass: '='
            },
            link    : function (scope, iElement)
            {
                var randomClass = scope.msRandomClass[Math.floor(Math.random() * (scope.msRandomClass.length))];
                iElement.addClass(randomClass);
            }
        };
    }
})();
(function ()
{
    'use strict';

    MsNavigationController.$inject = ["$scope", "msNavigationService"];
    msNavigationDirective.$inject = ["$rootScope", "$timeout", "$mdSidenav", "msNavigationService"];
    MsNavigationNodeController.$inject = ["$scope", "$element", "$rootScope", "$animate", "$state", "msNavigationService"];
    msNavigationHorizontalDirective.$inject = ["msNavigationService"];
    MsNavigationHorizontalNodeController.$inject = ["$scope", "$element", "$rootScope", "$state", "msNavigationService"];
    msNavigationHorizontalItemDirective.$inject = ["$mdMedia"];
    angular
        .module('app.core')
        .provider('msNavigationService', msNavigationServiceProvider)
        .controller('MsNavigationController', MsNavigationController)
        // Vertical
        .directive('msNavigation', msNavigationDirective)
        .controller('MsNavigationNodeController', MsNavigationNodeController)
        .directive('msNavigationNode', msNavigationNodeDirective)
        .directive('msNavigationItem', msNavigationItemDirective)
        //Horizontal
        .directive('msNavigationHorizontal', msNavigationHorizontalDirective)
        .controller('MsNavigationHorizontalNodeController', MsNavigationHorizontalNodeController)
        .directive('msNavigationHorizontalNode', msNavigationHorizontalNodeDirective)
        .directive('msNavigationHorizontalItem', msNavigationHorizontalItemDirective);

    /** @ngInject */
    function msNavigationServiceProvider()
    {
        // Inject $log service
        var $log = angular.injector(['ng']).get('$log');

        // Navigation array
        var navigation = [];

        var service = this;

        // Methods
        service.saveItem = saveItem;
        service.deleteItem = deleteItem;
        service.sortByWeight = sortByWeight;

        //////////

        /**
         * Create or update the navigation item
         *
         * @param path
         * @param item
         */
        function saveItem(path, item)
        {
            if ( !angular.isString(path) )
            {
                $log.error('path must be a string (eg. `dashboard.project`)');
                return;
            }

            var parts = path.split('.');

            // Generate the object id from the parts
            var id = parts[parts.length - 1];

            // Get the parent item from the parts
            var parent = _findOrCreateParent(parts);

            // Decide if we are going to update or create
            var updateItem = false;

            for ( var i = 0; i < parent.length; i++ )
            {
                if ( parent[i]._id === id )
                {
                    updateItem = parent[i];

                    break;
                }
            }

            // Update
            if ( updateItem )
            {
                angular.extend(updateItem, item);

                // Add proper ui-sref
                updateItem.uisref = _getUiSref(updateItem);
            }
            // Create
            else
            {
                // Create an empty children array in the item
                item.children = [];

                // Add the default weight if not provided or if it's not a number
                if ( angular.isUndefined(item.weight) || !angular.isNumber(item.weight) )
                {
                    item.weight = 1;
                }

                // Add the item id
                item._id = id;

                // Add the item path
                item._path = path;

                // Add proper ui-sref
                item.uisref = _getUiSref(item);

                // Push the item into the array
                parent.push(item);
            }
        }

        /**
         * Delete navigation item
         *
         * @param path
         */
        function deleteItem(path)
        {
            if ( !angular.isString(path) )
            {
                $log.error('path must be a string (eg. `dashboard.project`)');
                return;
            }

            // Locate the item by using given path
            var item = navigation,
                parts = path.split('.');

            for ( var p = 0; p < parts.length; p++ )
            {
                var id = parts[p];

                for ( var i = 0; i < item.length; i++ )
                {
                    if ( item[i]._id === id )
                    {
                        // If we have a matching path,
                        // we have found our object:
                        // remove it.
                        if ( item[i]._path === path )
                        {
                            item.splice(i, 1);
                            return true;
                        }

                        // Otherwise grab the children of
                        // the current item and continue
                        item = item[i].children;
                        break;
                    }
                }
            }

            return false;
        }

        /**
         * Sort the navigation items by their weights
         *
         * @param parent
         */
        function sortByWeight(parent)
        {
            // If parent not provided, sort the root items
            if ( !parent )
            {
                parent = navigation;
                parent.sort(_byWeight);
            }

            // Sort the children
            for ( var i = 0; i < parent.length; i++ )
            {
                var children = parent[i].children;

                if ( children.length > 1 )
                {
                    children.sort(_byWeight);
                }

                if ( children.length > 0 )
                {
                    sortByWeight(children);
                }
            }
        }

        /* ----------------- */
        /* Private Functions */
        /* ----------------- */

        /**
         * Find or create parent
         *
         * @param parts
         * @returns {Array|Boolean}
         * @private
         */
        function _findOrCreateParent(parts)
        {
            // Store the main navigation
            var parent = navigation;

            // If it's going to be a root item
            // return the navigation itself
            if ( parts.length === 1 )
            {
                return parent;
            }

            // Remove the last element from the parts as
            // we don't need that to figure out the parent
            parts.pop();

            // Find and return the parent
            for ( var i = 0; i < parts.length; i++ )
            {
                var _id = parts[i],
                    createParent = true;

                for ( var p = 0; p < parent.length; p++ )
                {
                    if ( parent[p]._id === _id )
                    {
                        parent = parent[p].children;
                        createParent = false;

                        break;
                    }
                }

                // If there is no parent found, create one, push
                // it into the current parent and assign it as a
                // new parent
                if ( createParent )
                {
                    var item = {
                        _id     : _id,
                        _path   : parts.join('.'),
                        title   : _id,
                        weight  : 1,
                        children: []
                    };

                    parent.push(item);
                    parent = item.children;
                }
            }

            return parent;
        }

        /**
         * Sort by weight
         *
         * @param x
         * @param y
         * @returns {number}
         * @private
         */
        function _byWeight(x, y)
        {
            return parseInt(x.weight) - parseInt(y.weight);
        }

        /**
         * Setup the ui-sref using state & state parameters
         *
         * @param item
         * @returns {string}
         * @private
         */
        function _getUiSref(item)
        {
            var uisref = '';

            if ( angular.isDefined(item.state) )
            {
                uisref = item.state;

                if ( angular.isDefined(item.stateParams) && angular.isObject(item.stateParams) )
                {
                    uisref = uisref + '(' + angular.toJson(item.stateParams) + ')';
                }
            }

            return uisref;
        }

        /* ----------------- */
        /* Service           */
        /* ----------------- */

        this.$get = function ()
        {
            var activeItem = null,
                navigationScope = null,
                folded = null,
                foldedOpen = null;

            var service = {
                saveItem          : saveItem,
                deleteItem        : deleteItem,
                sort              : sortByWeight,
                clearNavigation   : clearNavigation,
                setActiveItem     : setActiveItem,
                getActiveItem     : getActiveItem,
                getNavigation     : getNavigation,
                getFlatNavigation : getFlatNavigation,
                setNavigationScope: setNavigationScope,
                setFolded         : setFolded,
                getFolded         : getFolded,
                setFoldedOpen     : setFoldedOpen,
                getFoldedOpen     : getFoldedOpen,
                toggleFolded      : toggleFolded
            };

            return service;

            //////////

            /**
             * Clear the entire navigation
             */
            function clearNavigation()
            {
                // Clear the navigation array
                navigation = [];

                // Clear the vm.navigation from main controller
                if ( navigationScope )
                {
                    navigationScope.vm.navigation = navigation;
                }
            }

            /**
             * Set active item
             *
             * @param node
             * @param scope
             */
            function setActiveItem(node, scope)
            {
                activeItem = {
                    node : node,
                    scope: scope
                };
            }

            /**
             * Return active item
             */
            function getActiveItem()
            {
                return activeItem;
            }

            /**
             * Return navigation array
             *
             * @param root
             * @returns Array
             */
            function getNavigation(root)
            {
                if ( root )
                {
                    for ( var i = 0; i < navigation.length; i++ )
                    {
                        if ( navigation[i]._id === root )
                        {
                            return [navigation[i]];
                        }
                    }

                    return null;
                }

                return navigation;
            }

            /**
             * Return flat navigation array
             *
             * @param root
             * @returns Array
             */
            function getFlatNavigation(root)
            {
                // Get the correct navigation array
                var navigation = getNavigation(root);

                // Flatten the navigation object
                return _flattenNavigation(navigation);
            }

            /**
             * Store navigation's scope for later use
             *
             * @param scope
             */
            function setNavigationScope(scope)
            {
                navigationScope = scope;
            }

            /**
             * Set folded status
             *
             * @param status
             */
            function setFolded(status)
            {
                folded = status;
            }

            /**
             * Return folded status
             *
             * @returns {*}
             */
            function getFolded()
            {
                return folded;
            }

            /**
             * Set folded open status
             *
             * @param status
             */
            function setFoldedOpen(status)
            {
                foldedOpen = status;
            }

            /**
             * Return folded open status
             *
             * @returns {*}
             */
            function getFoldedOpen()
            {
                return foldedOpen;
            }


            /**
             * Toggle fold on stored navigation's scope
             */
            function toggleFolded()
            {
                navigationScope.toggleFolded();
            }

            /**
             * Flatten the given navigation
             *
             * @param navigation
             * @private
             */
            function _flattenNavigation(navigation)
            {
                var flatNav = [];

                for ( var x = 0; x < navigation.length; x++ )
                {
                    // Copy and clear the children of the
                    // navigation that we want to push
                    var navToPush = angular.copy(navigation[x]);
                    navToPush.children = [];

                    // Push the item
                    flatNav.push(navToPush);

                    // If there are child items in this navigation,
                    // do some nested function magic
                    if ( navigation[x].children.length > 0 )
                    {
                        flatNav = flatNav.concat(_flattenNavigation(navigation[x].children));
                    }
                }

                return flatNav;
            }
        };
    }

    /** @ngInject */
    function MsNavigationController($scope, msNavigationService)
    {
        var vm = this;

        // Data
        if ( $scope.root )
        {
            vm.navigation = msNavigationService.getNavigation($scope.root);
        }
        else
        {
            vm.navigation = msNavigationService.getNavigation();
        }

        // Methods
        vm.toggleHorizontalMobileMenu = toggleHorizontalMobileMenu;

        //////////

        init();

        /**
         * Initialize
         */
        function init()
        {
            // Sort the navigation before doing anything else
            msNavigationService.sort();
        }

        /**
         * Toggle horizontal mobile menu
         */
        function toggleHorizontalMobileMenu()
        {
            angular.element('body').toggleClass('ms-navigation-horizontal-mobile-menu-active');
        }
    }

    /** @ngInject */
    function msNavigationDirective($rootScope, $timeout, $mdSidenav, msNavigationService)
    {
        return {
            restrict   : 'E',
            scope      : {
                folded: '=',
                root  : '@'
            },
            controller : 'MsNavigationController as vm',
            templateUrl: 'app/core/directives/ms-navigation/templates/vertical.html',
            transclude : true,
            compile    : function (tElement)
            {
                tElement.addClass('ms-navigation');

                return function postLink(scope, iElement)
                {
                    var bodyEl = angular.element('body'),
                        foldExpanderEl = angular.element('<div id="ms-navigation-fold-expander"></div>'),
                        foldCollapserEl = angular.element('<div id="ms-navigation-fold-collapser"></div>'),
                        sidenav = $mdSidenav('navigation');

                    // Store the navigation in the service for public access
                    msNavigationService.setNavigationScope(scope);

                    // Initialize
                    init();

                    /**
                     * Initialize
                     */
                    function init()
                    {
                        // Set the folded status for the first time.
                        // First, we have to check if we have a folded
                        // status available in the service already. This
                        // will prevent navigation to act weird if we already
                        // set the fold status, remove the navigation and
                        // then re-initialize it, which happens if we
                        // change to a view without a navigation and then
                        // come back with history.back() function.

                        // If the service didn't initialize before, set
                        // the folded status from scope, otherwise we
                        // won't touch anything because the folded status
                        // already set in the service...
                        if ( msNavigationService.getFolded() === null )
                        {
                            msNavigationService.setFolded(scope.folded);
                        }

                        if ( msNavigationService.getFolded() )
                        {
                            // Collapse everything.
                            // This must be inside a $timeout because by the
                            // time we call this, the 'msNavigation::collapse'
                            // event listener is not registered yet. $timeout
                            // will ensure that it will be called after it is
                            // registered.
                            $timeout(function ()
                            {
                                $rootScope.$broadcast('msNavigation::collapse');
                            });

                            // Add class to the body
                            bodyEl.addClass('ms-navigation-folded');

                            // Set fold expander
                            setFoldExpander();
                        }
                    }

                    // Sidenav locked open status watcher
                    scope.$watch(function ()
                    {
                        return sidenav.isLockedOpen();
                    }, function (current, old)
                    {
                        if ( angular.isUndefined(current) || angular.equals(current, old) )
                        {
                            return;
                        }

                        var folded = msNavigationService.getFolded();

                        if ( folded )
                        {
                            if ( current )
                            {
                                // Collapse everything
                                $rootScope.$broadcast('msNavigation::collapse');
                            }
                            else
                            {
                                // Expand the active one and its parents
                                var activeItem = msNavigationService.getActiveItem();
                                if ( activeItem )
                                {
                                    activeItem.scope.$emit('msNavigation::stateMatched');
                                }
                            }
                        }
                    });

                    // Folded status watcher
                    scope.$watch('folded', function (current, old)
                    {
                        if ( angular.isUndefined(current) || angular.equals(current, old) )
                        {
                            return;
                        }

                        setFolded(current);
                    });

                    /**
                     * Set folded status
                     *
                     * @param folded
                     */
                    function setFolded(folded)
                    {
                        // Store folded status on the service for global access
                        msNavigationService.setFolded(folded);

                        if ( folded )
                        {
                            // Collapse everything
                            $rootScope.$broadcast('msNavigation::collapse');

                            // Add class to the body
                            bodyEl.addClass('ms-navigation-folded');

                            // Set fold expander
                            setFoldExpander();
                        }
                        else
                        {
                            // Expand the active one and its parents
                            var activeItem = msNavigationService.getActiveItem();
                            if ( activeItem )
                            {
                                activeItem.scope.$emit('msNavigation::stateMatched');
                            }

                            // Remove body class
                            bodyEl.removeClass('ms-navigation-folded ms-navigation-folded-open');

                            // Remove fold collapser
                            removeFoldCollapser();
                        }
                    }

                    /**
                     * Set fold expander
                     */
                    function setFoldExpander()
                    {
                        iElement.parent().append(foldExpanderEl);

                        // Let everything settle for a moment
                        // before registering the event listener
                        $timeout(function ()
                        {
                            foldExpanderEl.on('mouseenter touchstart', onFoldExpanderHover);
                        });
                    }

                    /**
                     * Set fold collapser
                     */
                    function setFoldCollapser()
                    {
                        bodyEl.find('#main').append(foldCollapserEl);
                        foldCollapserEl.on('mouseenter touchstart', onFoldCollapserHover);
                    }

                    /**
                     * Remove fold collapser
                     */
                    function removeFoldCollapser()
                    {
                        foldCollapserEl.remove();
                    }

                    /**
                     * onHover event of foldExpander
                     */
                    function onFoldExpanderHover(event)
                    {
                        if ( event )
                        {
                            event.preventDefault();
                        }

                        // Set folded open status
                        msNavigationService.setFoldedOpen(true);

                        // Expand the active one and its parents
                        var activeItem = msNavigationService.getActiveItem();
                        if ( activeItem )
                        {
                            activeItem.scope.$emit('msNavigation::stateMatched');
                        }

                        // Add class to the body
                        bodyEl.addClass('ms-navigation-folded-open');

                        // Remove the fold opener
                        foldExpanderEl.remove();

                        // Set fold collapser
                        setFoldCollapser();
                    }

                    /**
                     * onHover event of foldCollapser
                     */
                    function onFoldCollapserHover(event)
                    {
                        if ( event )
                        {
                            event.preventDefault();
                        }

                        // Set folded open status
                        msNavigationService.setFoldedOpen(false);

                        // Collapse everything
                        $rootScope.$broadcast('msNavigation::collapse');

                        // Remove body class
                        bodyEl.removeClass('ms-navigation-folded-open');

                        // Remove the fold collapser
                        foldCollapserEl.remove();

                        // Set fold expander
                        setFoldExpander();
                    }

                    /**
                     * Public access for toggling folded status externally
                     */
                    scope.toggleFolded = function ()
                    {
                        var folded = msNavigationService.getFolded();

                        setFolded(!folded);
                    };

                    /**
                     * On $stateChangeStart
                     */
                    scope.$on('$stateChangeStart', function ()
                    {
                        // Close the sidenav
                        sidenav.close();
                    });

                    // Cleanup
                    scope.$on('$destroy', function ()
                    {
                        foldCollapserEl.off('mouseenter touchstart');
                        foldExpanderEl.off('mouseenter touchstart');
                    });
                };
            }
        };
    }

    /** @ngInject */
    function MsNavigationNodeController($scope, $element, $rootScope, $animate, $state, msNavigationService)
    {
        var vm = this;

        // Data
        vm.element = $element;
        vm.node = $scope.node;
        vm.hasChildren = undefined;
        vm.collapsed = undefined;
        vm.collapsable = undefined;
        vm.group = undefined;
        vm.animateHeightClass = 'animate-height';

        // Methods
        vm.toggleCollapsed = toggleCollapsed;
        vm.collapse = collapse;
        vm.expand = expand;
        vm.getClass = getClass;
        vm.isHidden = isHidden;

        //////////

        init();

        /**
         * Initialize
         */
        function init()
        {
            // Setup the initial values

            // Has children?
            vm.hasChildren = vm.node.children.length > 0;

            // Is group?
            vm.group = !!(angular.isDefined(vm.node.group) && vm.node.group === true);

            // Is collapsable?
            if ( !vm.hasChildren || vm.group )
            {
                vm.collapsable = false;
            }
            else
            {
                vm.collapsable = !!(angular.isUndefined(vm.node.collapsable) || typeof vm.node.collapsable !== 'boolean' || vm.node.collapsable === true);
            }

            // Is collapsed?
            if ( !vm.collapsable )
            {
                vm.collapsed = false;
            }
            else
            {
                vm.collapsed = !!(angular.isUndefined(vm.node.collapsed) || typeof vm.node.collapsed !== 'boolean' || vm.node.collapsed === true);
            }

            // Expand all parents if we have a matching state or
            // the current state is a child of the node's state
            if ( vm.node.state === $state.current.name || $state.includes(vm.node.state) )
            {
                // If state params are defined, make sure they are
                // equal, otherwise do not set the active item
                if ( angular.isDefined(vm.node.stateParams) && angular.isDefined($state.params) && !angular.equals(vm.node.stateParams, $state.params) )
                {
                    return;
                }

                $scope.$emit('msNavigation::stateMatched');

                // Also store the current active menu item
                msNavigationService.setActiveItem(vm.node, $scope);
            }

            $scope.$on('msNavigation::stateMatched', function ()
            {
                // Expand if the current scope is collapsable and is collapsed
                if ( vm.collapsable && vm.collapsed )
                {
                    $scope.$evalAsync(function ()
                    {
                        vm.collapsed = false;
                    });
                }
            });

            // Listen for collapse event
            $scope.$on('msNavigation::collapse', function (event, path)
            {
                if ( vm.collapsed || !vm.collapsable )
                {
                    return;
                }

                // If there is no path defined, collapse
                if ( angular.isUndefined(path) )
                {
                    vm.collapse();
                }
                // If there is a path defined, do not collapse
                // the items that are inside that path. This will
                // prevent parent items from collapsing
                else
                {
                    var givenPathParts = path.split('.'),
                        activePathParts = [];

                    var activeItem = msNavigationService.getActiveItem();
                    if ( activeItem )
                    {
                        activePathParts = activeItem.node._path.split('.');
                    }

                    // Test for given path
                    if ( givenPathParts.indexOf(vm.node._id) > -1 )
                    {
                        return;
                    }

                    // Test for active path
                    if ( activePathParts.indexOf(vm.node._id) > -1 )
                    {
                        return;
                    }

                    vm.collapse();
                }
            });

            // Listen for $stateChangeSuccess event
            $scope.$on('$stateChangeSuccess', function ()
            {
                if ( vm.node.state === $state.current.name )
                {
                    // If state params are defined, make sure they are
                    // equal, otherwise do not set the active item
                    if ( angular.isDefined(vm.node.stateParams) && angular.isDefined($state.params) && !angular.equals(vm.node.stateParams, $state.params) )
                    {
                        return;
                    }

                    // Update active item on state change
                    msNavigationService.setActiveItem(vm.node, $scope);

                    // Collapse everything except the one we're using
                    $rootScope.$broadcast('msNavigation::collapse', vm.node._path);
                }

                // Expand the parents if we the current
                // state is a child of the node's state
                if ( $state.includes(vm.node.state) )
                {
                    // If state params are defined, make sure they are
                    // equal, otherwise do not set the active item
                    if ( angular.isDefined(vm.node.stateParams) && angular.isDefined($state.params) && !angular.equals(vm.node.stateParams, $state.params) )
                    {
                        return;
                    }

                    // Emit the stateMatched
                    $scope.$emit('msNavigation::stateMatched');
                }
            });
        }

        /**
         * Toggle collapsed
         */
        function toggleCollapsed()
        {
            if ( vm.collapsed )
            {
                vm.expand();
            }
            else
            {
                vm.collapse();
            }
        }

        /**
         * Collapse
         */
        function collapse()
        {
            // Grab the element that we are going to collapse
            var collapseEl = vm.element.children('ul');

            // Grab the height
            var height = collapseEl[0].offsetHeight;

            $scope.$evalAsync(function ()
            {
                // Set collapsed status
                vm.collapsed = true;

                // Add collapsing class to the node
                vm.element.addClass('collapsing');

                // Animate the height
                $animate.animate(collapseEl,
                    {
                        'display': 'block',
                        'height' : height + 'px'
                    },
                    {
                        'height': '0px'
                    },
                    vm.animateHeightClass
                ).then(
                    function ()
                    {
                        // Clear the inline styles after animation done
                        collapseEl.css({
                            'display': '',
                            'height' : ''
                        });

                        // Clear collapsing class from the node
                        vm.element.removeClass('collapsing');
                    }
                );

                // Broadcast the collapse event so child items can also be collapsed
                $scope.$broadcast('msNavigation::collapse');
            });
        }

        /**
         * Expand
         */
        function expand()
        {
            // Grab the element that we are going to expand
            var expandEl = vm.element.children('ul');

            // Move the element out of the dom flow and
            // make it block so we can get its height
            expandEl.css({
                'position'  : 'absolute',
                'visibility': 'hidden',
                'display'   : 'block',
                'height'    : 'auto'
            });

            // Grab the height
            var height = expandEl[0].offsetHeight;

            // Reset the style modifications
            expandEl.css({
                'position'  : '',
                'visibility': '',
                'display'   : '',
                'height'    : ''
            });

            $scope.$evalAsync(function ()
            {
                // Set collapsed status
                vm.collapsed = false;

                // Add expanding class to the node
                vm.element.addClass('expanding');

                // Animate the height
                $animate.animate(expandEl,
                    {
                        'display': 'block',
                        'height' : '0px'
                    },
                    {
                        'height': height + 'px'
                    },
                    vm.animateHeightClass
                ).then(
                    function ()
                    {
                        // Clear the inline styles after animation done
                        expandEl.css({
                            'height': ''
                        });

                        // Clear expanding class from the node
                        vm.element.removeClass('expanding');
                    }
                );

                // If item expanded, broadcast the collapse event from rootScope so that the other expanded items
                // can be collapsed. This is necessary for keeping only one parent expanded at any time
                $rootScope.$broadcast('msNavigation::collapse', vm.node._path);
            });
        }

        /**
         * Return the class
         *
         * @returns {*}
         */
        function getClass()
        {
            return vm.node.class;
        }

        /**
         * Check if node should be hidden
         *
         * @returns {boolean}
         */
        function isHidden()
        {
            if ( angular.isDefined(vm.node.hidden) && angular.isFunction(vm.node.hidden) )
            {
                return vm.node.hidden();
            }

            return false;
        }
    }

    /** @ngInject */
    function msNavigationNodeDirective()
    {
        return {
            restrict        : 'A',
            bindToController: {
                node: '=msNavigationNode'
            },
            controller      : 'MsNavigationNodeController as vm',
            compile         : function (tElement)
            {
                tElement.addClass('ms-navigation-node');

                return function postLink(scope, iElement, iAttrs, MsNavigationNodeCtrl)
                {
                    // Add custom classes
                    iElement.addClass(MsNavigationNodeCtrl.getClass());

                    // Add group class if it's a group
                    if ( MsNavigationNodeCtrl.group )
                    {
                        iElement.addClass('group');
                    }
                };
            }
        };
    }

    /** @ngInject */
    function msNavigationItemDirective()
    {
        return {
            restrict: 'A',
            require : '^msNavigationNode',
            compile : function (tElement)
            {
                tElement.addClass('ms-navigation-item');

                return function postLink(scope, iElement, iAttrs, MsNavigationNodeCtrl)
                {
                    // If the item is collapsable...
                    if ( MsNavigationNodeCtrl.collapsable )
                    {
                        iElement.on('click', MsNavigationNodeCtrl.toggleCollapsed);
                    }

                    // Cleanup
                    scope.$on('$destroy', function ()
                    {
                        iElement.off('click');
                    });
                };
            }
        };
    }

    /** @ngInject */
    function msNavigationHorizontalDirective(msNavigationService)
    {
        return {
            restrict   : 'E',
            scope      : {
                root: '@'
            },
            controller : 'MsNavigationController as vm',
            templateUrl: 'app/core/directives/ms-navigation/templates/horizontal.html',
            transclude : true,
            compile    : function (tElement)
            {
                tElement.addClass('ms-navigation-horizontal');

                return function postLink(scope)
                {
                    // Store the navigation in the service for public access
                    msNavigationService.setNavigationScope(scope);
                };
            }
        };
    }

    /** @ngInject */
    function MsNavigationHorizontalNodeController($scope, $element, $rootScope, $state, msNavigationService)
    {
        var vm = this;

        // Data
        vm.element = $element;
        vm.node = $scope.node;
        vm.hasChildren = undefined;
        vm.group = undefined;

        // Methods
        vm.getClass = getClass;

        //////////

        init();

        /**
         * Initialize
         */
        function init()
        {
            // Setup the initial values

            // Is active
            vm.isActive = false;

            // Has children?
            vm.hasChildren = vm.node.children.length > 0;

            // Is group?
            vm.group = !!(angular.isDefined(vm.node.group) && vm.node.group === true);

            // Mark all parents as active if we have a matching state
            // or the current state is a child of the node's state
            if ( vm.node.state === $state.current.name || $state.includes(vm.node.state) )
            {
                // If state params are defined, make sure they are
                // equal, otherwise do not set the active item
                if ( angular.isDefined(vm.node.stateParams) && angular.isDefined($state.params) && !angular.equals(vm.node.stateParams, $state.params) )
                {
                    return;
                }

                $scope.$emit('msNavigation::stateMatched');

                // Also store the current active menu item
                msNavigationService.setActiveItem(vm.node, $scope);
            }

            $scope.$on('msNavigation::stateMatched', function ()
            {
                // Mark as active if has children
                if ( vm.hasChildren )
                {
                    $scope.$evalAsync(function ()
                    {
                        vm.isActive = true;
                    });
                }
            });

            // Listen for clearActive event
            $scope.$on('msNavigation::clearActive', function ()
            {
                if ( !vm.hasChildren )
                {
                    return;
                }

                var activePathParts = [];

                var activeItem = msNavigationService.getActiveItem();
                if ( activeItem )
                {
                    activePathParts = activeItem.node._path.split('.');
                }

                // Test for active path
                if ( activePathParts.indexOf(vm.node._id) > -1 )
                {
                    $scope.$evalAsync(function ()
                    {
                        vm.isActive = true;
                    });
                }
                else
                {
                    $scope.$evalAsync(function ()
                    {
                        vm.isActive = false;
                    });
                }

            });

            // Listen for $stateChangeSuccess event
            $scope.$on('$stateChangeSuccess', function ()
            {
                if ( vm.node.state === $state.current.name || $state.includes(vm.node.state) )
                {
                    // If state params are defined, make sure they are
                    // equal, otherwise do not set the active item
                    if ( angular.isDefined(vm.node.stateParams) && angular.isDefined($state.params) && !angular.equals(vm.node.stateParams, $state.params) )
                    {
                        return;
                    }

                    // Update active item on state change
                    msNavigationService.setActiveItem(vm.node, $scope);

                    // Clear all active states except the one we're using
                    $rootScope.$broadcast('msNavigation::clearActive');
                }
            });
        }

        /**
         * Return the class
         *
         * @returns {*}
         */
        function getClass()
        {
            return vm.node.class;
        }
    }

    /** @ngInject */
    function msNavigationHorizontalNodeDirective()
    {
        return {
            restrict        : 'A',
            bindToController: {
                node: '=msNavigationHorizontalNode'
            },
            controller      : 'MsNavigationHorizontalNodeController as vm',
            compile         : function (tElement)
            {
                tElement.addClass('ms-navigation-horizontal-node');

                return function postLink(scope, iElement, iAttrs, MsNavigationHorizontalNodeCtrl)
                {
                    // Add custom classes
                    iElement.addClass(MsNavigationHorizontalNodeCtrl.getClass());

                    // Add group class if it's a group
                    if ( MsNavigationHorizontalNodeCtrl.group )
                    {
                        iElement.addClass('group');
                    }
                };
            }
        };
    }

    /** @ngInject */
    function msNavigationHorizontalItemDirective($mdMedia)
    {
        return {
            restrict: 'A',
            require : '^msNavigationHorizontalNode',
            compile : function (tElement)
            {
                tElement.addClass('ms-navigation-horizontal-item');

                return function postLink(scope, iElement, iAttrs, MsNavigationHorizontalNodeCtrl)
                {
                    iElement.on('click', onClick);

                    function onClick()
                    {
                        if ( !MsNavigationHorizontalNodeCtrl.hasChildren || $mdMedia('gt-md') )
                        {
                            return;
                        }

                        iElement.toggleClass('expanded');
                    }

                    // Cleanup
                    scope.$on('$destroy', function ()
                    {
                        iElement.off('click');
                    });
                };
            }
        };
    }

})();
(function ()
{
    'use strict';

    msNavIsFoldedDirective.$inject = ["$document", "$rootScope", "msNavFoldService"];
    msNavDirective.$inject = ["$rootScope", "$mdComponentRegistry", "msNavFoldService"];
    msNavToggleDirective.$inject = ["$rootScope", "$q", "$animate", "$state"];
    angular
        .module('app.core')
        .factory('msNavFoldService', msNavFoldService)
        .directive('msNavIsFolded', msNavIsFoldedDirective)
        .controller('MsNavController', MsNavController)
        .directive('msNav', msNavDirective)
        .directive('msNavTitle', msNavTitleDirective)
        .directive('msNavButton', msNavButtonDirective)
        .directive('msNavToggle', msNavToggleDirective);

    /** @ngInject */
    function msNavFoldService()
    {
        var foldable = {};

        var service = {
            setFoldable    : setFoldable,
            isNavFoldedOpen: isNavFoldedOpen,
            toggleFold     : toggleFold,
            openFolded     : openFolded,
            closeFolded    : closeFolded
        };

        return service;

        //////////

        /**
         * Set the foldable
         *
         * @param scope
         * @param element
         */
        function setFoldable(scope, element)
        {
            foldable = {
                'scope'  : scope,
                'element': element
            };
        }

        /**
         * Is folded open
         */
        function isNavFoldedOpen()
        {
            return foldable.scope.isNavFoldedOpen();
        }

        /**
         * Toggle fold
         */
        function toggleFold()
        {
            foldable.scope.toggleFold();
        }

        /**
         * Open folded navigation
         */
        function openFolded()
        {
            foldable.scope.openFolded();
        }

        /**
         * Close folded navigation
         */
        function closeFolded()
        {
            foldable.scope.closeFolded();
        }
    }

    /** @ngInject */
    function msNavIsFoldedDirective($document, $rootScope, msNavFoldService)
    {
        return {
            restrict: 'A',
            link    : function (scope, iElement, iAttrs)
            {
                var isFolded = (iAttrs.msNavIsFolded === 'true'),
                    isFoldedOpen = false,
                    body = angular.element($document[0].body),
                    openOverlay = angular.element('<div id="ms-nav-fold-open-overlay"></div>'),
                    closeOverlay = angular.element('<div id="ms-nav-fold-close-overlay"></div>'),
                    sidenavEl = iElement.parent();

                // Initialize the service
                msNavFoldService.setFoldable(scope, iElement, isFolded);

                // Set the fold status for the first time
                if ( isFolded )
                {
                    fold();
                }
                else
                {
                    unfold();
                }

                /**
                 * Is nav folded open
                 */
                function isNavFoldedOpen()
                {
                    return isFoldedOpen;
                }

                /**
                 * Toggle fold
                 */
                function toggleFold()
                {
                    isFolded = !isFolded;

                    if ( isFolded )
                    {
                        fold();
                    }
                    else
                    {
                        unfold();
                    }
                }

                /**
                 * Fold the navigation
                 */
                function fold()
                {
                    // Add classes
                    body.addClass('ms-nav-folded');

                    // Collapse everything and scroll to the top
                    $rootScope.$broadcast('msNav::forceCollapse');
                    iElement.scrollTop(0);

                    // Append the openOverlay to the element
                    sidenavEl.append(openOverlay);

                    // Event listeners
                    openOverlay.on('mouseenter touchstart', function (event)
                    {
                        openFolded(event);
                        isFoldedOpen = true;
                    });
                }

                /**
                 * Open folded navigation
                 */
                function openFolded(event)
                {
                    if ( angular.isDefined(event) )
                    {
                        event.preventDefault();
                    }

                    body.addClass('ms-nav-folded-open');

                    // Update the location
                    $rootScope.$broadcast('msNav::expandMatchingToggles');

                    // Remove open overlay
                    sidenavEl.find(openOverlay).remove();

                    // Append close overlay and bind its events
                    sidenavEl.parent().append(closeOverlay);
                    closeOverlay.on('mouseenter touchstart', function (event)
                    {
                        closeFolded(event);
                        isFoldedOpen = false;
                    });
                }

                /**
                 * Close folded navigation
                 */
                function closeFolded(event)
                {
                    if ( angular.isDefined(event) )
                    {
                        event.preventDefault();
                    }

                    // Collapse everything and scroll to the top
                    $rootScope.$broadcast('msNav::forceCollapse');
                    iElement.scrollTop(0);

                    body.removeClass('ms-nav-folded-open');

                    // Remove close overlay
                    sidenavEl.parent().find(closeOverlay).remove();

                    // Append open overlay and bind its events
                    sidenavEl.append(openOverlay);
                    openOverlay.on('mouseenter touchstart', function (event)
                    {
                        openFolded(event);
                        isFoldedOpen = true;
                    });
                }

                /**
                 * Unfold the navigation
                 */
                function unfold()
                {
                    body.removeClass('ms-nav-folded ms-nav-folded-open');

                    // Update the location
                    $rootScope.$broadcast('msNav::expandMatchingToggles');

                    iElement.off('mouseenter mouseleave');
                }

                // Expose functions to the scope
                scope.toggleFold = toggleFold;
                scope.openFolded = openFolded;
                scope.closeFolded = closeFolded;
                scope.isNavFoldedOpen = isNavFoldedOpen;

                // Cleanup
                scope.$on('$destroy', function ()
                {
                    openOverlay.off('mouseenter touchstart');
                    closeOverlay.off('mouseenter touchstart');
                    iElement.off('mouseenter mouseleave');
                });
            }
        };
    }


    /** @ngInject */
    function MsNavController()
    {
        var vm = this,
            disabled = false,
            toggleItems = [],
            lockedItems = [];

        // Data

        // Methods
        vm.isDisabled = isDisabled;
        vm.enable = enable;
        vm.disable = disable;
        vm.setToggleItem = setToggleItem;
        vm.getLockedItems = getLockedItems;
        vm.setLockedItem = setLockedItem;
        vm.clearLockedItems = clearLockedItems;

        //////////

        /**
         * Is navigation disabled
         *
         * @returns {boolean}
         */
        function isDisabled()
        {
            return disabled;
        }

        /**
         * Disable the navigation
         */
        function disable()
        {
            disabled = true;
        }

        /**
         * Enable the navigation
         */
        function enable()
        {
            disabled = false;
        }

        /**
         * Set toggle item
         *
         * @param element
         * @param scope
         */
        function setToggleItem(element, scope)
        {
            toggleItems.push({
                'element': element,
                'scope'  : scope
            });
        }

        /**
         * Get locked items
         *
         * @returns {Array}
         */
        function getLockedItems()
        {
            return lockedItems;
        }

        /**
         * Set locked item
         *
         * @param element
         * @param scope
         */
        function setLockedItem(element, scope)
        {
            lockedItems.push({
                'element': element,
                'scope'  : scope
            });
        }

        /**
         * Clear locked items list
         */
        function clearLockedItems()
        {
            lockedItems = [];
        }
    }

    /** @ngInject */
    function msNavDirective($rootScope, $mdComponentRegistry, msNavFoldService)
    {
        return {
            restrict  : 'E',
            scope     : {},
            controller: 'MsNavController',
            compile   : function (tElement)
            {
                tElement.addClass('ms-nav');

                return function postLink(scope)
                {
                    // Update toggle status according to the ui-router current state
                    $rootScope.$broadcast('msNav::expandMatchingToggles');

                    // Update toggles on state changes
                    var stateChangeSuccessEvent = $rootScope.$on('$stateChangeSuccess', function ()
                    {
                        $rootScope.$broadcast('msNav::expandMatchingToggles');

                        // Close navigation sidenav on stateChangeSuccess
                        $mdComponentRegistry.when('navigation').then(function (navigation)
                        {
                            navigation.close();

                            if ( msNavFoldService.isNavFoldedOpen() )
                            {
                                msNavFoldService.closeFolded();
                            }
                        });
                    });

                    // Cleanup
                    scope.$on('$destroy', function ()
                    {
                        stateChangeSuccessEvent();
                    });
                };
            }
        };
    }

    /** @ngInject */
    function msNavTitleDirective()
    {
        return {
            restrict: 'A',
            compile : function (tElement)
            {
                tElement.addClass('ms-nav-title');

                return function postLink()
                {

                };
            }
        };
    }

    /** @ngInject */
    function msNavButtonDirective()
    {
        return {
            restrict: 'AE',
            compile : function (tElement)
            {
                tElement.addClass('ms-nav-button');

                return function postLink()
                {

                };
            }
        };
    }

    /** @ngInject */
    function msNavToggleDirective($rootScope, $q, $animate, $state)
    {
        return {
            restrict: 'A',
            require : '^msNav',
            scope   : true,
            compile : function (tElement, tAttrs)
            {
                tElement.addClass('ms-nav-toggle');

                // Add collapsed attr
                if ( angular.isUndefined(tAttrs.collapsed) )
                {
                    tAttrs.collapsed = true;
                }

                tElement.attr('collapsed', tAttrs.collapsed);

                return function postLink(scope, iElement, iAttrs, MsNavCtrl)
                {
                    var classes = {
                        expanded         : 'expanded',
                        expandAnimation  : 'expand-animation',
                        collapseAnimation: 'collapse-animation'
                    };

                    // Store all related states
                    var links = iElement.find('a');
                    var states = [];
                    var regExp = /\(.*\)/g;

                    angular.forEach(links, function (link)
                    {
                        var state = angular.element(link).attr('ui-sref');

                        if ( angular.isUndefined(state) )
                        {
                            return;
                        }

                        // Remove any parameter definition from the state name before storing it
                        state = state.replace(regExp, '');

                        states.push(state);
                    });

                    // Store toggle-able element and its scope in the main nav controller
                    MsNavCtrl.setToggleItem(iElement, scope);

                    // Click handler
                    iElement.children('.ms-nav-button').on('click', toggle);

                    // Toggle function
                    function toggle()
                    {
                        // If navigation is disabled, do nothing...
                        if ( MsNavCtrl.isDisabled() )
                        {
                            return;
                        }

                        // Disable the entire navigation to prevent spamming
                        MsNavCtrl.disable();

                        if ( isCollapsed() )
                        {
                            // Clear the locked items list
                            MsNavCtrl.clearLockedItems();

                            // Emit pushToLockedList event
                            scope.$emit('msNav::pushToLockedList');

                            // Collapse everything but locked items
                            $rootScope.$broadcast('msNav::collapse');

                            // Expand and then...
                            expand().then(function ()
                            {
                                // Enable the entire navigation after animations completed
                                MsNavCtrl.enable();
                            });
                        }
                        else
                        {
                            // Collapse with all children
                            scope.$broadcast('msNav::forceCollapse');
                        }
                    }

                    // Cleanup
                    scope.$on('$destroy', function ()
                    {
                        iElement.children('.ms-nav-button').off('click');
                    });

                    /*---------------------*/
                    /* Scope Events        */
                    /*---------------------*/

                    /**
                     * Collapse everything but locked items
                     */
                    scope.$on('msNav::collapse', function ()
                    {
                        // Only collapse toggles that are not locked
                        var lockedItems = MsNavCtrl.getLockedItems();
                        var locked = false;

                        angular.forEach(lockedItems, function (lockedItem)
                        {
                            if ( angular.equals(lockedItem.scope, scope) )
                            {
                                locked = true;
                            }
                        });

                        if ( locked )
                        {
                            return;
                        }

                        // Collapse and then...
                        collapse().then(function ()
                        {
                            // Enable the entire navigation after animations completed
                            MsNavCtrl.enable();
                        });
                    });

                    /**
                     * Collapse everything
                     */
                    scope.$on('msNav::forceCollapse', function ()
                    {
                        // Collapse and then...
                        collapse().then(function ()
                        {
                            // Enable the entire navigation after animations completed
                            MsNavCtrl.enable();
                        });
                    });

                    /**
                     * Expand toggles that match with the current states
                     */
                    scope.$on('msNav::expandMatchingToggles', function ()
                    {
                        var currentState = $state.current.name;
                        var shouldExpand = false;

                        angular.forEach(states, function (state)
                        {
                            if ( currentState === state )
                            {
                                shouldExpand = true;
                            }
                        });

                        if ( shouldExpand )
                        {
                            expand();
                        }
                        else
                        {
                            collapse();
                        }
                    });

                    /**
                     * Add toggle to the locked list
                     */
                    scope.$on('msNav::pushToLockedList', function ()
                    {
                        // Set expanded item on main nav controller
                        MsNavCtrl.setLockedItem(iElement, scope);
                    });

                    /*---------------------*/
                    /* Internal functions  */
                    /*---------------------*/

                    /**
                     * Is element collapsed
                     *
                     * @returns {bool}
                     */
                    function isCollapsed()
                    {
                        return iElement.attr('collapsed') === 'true';
                    }

                    /**
                     * Is element expanded
                     *
                     * @returns {bool}
                     */
                    function isExpanded()
                    {
                        return !isCollapsed();
                    }

                    /**
                     * Expand the toggle
                     *
                     * @returns $promise
                     */
                    function expand()
                    {
                        // Create a new deferred object
                        var deferred = $q.defer();

                        // If the menu item is already expanded, do nothing..
                        if ( isExpanded() )
                        {
                            // Reject the deferred object
                            deferred.reject({'error': true});

                            // Return the promise
                            return deferred.promise;
                        }

                        // Set element attr
                        iElement.attr('collapsed', false);

                        // Grab the element to expand
                        var elementToExpand = angular.element(iElement.find('ms-nav-toggle-items')[0]);

                        // Move the element out of the dom flow and
                        // make it block so we can get its height
                        elementToExpand.css({
                            'position'  : 'absolute',
                            'visibility': 'hidden',
                            'display'   : 'block',
                            'height'    : 'auto'
                        });

                        // Grab the height
                        var height = elementToExpand[0].offsetHeight;

                        // Reset the style modifications
                        elementToExpand.css({
                            'position'  : '',
                            'visibility': '',
                            'display'   : '',
                            'height'    : ''
                        });

                        // Animate the height
                        scope.$evalAsync(function ()
                        {
                            $animate.animate(elementToExpand,
                                {
                                    'display': 'block',
                                    'height' : '0px'
                                },
                                {
                                    'height': height + 'px'
                                },
                                classes.expandAnimation
                            ).then(
                                function ()
                                {
                                    // Add expanded class
                                    elementToExpand.addClass(classes.expanded);

                                    // Clear the inline styles after animation done
                                    elementToExpand.css({'height': ''});

                                    // Resolve the deferred object
                                    deferred.resolve({'success': true});
                                }
                            );
                        });

                        // Return the promise
                        return deferred.promise;
                    }

                    /**
                     * Collapse the toggle
                     *
                     * @returns $promise
                     */
                    function collapse()
                    {
                        // Create a new deferred object
                        var deferred = $q.defer();

                        // If the menu item is already collapsed, do nothing..
                        if ( isCollapsed() )
                        {
                            // Reject the deferred object
                            deferred.reject({'error': true});

                            // Return the promise
                            return deferred.promise;
                        }

                        // Set element attr
                        iElement.attr('collapsed', true);

                        // Grab the element to collapse
                        var elementToCollapse = angular.element(iElement.find('ms-nav-toggle-items')[0]);

                        // Grab the height
                        var height = elementToCollapse[0].offsetHeight;

                        // Animate the height
                        scope.$evalAsync(function ()
                        {
                            $animate.animate(elementToCollapse,
                                {
                                    'height': height + 'px'
                                },
                                {
                                    'height': '0px'
                                },
                                classes.collapseAnimation
                            ).then(
                                function ()
                                {
                                    // Remove expanded class
                                    elementToCollapse.removeClass(classes.expanded);

                                    // Clear the inline styles after animation done
                                    elementToCollapse.css({
                                        'display': '',
                                        'height' : ''
                                    });

                                    // Resolve the deferred object
                                    deferred.resolve({'success': true});
                                }
                            );
                        });

                        // Return the promise
                        return deferred.promise;
                    }
                };
            }
        };
    }
})();
(function ()
{
    'use strict';

    msMaterialColorPickerController.$inject = ["$scope", "$mdColorPalette", "$mdMenu", "fuseGenerator"];
    angular
        .module('app.core')
        .controller('msMaterialColorPickerController', msMaterialColorPickerController)
        .directive('msMaterialColorPicker', msMaterialColorPicker);

    /** @ngInject */
    function msMaterialColorPickerController($scope, $mdColorPalette, $mdMenu, fuseGenerator)
    {
        var vm = this;
        vm.palettes = $mdColorPalette; // Material Color Palette
        vm.selectedPalette = false;
        vm.selectedHues = false;
        $scope.$selectedColor = {};

        // Methods
        vm.activateHueSelection = activateHueSelection;
        vm.selectColor = selectColor;
        vm.removeColor = removeColor;

        /**
         * Initialize / Watch model changes
         */
        $scope.$watch('ngModel', setSelectedColor);

        /**
         * Activate Hue Selection
         * @param palette
         * @param hues
         */
        function activateHueSelection(palette, hues)
        {
            vm.selectedPalette = palette;
            vm.selectedHues = hues;
        }

        /**
         * Select Color
         * @type {selectColor}
         */
        function selectColor(palette, hue)
        {
            // Update Selected Color
            updateSelectedColor(palette, hue);

            // Update Model Value
            updateModel();

            // Hide The picker
            $mdMenu.hide();
        }

        function removeColor()
        {
            vm.selectedColor = {
                palette: '',
                hue    : '',
                class  : ''
            };

            activateHueSelection(false, false);

            updateModel();
        }

        /**
         * Set SelectedColor by model type
         */
        function setSelectedColor()
        {
            if ( !vm.modelCtrl.$viewValue || vm.modelCtrl.$viewValue === '' )
            {
                removeColor();
                return;
            }

            var palette, hue;

            // If ModelType Class
            if ( vm.msModelType === 'class' )
            {
                var color = vm.modelCtrl.$viewValue.split('-');
                if ( color.length >= 5 )
                {
                    palette = color[1] + '-' + color[2];
                    hue = color[3];
                }
                else
                {
                    palette = color[1];
                    hue = color[2];
                }
            }

            // If ModelType Object
            else if ( vm.msModelType === 'obj' )
            {
                palette = vm.modelCtrl.$viewValue.palette;
                hue = vm.modelCtrl.$viewValue.hue || 500;
            }

            // Update Selected Color
            updateSelectedColor(palette, hue);
        }

        /**
         * Update Selected Color
         * @param palette
         * @param hue
         */
        function updateSelectedColor(palette, hue)
        {
            vm.selectedColor = {
                palette     : palette,
                hue         : hue,
                class       : 'md-' + palette + '-' + hue + '-bg',
                bgColorValue: fuseGenerator.rgba(vm.palettes[palette][hue].value),
                fgColorValue: fuseGenerator.rgba(vm.palettes[palette][hue].contrast)
            };

            // If Model object not Equals the selectedColor update it
            // it can be happen when the model only have pallete and hue values
            if ( vm.msModelType === 'obj' && !angular.equals(vm.selectedColor, vm.modelCtrl.$viewValue) )
            {
                // Update Model Value
                updateModel();
            }

            activateHueSelection(palette, vm.palettes[palette]);

            $scope.$selectedColor = vm.selectedColor;
        }

        /**
         * Update Model Value by model type
         */
        function updateModel()
        {
            if ( vm.msModelType === 'class' )
            {
                vm.modelCtrl.$setViewValue(vm.selectedColor.class);
            }
            else if ( vm.msModelType === 'obj' )
            {
                vm.modelCtrl.$setViewValue(vm.selectedColor);
            }
        }
    }

    /** @ngInject */
    function msMaterialColorPicker()
    {
        return {
            require    : ['msMaterialColorPicker', 'ngModel'],
            restrict   : 'E',
            scope      : {
                ngModel    : '=',
                msModelType: '@?'
            },
            controller : 'msMaterialColorPickerController as vm',
            transclude : true,
            templateUrl: 'app/core/directives/ms-material-color-picker/ms-material-color-picker.html',
            link       : function (scope, element, attrs, controllers, transclude)
            {
                var ctrl = controllers[0];

                /**
                 *  Pass model controller to directive controller
                 */
                ctrl.modelCtrl = controllers[1];

                /**
                 * ModelType: 'obj', 'class'(default)
                 * @type {string|string}
                 */
                ctrl.msModelType = scope.msModelType || 'class';

                transclude(scope, function (clone)
                {
                    clone = clone.filter(function (i, el)
                    {
                        return ( el.nodeType === 1 ) ? true : false;
                    });

                    if ( clone.length )
                    {
                        element.find('ms-color-picker-button').replaceWith(clone);
                    }
                });
            }
        };
    }
})();
(function ()
{
    'use strict';

    msMasonryController.$inject = ["$scope", "$window", "$mdMedia", "$timeout"];
    msMasonry.$inject = ["$timeout"];
    angular
        .module('app.core')
        .controller('msMasonryController', msMasonryController)
        .directive('msMasonry', msMasonry)
        .directive('msMasonryItem', msMasonryItem);

    /** @ngInject */
    function msMasonryController($scope, $window, $mdMedia, $timeout)
    {
        var vm = this,
            defaultOpts = {
                columnCount     : 5,
                respectItemOrder: false,
                reLayoutDebounce: 400,
                responsive      : {
                    md: 3,
                    sm: 2,
                    xs: 1
                }
            },
            reLayoutTimeout = true;

        vm.options = null;
        vm.container = [];
        vm.containerPos = '';
        vm.columnWidth = '';
        vm.items = [];

        // Methods
        vm.reLayout = reLayout;
        vm.initialize = initialize;
        vm.waitImagesLoaded = waitImagesLoaded;

        function initialize()
        {
            vm.options = !vm.options ? defaultOpts : angular.extend(defaultOpts, vm.options);


            watchContainerResize();
        }

        $scope.$on('msMasonry:relayout', function ()
        {
            reLayout();
        });

        function waitImagesLoaded(element, callback)
        {
            if ( typeof imagesLoaded !== 'undefined' )
            {
                var imgLoad = $window.imagesLoaded(element);

                imgLoad.on('done', function ()
                {
                    callback();
                });
            }
            else
            {
                callback();
            }
        }

        function watchContainerResize()
        {
            $scope.$watch(
                function ()
                {
                    return vm.container.width();
                },
                function (newValue, oldValue)
                {
                    if ( newValue !== oldValue )
                    {
                        reLayout();
                    }
                }
            );
        }

        function reLayout()
        {
            // Debounce for relayout
            if ( reLayoutTimeout )
            {
                $timeout.cancel(reLayoutTimeout);
            }

            reLayoutTimeout = $timeout(function ()
            {
                start();

                $scope.$broadcast('msMasonry:relayoutFinished');

            }, vm.options.reLayoutDebounce);

            // Start relayout
            function start()
            {
                vm.containerPos = vm.container[0].getBoundingClientRect();

                updateColumnOptions();

                $scope.$broadcast('msMasonry:relayoutStarted');

                vm.items = vm.container.find('ms-masonry-item');

                //initialize lastRowBottomArr
                var referenceArr = Array.apply(null, new Array(vm.columnCount)).map(function ()
                {
                    return 0;
                });

                // set item positions
                for ( var i = 0; i < vm.items.length; i++ )
                {
                    var item = vm.items[i],
                        xPos, yPos, column, refTop;

                    item = angular.element(item);

                    if ( item.scope() )
                    {
                        item.scope().$broadcast('msMasonryItem:startReLayout');
                    }

                    item.css({'width': vm.columnWidth});

                    if ( vm.options.respectItemOrder )
                    {
                        column = i % vm.columnCount;
                        refTop = referenceArr[column];
                    }
                    else
                    {
                        refTop = Math.min.apply(Math, referenceArr);
                        column = referenceArr.indexOf(refTop);
                    }

                    referenceArr[column] = refTop + item[0].getBoundingClientRect().height;

                    xPos = Math.round(column * vm.columnWidth);
                    yPos = refTop;

                    item.css({'transform': 'translate3d(' + xPos + 'px,' + yPos + 'px,0px)'});
                    item.addClass('placed');

                    if ( item.scope() )
                    {
                        item.scope().$broadcast('msMasonryItem:finishReLayout');
                    }
                }
            }
        }

        function updateColumnOptions()
        {
            vm.columnCount = vm.options.columnCount;

            if ( $mdMedia('gt-md') )
            {
                vm.columnCount = vm.options.columnCount;
            }
            else if ( $mdMedia('md') )
            {
                vm.columnCount = (vm.columnCount > vm.options.responsive.md ? vm.options.responsive.md : vm.columnCount);
            }
            else if ( $mdMedia('sm') )
            {
                vm.columnCount = (vm.columnCount > vm.options.responsive.sm ? vm.options.responsive.sm : vm.columnCount);
            }
            else
            {
                vm.columnCount = vm.options.responsive.xs;
            }

            vm.columnWidth = vm.containerPos.width / vm.columnCount;

        }
    }

    /** @ngInject */
    function msMasonry($timeout)
    {
        return {
            restrict  : 'AEC',
            controller: 'msMasonryController',
            compile   : compile
        };
        function compile(element, attributes)
        {
            return {
                pre : function preLink(scope, iElement, iAttrs, controller)
                {
                    controller.options = angular.fromJson(attributes.options || '{}');
                    controller.container = element;
                },
                post: function postLink(scope, iElement, iAttrs, controller)
                {
                    $timeout(function ()
                    {
                        controller.initialize();
                    });
                }
            };
        }
    }

    /** @ngInject */
    function msMasonryItem()
    {
        return {
            restrict: 'AEC',
            require : '^msMasonry',
            priority: 1,
            link    : link
        };

        function link(scope, element, attributes, controller)
        {
            controller.waitImagesLoaded(element, function ()
            {
                controller.reLayout();

            });

            scope.$on('msMasonryItem:finishReLayout', function ()
            {
                scope.$watch(function ()
                {
                    return element.height();
                }, function (newVal, oldVal)
                {
                    if ( newVal !== oldVal )
                    {
                        controller.reLayout();
                    }
                });
            });

            element.on('$destroy', function ()
            {
                controller.reLayout();
            });
        }
    }
})();
(function ()
{
    'use strict';

    msInfoBarDirective.$inject = ["$document"];
    angular
        .module('app.core')
        .directive('msInfoBar', msInfoBarDirective);

    /** @ngInject */
    function msInfoBarDirective($document)
    {
        return {
            restrict   : 'E',
            scope      : {},
            transclude : true,
            templateUrl: 'app/core/directives/ms-info-bar/ms-info-bar.html',
            link       : function (scope, iElement)
            {
                var body = $document.find('body'),
                    bodyClass = 'ms-info-bar-active';

                // Add body class
                body.addClass(bodyClass);

                /**
                 * Remove the info bar
                 */
                function removeInfoBar()
                {
                    body.removeClass(bodyClass);
                    iElement.remove();
                    scope.$destroy();
                }

                // Expose functions
                scope.removeInfoBar = removeInfoBar;
            }
        };
    }
})();
(function ()
{
    'use strict';

    angular
        .module('app.core')
        .controller('MsFormWizardController', MsFormWizardController)
        .directive('msFormWizard', msFormWizardDirective)
        .directive('msFormWizardForm', msFormWizardFormDirective);

    /** @ngInject */
    function MsFormWizardController()
    {
        var vm = this;

        // Data
        vm.forms = [];
        vm.selectedIndex = 0;

        // Methods
        vm.registerForm = registerForm;

        vm.previousStep = previousStep;
        vm.nextStep = nextStep;
        vm.firstStep = firstStep;
        vm.lastStep = lastStep;

        vm.totalSteps = totalSteps;
        vm.isFirstStep = isFirstStep;
        vm.isLastStep = isLastStep;

        vm.currentStepInvalid = currentStepInvalid;
        vm.previousStepInvalid = previousStepInvalid;
        vm.formsIncomplete = formsIncomplete;
        vm.resetForm = resetForm;

        //////////

        /**
         * Register form
         *
         * @param form
         */
        function registerForm(form)
        {
            vm.forms.push(form);
        }

        /**
         * Go to previous step
         */
        function previousStep()
        {
            if ( isFirstStep() )
            {
                return;
            }

            vm.selectedIndex--;
        }

        /**
         * Go to next step
         */
        function nextStep()
        {
            if ( isLastStep() )
            {
                return;
            }

            vm.selectedIndex++;
        }

        /**
         * Go to first step
         */
        function firstStep()
        {
            vm.selectedIndex = 0;
        }

        /**
         * Go to last step
         */
        function lastStep()
        {
            vm.selectedIndex = totalSteps() - 1;
        }

        /**
         * Return total steps
         *
         * @returns {int}
         */
        function totalSteps()
        {
            return vm.forms.length;
        }

        /**
         * Is first step?
         *
         * @returns {boolean}
         */
        function isFirstStep()
        {
            return vm.selectedIndex === 0;
        }

        /**
         * Is last step?
         *
         * @returns {boolean}
         */
        function isLastStep()
        {
            return vm.selectedIndex === totalSteps() - 1;
        }

        /**
         * Is current step invalid?
         *
         * @returns {boolean}
         */
        function currentStepInvalid()
        {
            return angular.isDefined(vm.forms[vm.selectedIndex]) && vm.forms[vm.selectedIndex].$invalid;
        }

        /**
         * Is previous step invalid?
         *
         * @returns {boolean}
         */
        function previousStepInvalid()
        {
            return vm.selectedIndex > 0 && angular.isDefined(vm.forms[vm.selectedIndex - 1]) && vm.forms[vm.selectedIndex - 1].$invalid;
        }

        /**
         * Check if there is any incomplete forms
         *
         * @returns {boolean}
         */
        function formsIncomplete()
        {
            for ( var x = 0; x < vm.forms.length; x++ )
            {
                if ( vm.forms[x].$invalid )
                {
                    return true;
                }
            }

            return false;
        }

        /**
         * Reset form
         */
        function resetForm()
        {
            // Go back to the first step
            vm.selectedIndex = 0;

            // Make sure all the forms are back in the $pristine & $untouched status
            for ( var x = 0; x < vm.forms.length; x++ )
            {
                vm.forms[x].$setPristine();
                vm.forms[x].$setUntouched();
            }
        }
    }

    /** @ngInject */
    function msFormWizardDirective()
    {
        return {
            restrict  : 'E',
            scope     : true,
            controller: 'MsFormWizardController as msWizard',
            compile   : function (tElement)
            {
                tElement.addClass('ms-form-wizard');

                return function postLink()
                {

                };
            }
        };
    }

    /** @ngInject */
    function msFormWizardFormDirective()
    {
        return {
            restrict: 'A',
            require : ['form', '^msFormWizard'],
            compile : function (tElement)
            {
                tElement.addClass('ms-form-wizard-form');

                return function postLink(scope, iElement, iAttrs, ctrls)
                {
                    var formCtrl = ctrls[0],
                        MsFormWizardCtrl = ctrls[1];

                    MsFormWizardCtrl.registerForm(formCtrl);
                };
            }
        };
    }

})();
(function ()
{
    'use strict';

    msDatepickerFix.$inject = ["msDatepickerFixConfig"];
    angular
        .module('app.core')
        .provider('msDatepickerFixConfig', msDatepickerFixConfigProvider)
        .directive('msDatepickerFix', msDatepickerFix);

    /** @ngInject */
    function msDatepickerFixConfigProvider()
    {
        var service = this;

        // Default configuration
        var defaultConfig = {
            // To view
            formatter: function (val)
            {
                if ( !val )
                {
                    return '';
                }

                return val === '' ? val : new Date(val);
            },
            // To model
            parser   : function (val)
            {
                if ( !val )
                {
                    return '';
                }

                return moment(val).add(moment(val).utcOffset(), 'm').toDate();
            }
        };

        // Methods
        service.config = config;

        //////////

        /**
         * Extend default configuration with the given one
         *
         * @param configuration
         */
        function config(configuration)
        {
            defaultConfig = angular.extend({}, defaultConfig, configuration);
        }

        /**
         * Service
         */
        service.$get = function ()
        {
            return defaultConfig;
        };
    }

    /** @ngInject */
    function msDatepickerFix(msDatepickerFixConfig)
    {
        return {
            require : 'ngModel',
            priority: 1,
            link    : function (scope, elem, attrs, ngModel)
            {
                ngModel.$formatters.push(msDatepickerFixConfig.formatter); // to view
                ngModel.$parsers.push(msDatepickerFixConfig.parser); // to model
            }
        };
    }
})();
(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('msCard', msCardDirective);

    /** @ngInject */
    function msCardDirective()
    {
        return {
            restrict: 'E',
            scope   : {
                templatePath: '=template',
                card        : '=ngModel',
                vm          : '=viewModel'
            },
            template: '<div class="ms-card-content-wrapper" ng-include="templatePath" onload="cardTemplateLoaded()"></div>',
            compile : function (tElement)
            {
                // Add class
                tElement.addClass('ms-card');

                return function postLink(scope, iElement)
                {
                    // Methods
                    scope.cardTemplateLoaded = cardTemplateLoaded;

                    //////////

                    /**
                     * Emit cardTemplateLoaded event
                     */
                    function cardTemplateLoaded()
                    {
                        scope.$emit('msCard::cardTemplateLoaded', iElement);
                    }
                };
            }
        };
    }
})();
(function ()
{
    'use strict';

    config.$inject = ["$stateProvider", "$translatePartialLoaderProvider", "msApiProvider", "msNavigationServiceProvider"];
    angular
        .module('app.dashboard', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msApiProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider
            .state('app.dashboard', {
                url    : '/dashboard',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/dashboard/dashboard.html',
                        controller : 'DashboardController as vm'
                    }
                },
                requiredLogin : true
            });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/dashboard');



        msNavigationServiceProvider.saveItem('dashboard', {
            title    : 'Dashboard',
            icon     : 'icon-tile-four',
            state    : 'app.dashboard',

            translate: 'DASHBOARD.DASHBOARD_NAV',
            weight   : 1
        });
    }
})();
(function ()
{
    'use strict';

    controller.$inject = ["$scope", "$interval", "$mdSidenav", "$translate", "store"];
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

(function ()
{
    'use strict';

    config.$inject = ["$stateProvider", "$translatePartialLoaderProvider", "msNavigationServiceProvider", "msApiProvider"];
    angular
        .module('app.auth', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msNavigationServiceProvider, msApiProvider)
    {
        // State
        $stateProvider.state('app.auth', {
            url      : '/auth',
            views    : {
                'main@' : {
                    templateUrl: 'app/core/layouts/content-only.html',
                    controller : 'MainController as vMain'
                },
                'content@app.auth': {
                    templateUrl: 'app/main/auth/auth.html',
                    controller : 'AuthController as vm'
                }
            },
            bodyClass: 'login'
        });

        // Translation
        $translatePartialLoaderProvider.addPart('app/main/auth');
        var uri = '/sessions';
        msApiProvider.register('auth.login', [uri,  {  } , {
              session :{
                method : 'POST'
              }
        }]);
        
    }   

})();
(function ()
{
    'use strict';

    controller.$inject = ["$window", "$document", "$rootScope", "$scope", "$log", "msApi", "store", "$state", "$mdToast", "$translate", "$filter", "ngProgressLite", "$timeout"];
    angular
        .module('app.auth')
        .controller('AuthController', controller);

    /** @ngInject */
    function controller($window, $document, $rootScope, $scope, $log, msApi, store, $state,  $mdToast, $translate, $filter, ngProgressLite, $timeout)
    {
        // Data
        var vm = this;

        vm.$window = $window;

        vm.$document = $document;

        vm.$rootScope = $rootScope;

        vm.$scope = $scope;

        vm.$log = $log;

        vm.msApi = msApi;

        vm.store = store;

        vm.$state = $state;

        vm.$$submit = false;

        vm.$mdToast = $mdToast;

        vm.$translate =  $filter('translate');

        vm.$filter = $filter;

        vm.$timeout =$timeout;

        vm.ngProgressLite = ngProgressLite;
        // Methods
    }

    /**
     * LOGIN ACTION
     */
    controller.prototype.login = function(){
        var self = this;
        var param = self.form
        if(self.$$submit) return;
        self.$$submit = true;
        self.ngProgressLite.start();
        self.msApi.request('auth.login@session', param,
            function (response)
            {
                self.$$submit = false;
                self.store.set('user', JSON.parse(angular.toJson(response)));
                self.$log.debug(JSON.parse(angular.toJson(response)));
                self.ngProgressLite.done();
                self.$state.go('app.dashboard');
                
            },
            // ERROR
            function (error)
            {
                self.$$submit = false;
                // self.$log.debug(error);
                // var msg = self.$translate('LOGIN.ERRORS.INTERNAL');
                // if(error.status === 401){
                //      var msg = self.$translate('LOGIN.ERRORS.' + error.data.name);
                // }

                // var toast = self.$mdToast.simple()
                //     .textContent(msg)
                //     .action(self.$translate('LOGIN.DISMISS'))
                //     .highlightAction(true)
                //     .position('top right');
                    
                // self.$mdToast.show(toast);
                self.$timeout(function ()
                {
                    self.ngProgressLite.done();
                })
            }
        );
    }
})();
(function ()
{
    'use strict';

    fuseThemingService.$inject = ["store", "$log", "$mdTheming"];
    angular
        .module('app.core')
        .service('fuseTheming', fuseThemingService);

    /** @ngInject */
    function fuseThemingService(store, $log, $mdTheming)
    {
        var service = {
            getRegisteredPalettes: getRegisteredPalettes,
            getRegisteredThemes  : getRegisteredThemes,
            setActiveTheme       : setActiveTheme,
            setThemesList        : setThemesList,
            themes               : {
                list  : {},
                active: {
                    'name' : '',
                    'theme': {}
                }
            }
        };

        return service;

        //////////

        /**
         * Get registered palettes
         *
         * @returns {*}
         */
        function getRegisteredPalettes()
        {
            return $mdTheming.PALETTES;
        }

        /**
         * Get registered themes
         *
         * @returns {*}
         */
        function getRegisteredThemes()
        {
            return $mdTheming.THEMES;
        }

        /**
         * Set active theme
         *
         * @param themeName
         */
        function setActiveTheme(themeName)
        {
            // If theme does not exist, fallback to the default theme
            if ( angular.isUndefined(service.themes.list[themeName]) )
            {
                // If there is no theme called "default"...
                if ( angular.isUndefined(service.themes.list.default) )
                {
                    $log.error('You must have at least one theme named "default"');
                    return;
                }

                $log.warn('The theme "' + themeName + '" does not exist! Falling back to the "default" theme.');

                // Otherwise set theme to default theme
                service.themes.active.name = 'default';
                service.themes.active.theme = service.themes.list.default;
                store.set('selectedTheme', service.themes.active.name);

                return;
            }

            service.themes.active.name = themeName;
            service.themes.active.theme = service.themes.list[themeName];
            store.set('selectedTheme', themeName);
        }

        /**
         * Set available themes list
         *
         * @param themeList
         */
        function setThemesList(themeList)
        {
            service.themes.list = themeList;
        }
    }
})();

(function ()
{
    'use strict';

    config.$inject = ["$mdThemingProvider", "fusePalettes", "fuseThemes"];
    angular
        .module('app.core')
        .config(config);

    /** @ngInject */
    function config($mdThemingProvider, fusePalettes, fuseThemes)
    {
        // Inject Cookies Service
        var store;
        angular.injector(['angular-storage']).invoke([
            'store', function (_store)
            {
                store = _store;
            }
        ]);

        // // Check if custom theme exist in cookies
        var customTheme = store.get('customTheme');
        if ( customTheme )
        {
            fuseThemes['custom'] = customTheme;
        }

        // $mdThemingProvider.alwaysWatchTheme(true);

        // Define custom palettes
        angular.forEach(fusePalettes, function (palette)
        {
            $mdThemingProvider.definePalette(palette.name, palette.options);
        });

        // Register custom themes
        angular.forEach(fuseThemes, function (theme, themeName)
        {
            $mdThemingProvider.theme(themeName)
                .primaryPalette(theme.primary.name, theme.primary.hues)
                .accentPalette(theme.accent.name, theme.accent.hues)
                .warnPalette(theme.warn.name, theme.warn.hues)
                .backgroundPalette(theme.background.name, theme.background.hues);
        });
    }

})();
(function ()
{
    'use strict';

    var fuseThemes = {
        default  : {
            primary   : {
                name: 'fuse-paleblue',
                hues: {
                    'default': '700',
                    'hue-1'  : '500',
                    'hue-2'  : '600',
                    'hue-3'  : '400'
                }
            },
            accent    : {
                name: 'light-blue',
                hues: {
                    'default': '600',
                    'hue-1'  : '400',
                    'hue-2'  : '700',
                    'hue-3'  : 'A100'
                }
            },
            warn      : {
                name: 'red'
            },
            background: {
                name: 'grey',
                hues: {
                    'default': 'A100',
                    'hue-1'  : 'A100',
                    'hue-2'  : '100',
                    'hue-3'  : '300'
                }
            }
        },
        'pinkTheme': {
            primary   : {
                name: 'blue-grey',
                hues: {
                    'default': '800',
                    'hue-1'  : '600',
                    'hue-2'  : '400',
                    'hue-3'  : 'A100'
                }
            },
            accent    : {
                name: 'pink',
                hues: {
                    'default': '400',
                    'hue-1'  : '300',
                    'hue-2'  : '600',
                    'hue-3'  : 'A100'
                }
            },
            warn      : {
                name: 'blue'
            },
            background: {
                name: 'grey',
                hues: {
                    'default': 'A100',
                    'hue-1'  : 'A100',
                    'hue-2'  : '100',
                    'hue-3'  : '300'
                }
            }
        },
        'tealTheme': {
            primary   : {
                name: 'fuse-blue',
                hues: {
                    'default': '900',
                    'hue-1'  : '600',
                    'hue-2'  : '500',
                    'hue-3'  : 'A100'
                }
            },
            accent    : {
                name: 'teal',
                hues: {
                    'default': '500',
                    'hue-1'  : '400',
                    'hue-2'  : '600',
                    'hue-3'  : 'A100'
                }
            },
            warn      : {
                name: 'deep-orange'
            },
            background: {
                name: 'grey',
                hues: {
                    'default': 'A100',
                    'hue-1'  : 'A100',
                    'hue-2'  : '100',
                    'hue-3'  : '300'
                }
            }
        }
    };

    angular
        .module('app.core')
        .constant('fuseThemes', fuseThemes);
})();
(function () {
    'use strict';

    var fusePalettes = [
        {
            name: 'fuse-blue',
            options: {
                '50': '#ebf1fa',
                '100': '#c2d4ef',
                '200': '#9ab8e5',
                '300': '#78a0dc',
                '400': '#5688d3',
                '500': '#3470ca',
                '600': '#2e62b1',
                '700': '#275498',
                '800': '#21467e',
                '900': '#1a3865',
                'A100': '#c2d4ef',
                'A200': '#9ab8e5',
                'A400': '#5688d3',
                'A700': '#275498',
                'contrastDefaultColor': 'light',
                'contrastDarkColors': '50 100 200 A100',
                'contrastStrongLightColors': '300 400'
            }
        },
        {
            name: 'fuse-paleblue',
            options: {
                '50': '#ececee',
                '100': '#c5c6cb',
                '200': '#9ea1a9',
                '300': '#7d818c',
                '400': '#5c616f',
                '500': '#3c4252',
                '600': '#353a48',
                '700': '#2d323e',
                '800': '#262933',
                '900': '#1e2129',
                'A100': '#c5c6cb',
                'A200': '#9ea1a9',
                'A400': '#5c616f',
                'A700': '#2d323e',
                'contrastDefaultColor': 'light',
                'contrastDarkColors': '50 100 200 A100',
                'contrastStrongLightColors': '300 400'
            }
        }
    ];

    angular
        .module('app.core')
        .constant('fusePalettes', fusePalettes);
})();
(function ()
{
    'use strict';

    fuseGeneratorService.$inject = ["store", "$log", "fuseTheming"];
    angular
        .module('app.core')
        .factory('fuseGenerator', fuseGeneratorService);

    /** @ngInject */
    function fuseGeneratorService(store, $log, fuseTheming)
    {
        // Storage for simplified themes object
        var themes = {};

        var service = {
            generate: generate,
            rgba    : rgba
        };

        return service;

        //////////

        /**
         * Generate less variables for each theme from theme's
         * palette by using material color naming conventions
         */
        function generate()
        {
            // Get registered themes and palettes and copy
            // them so we don't modify the original objects
            var registeredThemes = angular.copy(fuseTheming.getRegisteredThemes());
            var registeredPalettes = angular.copy(fuseTheming.getRegisteredPalettes());

            // First, create a simplified object that stores
            // all registered themes and their colors

            // Iterate through registered themes
            angular.forEach(registeredThemes, function (registeredTheme)
            {
                themes[registeredTheme.name] = {};

                // Iterate through color types (primary, accent, warn & background)
                angular.forEach(registeredTheme.colors, function (colorType, colorTypeName)
                {
                    themes[registeredTheme.name][colorTypeName] = {
                        'name'  : colorType.name,
                        'levels': {
                            'default': {
                                'color'    : rgba(registeredPalettes[colorType.name][colorType.hues.default].value),
                                'contrast1': rgba(registeredPalettes[colorType.name][colorType.hues.default].contrast, 1),
                                'contrast2': rgba(registeredPalettes[colorType.name][colorType.hues.default].contrast, 2),
                                'contrast3': rgba(registeredPalettes[colorType.name][colorType.hues.default].contrast, 3),
                                'contrast4': rgba(registeredPalettes[colorType.name][colorType.hues.default].contrast, 4)
                            },
                            'hue1'   : {
                                'color'    : rgba(registeredPalettes[colorType.name][colorType.hues['hue-1']].value),
                                'contrast1': rgba(registeredPalettes[colorType.name][colorType.hues['hue-1']].contrast, 1),
                                'contrast2': rgba(registeredPalettes[colorType.name][colorType.hues['hue-1']].contrast, 2),
                                'contrast3': rgba(registeredPalettes[colorType.name][colorType.hues['hue-1']].contrast, 3),
                                'contrast4': rgba(registeredPalettes[colorType.name][colorType.hues['hue-1']].contrast, 4)
                            },
                            'hue2'   : {
                                'color'    : rgba(registeredPalettes[colorType.name][colorType.hues['hue-2']].value),
                                'contrast1': rgba(registeredPalettes[colorType.name][colorType.hues['hue-2']].contrast, 1),
                                'contrast2': rgba(registeredPalettes[colorType.name][colorType.hues['hue-2']].contrast, 2),
                                'contrast3': rgba(registeredPalettes[colorType.name][colorType.hues['hue-2']].contrast, 3),
                                'contrast4': rgba(registeredPalettes[colorType.name][colorType.hues['hue-2']].contrast, 4)
                            },
                            'hue3'   : {
                                'color'    : rgba(registeredPalettes[colorType.name][colorType.hues['hue-3']].value),
                                'contrast1': rgba(registeredPalettes[colorType.name][colorType.hues['hue-3']].contrast, 1),
                                'contrast2': rgba(registeredPalettes[colorType.name][colorType.hues['hue-3']].contrast, 2),
                                'contrast3': rgba(registeredPalettes[colorType.name][colorType.hues['hue-3']].contrast, 3),
                                'contrast4': rgba(registeredPalettes[colorType.name][colorType.hues['hue-3']].contrast, 4)
                            }
                        }
                    };
                });
            });

            // Process themes one more time and then store them in the service for external use
            processAndStoreThemes(themes);

            // Iterate through simplified themes
            // object and create style variables
            var styleVars = {};

            // Iterate through registered themes
            angular.forEach(themes, function (theme, themeName)
            {
                styleVars = {};
                styleVars['@themeName'] = themeName;

                // Iterate through color types (primary, accent, warn & background)
                angular.forEach(theme, function (colorTypes, colorTypeName)
                {
                    // Iterate through color levels (default, hue1, hue2 & hue3)
                    angular.forEach(colorTypes.levels, function (colors, colorLevelName)
                    {
                        // Iterate through color name (color, contrast1, contrast2, contrast3 & contrast4)
                        angular.forEach(colors, function (color, colorName)
                        {
                            styleVars['@' + colorTypeName + ucfirst(colorLevelName) + ucfirst(colorName)] = color;
                        });
                    });
                });

                // Render styles
                render(styleVars);
            });
        }

        // ---------------------------
        //  INTERNAL HELPER FUNCTIONS
        // ---------------------------

        /**
         * Process and store themes for global use
         *
         * @param _themes
         */
        function processAndStoreThemes(_themes)
        {
            // Here we will go through every registered theme one more time
            // and try to simplify their objects as much as possible for
            // easier access to their properties.
            var themes = angular.copy(_themes);

            // Iterate through themes
            angular.forEach(themes, function (theme)
            {
                // Iterate through color types (primary, accent, warn & background)
                angular.forEach(theme, function (colorType, colorTypeName)
                {
                    theme[colorTypeName] = colorType.levels;
                    theme[colorTypeName].color = colorType.levels.default.color;
                    theme[colorTypeName].contrast1 = colorType.levels.default.contrast1;
                    theme[colorTypeName].contrast2 = colorType.levels.default.contrast2;
                    theme[colorTypeName].contrast3 = colorType.levels.default.contrast3;
                    theme[colorTypeName].contrast4 = colorType.levels.default.contrast4;
                    delete theme[colorTypeName].default;
                });
            });

            // Store themes and set selected theme for the first time
            fuseTheming.setThemesList(themes);
            fuseTheming.setActiveTheme('default');
            // // Remember selected theme.
            // var selectedTheme = $cookies.get('selectedTheme');

            // if ( selectedTheme )
            // {
            //     fuseTheming.setActiveTheme(selectedTheme);
            // }
            // else
            // {
            //     fuseTheming.setActiveTheme('default');
            // }
        }


        /**
         * Render css files
         *
         * @param styleVars
         */
        function render(styleVars)
        {
            var cssTemplate = '/* Content hack because they wont fix */\n/* https://github.com/angular/material/pull/8067 */\n[md-theme="@themeName"] md-content.md-hue-1,\nmd-content.md-@themeName-theme.md-hue-1 {\n    color: @backgroundHue1Contrast1;\n    background-color: @backgroundHue1Color;\n}\n\n[md-theme="@themeName"] md-content.md-hue-2,\nmd-content.md-@themeName-theme.md-hue-2 {\n    color: @backgroundHue2Contrast1;\n    background-color: @backgroundHue2Color;\n}\n\n[md-theme="@themeName"] md-content.md-hue-3,\n md-content.md-@themeName-theme.md-hue-3 {\n    color: @backgroundHue3Contrast1;\n    background-color: @backgroundHue3Color;\n}\n\n/* Text Colors */\n[md-theme="@themeName"] a {\n    color: @accentDefaultColor;\n}\n\n[md-theme="@themeName"] .secondary-text,\n[md-theme="@themeName"] .icon {\n    color: @backgroundDefaultContrast2;\n}\n\n[md-theme="@themeName"] .hint-text,\n[md-theme="@themeName"] .disabled-text {\n    color: @backgroundDefaultContrast3;\n}\n\n[md-theme="@themeName"] .fade-text,\n[md-theme="@themeName"] .divider {\n    color: @backgroundDefaultContrast4;\n}\n\n/* Primary */\n[md-theme="@themeName"] .md-primary-bg {\n    background-color: @primaryDefaultColor;\n    color: @primaryDefaultContrast1;\n}\n\n[md-theme="@themeName"] .md-primary-bg .secondary-text,\n[md-theme="@themeName"] .md-primary-bg .icon {\n    color: @primaryDefaultContrast2;\n}\n\n[md-theme="@themeName"] .md-primary-bg .hint-text,\n[md-theme="@themeName"] .md-primary-bg .disabled-text {\n    color: @primaryDefaultContrast3;\n}\n\n[md-theme="@themeName"] .md-primary-bg .fade-text,\n[md-theme="@themeName"] .md-primary-bg .divider {\n    color: @primaryDefaultContrast4;\n}\n\n/* Primary, Hue-1 */\n[md-theme="@themeName"] .md-primary-bg.md-hue-1 {\n    background-color: @primaryHue1Color;\n    color: @primaryHue1Contrast1;\n}\n\n[md-theme="@themeName"] .md-primary-bg.md-hue-1 .secondary-text,\n[md-theme="@themeName"] .md-primary-bg.md-hue-1 .icon {\n    color: @primaryHue1Contrast2;\n}\n\n[md-theme="@themeName"] .md-primary-bg.md-hue-1 .hint-text,\n[md-theme="@themeName"] .md-primary-bg.md-hue-1 .disabled-text {\n    color: @primaryHue1Contrast3;\n}\n\n[md-theme="@themeName"] .md-primary-bg.md-hue-1 .fade-text,\n[md-theme="@themeName"] .md-primary-bg.md-hue-1 .divider {\n    color: @primaryHue1Contrast4;\n}\n\n/* Primary, Hue-2 */\n[md-theme="@themeName"] .md-primary-bg.md-hue-2 {\n    background-color: @primaryHue2Color;\n    color: @primaryHue2Contrast1;\n}\n\n[md-theme="@themeName"] .md-primary-bg.md-hue-2 .secondary-text,\n[md-theme="@themeName"] .md-primary-bg.md-hue-2 .icon {\n    color: @primaryHue2Contrast2;\n}\n\n[md-theme="@themeName"] .md-primary-bg.md-hue-2 .hint-text,\n[md-theme="@themeName"] .md-primary-bg.md-hue-2 .disabled-text {\n    color: @primaryHue2Contrast3;\n}\n\n[md-theme="@themeName"] .md-primary-bg.md-hue-2 .fade-text,\n[md-theme="@themeName"] .md-primary-bg.md-hue-2 .divider {\n    color: @primaryHue2Contrast4;\n}\n\n/* Primary, Hue-3 */\n[md-theme="@themeName"] .md-primary-bg.md-hue-3 {\n    background-color: @primaryHue3Color;\n    color: @primaryHue3Contrast1;\n}\n\n[md-theme="@themeName"] .md-primary-bg.md-hue-3 .secondary-text,\n[md-theme="@themeName"] .md-primary-bg.md-hue-3 .icon {\n    color: @primaryHue3Contrast1;\n}\n\n[md-theme="@themeName"] .md-primary-bg.md-hue-3 .hint-text,\n[md-theme="@themeName"] .md-primary-bg.md-hue-3 .disabled-text {\n    color: @primaryHue3Contrast3;\n}\n\n[md-theme="@themeName"] .md-primary-bg.md-hue-3 .fade-text,\n[md-theme="@themeName"] .md-primary-bg.md-hue-3 .divider {\n    color: @primaryHue3Contrast4;\n}\n\n/* Primary foreground */\n[md-theme="@themeName"] .md-primary-fg {\n    color: @primaryDefaultColor !important;\n}\n\n/* Primary foreground, Hue-1 */\n[md-theme="@themeName"] .md-primary-fg.md-hue-1 {\n    color: @primaryHue1Color !important;\n}\n\n/* Primary foreground, Hue-2 */\n[md-theme="@themeName"] .md-primary-fg.md-hue-2 {\n    color: @primaryHue2Color !important;\n}\n\n/* Primary foreground, Hue-3 */\n[md-theme="@themeName"] .md-primary-fg.md-hue-3 {\n    color: @primaryHue3Color !important;\n}\n\n/* Accent */\n[md-theme="@themeName"] .md-accent-bg {\n    background-color: @accentDefaultColor;\n    color: @accentDefaultContrast1;\n}\n\n[md-theme="@themeName"] .md-accent-bg .secondary-text,\n[md-theme="@themeName"] .md-accent-bg .icon {\n    color: @accentDefaultContrast2;\n}\n\n[md-theme="@themeName"] .md-accent-bg .hint-text,\n[md-theme="@themeName"] .md-accent-bg .disabled-text {\n    color: @accentDefaultContrast3;\n}\n\n[md-theme="@themeName"] .md-accent-bg .fade-text,\n[md-theme="@themeName"] .md-accent-bg .divider {\n    color: @accentDefaultContrast4;\n}\n\n/* Accent, Hue-1 */\n[md-theme="@themeName"] .md-accent-bg.md-hue-1 {\n    background-color: @accentHue1Color;\n    color: @accentHue1Contrast1;\n}\n\n[md-theme="@themeName"] .md-accent-bg.md-hue-1 .secondary-text,\n[md-theme="@themeName"] .md-accent-bg.md-hue-1 .icon {\n    color: @accentHue1Contrast2;\n}\n\n[md-theme="@themeName"] .md-accent-bg.md-hue-1 .hint-text,\n[md-theme="@themeName"] .md-accent-bg.md-hue-1 .disabled-text {\n    color: @accentHue1Contrast3;\n}\n\n[md-theme="@themeName"] .md-accent-bg.md-hue-1 .fade-text,\n[md-theme="@themeName"] .md-accent-bg.md-hue-1 .divider {\n    color: @accentHue1Contrast4;\n}\n\n/* Accent, Hue-2 */\n[md-theme="@themeName"] .md-accent-bg.md-hue-2 {\n    background-color: @accentHue2Color;\n    color: @accentHue2Contrast1;\n}\n\n[md-theme="@themeName"] .md-accent-bg.md-hue-2 .secondary-text,\n[md-theme="@themeName"] .md-accent-bg.md-hue-2 .icon {\n    color: @accentHue2Contrast2;\n}\n\n[md-theme="@themeName"] .md-accent-bg.md-hue-2 .hint-text,\n[md-theme="@themeName"] .md-accent-bg.md-hue-2 .disabled-text {\n    color: @accentHue2Contrast3;\n}\n\n[md-theme="@themeName"] .md-accent-bg.md-hue-2 .fade-text,\n[md-theme="@themeName"] .md-accent-bg.md-hue-2 .divider {\n    color: @accentHue2Contrast4;\n}\n\n/* Accent, Hue-3 */\n[md-theme="@themeName"] .md-accent-bg.md-hue-3 {\n    background-color: @accentHue3Color;\n    color: @accentHue3Contrast1;\n}\n\n[md-theme="@themeName"] .md-accent-bg.md-hue-3 .secondary-text,\n[md-theme="@themeName"] .md-accent-bg.md-hue-3 .icon {\n    color: @accentHue3Contrast1;\n}\n\n[md-theme="@themeName"] .md-accent-bg.md-hue-3 .hint-text,\n[md-theme="@themeName"] .md-accent-bg.md-hue-3 .disabled-text {\n    color: @accentHue3Contrast3;\n}\n\n[md-theme="@themeName"] .md-accent-bg.md-hue-3 .fade-text,\n[md-theme="@themeName"] .md-accent-bg.md-hue-3 .divider {\n    color: @accentHue3Contrast4;\n}\n\n/* Accent foreground */\n[md-theme="@themeName"] .md-accent-fg {\n    color: @accentDefaultColor !important;\n}\n\n/* Accent foreground, Hue-1 */\n[md-theme="@themeName"] .md-accent-fg.md-hue-1 {\n    color: @accentHue1Color !important;\n}\n\n/* Accent foreground, Hue-2 */\n[md-theme="@themeName"] .md-accent-fg.md-hue-2 {\n    color: @accentHue2Color !important;\n}\n\n/* Accent foreground, Hue-3 */\n[md-theme="@themeName"] .md-accent-fg.md-hue-3 {\n    color: @accentHue3Color !important;\n}\n\n/* Warn */\n[md-theme="@themeName"] .md-warn-bg {\n    background-color: @warnDefaultColor;\n    color: @warnDefaultContrast1;\n}\n\n[md-theme="@themeName"] .md-warn-bg .secondary-text,\n[md-theme="@themeName"] .md-warn-bg .icon {\n    color: @warnDefaultContrast2;\n}\n\n[md-theme="@themeName"] .md-warn-bg .hint-text,\n[md-theme="@themeName"] .md-warn-bg .disabled-text {\n    color: @warnDefaultContrast3;\n}\n\n[md-theme="@themeName"] .md-warn-bg .fade-text,\n[md-theme="@themeName"] .md-warn-bg .divider {\n    color: @warnDefaultContrast4;\n}\n\n/* Warn, Hue-1 */\n[md-theme="@themeName"] .md-warn-bg.md-hue-1 {\n    background-color: @warnHue1Color;\n    color: @warnHue1Contrast1;\n}\n\n[md-theme="@themeName"] .md-warn-bg.md-hue-1 .secondary-text,\n[md-theme="@themeName"] .md-warn-bg.md-hue-1 .icon {\n    color: @warnHue1Contrast2;\n}\n\n[md-theme="@themeName"] .md-warn-bg.md-hue-1 .hint-text,\n[md-theme="@themeName"] .md-warn-bg.md-hue-1 .disabled-text {\n    color: @warnHue1Contrast3;\n}\n\n[md-theme="@themeName"] .md-warn-bg.md-hue-1 .fade-text,\n[md-theme="@themeName"] .md-warn-bg.md-hue-1 .divider {\n    color: @warnHue1Contrast4;\n}\n\n/* Warn, Hue-2 */\n[md-theme="@themeName"] .md-warn-bg.md-hue-2 {\n    background-color: @warnHue2Color;\n    color: @warnHue2Contrast1;\n}\n\n[md-theme="@themeName"] .md-warn-bg.md-hue-2 .secondary-text,\n[md-theme="@themeName"] .md-warn-bg.md-hue-2 .icon {\n    color: @warnHue2Contrast2;\n}\n\n[md-theme="@themeName"] .md-warn-bg.md-hue-2 .hint-text,\n[md-theme="@themeName"] .md-warn-bg.md-hue-2 .disabled-text {\n    color: @warnHue2Contrast3;\n}\n\n[md-theme="@themeName"] .md-warn-bg.md-hue-2 .fade-text,\n[md-theme="@themeName"] .md-warn-bg.md-hue-2 .divider {\n    color: @warnHue2Contrast4;\n}\n\n/* Warn, Hue-3 */\n[md-theme="@themeName"] .md-warn-bg.md-hue-3 {\n    background-color: @warnHue3Color;\n    color: @warnHue3Contrast1;\n}\n\n[md-theme="@themeName"] .md-warn-bg.md-hue-3 .secondary-text,\n[md-theme="@themeName"] .md-warn-bg.md-hue-3 .icon {\n    color: @warnHue3Contrast1;\n}\n\n[md-theme="@themeName"] .md-warn-bg.md-hue-3 .hint-text,\n[md-theme="@themeName"] .md-warn-bg.md-hue-3 .disabled-text {\n    color: @warnHue3Contrast3;\n}\n\n[md-theme="@themeName"] .md-warn-bg.md-hue-3 .fade-text,\n[md-theme="@themeName"] .md-warn-bg.md-hue-3 .divider {\n    color: @warnHue3Contrast4;\n}\n\n/* Warn foreground */\n[md-theme="@themeName"] .md-warn-fg {\n    color: @warnDefaultColor !important;\n}\n\n/* Warn foreground, Hue-1 */\n[md-theme="@themeName"] .md-warn-fg.md-hue-1 {\n    color: @warnHue1Color !important;\n}\n\n/* Warn foreground, Hue-2 */\n[md-theme="@themeName"] .md-warn-fg.md-hue-2 {\n    color: @warnHue2Color !important;\n}\n\n/* Warn foreground, Hue-3 */\n[md-theme="@themeName"] .md-warn-fg.md-hue-3 {\n    color: @warnHue3Color !important;\n}\n\n/* Background */\n[md-theme="@themeName"] .md-background-bg {\n    background-color: @backgroundDefaultColor;\n    color: @backgroundDefaultContrast1;\n}\n\n[md-theme="@themeName"] .md-background-bg .secondary-text,\n[md-theme="@themeName"] .md-background-bg .icon {\n    color: @backgroundDefaultContrast2;\n}\n\n[md-theme="@themeName"] .md-background-bg .hint-text,\n[md-theme="@themeName"] .md-background-bg .disabled-text {\n    color: @backgroundDefaultContrast3;\n}\n\n[md-theme="@themeName"] .md-background-bg .fade-text,\n[md-theme="@themeName"] .md-background-bg .divider {\n    color: @backgroundDefaultContrast4;\n}\n\n/* Background, Hue-1 */\n[md-theme="@themeName"] .md-background-bg.md-hue-1 {\n    background-color: @backgroundHue1Color;\n    color: @backgroundHue1Contrast1;\n}\n\n[md-theme="@themeName"] .md-background-bg.md-hue-1 .secondary-text,\n[md-theme="@themeName"] .md-background-bg.md-hue-1 .icon {\n    color: @backgroundHue1Contrast2;\n}\n\n[md-theme="@themeName"] .md-background-bg.md-hue-1 .hint-text,\n[md-theme="@themeName"] .md-background-bg.md-hue-1 .disabled-text {\n    color: @backgroundHue1Contrast3;\n}\n\n[md-theme="@themeName"] .md-background-bg.md-hue-1 .fade-text,\n[md-theme="@themeName"] .md-background-bg.md-hue-1 .divider {\n    color: @backgroundHue1Contrast4;\n}\n\n/* Background, Hue-2 */\n[md-theme="@themeName"] .md-background-bg.md-hue-2 {\n    background-color: @backgroundHue2Color;\n    color: @backgroundHue2Contrast1;\n}\n\n[md-theme="@themeName"] .md-background-bg.md-hue-2 .secondary-text,\n[md-theme="@themeName"] .md-background-bg.md-hue-2 .icon {\n    color: @backgroundHue2Contrast2;\n}\n\n[md-theme="@themeName"] .md-background-bg.md-hue-2 .hint-text,\n[md-theme="@themeName"] .md-background-bg.md-hue-2 .disabled-text {\n    color: @backgroundHue2Contrast3;\n}\n\n[md-theme="@themeName"] .md-background-bg.md-hue-2 .fade-text,\n[md-theme="@themeName"] .md-background-bg.md-hue-2 .divider {\n    color: @backgroundHue2Contrast4;\n}\n\n/* Background, Hue-3 */\n[md-theme="@themeName"] .md-background-bg.md-hue-3 {\n    background-color: @backgroundHue3Color;\n    color: @backgroundHue3Contrast1;\n}\n\n[md-theme="@themeName"] .md-background-bg.md-hue-3 .secondary-text,\n[md-theme="@themeName"] .md-background-bg.md-hue-3 .icon {\n    color: @backgroundHue3Contrast1;\n}\n\n[md-theme="@themeName"] .md-background-bg.md-hue-3 .hint-text,\n[md-theme="@themeName"] .md-background-bg.md-hue-3 .disabled-text {\n    color: @backgroundHue3Contrast3;\n}\n\n[md-theme="@themeName"] .md-background-bg.md-hue-3 .fade-text,\n[md-theme="@themeName"] .md-background-bg.md-hue-3 .divider {\n    color: @backgroundHue3Contrast4;\n}\n\n/* Background foreground */\n[md-theme="@themeName"] .md-background-fg {\n    color: @backgroundDefaultColor !important;\n}\n\n/* Background foreground, Hue-1 */\n[md-theme="@themeName"] .md-background-fg.md-hue-1 {\n    color: @backgroundHue1Color !important;\n}\n\n/* Background foreground, Hue-2 */\n[md-theme="@themeName"] .md-background-fg.md-hue-2 {\n    color: @backgroundHue2Color !important;\n}\n\n/* Background foreground, Hue-3 */\n[md-theme="@themeName"] .md-background-fg.md-hue-3 {\n    color: @backgroundHue3Color !important;\n}';

            var regex = new RegExp(Object.keys(styleVars).join('|'), 'gi');
            var css = cssTemplate.replace(regex, function (matched)
            {
                return styleVars[matched];
            });

            var headEl = angular.element('head');
            var styleEl = angular.element('<style type="text/css"></style>');
            styleEl.html(css);
            headEl.append(styleEl);
        }

        /**
         * Convert color array to rgb/rgba
         * Also apply contrasts if needed
         *
         * @param color
         * @param _contrastLevel
         * @returns {string}
         */
        function rgba(color, _contrastLevel)
        {
            var contrastLevel = _contrastLevel || false;

            // Convert 255,255,255,0.XX to 255,255,255
            // According to Google's Material design specs, white primary
            // text must have opacity of 1 and we will fix that here
            // because Angular Material doesn't care about that spec
            if ( color.length === 4 && color[0] === 255 && color[1] === 255 && color[2] === 255 )
            {
                color.splice(3, 4);
            }

            // If contrast level provided, apply it to the current color
            if ( contrastLevel )
            {
                color = applyContrast(color, contrastLevel);
            }

            // Convert color array to color string (rgb/rgba)
            if ( color.length === 3 )
            {
                return 'rgb(' + color.join(',') + ')';
            }
            else if ( color.length === 4 )
            {
                return 'rgba(' + color.join(',') + ')';
            }
            else
            {
                $log.error('Invalid number of arguments supplied in the color array: ' + color.length + '\n' + 'The array must have 3 or 4 colors.');
            }
        }

        /**
         * Apply given contrast level to the given color
         *
         * @param color
         * @param contrastLevel
         */
        function applyContrast(color, contrastLevel)
        {
            var contrastLevels = {
                'white': {
                    '1': '1',
                    '2': '0.7',
                    '3': '0.3',
                    '4': '0.12'
                },
                'black': {
                    '1': '0.87',
                    '2': '0.54',
                    '3': '0.26',
                    '4': '0.12'
                }
            };

            // If white
            if ( color[0] === 255 && color[1] === 255 && color[2] === 255 )
            {
                color[3] = contrastLevels.white[contrastLevel];
            }
            // If black
            else if ( color[0] === 0 && color[1] === 0 && color[2] === 0 )
            {
                color[3] = contrastLevels.black[contrastLevel];
            }

            return color;
        }

        /**
         * Uppercase first
         */
        function ucfirst(string)
        {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
    }

})();
(function ()
{
    'use strict';

    MsThemeOptionsController.$inject = ["store", "fuseTheming"];
    msThemeOptions.$inject = ["$mdSidenav"];
    angular
        .module('app.core')
        .controller('MsThemeOptionsController', MsThemeOptionsController)
        .directive('msThemeOptions', msThemeOptions);

    /** @ngInject */
    function MsThemeOptionsController(store, fuseTheming)
    {
        var vm = this;

        // Data
        vm.themes = fuseTheming.themes;

        vm.layoutModes = [
            {
                label: 'Boxed',
                value: 'boxed'
            },
            {
                label: 'Wide',
                value: 'wide'
            }
        ];
        vm.layoutStyles = [
            {
                label : 'Vertical Navigation',
                value : 'verticalNavigation',
                figure: '/assets/images/theme-options/vertical-nav.jpg'
            },
            {
                label : 'Vertical Navigation with Fullwidth Toolbar',
                value : 'verticalNavigationFullwidthToolbar',
                figure: '/assets/images/theme-options/vertical-nav-with-full-toolbar.jpg'
            },
            {
                label : 'Vertical Navigation with Fullwidth Toolbar 2',
                value : 'verticalNavigationFullwidthToolbar2',
                figure: '/assets/images/theme-options/vertical-nav-with-full-toolbar-2.jpg'
            },
            {
                label : 'Horizontal Navigation',
                value : 'horizontalNavigation',
                figure: '/assets/images/theme-options/horizontal-nav.jpg'
            },
            {
                label : 'Content with Toolbar',
                value : 'contentWithToolbar',
                figure: '/assets/images/theme-options/content-with-toolbar.jpg'
            },
            {
                label : 'Content Only',
                value : 'contentOnly',
                figure: '/assets/images/theme-options/content-only.jpg'
            },
        ];

        vm.layoutMode = 'wide';
        vm.layoutStyle = store.get('layoutStyle') || 'verticalNavigation';

        // Methods
        vm.setActiveTheme = setActiveTheme;
        vm.getActiveTheme = getActiveTheme;
        vm.updateLayoutMode = updateLayoutMode;
        vm.updateLayoutStyle = updateLayoutStyle;

        //////////

        /**
         * Set active theme
         *
         * @param themeName
         */
        function setActiveTheme(themeName)
        {
            fuseTheming.setActiveTheme(themeName);
        }

        /**
         * Get active theme
         *
         * @returns {service.themes.active|{name, theme}}
         */
        function getActiveTheme()
        {
            return fuseTheming.themes.active;
        }

        /**
         * Update layout mode
         */
        function updateLayoutMode()
        {
            var bodyEl = angular.element('body');

            // Update class on body element
            bodyEl.toggleClass('boxed', (vm.layoutMode === 'boxed'));
        }

        /**
         * Update layout style
         */
        function updateLayoutStyle()
        {
            // Update the cookie
            store.set('layoutStyle', vm.layoutStyle);

            // Reload the page to apply the changes
            location.reload();
        }
    }

    /** @ngInject */
    function msThemeOptions($mdSidenav)
    {
        return {
            restrict   : 'E',
            scope      : {},
            controller : 'MsThemeOptionsController as vm',
            templateUrl: 'app/core/theme-options/theme-options.html',
            compile    : function (tElement)
            {
                tElement.addClass('ms-theme-options');

                return function postLink(scope)
                {
                    /**
                     * Toggle options sidenav
                     */
                    function toggleOptionsSidenav()
                    {
                        // Toggle the fuse theme options panel
                        $mdSidenav('fuse-theme-options').toggle();
                    }

                    // Expose the toggle function
                    scope.toggleOptionsSidenav = toggleOptionsSidenav;
                };
            }
        };
    }
})();
(function ()
{
    'use strict';

    msUtils.$inject = ["$window"];
    angular
        .module('app.core')
        .factory('msUtils', msUtils);

    /** @ngInject */
    function msUtils($window)
    {
        // Private variables
        var mobileDetect = new MobileDetect($window.navigator.userAgent),
            browserInfo = null;

        var service = {
            exists       : exists,
            detectBrowser: detectBrowser,
            guidGenerator: guidGenerator,
            isMobile     : isMobile,
            toggleInArray: toggleInArray
        };

        return service;

        //////////

        /**
         * Check if item exists in a list
         *
         * @param item
         * @param list
         * @returns {boolean}
         */
        function exists(item, list)
        {
            return list.indexOf(item) > -1;
        }

        /**
         * Returns browser information
         * from user agent data
         *
         * Found at http://www.quirksmode.org/js/detect.html
         * but modified and updated to fit for our needs
         */
        function detectBrowser()
        {
            // If we already tested, do not test again
            if ( browserInfo )
            {
                return browserInfo;
            }

            var browserData = [
                {
                    string       : $window.navigator.userAgent,
                    subString    : 'Edge',
                    versionSearch: 'Edge',
                    identity     : 'Edge'
                },
                {
                    string   : $window.navigator.userAgent,
                    subString: 'Chrome',
                    identity : 'Chrome'
                },
                {
                    string       : $window.navigator.userAgent,
                    subString    : 'OmniWeb',
                    versionSearch: 'OmniWeb/',
                    identity     : 'OmniWeb'
                },
                {
                    string       : $window.navigator.vendor,
                    subString    : 'Apple',
                    versionSearch: 'Version',
                    identity     : 'Safari'
                },
                {
                    prop    : $window.opera,
                    identity: 'Opera'
                },
                {
                    string   : $window.navigator.vendor,
                    subString: 'iCab',
                    identity : 'iCab'
                },
                {
                    string   : $window.navigator.vendor,
                    subString: 'KDE',
                    identity : 'Konqueror'
                },
                {
                    string   : $window.navigator.userAgent,
                    subString: 'Firefox',
                    identity : 'Firefox'
                },
                {
                    string   : $window.navigator.vendor,
                    subString: 'Camino',
                    identity : 'Camino'
                },
                {
                    string   : $window.navigator.userAgent,
                    subString: 'Netscape',
                    identity : 'Netscape'
                },
                {
                    string       : $window.navigator.userAgent,
                    subString    : 'MSIE',
                    identity     : 'Explorer',
                    versionSearch: 'MSIE'
                },
                {
                    string       : $window.navigator.userAgent,
                    subString    : 'Trident/7',
                    identity     : 'Explorer',
                    versionSearch: 'rv'
                },
                {
                    string       : $window.navigator.userAgent,
                    subString    : 'Gecko',
                    identity     : 'Mozilla',
                    versionSearch: 'rv'
                },
                {
                    string       : $window.navigator.userAgent,
                    subString    : 'Mozilla',
                    identity     : 'Netscape',
                    versionSearch: 'Mozilla'
                }
            ];

            var osData = [
                {
                    string   : $window.navigator.platform,
                    subString: 'Win',
                    identity : 'Windows'
                },
                {
                    string   : $window.navigator.platform,
                    subString: 'Mac',
                    identity : 'Mac'
                },
                {
                    string   : $window.navigator.platform,
                    subString: 'Linux',
                    identity : 'Linux'
                },
                {
                    string   : $window.navigator.platform,
                    subString: 'iPhone',
                    identity : 'iPhone'
                },
                {
                    string   : $window.navigator.platform,
                    subString: 'iPod',
                    identity : 'iPod'
                },
                {
                    string   : $window.navigator.platform,
                    subString: 'iPad',
                    identity : 'iPad'
                },
                {
                    string   : $window.navigator.platform,
                    subString: 'Android',
                    identity : 'Android'
                }
            ];

            var versionSearchString = '';

            function searchString(data)
            {
                for ( var i = 0; i < data.length; i++ )
                {
                    var dataString = data[i].string;
                    var dataProp = data[i].prop;

                    versionSearchString = data[i].versionSearch || data[i].identity;

                    if ( dataString )
                    {
                        if ( dataString.indexOf(data[i].subString) !== -1 )
                        {
                            return data[i].identity;

                        }
                    }
                    else if ( dataProp )
                    {
                        return data[i].identity;
                    }
                }
            }

            function searchVersion(dataString)
            {
                var index = dataString.indexOf(versionSearchString);

                if ( index === -1 )
                {
                    return;
                }

                return parseInt(dataString.substring(index + versionSearchString.length + 1));
            }

            var browser = searchString(browserData) || 'unknown-browser';
            var version = searchVersion($window.navigator.userAgent) || searchVersion($window.navigator.appVersion) || 'unknown-version';
            var os = searchString(osData) || 'unknown-os';

            // Prepare and store the object
            browser = browser.toLowerCase();
            version = browser + '-' + version;
            os = os.toLowerCase();

            browserInfo = {
                browser: browser,
                version: version,
                os     : os
            };

            return browserInfo;
        }

        /**
         * Generates a globally unique id
         *
         * @returns {*}
         */
        function guidGenerator()
        {
            var S4 = function ()
            {
                return (((1 + Math.random()) * 0x10000) || 0).toString(16).substring(1);
            };
            return (S4() + S4() + S4() + S4() + S4() + S4());
        }

        /**
         * Return if current device is a
         * mobile device or not
         */
        function isMobile()
        {
            return mobileDetect.mobile();
        }

        /**
         * Toggle in array (push or splice)
         *
         * @param item
         * @param array
         */
        function toggleInArray(item, array)
        {
            if ( array.indexOf(item) === -1 )
            {
                array.push(item);
            }
            else
            {
                array.splice(array.indexOf(item), 1);
            }
        }
    }
}());
(function ()
{
    'use strict';

angular.module('app.core')
  .service('msPending', ["$q", function ($q) {
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
  }]);
  
 })();
(function ()
{
    'use strict';

    angular
        .module('app.core')
        .provider('msApi', msApiProvider);

    /** @ngInject **/
    function msApiProvider()
    {
        /* ----------------- */
        /* Provider          */
        /* ----------------- */
        var provider = this;

        // Inject the $log service
        var $log = angular.injector(['ng']).get('$log');

        // Data
        var baseUrl = '';
        var api = [];

        // Methods
        provider.setBaseUrl = setBaseUrl;
        provider.getBaseUrl = getBaseUrl;
        provider.getApiObject = getApiObject;
        provider.register = register;

        //////////

        /**
         * Set base url for API endpoints
         *
         * @param url {string}
         */
        function setBaseUrl(url)
        {
            baseUrl = url;
        }

        /**
         * Return the base url
         *
         * @returns {string}
         */
        function getBaseUrl()
        {
            return baseUrl;
        }

        /**
         * Return the api object
         *
         * @returns {object}
         */
        function getApiObject()
        {
            return api;
        }

        /**
         * Register API endpoint
         *
         * @param key
         * @param resource
         */
        function register(key, resource)
        {
            if ( !angular.isString(key) )
            {
                $log.error('"path" must be a string (eg. `dashboard.project`)');
                return;
            }

            if ( !angular.isArray(resource) )
            {
                $log.error('"resource" must be an array and it must follow $resource definition');
                return;
            }

            // Store the API object
            api[key] = {
                url          : baseUrl + (resource[0] || ''),
                paramDefaults: resource[1] || [],
                actions      : resource[2] || [],
                options      : resource[3] || {}
            };
        }

        /* ----------------- */
        /* Service           */
        /* ----------------- */
        this.$get = ["$log", "$q", "$resource", "$rootScope", function ($log, $q, $resource, $rootScope)
        {
            // Data

            // Methods
            var service = {
                setBaseUrl: setBaseUrl,
                getBaseUrl: getBaseUrl,
                register  : register,
                resolve   : resolve,
                request   : request
            };

            return service;

            //////////

            /**
             * Resolve an API endpoint
             *
             * @param action {string}
             * @param parameters {object}
             * @returns {promise|boolean}
             */
            function resolve(action, parameters)
            {
                // Emit an event
                $rootScope.$broadcast('msApi::resolveStart');
                
                var actionParts = action.split('@'),
                    resource = actionParts[0],
                    method = actionParts[1],
                    params = parameters || {};

                if ( !resource || !method )
                {
                    $log.error('msApi.resolve requires correct action parameter (resourceName@methodName)');
                    return false;
                }

                // Create a new deferred object
                var deferred = $q.defer();

                // Get the correct resource definition from api object
                var apiObject = api[resource];

                if ( !apiObject )
                {
                    $log.error('Resource "' + resource + '" is not defined in the api service!');
                    deferred.reject('Resource "' + resource + '" is not defined in the api service!');
                }
                else
                {
                    // Generate the $resource object based on the stored API object
                    var resourceObject = $resource(apiObject.url, apiObject.paramDefaults, apiObject.actions, apiObject.options);

                    // Make the call...
                    resourceObject[method](params,

                        // Success
                        function (response)
                        {
                            deferred.resolve(response);

                            // Emit an event
                            $rootScope.$broadcast('msApi::resolveSuccess');
                        },

                        // Error
                        function (response)
                        {
                            deferred.reject(response);

                            // Emit an event
                            $rootScope.$broadcast('msApi::resolveError');
                        }
                    );
                }

                // Return the promise
                return deferred.promise;
            }

            /**
             * Make a request to an API endpoint
             *
             * @param action {string}
             * @param [parameters] {object}
             * @param [success] {function}
             * @param [error] {function}
             *
             * @returns {promise|boolean}
             */
            function request(action, parameters, success, error)
            {
                // Emit an event
                $rootScope.$broadcast('msApi::requestStart');
                
                var actionParts = action.split('@'),
                    resource = actionParts[0],
                    method = actionParts[1],
                    params = parameters || {};

                if ( !resource || !method )
                {
                    $log.error('msApi.resolve requires correct action parameter (resourceName@methodName)');
                    return false;
                }

                // Create a new deferred object
                var deferred = $q.defer();

                // Get the correct resource definition from api object
                var apiObject = api[resource];

                if ( !apiObject )
                {
                    $log.error('Resource "' + resource + '" is not defined in the api service!');
                    deferred.reject('Resource "' + resource + '" is not defined in the api service!');
                }
                else
                {
                    // Generate the $resource object based on the stored API object
                    var resourceObject = $resource(apiObject.url, apiObject.paramDefaults, apiObject.actions, apiObject.options);

                    // Make the call...
                    resourceObject[method](params,

                        // SUCCESS
                        function (response)
                        {
                            // Emit an event
                            $rootScope.$broadcast('msApi::requestSuccess');
                            
                            // Resolve the promise
                            deferred.resolve(response);

                            // Call the success function if there is one
                            if ( angular.isDefined(success) && angular.isFunction(success) )
                            {
                                success(response);
                            }
                        },

                        // ERROR
                        function (response)
                        {
                            // Emit an event
                            $rootScope.$broadcast('msApi::requestError');
                            
                            // Reject the promise
                            deferred.reject(response);

                            // Call the error function if there is one
                            if ( angular.isDefined(error) && angular.isFunction(error) )
                            {
                                error(response);
                            }
                        }
                    );
                }

                // Return the promise
                return deferred.promise;
            }
        }];
    }
})();
(function ()
{
    'use strict';

    apiResolverService.$inject = ["$q", "$log", "api"];
    angular
        .module('app.core')
        .factory('apiResolver', apiResolverService);

    /** @ngInject */
    function apiResolverService($q, $log, api)
    {
        var service = {
            resolve: resolve
        };

        return service;

        //////////
        /**
         * Resolve api
         * @param action
         * @param parameters
         */
        function resolve(action, parameters)
        {
            var actionParts = action.split('@'),
                resource = actionParts[0],
                method = actionParts[1],
                params = parameters || {};

            if ( !resource || !method )
            {
                $log.error('apiResolver.resolve requires correct action parameter (ResourceName@methodName)');
                return false;
            }

            // Create a new deferred object
            var deferred = $q.defer();

            // Get the correct api object from api service
            var apiObject = getApiObject(resource);

            if ( !apiObject )
            {
                $log.error('Resource "' + resource + '" is not defined in the api service!');
                deferred.reject('Resource "' + resource + '" is not defined in the api service!');
            }
            else
            {
                apiObject[method](params,

                    // Success
                    function (response)
                    {
                        deferred.resolve(response);
                    },

                    // Error
                    function (response)
                    {
                        deferred.reject(response);
                    }
                );
            }

            // Return the promise
            return deferred.promise;
        }

        /**
         * Get correct api object
         *
         * @param resource
         * @returns {*}
         */
        function getApiObject(resource)
        {
            // Split the resource in case if we have a dot notated object
            var resourceParts = resource.split('.'),
                apiObject = api;

            // Loop through the resource parts and go all the way through
            // the api object and return the correct one
            for ( var l = 0; l < resourceParts.length; l++ )
            {
                if ( angular.isUndefined(apiObject[resourceParts[l]]) )
                {
                    $log.error('Resource part "' + resourceParts[l] + '" is not defined!');
                    apiObject = false;
                    break;
                }

                apiObject = apiObject[resourceParts[l]];
            }

            if ( !apiObject )
            {
                return false;
            }

            return apiObject;
        }
    }

})();
(function ()
{
    'use strict';

    angular
        .module('app.core')
        .filter('filterByTags', filterByTags)
        .filter('filterSingleByTags', filterSingleByTags);

    /** @ngInject */
    function filterByTags()
    {
        return function (items, tags)
        {
            if ( items.length === 0 || tags.length === 0 )
            {
                return items;
            }

            var filtered = [];

            items.forEach(function (item)
            {
                var match = tags.every(function (tag)
                {
                    var tagExists = false;

                    item.tags.forEach(function (itemTag)
                    {
                        if ( itemTag.name === tag.name )
                        {
                            tagExists = true;
                            return;
                        }
                    });

                    return tagExists;
                });

                if ( match )
                {
                    filtered.push(item);
                }
            });

            return filtered;
        };
    }

    /** @ngInject */
    function filterSingleByTags()
    {
        return function (itemTags, tags)
        {
            if ( itemTags.length === 0 || tags.length === 0 )
            {
                return;
            }

            if ( itemTags.length < tags.length )
            {
                return [];
            }

            var filtered = [];

            var match = tags.every(function (tag)
            {
                var tagExists = false;

                itemTags.forEach(function (itemTag)
                {
                    if ( itemTag.name === tag.name )
                    {
                        tagExists = true;
                        return;
                    }
                });

                return tagExists;
            });

            if ( match )
            {
                filtered.push(itemTags);
            }

            return filtered;
        };
    }

})();
(function ()
{
    'use strict';

    angular
        .module('app.core')
        .filter('filterByPropIds', filterByPropIds);

    /** @ngInject */
    function filterByPropIds()
    {
        return function (items, parameter, ids)
        {
            if ( items.length === 0 || !ids || ids.length === 0 )
            {
                return items;
            }

            var filtered = [];

            for ( var i = 0; i < items.length; i++ )
            {
                var item = items[i];
                var match = false;

                for ( var j = 0; j < ids.length; j++ )
                {
                    var id = ids[j];
                    if ( item[parameter].indexOf(id) > -1 )
                    {
                        match = true;
                        break;
                    }
                }

                if ( match )
                {
                    filtered.push(item);
                }

            }

            return filtered;

        };
    }

})();
(function ()
{
    'use strict';

    angular
        .module('app.core')
        .filter('filterByIds', filterByIds);

    /** @ngInject */
    function filterByIds()
    {
        return function (items, ids)
        {

            if ( items.length === 0 || !ids )
            {
                return items;
            }

            if ( ids.length === 0 )
            {
                return [];
            }

            var filtered = [];

            for ( var i = 0; i < items.length; i++ )
            {
                var item = items[i];
                var match = false;

                for ( var j = 0; j < ids.length; j++ )
                {
                    var id = ids[j];
                    if ( item.id === id )
                    {
                        match = true;
                        break;
                    }
                }

                if ( match )
                {
                    filtered.push(item);
                }

            }

            return filtered;

        };
    }

})();
(function ()
{
    'use strict';

    toTrustedFilter.$inject = ["$sce"];
    angular
        .module('app.core')
        .filter('toTrusted', toTrustedFilter)
        .filter('htmlToPlaintext', htmlToPlainTextFilter)
        .filter('nospace', nospaceFilter)
        .filter('humanizeDoc', humanizeDocFilter);

    /** @ngInject */
    function toTrustedFilter($sce)
    {
        return function (value)
        {
            return $sce.trustAsHtml(value);
        };
    }

    /** @ngInject */
    function htmlToPlainTextFilter()
    {
        return function (text)
        {
            return String(text).replace(/<[^>]+>/gm, '');
        };
    }

    /** @ngInject */
    function nospaceFilter()
    {
        return function (value)
        {
            return (!value) ? '' : value.replace(/ /g, '');
        };
    }

    /** @ngInject */
    function humanizeDocFilter()
    {
        return function (doc)
        {
            if ( !doc )
            {
                return;
            }
            if ( doc.type === 'directive' )
            {
                return doc.name.replace(/([A-Z])/g, function ($1)
                {
                    return '-' + $1.toLowerCase();
                });
            }
            return doc.label || doc.name;
        };
    }

})();
(function ()
{
    'use strict';

    angular
        .module('app.core')
        .filter('altDate', altDate);

    /** @ngInject */
    function altDate()
    {
        return function (value)
        {
            var diff = Date.now() - new Date(value);

            /**
             * If in a hour
             * e.g. "2 minutes ago"
             */
            if ( diff < (60 * 60 * 1000) )
            {
                return moment(value).fromNow();
            }
            /*
             * If in the day
             * e.g. "11:23"
             */
            else if ( diff < (60 * 60 * 24 * 1000) )
            {
                return moment(value).format('HH:mm');
            }
            /*
             * If in week
             * e.g "Tuesday"
             */
            else if ( diff < (60 * 60 * 24 * 7 * 1000) )
            {
                return moment(value).format('dddd');
            }
            /*
             * If more than a week
             * e.g. 03/29/2016
             */
            else
            {
                return moment(value).calendar();
            }

        };
    }

})();
(function () {
    'use strict';

    hljsDirective.$inject = ["$timeout", "$q", "$interpolate"];
    angular
        .module('app.core')
        .directive('hljs', hljsDirective);

    /** @ngInject */
    function hljsDirective($timeout, $q, $interpolate) {
        return {
            restrict: 'E',
            compile : function (element, attr) {
                var code;
                //No attribute? code is the content
                if (!attr.code) {
                    code = element.html();
                    element.empty();
                }

                return function (scope, element, attr) {

                    if (attr.code) {
                        // Attribute? code is the evaluation
                        code = scope.$eval(attr.code);
                    }
                    var shouldInterpolate = scope.$eval(attr.shouldInterpolate);

                    $q.when(code).then(function (code) {
                        if (code) {
                            if (shouldInterpolate) {
                                code = $interpolate(code)(scope);
                            }
                            var contentParent = angular.element(
                                '<pre><code class="highlight" ng-non-bindable></code></pre>'
                            );
                            element.append(contentParent);
                            // Defer highlighting 1-frame to prevent GA interference...
                            $timeout(function () {
                                render(code, contentParent);
                            }, 34, false);
                        }
                    });

                    function render(contents, parent) {

                        var codeElement = parent.find('code');
                        var lines = contents.split('\n');

                        // Remove empty lines
                        lines = lines.filter(function (line) {
                            return line.trim().length;
                        });

                        // Make it so each line starts at 0 whitespace
                        var firstLineWhitespace = lines[0].match(/^\s*/)[0];
                        var startingWhitespaceRegex = new RegExp('^' + firstLineWhitespace);
                        lines = lines.map(function (line) {
                            return line
                                .replace(startingWhitespaceRegex, '')
                                .replace(/\s+$/, '');
                        });

                        var highlightedCode = hljs.highlight(attr.language || attr.lang, lines.join('\n'), true);
                        highlightedCode.value = highlightedCode.value
                            .replace(/=<span class="hljs-value">""<\/span>/gi, '')
                            .replace('<head>', '')
                            .replace('<head/>', '');
                        codeElement.append(highlightedCode.value).addClass('highlight');
                    }
                };
            }
        };
    }
})();
(function ()
{
    'use strict';

    angular
        .module('app.core')
        .provider('fuseConfig', fuseConfigProvider);

    /** @ngInject */
    function fuseConfigProvider()
    {
        // Default configuration
        var fuseConfiguration = {
            'disableCustomScrollbars'        : false,
            'disableMdInkRippleOnMobile'     : true,
            'disableCustomScrollbarsOnMobile': true
        };

        // Methods
        this.config = config;

        //////////

        /**
         * Extend default configuration with the given one
         *
         * @param configuration
         */
        function config(configuration)
        {
            fuseConfiguration = angular.extend({}, fuseConfiguration, configuration);
        }

        /**
         * Service
         */
        this.$get = function ()
        {
            var service = {
                getConfig: getConfig,
                setConfig: setConfig
            };

            return service;

            //////////

            /**
             * Returns a config value
             */
            function getConfig(configName)
            {
                if ( angular.isUndefined(fuseConfiguration[configName]) )
                {
                    return false;
                }

                return fuseConfiguration[configName];
            }

            /**
             * Creates or updates config object
             *
             * @param configName
             * @param configValue
             */
            function setConfig(configName, configValue)
            {
                fuseConfiguration[configName] = configValue;
            }
        };
    }

})();
(function ()
{
    'use strict';

    config.$inject = ["$translatePartialLoaderProvider", "msApiProvider"];
    angular
        .module('app.toolbar', [])
        .config(config);

    /** @ngInject */
    function config($translatePartialLoaderProvider, msApiProvider)
    {
        $translatePartialLoaderProvider.addPart('app/toolbar');

        var uri = '/session';
        msApiProvider.register('app.logout', [uri,  {} , {
              logout :{
                method : 'DELETE'
              }
        }]);
    }
})();

(function ()
{
    'use strict';

    controller.$inject = ["$rootScope", "$scope", "$q", "$state", "$timeout", "$mdSidenav", "$translate", "$mdToast", "msNavigationService", "store", "msApi", "ngProgressLite"];
    angular
        .module('app.toolbar')
        .controller('ToolbarController', controller);

    /** @ngInject */
    function controller($rootScope, $scope, $q, $state, $timeout, $mdSidenav, $translate, $mdToast, msNavigationService, store, msApi, ngProgressLite)
    {
        var vm = this;

        vm.$rootScope = $rootScope;

        vm.$q = $q;
        
        vm.$state = $state;

        vm.$timeout = $timeout;

        vm.$mdSidenav = $mdSidenav;

        vm.$translate = $translate;

        vm.$mdToast = $mdToast;

        vm.msNavigationService = msNavigationService;

        vm.store = store;

        vm.$scope = $scope;

        vm.msApi = msApi;

        vm.ngProgressLite = ngProgressLite;

        vm.initData();
    }

    controller.prototype.logout = function(){
        var self = this;
        if(self.$$submit) return;
        self.$$submit = true;
        self.ngProgressLite.start();
        self.msApi.request('app.logout@logout', {}, function(resp){
            self.store.remove('user');
            self.$timeout(function(){
                self.$$submit = false;
                self.ngProgressLite.done();
                self.$state.go('app.auth');
            });
        }, function(err){
            self.$timeout(function(){
                self.$$submit = false;
                self.ngProgressLite.done();
            });
        });
    }

    controller.prototype.initData = function(){
        var self = this;

        self.$scope.user = self.store.get('user');
    }

    controller.prototype.toggleSideNav = function(id){
         this.$mdSidenav(id).toggle();
    }


})();
(function ()
{
    'use strict';

    QuickPanelController.$inject = ["msApi"];
    angular
        .module('app.quick-panel')
        .controller('QuickPanelController', QuickPanelController);

    /** @ngInject */
    function QuickPanelController(msApi)
    {
        var vm = this;

        // Data
        vm.date = new Date();
        vm.settings = {
            notify: true,
            cloud : false,
            retro : true
        };

        msApi.request('quickPanel.activities@get', {},
            // Success
            function (response)
            {
                vm.activities = response.data;
            }
        );

        msApi.request('quickPanel.events@get', {},
            // Success
            function (response)
            {
                vm.events = response.data;
            }
        );

        msApi.request('quickPanel.notes@get', {},
            // Success
            function (response)
            {
                vm.notes = response.data;
            }
        );

        // Methods

        //////////
    }

})();
(function ()
{
    'use strict';

    angular
        .module('app.navigation', [])
        .config(config);

    /** @ngInject */
    function config()
    {
        
    }

})();
(function ()
{
    'use strict';

    NavigationController.$inject = ["$scope"];
    angular
        .module('app.navigation')
        .controller('NavigationController', NavigationController);

    /** @ngInject */
    function NavigationController($scope)
    {
        var vm = this;

        // Data
        vm.bodyEl = angular.element('body');
        vm.folded = false;
        vm.msScrollOptions = {
            suppressScrollX: true
        };

        // Methods
        vm.toggleMsNavigationFolded = toggleMsNavigationFolded;

        //////////

        /**
         * Toggle folded status
         */
        function toggleMsNavigationFolded()
        {
            vm.folded = !vm.folded;
        }

        // Close the mobile menu on $stateChangeSuccess
        $scope.$on('$stateChangeSuccess', function ()
        {
            vm.bodyEl.removeClass('ms-navigation-horizontal-mobile-menu-active');
        });
    }

})();
(function ()
{
    'use strict';

    /**
     * Main module of the Fuse
     */
    config.$inject = ["$translatePartialLoaderProvider"];
    angular
        .module('fuse', [

            // Common 3rd Party Dependencies
            'uiGmapgoogle-maps',
            'textAngular',
            'xeditable',

            // Core
            'app.core',

            // Navigation
            'app.navigation',

            // Toolbar
            'app.toolbar',
            
            'app.quick-panel',
            'app.dashboard',
            'app.auth',
            'app.contents',
            'app.setting'
        ]).config(config);

    /** @ngInject */
    function config($translatePartialLoaderProvider)
    {
           // Translation
        $translatePartialLoaderProvider.addPart('app');
       
    };
})();

(function ()
{
    'use strict';

    MainController.$inject = ["$scope", "$rootScope"];
    angular
        .module('fuse')
        .controller('MainController', MainController);

    /** @ngInject */
    function MainController($scope, $rootScope)
    {
        // Data

        //////////

        // Remove the splash screen
        $scope.$on('$viewContentAnimationEnded', function (event)
        {
            if ( event.targetScope.$id === $scope.$id )
            {
                $rootScope.$broadcast('msSplashScreen::remove');
            }
        });
    }
})();
(function ()
{
    'use strict';

    runBlock.$inject = ["msUtils", "fuseGenerator", "fuseConfig"];
    angular
        .module('app.core')
        .run(runBlock);

    /** @ngInject */
    function runBlock(msUtils, fuseGenerator, fuseConfig)
    {
        /**
         * Generate extra classes based on registered themes so we
         * can use same colors with non-angular-material elements
         */
        fuseGenerator.generate();

        /**
         * Disable md-ink-ripple effects on mobile
         * if 'disableMdInkRippleOnMobile' config enabled
         */
        if ( fuseConfig.getConfig('disableMdInkRippleOnMobile') && msUtils.isMobile() )
        {
            var bodyEl = angular.element('body');
            bodyEl.attr('md-no-ink', true);
        }

        /**
         * Put isMobile() to the html as a class
         */
        if ( msUtils.isMobile() )
        {
            angular.element('html').addClass('is-mobile');
        }

        /**
         * Put browser information to the html as a class
         */
        var browserInfo = msUtils.detectBrowser();
        if ( browserInfo )
        {
            var htmlClass = browserInfo.browser + ' ' + browserInfo.version + ' ' + browserInfo.os;
            angular.element('html').addClass(htmlClass);
        }
    }
})();
(function ()
{
    'use strict';
    interceptor.$inject = ["$rootScope", "$log", "$q", "uri", "$timeout", "msPending"];
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

(function ()
{
    'use strict';

    config.$inject = ["$ariaProvider", "$logProvider", "msScrollConfigProvider", "fuseConfigProvider", "msApiProvider", "$httpProvider", "$resourceProvider", "ngProgressLiteProvider"];
    angular
        .module('app.core')
        .config(config);

    /** @ngInject */
    function config($ariaProvider, $logProvider, msScrollConfigProvider, fuseConfigProvider, msApiProvider, $httpProvider, $resourceProvider, ngProgressLiteProvider)
    {
        // Enable debug logging
        $logProvider.debugEnabled(true);
        msApiProvider.setBaseUrl('api/v1');
        $httpProvider.interceptors.push('interceptor')
        $resourceProvider.defaults.cancellable = true;
        ngProgressLiteProvider.settings.speed = 1500;
        /*eslint-disable */
        
        // ng-aria configuration
        $ariaProvider.config({
            tabindex: false
        });

        // Fuse theme configurations
        fuseConfigProvider.config({
            'disableCustomScrollbars'        : false,
            'disableCustomScrollbarsOnMobile': true,
            'disableMdInkRippleOnMobile'     : true
        });

        // msScroll configuration
        msScrollConfigProvider.config({
            wheelPropagation: true
        });

        /*eslint-enable */
    }
})();
(function ()
{
    'use strict';

    runBlock.$inject = ["$window", "$rootScope", "$timeout", "$state", "editableThemes", "store", "$log", "ngProgressLite", "$mdToast", "$translate"];
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
(function ()
{
    'use strict';

    routeConfig.$inject = ["$stateProvider", "$urlRouterProvider", "$locationProvider"];
    angular
        .module('fuse')
        .config(routeConfig);

    /** @ngInject */
    function routeConfig($stateProvider, $urlRouterProvider, $locationProvider)
    {
        //$locationProvider.html5Mode(true);

        $urlRouterProvider.otherwise('/dashboard');

        /**
         * Layout Style Switcher
         *
         * This code is here for demonstration purposes.
         * If you don't need to switch between the layout
         * styles like in the demo, you can set one manually by
         * typing the template urls into the `State definitions`
         * area and remove this code
         */
        // Inject $cookies
        // var $cookies;

        // angular.injector(['ngCookies']).invoke([
        //     '$cookies', function (_$cookies)
        //     {
        //         $cookies = _$cookies;
        //     }
        // ]);

        // Get active layout
        var layoutStyle = 'verticalNavigation';

        var layouts = {
            verticalNavigation  : {
                main      : 'app/core/layouts/vertical-navigation.html',
                toolbar   : 'app/toolbar/layouts/vertical-navigation/toolbar.html',
                navigation: 'app/navigation/layouts/vertical-navigation/navigation.html'
            },
            verticalNavigationFullwidthToolbar  : {
                main      : 'app/core/layouts/vertical-navigation-fullwidth-toolbar.html',
                toolbar   : 'app/toolbar/layouts/vertical-navigation-fullwidth-toolbar/toolbar.html',
                navigation: 'app/navigation/layouts/vertical-navigation/navigation.html'
            },
            verticalNavigationFullwidthToolbar2  : {
                main      : 'app/core/layouts/vertical-navigation-fullwidth-toolbar-2.html',
                toolbar   : 'app/toolbar/layouts/vertical-navigation-fullwidth-toolbar-2/toolbar.html',
                navigation: 'app/navigation/layouts/vertical-navigation-fullwidth-toolbar-2/navigation.html'
            },
            horizontalNavigation: {
                main      : 'app/core/layouts/horizontal-navigation.html',
                toolbar   : 'app/toolbar/layouts/horizontal-navigation/toolbar.html',
                navigation: 'app/navigation/layouts/horizontal-navigation/navigation.html'
            },
            contentOnly         : {
                main      : 'app/core/layouts/content-only.html',
                toolbar   : '',
                navigation: ''
            },
            contentWithToolbar  : {
                main      : 'app/core/layouts/content-with-toolbar.html',
                toolbar   : 'app/toolbar/layouts/content-with-toolbar/toolbar.html',
                navigation: ''
            }
        };
        // END - Layout Style Switcher

        // State definitions
        $stateProvider
            .state('app', {
                abstract: true,
                views   : {
                    'main@'         : {
                        templateUrl: layouts[layoutStyle].main,
                        controller : 'MainController as vm'
                    },
                    'toolbar@app'   : {
                        templateUrl: layouts[layoutStyle].toolbar,
                        controller : 'ToolbarController as vm'
                    },
                    'navigation@app': {
                        templateUrl: layouts[layoutStyle].navigation,
                        controller : 'NavigationController as vm'
                    },
                    'quickPanel@app': {
                        templateUrl: 'app/quick-panel/quick-panel.html',
                        controller : 'QuickPanelController as vm'
                    }
                }
            });
    }

})();
(function ()
{
    'use strict';

    IndexController.$inject = ["fuseTheming"];
    angular
        .module('fuse')
        .controller('IndexController', IndexController);

    /** @ngInject */
    function IndexController(fuseTheming)
    {
        var vm = this;

        // Data
        vm.themes = fuseTheming.themes;

        //////////
    }
})();
(function ()
{
    'use strict';

    angular
        .module('fuse')
        .constant('dateTimeFormat', 'dd/MM/yyyy hh:mm tt')
        .constant('uri', 'api/v1/')
        .constant('pageSize', 20)
        .constant('currentDate', new Date());;
})();

(function ()
{
    'use strict';

    config.$inject = ["uiGmapGoogleMapApiProvider", "$translateProvider", "$provide", "$mdDateLocaleProvider"];
    angular
        .module('fuse')
        .config(config);

    /** @ngInject */
    function config(uiGmapGoogleMapApiProvider, $translateProvider, $provide, $mdDateLocaleProvider)
    {
        // Put your common app configurations here

        // uiGmapgoogle-maps configuration
        uiGmapGoogleMapApiProvider.configure({
            key: 'AIzaSyAMWvrZkeLRrGTqh9RgY7niHemli1HIPDU',
            v        : '3.exp',
            libraries: 'weather,geometry,visualization'
        });

        $mdDateLocaleProvider.formatDate = function(date) {
            return moment(date).format('DD/MM/YYYY');
        };

        // angular-translate configuration
        $translateProvider.useLoader('$translatePartialLoader', {
            urlTemplate: '{part}/i18n/{lang}.json'
        });
        $translateProvider.preferredLanguage('vi');
        $translateProvider.useSanitizeValueStrategy('sanitize');

        // Text Angular options
        $provide.decorator('taOptions', [
            '$delegate', function (taOptions)
            {
                taOptions.toolbar = [
                    ['bold', 'italics', 'underline', 'ul', 'ol', 'quote']
                ];

                taOptions.classes = {
                    focussed           : 'focussed',
                    toolbar            : 'ta-toolbar',
                    toolbarGroup       : 'ta-group',
                    toolbarButton      : 'md-button',
                    toolbarButtonActive: 'active',
                    disabled           : '',
                    textEditor         : 'form-control',
                    htmlEditor         : 'form-control'
                };

                return taOptions;
            }
        ]);

        // Text Angular tools
        $provide.decorator('taTools', [
            '$delegate', function (taTools)
            {
                taTools.quote.iconclass = 'icon-format-quote';
                taTools.bold.iconclass = 'icon-format-bold';
                taTools.italics.iconclass = 'icon-format-italic';
                taTools.underline.iconclass = 'icon-format-underline';
                taTools.strikeThrough.iconclass = 'icon-format-strikethrough';
                taTools.ul.iconclass = 'icon-format-list-bulleted';
                taTools.ol.iconclass = 'icon-format-list-numbers';
                taTools.redo.iconclass = 'icon-redo';
                taTools.undo.iconclass = 'icon-undo';
                taTools.clear.iconclass = 'icon-close-circle-outline';
                taTools.justifyLeft.iconclass = 'icon-format-align-left';
                taTools.justifyCenter.iconclass = 'icon-format-align-center';
                taTools.justifyRight.iconclass = 'icon-format-align-right';
                taTools.justifyFull.iconclass = 'icon-format-align-justify';
                taTools.indent.iconclass = 'icon-format-indent-increase';
                taTools.outdent.iconclass = 'icon-format-indent-decrease';
                taTools.html.iconclass = 'icon-code-tags';
                taTools.insertImage.iconclass = 'icon-file-image-box';
                taTools.insertLink.iconclass = 'icon-link';
                taTools.insertVideo.iconclass = 'icon-filmstrip';

                return taTools;
            }
        ]);
    }

})();
(function ()
{
    'use strict';

    apiService.$inject = ["$resource"];
    angular
        .module('fuse')
        .factory('api', apiService);

    /** @ngInject */
    function apiService($resource)
    {
        /**
         * You can use this service to define your API urls. The "api" service
         * is designed to work in parallel with "apiResolver" service which you can
         * find in the "app/core/services/api-resolver.service.js" file.
         *
         * You can structure your API urls whatever the way you want to structure them.
         * You can either use very simple definitions, or you can use multi-dimensional
         * objects.
         *
         * Here's a very simple API url definition example:
         *
         *      api.getBlogList = $resource('http://api.example.com/getBlogList');
         *
         * While this is a perfectly valid $resource definition, most of the time you will
         * find yourself in a more complex situation where you want url parameters:
         *
         *      api.getBlogById = $resource('http://api.example.com/blog/:id', {id: '@id'});
         *
         * You can also define your custom methods. Custom method definitions allow you to
         * add hardcoded parameters to your API calls that you want to sent every time you
         * make that API call:
         *
         *      api.getBlogById = $resource('http://api.example.com/blog/:id', {id: '@id'}, {
         *         'getFromHomeCategory' : {method: 'GET', params: {blogCategory: 'home'}}
         *      });
         *
         * In addition to these definitions, you can also create multi-dimensional objects.
         * They are nothing to do with the $resource object, it's just a more convenient
         * way that we have created for you to packing your related API urls together:
         *
         *      api.blog = {
         *                   list     : $resource('http://api.example.com/blog'),
         *                   getById  : $resource('http://api.example.com/blog/:id', {id: '@id'}),
         *                   getByDate: $resource('http://api.example.com/blog/:date', {id: '@date'}, {
         *                       get: {
         *                            method: 'GET',
         *                            params: {
         *                                getByDate: true
         *                            }
         *                       }
         *                   })
         *       }
         *
         * If you look at the last example from above, we overrode the 'get' method to put a
         * hardcoded parameter. Now every time we make the "getByDate" call, the {getByDate: true}
         * object will also be sent along with whatever data we are sending.
         *
         * All the above methods are using standard $resource service. You can learn more about
         * it at: https://docs.angularjs.org/api/ngResource/service/$resource
         *
         * -----
         *
         * After you defined your API urls, you can use them in Controllers, Services and even
         * in the UIRouter state definitions.
         *
         * If we use the last example from above, you can do an API call in your Controllers and
         * Services like this:
         *
         *      function MyController (api)
         *      {
         *          // Get the blog list
         *          api.blog.list.get({},
         *
         *              // Success
         *              function (response)
         *              {
         *                  console.log(response);
         *              },
         *
         *              // Error
         *              function (response)
         *              {
         *                  console.error(response);
         *              }
         *          );
         *
         *          // Get the blog with the id of 3
         *          var id = 3;
         *          api.blog.getById.get({'id': id},
         *
         *              // Success
         *              function (response)
         *              {
         *                  console.log(response);
         *              },
         *
         *              // Error
         *              function (response)
         *              {
         *                  console.error(response);
         *              }
         *          );
         *
         *          // Get the blog with the date by using custom defined method
         *          var date = 112314232132;
         *          api.blog.getByDate.get({'date': date},
         *
         *              // Success
         *              function (response)
         *              {
         *                  console.log(response);
         *              },
         *
         *              // Error
         *              function (response)
         *              {
         *                  console.error(response);
         *              }
         *          );
         *      }
         *
         * Because we are directly using $resource service, all your API calls will return a
         * $promise object.
         *
         * --
         *
         * If you want to do the same calls in your UI Router state definitions, you need to use
         * "apiResolver" service we have prepared for you:
         *
         *      $stateProvider.state('app.blog', {
         *          url      : '/blog',
         *          views    : {
         *               'content@app': {
         *                   templateUrl: 'app/main/apps/blog/blog.html',
         *                   controller : 'BlogController as vm'
         *               }
         *          },
         *          resolve  : {
         *              Blog: function (apiResolver)
         *              {
         *                  return apiResolver.resolve('blog.list@get');
         *              }
         *          }
         *      });
         *
         *  You can even use parameters with apiResolver service:
         *
         *      $stateProvider.state('app.blog.show', {
         *          url      : '/blog/:id',
         *          views    : {
         *               'content@app': {
         *                   templateUrl: 'app/main/apps/blog/blog.html',
         *                   controller : 'BlogController as vm'
         *               }
         *          },
         *          resolve  : {
         *              Blog: function (apiResolver, $stateParams)
         *              {
         *                  return apiResolver.resolve('blog.getById@get', {'id': $stateParams.id);
         *              }
         *          }
         *      });
         *
         *  And the "Blog" object will be available in your BlogController:
         *
         *      function BlogController(Blog)
         *      {
         *          var vm = this;
         *
         *          // Data
         *          vm.blog = Blog;
         *
         *          ...
         *      }
         */

        var api = {};

        // Base Url
        api.baseUrl = 'app/data/';

        /**
         * Here you can find all the definitions that the Demo Project requires
         *
         * If you wish to use this method, you can create your API definitions
         * in a similar way.
         */

        /*
         api.dashboard = {
         project  : $resource(api.baseUrl + 'dashboard/project/data.json'),
         server   : $resource(api.baseUrl + 'dashboard/server/data.json'),
         analytics: $resource(api.baseUrl + 'dashboard/analytics/data.json')
         };

         api.cards = $resource(api.baseUrl + 'cards/cards.json');

         api.fileManager = {
         documents: $resource(api.baseUrl + 'file-manager/documents.json')
         };

         api.ganttChart = {
         tasks: $resource(api.baseUrl + 'gantt-chart/tasks.json'),
         timespans : $resource(api.baseUrl + 'gantt-chart/timespans.json')
         };

         api.icons = $resource('assets/icons/selection.json');

         api.invoice = $resource(api.baseUrl + 'invoice/invoice.json');

         api.mail = {
         inbox: $resource(api.baseUrl + 'mail/inbox.json')
         };

         api.profile = {
         timeline    : $resource(api.baseUrl + 'profile/timeline.json'),
         about       : $resource(api.baseUrl + 'profile/about.json'),
         photosVideos: $resource(api.baseUrl + 'profile/photos-videos.json')
         };

         api.quickPanel = {
         activities: $resource(api.baseUrl + 'quick-panel/activities.json'),
         contacts  : $resource(api.baseUrl + 'quick-panel/contacts.json'),
         events    : $resource(api.baseUrl + 'quick-panel/events.json'),
         notes     : $resource(api.baseUrl + 'quick-panel/notes.json')
         };

         api.search = {
         classic : $resource(api.baseUrl + 'search/classic.json'),
         mails   : $resource(api.baseUrl + 'search/mails.json'),
         users   : $resource(api.baseUrl + 'search/users.json'),
         contacts: $resource(api.baseUrl + 'search/contacts.json')
         };

         api.scrumboard = {
         boardList: $resource(api.baseUrl + 'scrumboard/boardList.json'),
         board    : $resource(api.baseUrl + 'scrumboard/boards/:id.json')
         };

         api.tables = {
         employees   : $resource(api.baseUrl + 'tables/employees.json'),
         employees100: $resource(api.baseUrl + 'tables/employees100.json')
         };

         api.timeline = {
         page1: $resource(api.baseUrl + 'timeline/page-1.json'),
         page2: $resource(api.baseUrl + 'timeline/page-2.json'),
         page3: $resource(api.baseUrl + 'timeline/page-3.json')
         };

         api.todo = {
         tasks: $resource(api.baseUrl + 'todo/tasks.json'),
         tags : $resource(api.baseUrl + 'todo/tags.json')
         };
         */

        return api;
    }

})();
(function ()
{
    'use strict';

    config.$inject = ["msNavigationServiceProvider", "$translatePartialLoaderProvider"];
    angular
        .module('app.setting', [
            'app.setting.general',
            'app.setting.company',
            'app.setting.location',
        ])
        .config(config);

    /** @ngInject */
    function config(msNavigationServiceProvider, $translatePartialLoaderProvider)
    {
           // Translation
        $translatePartialLoaderProvider.addPart('app/main/setting');
        // Navigation
        msNavigationServiceProvider.saveItem('setting', {
            title : 'Setting',
            group : true,
            translate: 'SETTING.SETTING_NAV',
            weight: 1
        });
    }
})();
(function ()
{
    'use strict';

    config.$inject = ["msNavigationServiceProvider", "$translatePartialLoaderProvider"];
    angular
        .module('app.contents', [
            'app.contents.teams',
            'app.contents.artists',
            'app.contents.gallery',
            'app.contents.news'
        ])
        .config(config);

    /** @ngInject */
    function config(msNavigationServiceProvider, $translatePartialLoaderProvider)
    {
           // Translation
        $translatePartialLoaderProvider.addPart('app/main/contents');
        // Navigation
        msNavigationServiceProvider.saveItem('contents', {
            title : 'Content',
            group : true,
            translate: 'CONTENTS.CONTENTS_NAV',
            weight: 2
        });
    }
})();