from marshmallow import Schema, fields, validate, validates_schema, pre_load, ValidationError

PET_TYPES = ["cachorro", "gato"]
CATEGORIES = ["perdido", "encontrado"]

ADDRESS_MIN = 5
ADDRESS_MAX = 255
ADDRESS_REQUIRED_MSG = "Informe o endereço do local."
ADDRESS_LENGTH = validate.Length(
    min=ADDRESS_MIN,
    max=ADDRESS_MAX,
    error=f"O endereço deve ter entre {ADDRESS_MIN} e {ADDRESS_MAX} caracteres.",
)


def _strip_address(data):
    if isinstance(data, dict) and isinstance(data.get("address"), str):
        return {**data, "address": data["address"].strip()}
    return data


class PostCreateSchema(Schema):
    pet_name = fields.Str(allow_none=True, validate=validate.Length(max=100))
    pet_type = fields.Str(required=True, validate=validate.OneOf(PET_TYPES))
    category = fields.Str(required=True, validate=validate.OneOf(CATEGORIES))
    description = fields.Str(allow_none=True)
    date = fields.DateTime()
    latitude = fields.Float(required=True, validate=validate.Range(min=-90, max=90))
    longitude = fields.Float(required=True, validate=validate.Range(min=-180, max=180))
    address = fields.Str(
        required=True,
        validate=ADDRESS_LENGTH,
        error_messages={"required": ADDRESS_REQUIRED_MSG, "null": ADDRESS_REQUIRED_MSG},
    )

    @pre_load
    def clean_address(self, data, **kwargs):
        return _strip_address(data)


class MyPostUpdateSchema(Schema):
    pet_name = fields.Str(allow_none=True, validate=validate.Length(max=100))
    pet_type = fields.Str(validate=validate.OneOf(PET_TYPES))
    category = fields.Str(validate=validate.OneOf(CATEGORIES))
    description = fields.Str(allow_none=True)
    latitude = fields.Float(validate=validate.Range(min=-90, max=90))
    longitude = fields.Float(validate=validate.Range(min=-180, max=180))
    address = fields.Str(
        validate=ADDRESS_LENGTH,
        error_messages={"null": ADDRESS_REQUIRED_MSG},
    )

    @pre_load
    def clean_address(self, data, **kwargs):
        return _strip_address(data)

    @validates_schema
    def validate_coordinates_together(self, data, **kwargs):
        if ("latitude" in data) != ("longitude" in data):
            raise ValidationError("Envie latitude e longitude juntas.", "latitude")
        if "latitude" in data and "address" not in data:
            raise ValidationError(ADDRESS_REQUIRED_MSG, "address")


class FeedRequestSchema(Schema):
    pet_type = fields.Str(validate=validate.OneOf(PET_TYPES))
    category = fields.Str(validate=validate.OneOf(CATEGORIES))
    status = fields.Str(validate=validate.OneOf(["active", "resolved"]))
    latitude = fields.Float(validate=validate.Range(min=-90, max=90))
    longitude = fields.Float(validate=validate.Range(min=-180, max=180))
    distance = fields.Float(validate=validate.Range(min=1, max=50), load_default=10)
    page = fields.Int(validate=validate.Range(min=1), load_default=1)
    limit = fields.Int(validate=validate.Range(min=1, max=100), load_default=20)


class PostResponseSchema(Schema):
    id = fields.Int(dump_only=True)
    pet_name = fields.Str()
    pet_type = fields.Str()
    category = fields.Str()
    status = fields.Str()
    description = fields.Str()
    latitude = fields.Float()
    longitude = fields.Float()
    address = fields.Str()
    date = fields.DateTime()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    author = fields.Nested("UserResponseSchema", only=("id", "name", "email", "contact"), dump_only=True)
    images = fields.Nested("ImageResponseSchema", many=True, dump_only=True)
