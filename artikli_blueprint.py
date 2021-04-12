import flask
from flask import request
from flask import Blueprint
from flask_jwt import JWT, jwt_required, current_identity
from utils import mysql_db, socketio

artikli_blueprint = Blueprint("artikli blueprint", __name__)

@artikli_blueprint.route("", methods=["POST"])
@jwt_required()
def dodavanje_artikli():
    db = mysql_db.get_db()
    cr = db.cursor()
    cr.execute("INSERT INTO artikli (naziv, kolicina, opis) VALUES(%(naziv)s, %(kolicina)s, %(opis)s)", request.json)
    db.commit()
    # print('emitujem dodat artikal')
    socketio.emit('dodat artikal', {'id': current_identity['id']})
    return "", 201

# RAD SA ARTIKLAMA
@artikli_blueprint.route("/<int:id_artikli>", methods=["GET"])
@jwt_required()
def dobavljanje_artikli(id_artikli):
    cr = mysql_db.get_db().cursor()
    cr.execute("SELECT * FROM artikli WHERE idartikli=%s", (id_artikli, ))
    artikli = cr.fetchone()
    return flask.jsonify(artikli)

# RAD SA ARTIKLAMA
@artikli_blueprint.route("", methods=["GET"])
@jwt_required()
def dobavljanje_artikla():
    cr = mysql_db.get_db().cursor()

    upit = "SELECT * FROM artikli"
    selekcija = " WHERE "
    parametri_pretrage = []

    if request.args.get("naziv") is not None:
        parametri_pretrage.append("%" + request.args.get("naziv") + "%")
        selekcija += "naziv LIKE %s "


    try:
        parametri_pretrage.append(int(request.args.get("kolicinaOd")))
        if len(parametri_pretrage) > 1:
            selekcija += "AND "
        selekcija += "kolicina >= %s "
    except:
        pass

    try:
        parametri_pretrage.append(int(request.args.get("kolicinaDo")))
        if len(parametri_pretrage) > 1:
            selekcija += "AND "
        selekcija += "kolicina <= %s "
    except:
        pass
    
    if len(parametri_pretrage) > 0:
        upit += selekcija

    cr.execute(upit, parametri_pretrage)
    artikli = cr.fetchall()
    vrati = []
    for artikal in artikli:
        # print(artikal)
        if (artikal['kolicina'] != '0') and (current_identity['uloga'] == 'user'):
            vrati.append(artikal)
        if current_identity['uloga'] == 'admin':
            vrati.append(artikal)
    return flask.json.jsonify(vrati)

@artikli_blueprint.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def uklanjanje_artikli(id):
    db = mysql_db.get_db()
    cr = db.cursor()
    cr.execute("DELETE FROM artikli WHERE idartikli=%s", (id, ))
    db.commit()
    # print('emitujem obrisan artikal')
    socketio.emit('obrisan artikal', {'id': current_identity['id']})
    return "", 204


    
@artikli_blueprint.route("/<int:id_artikli>", methods=["PUT"])
@jwt_required()
def izmeni_artiklu(id_artikli):
    db = mysql_db.get_db()
    cr = db.cursor()
    data = dict(request.json)
    data["id_artikli"] = id_artikli
    cr.execute("UPDATE artikli SET naziv=%(naziv)s, kolicina=%(kolicina)s, opis=%(opis)s WHERE idartikli=%(id_artikli)s", data)
    db.commit()
    # print('emitujem izmenjen artikal')
    socketio.emit('izmenjen artikal', {'id': current_identity['id']})
    return "", 200
