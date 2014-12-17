(function () {
'use strict';

dockerboardApp.registerModule('containers.ctrl');

angular.module('containers.ctrl')
  .controller('ContainersCtrl', ContainersController)
  .controller('ContainerCtrl', ContainerController)
  .config(['$stateProvider',
    function ($stateProvider) {
      $stateProvider.
        state('containers', {
          url: '/containers',
          templateUrl: '/js/modules/containers/views/containers.tpl.html'
        })
        .state('containeritem', {
          url: '/containers/:id',
          templateUrl: '/js/modules/containers/views/container.tpl.html'
        });
    }
  ]);

ContainersController.$inject = ['$scope', 'Containers'];
function ContainersController($scope, Containers) {

  $scope.queryParams = Containers.queryParams;

  $scope.fetch = function () {
    Containers.query($scope.queryParams, function (data) {
      $scope.containers = data;
    });
  };

  $scope.fetch();

  $scope.search = function () {
    $scope.fetch();
  }
}

ContainerController.$inject = ['$scope', '$stateParams', 'limitToFilter', 'dateFilter', 'Containers'];
function ContainerController($scope, $stateParams, limitToFilter, dateFilter, Containers) {
  Containers.get({id: $stateParams.id}, function (data) {
    formatBasicAttributes(data);
    $scope.container = data;
  });

  $scope.basicAttributes = [];

  function formatBasicAttributes(container) {
    angular.forEach(Containers.basicAttributes, function (k) {
      var v = container[k];
      if (k === 'Id' || k === 'Image') {
        v = limitToFilter(v, 12);
        var href = '#/';
        href += (k === 'Id' ? 'containers/' : 'images/') + v;
        v = '<a ng-href="' + href + '" href="' + href + '">' + v + '</a>';
      } else if (k === 'Created') {
        v = dateFilter(v, 'yyyy-MM-dd HH:mm:ss Z');
      }

      this.push({
        key: k,
        value: v
      });
    }, $scope.basicAttributes);
  }
}
})();
