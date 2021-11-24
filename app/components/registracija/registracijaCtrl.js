(function(angular){

    angular.module('app').controller("registracijaCtrl", ["$http", "$state", function($http, $state){

        var that = this;

        this.noviKorisnik = {
            "korisnicko_ime" : "",
            "lozinka" : "",
            "ime" : "",
            "prezime" : "",
            "uloga" : "user"
        };

        this.registration = function(){
            $http.post("/api/registracija", that.noviKorisnik).then(function(){
                alert("Uspesna registracija");
                $state.go("login");
            }, function(){
                alert("Neuspesna registracija, moguce da je korisnicko ime zauzeto");
            })
        };

    }]);

})(angular);