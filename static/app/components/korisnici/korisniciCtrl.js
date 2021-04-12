(function(angular){

    var app = angular.module("app");

    app.controller("korisniciCtrl", ["$http", 'user', function($http, user){
        var that = this;
        this.ulogovaniKorisnik = null;
        this.dobavljeniPodaci = false;
        this.socket = io();

        this.korisnici = [];
        this.uloge = ["admin", "user"];

        this.noviKorisnik = {
            "korisnicko_ime": "",
            "lozinka" : "",
            "ime" : "",
            "prezime" : "",
            "uloga" : "user"
        }

        this.dobaviKorisnike = function(){
            $http.get("/api/korisnici", {headers: {"Authorization": user.getToken()}}).then(function(response){
                that.korisnici = response.data.filter(user => user.id !== that.ulogovaniKorisnik.id);
                // console.log(that.korisnici);
                that.dobavljeniPodaci = true;
            }, function(response){
                console.log("Greska prilikom dobavljanja korisnika " + response.status);
                user.logoutHandler();
            })
        }

        this.ukloniKorisnika = function(id){
            $http.delete("/api/korisnici/"+id, {headers: {"Authorization": user.getToken()}}).then(function(response){
                that.dobaviKorisnike();
            }, function(response){
                console.log("Greska prilikom brisanja korisnika " + response.status)
            })
        }

        this.dodajKorisnika = function(){
            if(that.noviKorisnik.korisnicko_ime === '' ||
            that.noviKorisnik.lozinka === '' ||
            that.noviKorisnik.ime === '' ||
            that.noviKorisnik.prezime === ''){
                return window.alert('Popunite sva polja');
            }
            $http.post("/api/korisnici", that.noviKorisnik, {headers: {"Authorization": user.getToken()}}).then(function(response){
                that.noviKorisnik = {
                    "korisnicko_ime": "",
                    "lozinka" : "",
                    "ime" : "",
                    "prezime" : "",
                    "uloga" : "user"
                };
                that.dobaviKorisnike();
            }, function(response){
                console.log("Greska prilikom dodavanja korisnika " + response.status);
            })
        }

        this.dobaviUlogovanogKorisnika = () => {
            $http.get("/api/user", {headers: {"Authorization": user.getToken()}}).then(function(response){
                that.ulogovaniKorisnik = response.data;
                // console.log(that.ulogovaniKorisnik);
            }, function(response){
                console.log("Greska prilikom dobavljanja ulogovanog korisnika " + response.status);
                user.logoutHandler();
            })
        }

        this.dobaviUlogovanogKorisnika();
        this.dobaviKorisnike();

        this.socket.on('dodat clan', user => {
            that.dobaviKorisnike();
        });

        this.socket.on('izmenjen clan', user => {
            that.dobaviKorisnike();
        });

        this.socket.on('obrisan clan', user => {
            that.dobaviKorisnike();
        });

    }]);

})(angular);