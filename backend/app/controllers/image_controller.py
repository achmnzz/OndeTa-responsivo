from flask import request, jsonify
from werkzeug.exceptions import NotFound, Forbidden
from app.services.image_service import ImageService
from app.schemas.image_schema import ImageResponseSchema, ImageUploadSchema
from app.controllers.auth_controller import AuthController

image_schema = ImageResponseSchema()
images_schema = ImageResponseSchema(many=True)
image_upload_schema = ImageUploadSchema()


class ImageController:

    @staticmethod
    def create_image(post_id):
        user = AuthController.authenticate_and_authorize(lean=True)

        try:
            validated = image_upload_schema.load(request.files)
            new_image = ImageService.create_image(validated['file'], post_id, user.id)
            return jsonify(image_schema.dump(new_image)), 201

        except NotFound:
            return jsonify({"error": "Post não encontrado"}), 404

        except Forbidden as e:
            return jsonify({"error": str(e)}), 403

    @staticmethod
    def get_post_images(post_id):
        images = ImageService.get_post_images(post_id)
        return jsonify(images_schema.dump(images)), 200

    @staticmethod
    def delete_image(image_id):
        user = AuthController.authenticate_and_authorize(lean=True)

        try:
            ImageService.delete_image(image_id, user.id)
            return jsonify({}), 204

        except NotFound:
            return jsonify({"error": "Imagem não encontrada"}), 404

        except Forbidden as e:
            return jsonify({"error": str(e)}), 403