"""add address to posts

Revision ID: e3a7c1f9b2d4
Revises: d6956810d844
Create Date: 2026-11-24 10:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e3a7c1f9b2d4'
down_revision: Union[str, Sequence[str], None] = 'd6956810d844'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('posts', sa.Column('address', sa.String(length=255), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('posts', 'address')
