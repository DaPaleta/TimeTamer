"""Phase 3: analytics snapshots and daily metrics

Revision ID: 20250811_01_phase3_analytics
Revises: af38ad25febf
Create Date: 2025-08-11
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '20250811_01_phase3_analytics'
down_revision = 'af38ad25febf'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'goal_progress_snapshots',
        sa.Column('snapshot_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('goal_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('goals.goal_id', ondelete='CASCADE'), nullable=False),
        sa.Column('period_start', sa.String(length=10), nullable=False),
        sa.Column('period_end', sa.String(length=10), nullable=False),
        sa.Column('achieved_value', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('target_value', sa.Integer(), nullable=False),
        sa.Column('percent_complete', sa.Numeric(5, 2), nullable=False),
        sa.Column('taken_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('idx_goal_progress_user_period', 'goal_progress_snapshots', ['user_id', 'period_start', 'period_end'])
    op.create_unique_constraint('uq_goal_progress_period', 'goal_progress_snapshots', ['goal_id', 'period_start', 'period_end'])

    op.create_table(
        'analytics_daily_metrics',
        sa.Column('metrics_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('date', sa.String(length=10), nullable=False),
        sa.Column('total_scheduled_minutes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('completed_tasks_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('focus_minutes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('category_minutes', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )
    op.create_unique_constraint('idx_analytics_daily_user_date', 'analytics_daily_metrics', ['user_id', 'date'])


def downgrade() -> None:
    op.drop_constraint('idx_analytics_daily_user_date', 'analytics_daily_metrics', type_='unique')
    op.drop_table('analytics_daily_metrics')
    op.drop_constraint('uq_goal_progress_period', 'goal_progress_snapshots', type_='unique')
    op.drop_index('idx_goal_progress_user_period', table_name='goal_progress_snapshots')
    op.drop_table('goal_progress_snapshots')


