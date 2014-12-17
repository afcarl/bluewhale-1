(function () {
  'use strict';

  angular.module('dockerboard.services')
    .factory('Images', ['$resource', function ($resource) {
      var res = $resource('/api/images/:id');

      res.queryParams = {
        all: false,
        filters: ''
      };

      res.basicAttributes = [
        'Id',
        'Author',
        'Comment',
        'DockerVersion',
        'Architecture',
        'Os',
        'Size',
        'VirtualSize',
        'Created',
        'Parent'
      ];
      return res;
    }]);

})();
