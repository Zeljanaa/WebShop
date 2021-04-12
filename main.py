import flask
import datetime
import eventlet
eventlet.monkey_patch()

from flask import Flask, request, redirect, url_for
from flask_jwt import JWT, jwt_required, current_identity
from utils import mysql_db, app, socketio, bcrypt, disconnect

# importovanje blueprintova
from user_blueprint import user_blueprint
from artikli_blueprint import artikli_blueprint

# Registrujemo blueprinte za korisnike i artikli
app.register_blueprint(user_blueprint, url_prefix="/api/korisnici")
app.register_blueprint(artikli_blueprint, url_prefix="/api/artikli")

# KONFIGURACIJA MYSQL BAZE
app.config["MYSQL_DATABASE_USER"] = 'root'
app.config["MYSQL_DATABASE_PASSWORD"] = 'lakisa'
app.config["MYSQL_DATABASE_DB"] = 'mydb2'

mysql_db.init_app(app)

app.config["JWT_AUTH_URL_RULE"] = '/api/login' 
app.config["JWT_EXPIRATION_DELTA"] = datetime.timedelta(seconds=3600)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5000')
    response.headers.add('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Accept, Content-Type, Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'false')
    return response

def authenticate(username, password):
    cr = mysql_db.get_db().cursor()
    cr.execute("SELECT * FROM korisnici WHERE korisnicko_ime=%s", (username, ))
    korisnik = cr.fetchone()
    if korisnik and bcrypt.check_password_hash(korisnik['lozinka'], password):
        return korisnik

def identity(payload):
    user_id = payload['identity']
    cr = mysql_db.get_db().cursor()
    cr.execute("SELECT * FROM korisnici WHERE id=%s", (user_id, ))
    korisnik = cr.fetchone()
    return korisnik

jwt = JWT(app, authenticate, identity)

@app.route('/api/user')
@jwt_required()
def get_logged_in_user():
    # print(current_identity)
    korisnik = {
        'id': current_identity['id'],
        'uloga': current_identity['uloga'],
        'korisnicko_ime': current_identity['korisnicko_ime'],
        'ime': current_identity['ime'],
        'prezime': current_identity['prezime']
    }
    return flask.json.jsonify(korisnik)

# Ruta za index, tj. home page
@app.route("/")
@app.route("/index")
def index():
    return app.send_static_file("index.html")

# REGISTRACIJA
@app.route("/api/registracija", methods=["POST"])
def registracija():
    data = dict(request.json)
    pw_hash = bcrypt.generate_password_hash(data['lozinka'], 12)
    data['lozinka'] = pw_hash
    db = mysql_db.get_db()
    cr = db.cursor()
    cr.execute("INSERT INTO korisnici (korisnicko_ime, lozinka, ime, prezime, uloga) VALUES(%(korisnicko_ime)s, %(lozinka)s, %(ime)s, %(prezime)s, %(uloga)s)",(data))
    db.commit()
    return "", 200

# logout
@app.route("/api/logout", methods=["GET"])
def logout():
    print('Client disconnected')
    return "", 200

@app.route("/favicon.ico", methods=["GET"])
def favicon():
    return "", 200

@app.route("/api/kupljeno", methods=["GET"])
@jwt_required()
def dobavi_kupljeno():
    cr = mysql_db.get_db().cursor()
    cr.execute("SELECT *, prodato.kolicina as kolicina_kupljena FROM prodato INNER JOIN artikli on artikli.idartikli = prodato.artikli_idartikli WHERE korisnici_idkorisnici=" + str(current_identity['id']))
    kupljeno = cr.fetchall()
    return flask.json.jsonify(kupljeno)

@app.route("/api/proveriKolicinu", methods=["PUT"])
@jwt_required()
def proveri_kolicinu():
    # print(request.json)
    data = dict(request.json)
    # print(data["proizvod"]["kolicina"])
    if int(data["proizvod"]["kolicina"]) < data["kolicina"]:
        return "false", 200
    return "true", 200

@app.route("/api/plati", methods=["POST"])
@jwt_required()
def placanje():
    # data = dict(request.json)
    # print(request.json[0])
    db = mysql_db.get_db()
    cr = db.cursor()
    upit = "INSERT INTO prodato(datum, kolicina, korisnici_idkorisnici, artikli_idartikli) VALUES"
    for proizvod in request.json:
        cr.execute("UPDATE artikli SET kolicina=" + str(int(proizvod["kolicina"]) - int(proizvod["izabranaKolicina"])) + " WHERE idartikli=" + str(proizvod["idartikli"]))
        if upit is not "INSERT INTO prodato(datum, kolicina, korisnici_idkorisnici, artikli_idartikli) VALUES":
            upit += ','
        deo_upita = " ('" + str(datetime.datetime.now()) + "', " + str(proizvod["izabranaKolicina"]) + ", " + str(current_identity["id"]) + ", " + str(proizvod["idartikli"]) + ")"
        upit += deo_upita
    # print(upit)
    cr.execute(upit)
    db.commit()
    # print('emitujem izmenjen artikal')
    socketio.emit('izmenjen artikal', {'id': current_identity['id']})
    return "", 204

@socketio.on('connection')
def connection(json):
    print('Connected user: ' + str(json))

@socketio.on_error()
def error_handler(e):
    pass
    
with app.app_context():
    db = mysql_db.get_db()
    f = open('db/prodavnica.sql', 'r')
    cr = db.cursor()
    for statement in f.read().split(';'):
        if(statement != ''):
            # print('query: ' + statement)
            cr.execute(statement)
            db.commit()

# nakon dropovanj, izvrsiti: CREATE DATABASE IF NOT EXISTS `mydb2`;
# Install eventlet or gevent and gevent-websocket for improved performance.

if __name__ == "__main__":
    # app.run("0.0.0.0", 5000, threaded=True)
    socketio.run(app) 

# za pokretanje python main.py ili flask run --no-reload