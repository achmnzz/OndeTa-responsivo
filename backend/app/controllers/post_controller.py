from flask import request, jsonify
from app.services.post_service import PostService
from app.schemas.post_schema import FeedRequestSchema, PostResponseSchema, PostCreateSchema, MyPostUpdateSchema
from app.controllers.auth_controller import AuthController

feed_schema = FeedRequestSchema()
post_response = PostResponseSchema()
post_create_schema = PostCreateSchema()
my_post_update_schema = MyPostUpdateSchema()


class PostController:
    @staticmethod
    def create_post():
        user = AuthController.authenticate_and_authorize(lean=True)
        data = post_create_schema.load(request.get_json())
        post = PostService.create_post(data, user.id)
        return jsonify(post_response.dump(post)), 201


    @staticmethod
    def get_feed():
        params = feed_schema.load(request.args)
        pagination_metadata, posts = PostService.get_feed(params)

        return jsonify({
            "posts": post_response.dump(posts, many=True),
            "meta": pagination_metadata
        }), 200


    @staticmethod
    def delete_post(post_id):
        user = AuthController.authenticate_and_authorize(lean=True)
        PostService.delete_post(post_id, user.id, is_admin=(user.role == "admin"))
        return jsonify({}), 204


    @staticmethod
    def get_my_posts():
        user = AuthController.authenticate_and_authorize(lean=True)
        posts = PostService.get_user_posts(user.id)
        return jsonify({"posts": post_response.dump(posts, many=True)}), 200


    @staticmethod
    def update_my_post(post_id):
        user = AuthController.authenticate_and_authorize(lean=True)
        data = my_post_update_schema.load(request.get_json() or {})
        post = PostService.update_post(post_id, user.id, data)
        return jsonify(post_response.dump(post)), 200


    @staticmethod
    def get_post(post_id, auth=False, admin=False):
        user = None
        if auth or admin:
            user = AuthController.authenticate_and_authorize(admin_required=admin, lean=True)
        post = PostService.get_post(post_id, user)
        return jsonify(post_response.dump(post)), 200
