from werkzeug.security import generate_password_hash, check_password_hash
from app.repositories.user_repository import UserRepository
from app.utils.exceptions import UnauthorizedError


class UserService:

    @staticmethod
    def update_password(user, old_password, new_password):
        if not check_password_hash(user.password, old_password):
            raise UnauthorizedError("Senha atual incorreta.")

        hashed_password = generate_password_hash(new_password)
        return UserRepository.update(user, {"password": hashed_password})

    @staticmethod
    def deactivate_user(user):
        return UserRepository.update(user, {"status": "inactive"})
