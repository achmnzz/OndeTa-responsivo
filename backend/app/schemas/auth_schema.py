import re

from marshmallow import Schema, fields, validate, pre_load, ValidationError
from app.schemas.user_schema import UserResponseSchema

PHONE_PATTERN = re.compile(r"^[1-9]{2}(?:9\d{8}|[2-5]\d{7})$")
EMAIL_MESSAGES = {
    "required": "Informe seu e-mail.",
    "invalid": "Informe um e-mail válido, como nome@exemplo.com.",
}


def _validate_phone(value):
    if value is None:
        return
    if not PHONE_PATTERN.match(re.sub(r"\D", "", value)):
        raise ValidationError("Informe um telefone válido com DDD, como (41) 99999-9999.")


def _normalize_email(data):
    if isinstance(data, dict) and isinstance(data.get("email"), str):
        return {**data, "email": data["email"].strip().lower()}
    return data


class RegisterSchema(Schema):
    name = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=100, error="O nome deve ter entre 2 e 100 caracteres."),
        error_messages={"required": "Informe seu nome."},
    )
    email = fields.Email(required=True, error_messages=EMAIL_MESSAGES)
    password = fields.Str(
        required=True,
        load_only=True,
        validate=validate.Length(min=6, error="A senha deve ter pelo menos 6 caracteres."),
        error_messages={"required": "Informe uma senha."},
    )
    contact = fields.Str(required=False, allow_none=True, validate=_validate_phone)

    @pre_load
    def clean_fields(self, data, **kwargs):
        data = _normalize_email(data)
        if not isinstance(data, dict):
            return data
        if isinstance(data.get("name"), str):
            data = {**data, "name": data["name"].strip()}
        if isinstance(data.get("contact"), str) and not data["contact"].strip():
            data = {**data, "contact": None}
        return data


class LoginSchema(Schema):
    email = fields.Email(required=True, error_messages=EMAIL_MESSAGES)
    password = fields.Str(required=True, error_messages={"required": "Informe sua senha."})

    @pre_load
    def clean_email(self, data, **kwargs):
        return _normalize_email(data)


class AuthResponseSchema(Schema):
    access_token = fields.Str()
    user = fields.Nested(UserResponseSchema)