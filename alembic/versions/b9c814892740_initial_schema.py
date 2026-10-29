"""initial_schema

Revision ID: b9c814892740
Revises: 
Create Date: 2026-10-29 11:43:46.270057

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9c814892740'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from backend.app.db.session import Base
import backend.app.db.models  # noqa


def upgrade() -> None:
    """Upgrade schema: ensure all tables defined in Base.metadata exist."""
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
