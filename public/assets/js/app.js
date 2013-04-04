'use strict';


// Declare app level module which depends on filters, and services
angular.module('AW', ['AW.filters', 'AW.services', 'AW.directives'])
  .config(function($locationProvider, $routeProvider) {
    $locationProvider.html5Mode(true);
    
    
    $routeProvider
      .when('/', {templateUrl: 'partials/dashboard.html', controller: MyCtrl2})
      .when('/login', {templateUrl: 'partials/login.html', controller: MyCtrl2})
      .when('/customers', {templateUrl: 'partials/listCustomers.html', controller: MyCtrl2})
      .when('/customer/new', {templateUrl: 'partials/newCustomer.html', controller: MyCtrl1})
      .when('/orders', {templateUrl: 'partials/listOrders.html', controller: MyCtrl2})
      .when('/order/new', {templateUrl: 'partials/newOrder.html', controller: MyCtrl1})
      .when('/account', {templateUrl: 'partials/account.html', controller: MyCtrl1})
      .when('/settings', {templateUrl: 'partials/settings.html', controller: MyCtrl2})
      .otherwise({redirectTo: '/404'});
});

/*
$rootScope.$on("$routeChangeStart", function (event, next, current) {
    if (!(next.$route.access & $rootScope.isAuthenticated)) {
        if($rootScope.isAuthenticated) {
            $location.path('/');
        }
        else {
            $location.path('/login');
        }
    }
});
*/