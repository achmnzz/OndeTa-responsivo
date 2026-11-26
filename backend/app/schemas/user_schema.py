from marshmallow import Schema, fields, validate


class UserResponseSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str()
    email = fields.Email()
    contact = fields.Str()


class PasswordUpdateSchema(Schema):
    old_password = fields.Str(
        required=True,
        load_only=True,
        validate=validate.Length(min=6, error="A senha atual deve ter pelo menos 6 caracteres."),
        error_messages={"required": "Informe sua senha atual."},
    )
    new_password = fields.Str(
        required=True,
        load_only=True,
        validate=validate.Length(min=6, error="A nova senha deve ter pelo menos 6 caracteres."),
        error_messages={"required": "Informe a nova senha."},
    )
