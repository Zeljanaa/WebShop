(function (angular) {

    var app = angular.module("app");

    app.controller("prodavnicaCtrl", ["$http", "$scope", 'user', function ($http, $scope, user) {
        var that = this;
        this.roba = [];
        this.robaSaParametrimaPretrage = [];
        this.pretragaPoParametrima = false;
        this.korisnicko = {korisnicko_ime: "", lozinka: ""}
        this.ulogovaniKorisnik = null;
        this.dobavljeniPodaci = false;
        this.socket = io();
        this.dobavitiPrekoSoketa = false;

        this.novaRoba = {
            "naziv": "",
            "kolicina": 0,
            "opis": ""
        }

        this.parametriPretrage = {
            naziv: "",
            kolicinaOd: undefined,
            kolicinaDo: undefined
        };

        // SORTIRANJE MRTVO
        this.sortColumn = "naziv";

        this.logout = function() {
            $http.get("/api/logout").then(function(){
                that.dobaviRobu();
            }, function() {

            })
        }

        this.showPretraguSaParametrima = () => {
            // console.log(that.robaSaParametrimaPretrage);
            // console.log(that.roba);
        }

        this.dobaviRobu = function() {
            $http.get("/api/artikli", {params: that.parametriPretrage, headers: {"Authorization": user.getToken()}}).then(function(response){
                response.data = response.data.map(r => {
                    let a = {...r};
                    a.kolicina = +r.kolicina;                    
                    return a;
                });
                if(that.dobavitiPrekoSoketa){
                    that.roba = response.data;
                    that.robaSaParametrimaPretrage = response.data;
                    that.dobavitiPrekoSoketa = false;
                    return;
                }
                if(that.parametriPretrage.naziv === "" &&
                that.parametriPretrage.kolicinaOd === undefined &&
                that.parametriPretrage.kolicinaDo === undefined){
                    that.roba = response.data;
                    that.pretragaPoParametrima = false;
                    that.dobavljeniPodaci = true;
                } else {
                    that.parametriPretrage = {
                        naziv: "",
                        kolicinaOd: undefined,
                        kolicinaDo: undefined
                    }
                    that.robaSaParametrimaPretrage = response.data;
                    that.pretragaPoParametrima = true;
                }
                // console.log("Roba");
                // console.log(that.roba);
                // console.log("Roba sa pretragom");
                // console.log(that.robaSaParametrimaPretrage);
                // console.log("Pretraga po parametrima? :");
                // console.log(that.pretragaPoParametrima);
            }, function(response) {
                console.log("Greska pri dobavljanju robe! Kod: " + response.status);
                if(response.status === 401){
                    user.logoutHandler();
                }
            })
        }

        this.ukloniRobu = id => {
            $http.delete("/api/artikli/"+id, {headers: {"Authorization": user.getToken()}}).then(function(response){
                that.dobaviRobu();
            }, function(response){
                console.log("Greska pri uklanjanju robe! Kod: " + response.status);
            });
        }


        this.dodajRobu = function() {
            if(that.novaRoba.naziv === '' || that.novaRoba.opis === ''){
                return window.alert('Popunite sva polja');
            }
            $http.post("/api/artikli", that.novaRoba, {headers: {"Authorization": user.getToken()}}).then(function(response){
                that.novaRoba = {
                    "naziv": "",
                    "kolicina": 0,
                    "opis": ""
                };
                that.dobaviRobu();
            }, function(response){
                console.log("Greska pri dodavanju robe! Kod: " + response.status);
            });
        }

        this.dobaviUlogovanogKorisnika = () => {
            $http.get("/api/user", {headers: {"Authorization": user.getToken()}}).then(function(response){
                that.ulogovaniKorisnik = response.data;
                // console.log(that.ulogovaniKorisnik);
                that.socket.on('connect', () => {
                    that.socket.emit('connection', {data: response.data});
                });
            }, function(response){
                console.log("Greska prilikom dobavljanja ulogovanog korisnika " + response.status)
            })
        }
        
        this.dobaviUlogovanogKorisnika();
        this.dobaviRobu();

        this.socket.on('dodat artikal', user => {
            // console.log(that.ulogovaniKorisnik);
            // console.log(user);
            if(user.id === that.ulogovaniKorisnik.id){
                return;
            }
            // window.alert('Doslo je do izmena podataka o robi');
            that.dobavitiPrekoSoketa = true;
            that.dobaviRobu();
        });

        this.socket.on('obrisan artikal', user => {
            // console.log(that.ulogovaniKorisnik);
            // console.log(user);
            if(user.id === that.ulogovaniKorisnik.id){
                return;
            }
            // window.alert('Doslo je do izmena podataka o robi');
            that.dobavitiPrekoSoketa = true;
            that.dobaviRobu();
        });

        this.socket.on('izmenjen artikal', user => {
            // console.log(that.ulogovaniKorisnik);
            // console.log(user);
            if(user.id === that.ulogovaniKorisnik.id){
                return;
            }
            // window.alert('Doslo je do izmena podataka o robi');
            that.dobavitiPrekoSoketa = true;
            that.dobaviRobu();
        });
    }]);
})(angular);