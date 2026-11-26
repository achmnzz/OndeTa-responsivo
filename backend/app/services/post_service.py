import math
from app.repositories.post_repository import PostRepository
from app.services.storage_service import delete_image_storage
from app.utils.exceptions import NotFoundError, ForbiddenError


class PostService:
    @staticmethod
    def _prepare_allowed_statuses(params):
        if params.get("status"):
            params["allowed_statuses"] = [params.get("status")]
        else:
            params["allowed_statuses"] = ["active", "resolved"]
        return params

    @staticmethod
    def get_feed(params):
        params = PostService._prepare_allowed_statuses(params)
        page = params.get("page")
        limit = params.get("limit")

        total_posts, posts = PostRepository.get_feed(params)
        total_pages = math.ceil(total_posts / limit) if total_posts > 0 else 1

        pagination_metadata = {
            "current_page": page,
            "limit": limit,
            "total_posts": total_posts,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }

        return pagination_metadata, posts

    @staticmethod
    def create_post(data, user_id):
        return PostRepository.create({**data, "user_id": user_id})

    @staticmethod
    def get_user_posts(user_id):
        return PostRepository.get_by_user(user_id)

    @staticmethod
    def update_post(post_id, user_id, data):
        post = PostRepository.get_post(post_id)

        if not post or post.status == "blocked":
            raise NotFoundError("Post não encontrado.")

        if post.user_id != user_id:
            raise ForbiddenError("Você não tem permissão para editar este post.")

        return PostRepository.update(post, data)

    @staticmethod
    def delete_post(post_id, user_id, is_admin=False):
        post = PostRepository.get_post(post_id)

        if not post:
            raise NotFoundError("Post não encontrado.")

        if not is_admin and post.user_id != user_id:
            raise ForbiddenError("Você não tem permissão para excluir este post.")

        for image in post.images:
            delete_image_storage(image.filename)

        PostRepository.delete(post)

    @staticmethod
    def get_post(post_id, user=None):
        post = PostRepository.get_post(post_id)

        authorized_user = False
        if (user is not None) and (
            ((post is not None and post.user_id == user.id) or
              getattr(user, "role", None) == "admin")):
            authorized_user = True

        if not post or (post.status in ["hidden", "blocked"] and not authorized_user):
            raise NotFoundError("Post não encontrado.")

        return post