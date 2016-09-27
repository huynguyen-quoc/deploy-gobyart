(function ()
{
    'use strict';

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