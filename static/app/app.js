(function(angular){
    var app = angular.module("app", ["ui.router"]);

    app.factory('user', ['$state', '$http', function($state, $http){
        console.log("user factory inicijalizovan");

        function logoutHandler() {
            $http.get("/api/logout").then(function(response){
                console.log('izvrsava se logoutHandler');
                localStorage.removeItem('token');
                localStorage.removeItem('expiryDate');
                $state.go("login");
            }, function(response){
                console.log("Greska prilikom logout-a ulogovanog korisnika " + response.status)
            })
            
        }

        function setAutoLogout(milliseconds) {
            console.log("timer postavljen za auto logout, vreme: " + milliseconds);
            setTimeout(()=>{
                // console.log(that.loggedIn);
                logoutHandler();
            }, milliseconds);
        }

        function token() {
            return localStorage.getItem('token') ? localStorage.getItem('token') : null
        }

        function expiryDate() {
            return localStorage.getItem('expiryDate') ? localStorage.getItem('expiryDate') : null
        }

        function autoLogin() {
            console.log('izvrsava se autoLogin');
            if(!token() || !expiryDate()){
                // mislim da to ne treba
                // return $state.go("login");
            } else {
                if(new Date(this.expiryDate) <= new Date()){
                    logoutHandler();
                    return;
                }
                let remainingTime = new Date(expiryDate()).getTime() - new Date().getTime();
                setAutoLogout(remainingTime); // u ms
            }
        }

        return {
            getToken: function() {
                return localStorage.getItem('token') ? localStorage.getItem('token') : null
            },
            getExpiryDate: function() {
                return localStorage.getItem('expiryDate') ? localStorage.getItem('expiryDate') : null
            },
            setAutoLogout: setAutoLogout,
            logoutHandler: logoutHandler,
            autoLogin: autoLogin
        };
    }])
    /**
     * ovaj deo se izvrsava sa svakim reload-om i imas autoLogin
     * koji dobavlja ponovo podatke i prikazuju se dalje,
     * a ta f-ja ti je u servisu koji je registrovan gore
     */
    .run(['user', function(user){
        user.autoLogin();
    }])

    app.factory('authService', ['$q', 'user', function($q, user){
        console.log("authService factory inicijalizovan");
        return {
            authenticate: function() {
                // logic
                this.token = user.getToken();
                this.expiryDate = user.getExpiryDate();
                // console.log(this.token);
                // console.log(this.expiryDate);
                if(this.token && this.expiryDate){
                    if(new Date(this.expiryDate) > new Date()){
                        return $q.resolve('AUTH');
                    }
                }
                return $q.reject('AUTH_REQUIRED');
            }
        }
    }])

    app.directive("loader", function ($rootScope) {
        return function ($scope, element, attrs) {
            // console.log("POSTAVLJENA DIREKTIVA");
            // console.log(element);
            $scope.$on("loader_show", function () {
                // console.log("SHOW SPINNER");
                return element.show();
            });
            return $scope.$on("loader_hide", function () {
                // console.log("HIDE SPINNER");
                // element.addClass('hidden');
                // console.log(element);
                return element.hide();
            });
        };
    })

    app.factory('httpInterceptor', function ($q, $rootScope, $log) {
        var numLoadings = 0;
        var poslatiZahtevi = 0;
        var primljeniOdgovori = 0;
        return {
            request: function (config) {
                // console.log("Poslat zahtev: ");
                poslatiZahtevi++;
                //console.log(config);
                console.log('br poslatih zahteva: ' + poslatiZahtevi);
                numLoadings++;

                // Show loader
                $rootScope.$broadcast("loader_show");
                return config || $q.when(config)

            },
            response: function (response) {
                // console.log("Primljen zahtev: ");
                // console.log(response);
                primljeniOdgovori++;
                console.log('br primljenih odgovora: ' + primljeniOdgovori);
                if ((--numLoadings) === 0) {
                    // Hide loader
                    $rootScope.$broadcast("loader_hide");
                }

                return response || $q.when(response);

            },
            responseError: function (response) {
                // console.log("Primljen zahtev: ");
                // console.log(response);
                primljeniOdgovori++;
                console.log('br primljenih odgovora: ' + primljeniOdgovori);
                if (!(--numLoadings)) {
                    // Hide loader
                    $rootScope.$broadcast("loader_hide");
                }

                return $q.reject(response);
            }
        };
    })

    app.config(["$stateProvider", "$urlRouterProvider", '$httpProvider', function($stateProvider, $urlRouterProvider, $httpProvider){
        $httpProvider.interceptors.push('httpInterceptor');
        $stateProvider
        .state({
            name: "home",
            url: "/home",
            templateUrl: "/app/components/prodavnica/prodavnica.tpl.html",
            controller: "prodavnicaCtrl",
            controllerAs: "mc",
            resolve: {
                currentAuth: function(authService, $state){
                    return authService.authenticate().then(response => {
                        // console.log('nije odbijen');
                        return $state.go("home");
                    }, () => {
                        // console.log('odbijen');
                        return $state.go("login", {});
                    });
                }
            }
        })
        .state("login", {
            url: "/login",
            templateUrl: "/app/components/login/login.tpl.html",
            controller: "loginCtrl",
            controllerAs: "lc",
            resolve: {
                currentAuth: function(authService, $state){
                    return authService.authenticate().then(response => {
                        // console.log('nije odbijen');
                        return $state.go("home");
                    }, () => {
                        // console.log('odbijen');
                        return $state.go("login");
                    });
                }
            }
        })
        .state("artikal", {
            url: "/artikli/{id: int}",
            templateUrl: "/app/components/artikla/artikla.tpl.html",
            controller: "artiklaCtrl",
            controllerAs: "sc",
            resolve: {
                currentAuth: function(authService, $state, $stateParams){
                    return authService.authenticate().then(response => {
                        // console.log('nije odbijen');
                        return $state.go("artikal", {"id": +$stateParams.id});
                    }, () => {
                        // console.log('odbijen');
                        return $state.go("login", {});
                    });
                }
            }
        })
        .state({
            name: "korisnici",
            url: "/korisnici",
            templateUrl: "/app/components/korisnici/korisnici.tpl.html",
            controller: "korisniciCtrl",
            controllerAs: "kc",
            resolve: {
                currentAuth: function(authService, $state){
                    return authService.authenticate().then(response => {
                        // console.log('nije odbijen');
                        return $state.go("korisnici");
                    }, () => {
                        // console.log('odbijen');
                        return $state.go("login", {});
                    });
                }
            }
        })
        .state({
            name: "korisnik",
            url: "/korisnici/{id: int}",
            templateUrl: "/app/components/korisnik/korisnik.tpl.html",
            controller: "korisnikCtrl",
            controllerAs: "kc",
            resolve: {
                currentAuth: function(authService, $state, $stateParams){
                    return authService.authenticate().then(response => {
                        return $state.go("korisnik", {"id": +$stateParams.id});
                    }, () => {
                        // console.log('odbijen');
                        return $state.go("login", {});
                    });
                }
            }
        })
        .state({
            name: "kupovina",
            url: "/kupovina",
            templateUrl: "/app/components/kupovina/kupovina.tpl.html",
            controller: "kupovinaCtrl",
            controllerAs: "kuc",
            resolve: {
                currentAuth: function(authService, $state){
                    return authService.authenticate().then(response => {
                        // console.log('nije odbijen');
                        return $state.go("kupovina");
                    }, () => {
                        // console.log('odbijen');
                        return $state.go("login", {});
                    });
                }
            }
        })
        .state({
            name: "registracija",
            url : "/registracija",
            templateUrl: "/app/components/registracija/registracija.tpl.html",
            controller: "registracijaCtrl",
            controllerAs: "rc"
        });

        $urlRouterProvider.otherwise("/login");

    }]);
})(angular);