(function ()
{
    'use strict';

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