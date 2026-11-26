from flask import request, jsonify
from app.services.user_service import UserService
from app.controllers.auth_controller import AuthController
from app.schemas.user_schema import UserResponseSchema, PasswordUpdateSchema

user_response_schema = UserResponseSchema()
password_update_schema = PasswordUpdateSchema()


class UserController:

    @staticmethod
    def get_current_user():
        user = AuthController.authenticate_and_authorize()
        return jsonify(user_response_schema.dump(user)), 200

    @staticmethod
    def update_password():
        user = AuthController.authenticate_and_authorize()
        data = password_update_schema.load(request.get_json())
        UserService.update_password(user, data.get("old_password"), data.get("new_password"))
        return jsonify({}), 204

    @staticmethod
    def deactivate_current_user():
        user = AuthController.authenticate_and_authorize()
        UserService.deactivate_user(user)
        return jsonify({}), 204
