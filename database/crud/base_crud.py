from datetime import datetime, timedelta
from typing import Sequence
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, UserBase
from core.config import settings

async def get_base(session: AsyncSession, user_id: int) -> UserBase | None:
    stmt = select(UserBase).options(selectinload(UserBase.user)).where(UserBase.user_id == user_id)
    res = await session.execute(stmt)
    return res.scalar_one_or_none()

async def upgrade_hq(session: AsyncSession, user: User) -> tuple[bool, str]:
    base = user.base
    if not base:
        return False, "Base not found!"
    
    cost = base.hq_level * 1500
    if user.gold_coins < cost:
        return False, f"Need {cost:,} 🪙 Gold Coins to upgrade HQ to Lv.{base.hq_level + 1}!"
    
    user.gold_coins -= cost
    base.hq_level += 1
    # Upgrade raises max wall and defense
    base.max_wall_hp += 250
    base.wall_hp = base.max_wall_hp
    base.defense_power += 50
    await session.commit()
    return True, f"🏰 HQ upgraded to Level {base.hq_level}! Max Wall HP is now {base.max_wall_hp} & Defense Power is {base.defense_power}."

async def upgrade_wall(session: AsyncSession, user: User) -> tuple[bool, str]:
    base = user.base
    cost = base.wall_level * 1000
    if user.gold_coins < cost:
        return False, f"Need {cost:,} 🪙 Gold Coins to upgrade Wall to Lv.{base.wall_level + 1}!"
    
    user.gold_coins -= cost
    base.wall_level += 1
    base.max_wall_hp += 300
    base.wall_hp = base.max_wall_hp
    await session.commit()
    return True, f"🧱 Wall upgraded to Level {base.wall_level}! Wall HP restored & increased to {base.max_wall_hp}."

async def repair_wall(session: AsyncSession, user: User) -> tuple[bool, str]:
    base = user.base
    if base.wall_hp >= base.max_wall_hp:
        return False, "Wall is already at 100% capacity!"
    
    missing_hp = base.max_wall_hp - base.wall_hp
    cost = int(missing_hp * 0.5)  # 0.5 gold per HP
    if user.gold_coins < cost:
        return False, f"Need {cost:,} 🪙 Gold to fully repair wall ({missing_hp} HP damaged)."
    
    user.gold_coins -= cost
    base.wall_hp = base.max_wall_hp
    await session.commit()
    return True, f"🛠️ Wall successfully repaired back to full {base.max_wall_hp} HP! (-{cost:,} 🪙)"

async def upgrade_turret(session: AsyncSession, user: User) -> tuple[bool, str]:
    base = user.base
    cost = base.defense_turret_level * 1200
    if user.gold_coins < cost:
        return False, f"Need {cost:,} 🪙 Gold Coins to upgrade Defense Turrets!"
    
    user.gold_coins -= cost
    base.defense_turret_level += 1
    base.defense_power += 75
    await session.commit()
    return True, f"🗼 Defense Turrets upgraded to Level {base.defense_turret_level}! Defense Power is now {base.defense_power}."

async def upgrade_mine(session: AsyncSession, user: User) -> tuple[bool, str]:
    base = user.base
    if not base:
        return False, "Base not found!"
    cost = base.collector_level * 1000
    if user.gold_coins < cost:
        return False, f"Need {cost:,} 🪙 Gold Coins to upgrade Gold Mine to Lv.{base.collector_level + 1}!"
    
    user.gold_coins -= cost
    base.collector_level += 1
    await session.commit()
    prod = base.collector_level * 5
    vip_prod = int(prod * 1.5)
    return True, f"⛏️ Gold Mine upgraded to Level {base.collector_level}! Gold Production is now ~{prod} 🪙/min (VIP: ~{vip_prod} 🪙/min)!"

async def collect_mine(session: AsyncSession, user: User) -> tuple[bool, int, str]:
    base = user.base
    now = datetime.utcnow()
    diff_minutes = int((now - base.last_collected_at).total_seconds() / 60)
    
    # 5 gold per minute per collector level, max 8 hours capacity (480 mins)
    capped_minutes = min(diff_minutes, 480)
    if capped_minutes < 5:
        return False, 0, "Resource Collector is empty. Please wait at least 5 minutes to collect."
    
    amount = capped_minutes * (5 * base.collector_level)
    if user.is_vip:
        amount = int(amount * 1.5)  # 50% boost for VIP
    
    user.gold_coins += amount
    base.last_collected_at = now
    await session.commit()
    return True, amount, f"⛏️ Collected {amount:,} 🪙 Gold from your Mine! (Accumulated over {capped_minutes} mins)."

async def activate_shield(session: AsyncSession, user: User, hours: int = 12) -> tuple[bool, str]:
    base = user.base
    cost = settings.SHIELD_COST_DIAMONDS
    if user.diamonds < cost:
        return False, f"Shield costs {cost} 💎 Diamonds! You have {user.diamonds} 💎."
    
    now = datetime.utcnow()
    current_shield = base.shield_until if base.shield_until and base.shield_until > now else now
    base.shield_until = current_shield + timedelta(hours=hours)
    user.diamonds -= cost
    await session.commit()
    
    diff = base.shield_until - now
    total_hours = int(diff.total_seconds() / 3600)
    return True, f"🛡️ Peace Treaty Activated! Your base is protected from all attacks for {total_hours} hours."

async def get_top_bases(session: AsyncSession, limit: int = 10) -> Sequence[UserBase]:
    stmt = select(UserBase).options(selectinload(UserBase.user)).order_by(desc(UserBase.hq_level), desc(UserBase.defense_power)).limit(limit)
    res = await session.execute(stmt)
    return res.scalars().all()
