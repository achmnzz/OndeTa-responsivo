from flask import Blueprint
from app.controllers.user_controller import UserController
from app.controllers.post_controller import PostController
from app.controllers.image_controller import ImageController
from flask_jwt_extended import jwt_required

me_bp = Blueprint("me", __name__, url_prefix="/me")


@me_bp.route("", methods=["GET"])
@jwt_required()
def get_my_profile():
    return UserController.get_current_user()

@me_bp.route("", methods=["DELETE"])
@jwt_required()
def deactivate_my_account():
    return UserController.deactivate_current_user()

@me_bp.route("/password", methods=["PATCH"])
@jwt_required()
def update_my_password():
    return UserController.update_password()

# ------------------------------------------------------ MEUS POSTS 

@me_bp.route("/posts", methods=["GET"])
@jwt_required()
def get_my_posts():
    return PostController.get_my_posts()

@me_bp.route("/posts/<int:post_id>", methods=["PATCH"])
@jwt_required()
def update_my_post(post_id):
    return PostController.update_my_post(post_id)

@me_bp.route("/posts/<int:post_id>", methods=["DELETE"])
@jwt_required()
def delete_my_post(post_id):
    return PostController.delete_post(post_id)


@me_bp.route("/posts/<int:post_id>/images", methods=["GET"])
@jwt_required()
def get_my_post_images(post_id):
    return ImageController.get_post_images(post_id)

@me_bp.route("/posts/<int:post_id>/images", methods=["POST"])
@jwt_required()
def add_image_to_post(post_id):
    return ImageController.create_image(post_id)

@me_bp.route("/images/<int:image_id>", methods=["DELETE"])
@jwt_required()
def delete_my_post_image(image_id):
    return ImageController.delete_image(image_id)