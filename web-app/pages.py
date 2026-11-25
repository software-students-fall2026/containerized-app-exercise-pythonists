from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, abort, render_template

pages = Blueprint("pages", __name__)


@pages.route("/")
def dashboard():
    return render_template("dashboard.html")


@pages.route("/record")
def record():
    return render_template("record.html")


@pages.route("/sessions/<session_id>")
def session_detail(session_id):
    try:
        ObjectId(session_id)
    except InvalidId:
        abort(404)
    return render_template("session.html", session_id=session_id)
