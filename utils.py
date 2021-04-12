import flask
from flaskext.mysql import MySQL
from pymysql.cursors import DictCursor
from functools import wraps
from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO, disconnect
from flask import Flask, request, redirect, url_for

mysql_db = MySQL(cursorclass=DictCursor)
app = Flask(__name__, static_url_path="")
app.secret_key = "ovo_bi_trebala_da_bude_DUGACKA_tajna"
bcrypt = Bcrypt(app)
socketio = SocketIO(app) 

# static_url_path="" posto je prazno po default-u folder iz kojeg se sluzi
# staticki sadrzaj je static