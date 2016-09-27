(function ()
{
    'use strict';

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
                Teams: function (msApi, $stateParams, pageSize){
                    return msApi.resolve('teams.teams@query',  { page : $stateParams.page, page_size : pageSize});
                },
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