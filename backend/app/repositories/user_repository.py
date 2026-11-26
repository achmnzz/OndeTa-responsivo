from app.extensions import db
from app.models import User
from sqlalchemy import func
from sqlalchemy.orm import joinedload, load_only


class UserRepository:
    @staticmethod
    def _apply_query_options(query, include_assets, lean):
        if lean:
            return query.options(
                load_only(
                    User.id,
                    User.status,
                    User.role
                )
            )
        elif include_assets:
            return query.options(joinedload(User.posts))

        return query

    @staticmethod
    def create(data):
        user = User(**data)
        db.session.add(user)
        db.session.commit()
        return user


    @staticmethod
    def get_user(user_id=None, email=None, include_assets=False, lean=False):
        query = db.session.query(User)

        query = UserRepository._apply_query_options(query, include_assets, lean)

        if user_id is not None:
            query = query.filter(User.id == user_id)
        elif email is not None:
            query = query.filter(func.lower(User.email) == email.strip().lower())
        else:
            return None

        return query.first()

    @staticmethod
    def update(user, data):
        for key, value in data.items():
            setattr(user, key, value)
        db.session.commit()
        return user