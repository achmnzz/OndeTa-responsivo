from flask import Flask, jsonify
from flask_cors import CORS
from marshmallow import ValidationError
from werkzeug.exceptions import HTTPException
from .config import Config
from app.extensions import db, bcrypt, jwt
from app.utils.exceptions import APIError
import os
import logging


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/*": {"origins": ["https://achmnzz.github.io", "http://localhost:5173"]}})

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    from app.models import User, Post, Image

    from app.routes.auth_routes import auth_bp
    from app.routes.post_routes import post_bp
    from app.routes.me_routes import me_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(post_bp)
    app.register_blueprint(me_bp)

    register_error_handlers(app)

    return app


def register_error_handlers(app):
    @app.errorhandler(APIError)
    def handle_api_error(error):
        return jsonify(error.to_dict()), error.code


    @app.errorhandler(ValidationError)
    def handle_marshmallow_validation(err):
        return jsonify({
            "status": "error",
            "message": "Dados inválidos",
            "details": err.messages
        }), 400


    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        messages = {
            404: "Recurso não encontrado.",
            405: "Método não permitido para este endereço.",
            413: "Arquivo grande demais. O limite é de 5 MB.",
        }
        return jsonify({
            "status": "error",
            "message": messages.get(error.code, error.description)
        }), error.code


    @app.errorhandler(Exception)
    def handle_unknown_exception(error):
        logging.error(f"Erro inesperado no servidor: {str(error)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": "Erro inesperado no servidor"
        }), 500