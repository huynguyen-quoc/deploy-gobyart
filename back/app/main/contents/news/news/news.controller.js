(function ()
{
    'use strict';

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