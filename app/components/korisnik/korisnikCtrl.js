(function(angular){

    angular.module("app").controller("korisnikCtrl", ["$stateParams", "$http", 'user', '$state', function($stateParams, $http, user, $state){

        var that = this;
        this.ulogovaniKorisnik = null;
        this.kopijaKorisnika = {};
        this.korisnik = null;
        this.uloge = ["user"];
        this.socket = io();

        this.dobaviKorisnika = function(id){
            $http.get("/api/korisnici/"+id, {headers: {"Authorization": user.getToken()}}).then(function(response){
                if(response.data === null) {
                    return $state.go("korisnici");
                }
                that.korisnik = {...response.data};
                that.kopijaKorisnika = {...response.data};
                // console.log(response.data);
                
            }, function(response){
                console.log("Greska kod dobavljanja korisnika zasebno " + response.status);                
            })
        }

        this.izmeniKorisnika = function(){
            if(that.kopijaKorisnika.ime === that.korisnik.ime &&
                that.kopijaKorisnika.korisnicko_ime === that.korisnik.korisnicko_ime &&
                that.kopijaKorisnika.lozinka === that.korisnik.lozinka &&
                that.kopijaKorisnika.prezime === that.korisnik.prezime &&
                that.kopijaKorisnika.uloga === that.korisnik.uloga){
                window.alert('Izmenite neko od polja');
                return;
            }
            $http.put("/api/korisnici/"+that.korisnik.id, that.korisnik, {headers: {"Authorization": user.getToken()}}).then(function(response){
                that.dobaviKorisnika(that.korisnik.id);
                window.alert('Korisnik izmenjen');
            }, function(response){
                console.log("Greska pri izmeni korisnika");
            })
        }

        this.dobaviUlogovanogKorisnika = () => {
            $http.get("/api/user", {headers: {"Authorization": user.getToken()}}).then(function(response){
                that.ulogovaniKorisnik = response.data;
                // console.log(that.ulogovaniKorisnik);
                if(that.ulogovaniKorisnik.uloga === "admin"){
                    that.uloge.push("admin");
                }
            }, function(response){
                console.log("Greska prilikom dobavljanja ulogovanog korisnika " + response.status);
                user.logoutHandler();
            })
        }

        this.dobaviUlogovanogKorisnika();
        this.dobaviKorisnika($stateParams["id"]);

        this.socket.on('izmenjen clan', user => {
            // console.log(that.ulogovaniKorisnik);
            // console.log(user);
            if(user.id === that.ulogovaniKorisnik.id){
                return;
            }
            that.dobaviKorisnika($stateParams["id"]);
        });

        this.socket.on('obrisan clan', user => {
            // console.log(that.ulogovaniKorisnik);
            // console.log(user);
            if(user.id === that.ulogovaniKorisnik.id){
                return;
            }
            that.dobaviUlogovanogKorisnika();
            that.dobaviKorisnika($stateParams["id"]);
        });

    }]);

})(angular);