(function () {
'use strict';

dockerboardApp.registerModule('images.ctrl');

angular.module('images.ctrl')
  .controller('ImagesCtrl', ImagesController)
  .controller('ImageCtrl', ImageController)
  .controller('ImageHistoryCtrl', ImageHistoryController)
  .controller('ImageCreateCtrl', ImageCreateController)
  .config(['$stateProvider',
    function ($stateProvider) {
      $stateProvider.
        state('images', {
          url: '/images',
          templateUrl: '/js/modules/images/views/images.tpl.html'
        })
        .state('imageItem', {
          url: '/images/{Id}',
          templateUrl: '/js/modules/images/views/image.tpl.html'
        })
        .state('imageHistory', {
          url: '/images/{Id}/history',
          templateUrl: '/js/modules/images/views/image.history.tpl.html'
        });
    }
  ]);

ImagesController.$inject = ['$scope', '$mdDialog', 'Images', 'Hosts'];
function ImagesController($scope, $mdDialog, Images, Hosts) {

  $scope.queryParams = Images.queryParams;
  $scope.queryParams.host = Hosts.getCurrentHostUrl();

  $scope.queryParamsFilters = '';

  $scope.fetch = function () {
    $scope.queryParams.filters = parseFilters($scope.queryParamsFilters);
    Images.query($scope.queryParams, function (data) {
      $scope.images = data;
    });
  };

  function parseFilters(text) {
    if (!text) return '';
    var filters = {};
    var arr = text.split(/\s+/g);
    for (var i = 0, l = arr.length; i < l; ++i) {
      var f = arr[i].split('=');
      if (f.length !== 2) {
        continue;
      }
      var name = f[0];
      var value = f[1];
      if (name && value) {
        filters[name] = filters[name] || [];
        filters[name].push(value);
      }
    }
    return JSON.stringify(filters);
  }

  $scope.fetch();

  $scope.search = function () {
    $scope.fetch();
  };

  $scope.getRepo = function (tags) {
    var repo = '';
    if (tags.length) {
      repo = tags[0].split(':')[0];
    }
    return repo;
  };

  $scope.getTags = function (repos) {
    var tags = [];
    angular.forEach(repos, function (value) {
      var tag = value.split(':')[1];
      if (tag) this.push(tag);
    }, tags);
    return tags.join(', ');
  };


  $scope.push = function (ev) {
    $mdDialog.show({
      controller: PushDialogController,
      templateUrl: '/js/modules/images/views/image.push.dialog.tpl.html',
      targetEvent: ev
    });
  };
}

ImageController.$inject = ['$scope', '$location', '$stateParams', '$mdDialog', 'limitToFilter', 'amTimeAgoFilter', 'prettyBytesFilter', 'Images', 'ImageActions', 'Hosts'];
function ImageController($scope, $location, $stateParams, $mdDialog, limitToFilter, amTimeAgoFilter, prettyBytesFilter, Images, ImageActions, Hosts) {
  // Fix contains `/` issue.
  $stateParams.Id = $stateParams.Id.replace(/%(25)/g, '%').replace(/\//g, '%2F');

  $scope.tabs = [
    {
      title: 'Normal'
    },
    {
      title: 'Base'
    }
  ];

  $scope.basicAttributes = [];

  function formatBasicAttributes(image) {
    angular.forEach(Images.basicAttributes, function (k) {
      var v = image[k];
      if (k === 'Id' || k === 'Parent') {
        v = limitToFilter(v, 12);
        var href = '#/images/' + v;
        v = '<a ng-href="' + href + '" href="' + href + '">' + v + '</a>';
      } else if (k === 'Size' || k === 'VirtualSize') {
        v = prettyBytesFilter(v);
      } else if (k === 'Created') {
        v = amTimeAgoFilter(v, true);
      }

      this.push({
        key: k,
        value: v
      });
    }, $scope.basicAttributes);
  }

  Images.get({Id: $stateParams.Id, host: Hosts.getCurrentHostUrl()}, function (data) {
    formatBasicAttributes(data);
    $scope.image = data;
    $scope.imageShortId = limitToFilter(data.Id, 12);
  }, function (e) {
    if (e.status === 404) {
      $location.path('/images');
    }
  });

  $scope.destory = function (ev) {
    $mdDialog.show({
      controller: DestoryDialogController,
      templateUrl: '/js/modules/images/views/image.destory.dialog.tpl.html',
      locals: { image: $scope.image, imageShortId: $scope.imageShortId },
      targetEvent: ev,
    });
  };

  $scope.tag = function (ev) {
    $mdDialog.show({
      controller: TagDialogController,
      templateUrl: '/js/modules/images/views/image.tag.dialog.tpl.html',
      locals: { image: $scope.image, imageShortId: $scope.imageShortId },
      targetEvent: ev,
    });
  };
}

DestoryDialogController.$inject = ['$scope', '$location', '$mdDialog', 'Images', 'image', 'imageShortId', 'Hosts'];
function DestoryDialogController($scope, $location, $mdDialog, Images, image, imageShortId, Hosts) {
  $scope.image = image;
  $scope.imageShortId = imageShortId;

  $scope.cancel = function () {
    $mdDialog.cancel();
  };

  $scope.params = {
    force: false,
    noprune: false
  };

  $scope.content = '';

  $scope.ok = function () {
    Images.delete(
      {
        Id: $scope.imageShortId,
        force: $scope.params.force,
        noprune: $scope.params.noprune,
        host: Hosts.getCurrentHostUrl()
      },
      null,
      function (data) {
        $scope.cancel();
        $location.path('/images');
      },
      function (e) {
        if (e.status === 404) {
          $scope.cancel();
          $location.path('/images');
          return;
        }
        $scope.content = e.data;
      }
    );
  };
}


ImageHistoryController.$inject = ['$scope', '$stateParams', 'ImageActions', 'Hosts'];
function ImageHistoryController($scope, $stateParams, ImageActions, Hosts) {
  $scope.imageShortId = $stateParams.Id;
  ImageActions.history(
    { Id: $scope.imageShortId, host: Hosts.getCurrentHostUrl() },
    function (data) {
      $scope.commits = data;
    },
    function (e) {
    }
  );
}

TagDialogController.$inject = ['$scope', '$mdDialog', 'ImageActions', 'Hosts', 'image', 'imageShortId'];
function TagDialogController($scope, $mdDialog, ImageActions, Hosts, image, imageShortId) {
  $scope.image = image;
  $scope.imageShortId = imageShortId;
  $scope.action = 'tag';

  $scope.cancel = function () {
    $mdDialog.cancel();
  };

  $scope.queryParams = {
    force: false,
    repo: '',
    tag: ''
  };

  $scope.content = '';

  $scope.ok = function () {
    var queryParams = {
      Id: $scope.imageShortId,
      action: $scope.action,
      host: Hosts.getCurrentHostUrl()
    };
    angular.extend(queryParams, $scope.queryParams);
    ImageActions.update(
      queryParams,
      null,
      function (data) {
        $mdDialog.hide();
      },
      function (e) {
        if (e.status === 404) {
          $mdDialog.hide();
          return;
        }
        $scope.content = e.data;
      }
    );
  };
}

PushDialogController.$inject = ['$scope', '$mdDialog', 'ImageActions', 'Hosts'];
function PushDialogController($scope, $mdDialog, ImageActions, Hosts) {
  $scope.action = 'push';

  $scope.cancel = function () {
    $mdDialog.cancel();
  };

  $scope.queryParams = {
    tag: ''
  };

  // Authorization
  $scope.username = '';
  $scope.password = '';

  $scope.content = '';

  $scope.ok = function () {
    if ($scope.repository) {
      var queryParams = {
        Id: encodeURIComponent($scope.repository),
        host: Hosts.getCurrentHostUrl()
      };
      angular.extend(queryParams, $scope.queryParams);
      ImageActions.push(
        queryParams,
        {
          username: $scope.username,
          password: $scope.password
        },
        function (data) {
          $mdDialog.hide();
        },
        function (e) {
          if (e.status === 404) {
            $mdDialog.hide();
            return;
          }
          $scope.content = e.data;
        }
      );
    }
  };
}

ImageCreateController.$inject = ['$scope', '$mdDialog', 'imageObject', 'Images'];
function ImageCreateController($scope, $mdDialog, imageObject, Images) {

  $scope.image = angular.copy(imageObject);

  $scope.queryParams = {
    fromImage: $scope.image.name,
    fromSrc: '',
    repo: '',
    tag: '',
    registry: ''
  };

  $scope.content = '';

  $scope.cancel = function () {
    $mdDialog.cancel();
  };

  $scope.ok = function () {
    Images.create(
      $scope.queryParams,
      null,
      function (data) {
        $mdDialog.hide();
      },
      function (e) {
        if (e.status === 404) {
          $mdDialog.hide();
          return;
        }
        $scope.content = e.data;
      }
    );
  };

}

})();
