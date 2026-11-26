from app.extensions import db
from app.models.image import Image
from app.models.post import Post
from app.utils.image_utils import compress_image
from app.services.storage_service import upload_image, delete_image_storage
from werkzeug.exceptions import NotFound, Forbidden


class ImageService:

    @staticmethod
    def create_image(file, post_id, user_id=None, is_admin=False):
        post = Post.query.get_or_404(post_id)
        if not is_admin and user_id and post.user_id != user_id:
            raise Forbidden("Você não tem permissão para adicionar imagens a este post.")

        compressed_buffer = compress_image(file)

        storage_data = upload_image(compressed_buffer)
        filename = storage_data["filename"]
        url = storage_data["url"]

        try:
            new_image = Image(
                filename=filename,
                url=url,
                post_id=post_id
            )
            db.session.add(new_image)
            db.session.commit()
            return new_image

        except Exception as e:
            db.session.rollback()
            delete_image_storage(filename)
            raise e

    @staticmethod
    def delete_image(image_id, user_id=None, is_admin=False):
        image = Image.query.get_or_404(image_id)

        if not is_admin and user_id:
            post = Post.query.get(image.post_id)
            if post.user_id != user_id:
                raise Forbidden("Você não tem permissão para deletar esta imagem.")

        filename = image.filename

        try:
            db.session.delete(image)
            db.session.commit()

            delete_image_storage(filename)
            return True
        except Exception as e:
            db.session.rollback()
            raise e

    @staticmethod
    def get_post_images(post_id):
        return Image.query.filter_by(post_id=post_id).all()