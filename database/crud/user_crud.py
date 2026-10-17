from datetime import datetime, timedelta
from typing import Sequence
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, UserBase, UserArmy
from core.config import settings

async def get_user(session: AsyncSession, telegram_id: int) -> User | None:
    stmt = (
        select(User)
        .options(selectinload(User.base), selectinload(User.army))
        .where(User.telegram_id == telegram_id)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

async def get_or_create_user(
    session: AsyncSession,
    telegram_id: int,
    username: str | None = None,
    full_name: str = "Warrior"
) -> User:
    user = await get_user(session, telegram_id)
    if user:
        # Update metadata if changed
        if user.username != username or user.full_name != full_name:
            user.username = username
            user.full_name = full_name
            user.last_active_at = datetime.utcnow()
            await session.commit()
        return user

    # Create new User, Base, and Army
    new_user = User(
        telegram_id=telegram_id,
        username=username,
        full_name=full_name,
        gold_coins=settings.STARTING_GOLD,
        diamonds=settings.STARTING_DIAMONDS,
        membership_tier="FREE",
        created_at=datetime.utcnow(),
        last_active_at=datetime.utcnow()
    )
    session.add(new_user)
    await session.flush()

    new_base = UserBase(
        user_id=telegram_id,
        hq_level=1,
        wall_level=1,
        wall_hp=500,
        max_wall_hp=500,
        defense_turret_level=1,
        defense_power=100,
        collector_level=1,
        last_collected_at=datetime.utcnow()
    )
    session.add(new_base)

    new_army = UserArmy(
        user_id=telegram_id,
        infantry_count=10,
        archer_count=5,
        siege_count=0,
        barracks_level=1
    )
    session.add(new_army)

    await session.commit()
    return await get_user(session, telegram_id)

async def update_balance(
    session: AsyncSession,
    user_id: int,
    gold_delta: int = 0,
    diamond_delta: int = 0
) -> bool:
    user = await get_user(session, user_id)
    if not user:
        return False
    if user.gold_coins + gold_delta < 0 or user.diamonds + diamond_delta < 0:
        return False
    user.gold_coins += gold_delta
    user.diamonds += diamond_delta
    await session.commit()
    return True

async def claim_daily_reward(session: AsyncSession, user: User) -> tuple[bool, int, int, str]:
    now = datetime.utcnow()
    if user.daily_claimed_at and (now - user.daily_claimed_at) < timedelta(hours=24):
        remaining = timedelta(hours=24) - (now - user.daily_claimed_at)
        hours, remainder = divmod(int(remaining.total_seconds()), 3600)
        minutes, _ = divmod(remainder, 60)
        return False, 0, 0, f"{hours}h {minutes}m"

    # Multiplier for VIPs
    gold = settings.DAILY_GOLD_REWARD * (2 if user.is_vip else 1)
    diamonds = settings.DAILY_DIAMOND_REWARD * (2 if user.is_vip else 1)

    user.gold_coins += gold
    user.diamonds += diamonds
    user.daily_claimed_at = now
    await session.commit()
    return True, gold, diamonds, "Claimed"

VIP_PLANS = {
    "2d": {"days": 2, "cost": 100, "label": "2-Day VIP Pass"},
    "7d": {"days": 7, "cost": 300, "label": "7-Day Imperial VIP"},
    "28d": {"days": 28, "cost": 1000, "label": "28-Day Sovereign VIP Crown"}
}

async def buy_vip(session: AsyncSession, user: User, plan_key: str = "2d") -> tuple[bool, str]:
    plan_key = plan_key.lower()
    if plan_key not in VIP_PLANS:
        return False, "Invalid VIP membership plan selected!"
    
    plan = VIP_PLANS[plan_key]
    cost = plan["cost"]
    days = plan["days"]
    label = plan["label"]

    if user.diamonds < cost:
        return False, f"Not enough Diamonds! {label} costs {cost} 💎. You have {user.diamonds} 💎."

    user.diamonds -= cost
    now = datetime.utcnow()
    
    # Stack time if already VIP, otherwise set from now
    if user.is_vip and user.membership_expires_at and user.membership_expires_at > now:
        user.membership_expires_at = user.membership_expires_at + timedelta(days=days)
    else:
        user.membership_expires_at = now + timedelta(days=days)

    user.membership_tier = "VIP"
    await session.commit()
    
    remaining_days = max(1, (user.membership_expires_at - now).days)
    return True, f"👑 Congratulations! You acquired {label} (+{days} days)! Total VIP duration: {remaining_days} days."

async def get_top_richest(session: AsyncSession, limit: int = 10) -> Sequence[User]:
    stmt = select(User).order_by(desc(User.gold_coins)).limit(limit)
    res = await session.execute(stmt)
    return res.scalars().all()
