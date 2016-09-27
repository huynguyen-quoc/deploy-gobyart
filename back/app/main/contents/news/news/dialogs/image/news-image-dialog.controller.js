(function ()
{
    'use strict';

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