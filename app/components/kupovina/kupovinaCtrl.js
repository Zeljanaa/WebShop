(function(angular){
    angular.module('app').controller("kupovinaCtrl", ["$http", 'user', function($http, user) {
        var that = this;

        this.prozivodi = [];
        this.korpa = [];
        this.kupljeno = [];
        this.izabraniProizvod = null;
        this.nazivProizvoda = "";
        this.socket = io();
        this.ulogovaniKorisnik = null;

        this.artikli = [];
        this.narucivanja = [];

        this.novoNarucivanje = {
            "kolicina": 1,
            "korisnik": null,
            "artikli": null
        }

        this.novoNarucivanje1 = {
            "naziv": "",
            "kolicina": 1,
            "opis" : ""
        }

        this.dobaviRobu = function() {
            $http.get("/api/artikli", {headers: {"Authorization": user.getToken()}}).then(function(response){
                // console.log(response.data);
                that.prozivodi = response.data;
            }, function(response) {
                console.log("Greska pri dobavljanju robe! Kod: " + response.status);
                if(response.status === 401){
                    user.logoutHandler();
                }
            })
        }

        this.dobaviKupljeno = function() {
            $http.get("/api/kupljeno", {headers: {"Authorization": user.getToken()}}).then(function(response){
                // console.log(response.data);
                that.kupljeno = response.data;
            }, function(response) {
                console.log("Greska pri dobavljanju kupljene robe! Kod: " + response.status);
                if(response.status === 401){
                    user.logoutHandler();
                }
            })
        }

        this.dobaviIzabraniProizvod = ($event) => {
            // console.log(document.getElementById('kolicina'));
            // console.log($event);
            that.izabraniProizvod = that.prozivodi.filter(p => p.naziv === that.nazivProizvoda)[0];
            // console.log(that.izabraniProizvod);
        }

        this.dodajUKorpu = () => {
            $http.put("/api/proveriKolicinu", {proizvod: that.izabraniProizvod, kolicina: +document.getElementById('kolicina').value}, {headers: {"Authorization": user.getToken()}}).then(function(response){
                if(response.data === 'true'){
                    that.prozivodi = that.prozivodi.filter(p => p.idartikli !== that.izabraniProizvod.idartikli);
                    let proizvod = {...that.izabraniProizvod};
                    proizvod.izabranaKolicina = +document.getElementById('kolicina').value;
                    that.korpa.push(proizvod);
                    that.izabraniProizvod = null;
                    that.nazivProizvoda = "";
                }
                // console.log(that.korpa);
            }, function(response) {
                console.log("Greska pri proveri kolicine! Kod: " + response.status);
            })
        }

        this.ukloniIzKorpe = id => {
            that.korpa = that.korpa.filter(k => {
                if(k.idartikli !== id){
                    return k;
                }
                that.prozivodi.push(k);
            });
        }

        this.plati = () => {
            $http.post("/api/plati", that.korpa, {headers: {"Authorization": user.getToken()}}).then(function(response){
                // console.log(response.data);
                that.korpa = [];
                that.dobaviRobu();
                that.dobaviKupljeno();
            }, function(response) {
                console.log("Greska pri placanju! Kod: " + response.status);
            })
        }

        this.dobaviUlogovanogKorisnika = () => {
            $http.get("/api/user", {headers: {"Authorization": user.getToken()}}).then(function(response){
                that.ulogovaniKorisnik = response.data;
            }, function(response){
                console.log("Greska prilikom dobavljanja ulogovanog korisnika " + response.status)
            })
        }

        this.dobaviUlogovanogKorisnika();

        this.dobaviRobu();
        this.dobaviKupljeno();

        this.socket.on('izmenjen artikal', user => {
            // console.log(that.ulogovaniKorisnik);
            // console.log(user);
            if(user.id === that.ulogovaniKorisnik.id){
                return;
            }            
            that.korpa = [];
            that.dobaviRobu();
            // window.alert('Doslo je do izmena podataka o robi. Vasa korpa je sada prazna.');
            // that.dobaviKupljeno();
        });

        this.socket.on('obrisan artikal', user => {
            // console.log(that.ulogovaniKorisnik);
            // console.log(user);
            if(user.id === that.ulogovaniKorisnik.id){
                return;
            }
            that.korpa = [];
            that.dobaviRobu();
            // window.alert('Doslo je do izmena podataka o robi. Vasa korpa je sada prazna.');
            // that.dobaviKupljeno();
        });

        this.socket.on('dodat artikal', user => {
            that.dobaviRobu();
        });
    }]);
})(angular);