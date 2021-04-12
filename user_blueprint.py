import flask
from flask import request
from flask import Blueprint
from flask_jwt import JWT, jwt_required, current_identity
from utils import mysql_db, socketio, bcrypt

user_blueprint = Blueprint("user blueprint", __name__)

#Rad sa korisnicima
@user_blueprint.route("", methods=["GET"])
@jwt_required()
def dobavi_korisnike():
    cr = mysql_db.get_db().cursor()
    cr.execute("SELECT * FROM korisnici")
    korisnici = cr.fetchall()
    return flask.json.jsonify(korisnici)

@user_blueprint.route("", methods=["POST"])
@jwt_required()
def dodavanje_korisnika():
    data = dict(request.json)
    pw_hash = bcrypt.generate_password_hash(data['lozinka'], 12)
    data['lozinka'] = pw_hash
    db = mysql_db.get_db()
    cr = db.cursor()
    cr.execute("INSERT INTO korisnici (korisnicko_ime, lozinka, ime, prezime, uloga) VALUES(%(korisnicko_ime)s, %(lozinka)s, %(ime)s, %(prezime)s, %(uloga)s)", data)
    db.commit()
    # print('emitujem dodat clan')
    socketio.emit('dodat clan', {'id': current_identity['id']})
    return "", 201

@user_blueprint.route("/<int:id_korisnika>", methods=["PUT"])
@jwt_required()
def izmena_korisnika(id_korisnika):
    db = mysql_db.get_db()
    cr = db.cursor()
    data = dict(request.json)
    data["id_korisnika"] = id_korisnika
    cr.execute("UPDATE korisnici SET korisnicko_ime=%(korisnicko_ime)s, ime=%(ime)s, prezime=%(prezime)s, lozinka=%(lozinka)s, uloga=%(uloga)s  WHERE id=%(id_korisnika)s", data)
    db.commit()
    # print('emitujem izmenjen clan')
    socketio.emit('izmenjen clan', {'id': current_identity['id']})
    return "", 200

@user_blueprint.route("/<int:id_korisnika>", methods=["GET"])
@jwt_required()
def dobavljanje_j_korisnika(id_korisnika):
    cr = mysql_db.get_db().cursor()
    cr.execute("SELECT * FROM korisnici WHERE id=%s", (id_korisnika, ))
    korisnik = cr.fetchone()
    return flask.jsonify(korisnik)

@user_blueprint.route("/<int:id_korisnika>", methods=["DELETE"])
@jwt_required()
def brisanje_korisnika(id_korisnika):
    db = mysql_db.get_db()
    cr = db.cursor()
    cr.execute("DELETE FROM korisnici WHERE id=%s", (id_korisnika, ))
    db.commit()
    # print('emitujem obrisan clan')
    socketio.emit('obrisan clan', {'id': current_identity['id']})
    return "", 204
