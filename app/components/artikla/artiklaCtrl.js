(function(angular){
    app = angular.module("app");

    app.controller("artiklaCtrl", ["$stateParams", "$http", 'user', function($stateParams, $http, user){

        var that = this;
        this.kopijaArtikla = {};
        this.artikal = null;
        this.ulogovaniKorisnik = null;
        this.socket = io();

        this.dobaviArtiklu = function(id){
            $http.get("/api/artikli/"+id, {headers: {"Authorization": user.getToken()}}).then(function(response){
                that.artikal = {...response.data, kolicina: +response.data['kolicina']};
                that.kopijaArtikla = {...response.data, kolicina: +response.data['kolicina']};
                // console.log(that.artikal);
            }, function(response){
                console.log("Greska prilikom dobavljanja artikle!" + response.status);
            });
        }

        this.izmeniArtiklu = function(){
            // console.log(that.kopijaArtikla);
            // console.log(that.artikal);
            if(that.kopijaArtikla.kolicina === that.artikal.kolicina &&
                that.kopijaArtikla.naziv === that.artikal.naziv &&
                that.kopijaArtikla.opis === that.artikal.opis){
                window.alert('Izmenite neko od polja');
                return;
            }
            $http.put("/api/artikli/"+$stateParams["id"], that.artikal, {headers: {"Authorization": user.getToken()}}).then(function(response){
                that.dobaviArtiklu($stateParams["id"]);
                window.alert('Artikal izmenjen');
            }, function(response){
                console.log("Greska prilikom izmeni artikle " + response.status);
            })
        }

        this.dobaviUlogovanogKorisnika = () => {
            $http.get("/api/user", {headers: {"Authorization": user.getToken()}}).then(function(response){
                that.ulogovaniKorisnik = response.data;
                // console.log(that.ulogovaniKorisnik);
            }, function(response){
                console.log("Greska prilikom dobavljanja ulogovanog korisnika " + response.status)
            })
        }

        this.dobaviUlogovanogKorisnika();
        this.dobaviArtiklu($stateParams["id"]);

        this.socket.on('izmenjen artikal', user => {
            this.dobaviArtiklu($stateParams["id"]);
        });
        
    }]);
})(angular);