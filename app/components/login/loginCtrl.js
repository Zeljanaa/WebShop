// var isAuth = false;
// var token = null;

(function(angular){
    var app = angular.module("app");

    app.controller("loginCtrl", ["$http", "$state", 'user', function($http, $state, user){
        var that = this;
        this.token = user.getToken();
        this.exiryDate = user.getExpiryDate();

        this.user = {
            username: "",
            password: "",
        }

        this.logoutHandler = () => {user.logoutHandler();};

        this.isAuth = () => {
            if(user.getToken()){
                // console.log('korisnik je logovan');
                return true;
            }
            // console.log('korisnik nije logovan');
            return false;
        };

        this.login = function(){
            $http.post("/api/login", that.user).then(response => {
                // console.log(response);

                const remainingMilliseconds = 60 * 60 * 1000;
                const expiryDate = new Date(new Date().getTime() + remainingMilliseconds);
                that.token = "JWT " + response.data.access_token;
                that.expiryDate = expiryDate;
                localStorage.setItem('expiryDate', expiryDate);
                localStorage.setItem('token', that.token);
                user.setAutoLogout(remainingMilliseconds);

                that.user.username = "";
                that.user.password = "";
                return $state.go("home");
            }, function(){
                alert("Prijava nije uspesna");
            })
        };
    }]);
})(angular);