from typing import Sequence
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, UserArmy

TROOP_PRICES = {
    "infantry": {"cost": 20, "name": "Infantry ⚔️", "power": 5},
    "archer": {"cost": 50, "name": "Archers 🏹", "power": 12},
    "siege": {"cost": 250, "name": "Siege Catapults 🛡️", "power": 50},
}

async def train_troops(session: AsyncSession, user: User, troop_type: str, amount: int) -> tuple[bool, str]:
    if troop_type not in TROOP_PRICES:
        return False, "Invalid troop type! Options: infantry, archer, siege"
    
    if amount <= 0 or amount > 1000:
        return False, "Please specify a valid troop amount (1 to 1000)."
    
    army = user.army
    # Max troop limit determined by Barracks level
    max_capacity = army.barracks_level * 150
    if army.total_troops + amount > max_capacity:
        return False, f"Barracks capacity full! ({army.total_troops}/{max_capacity}). Upgrade your Barracks first."
    
    unit_cost = TROOP_PRICES[troop_type]["cost"]
    total_cost = unit_cost * amount
    
    if user.gold_coins < total_cost:
        return False, f"Not enough Gold Coins! Training {amount} {TROOP_PRICES[troop_type]['name']} costs {total_cost:,} 🪙 (You have: {user.gold_coins:,} 🪙)."
    
    user.gold_coins -= total_cost
    if troop_type == "infantry":
        army.infantry_count += amount
    elif troop_type == "archer":
        army.archer_count += amount
    elif troop_type == "siege":
        army.siege_count += amount
        
    await session.commit()
    return True, f"✅ Successfully trained {amount} {TROOP_PRICES[troop_type]['name']} for {total_cost:,} 🪙! Army Power increased to {army.total_attack_power} 💥."

async def upgrade_barracks(session: AsyncSession, user: User) -> tuple[bool, str]:
    army = user.army
    cost = army.barracks_level * 2000
    if user.gold_coins < cost:
        return False, f"Need {cost:,} 🪙 Gold Coins to upgrade Barracks to Lv.{army.barracks_level + 1}!"
    
    user.gold_coins -= cost
    army.barracks_level += 1
    new_capacity = army.barracks_level * 150
    await session.commit()
    return True, f"⛺ Barracks upgraded to Level {army.barracks_level}! New maximum troop capacity: {new_capacity} units."

async def get_top_armies(session: AsyncSession, limit: int = 10) -> Sequence[UserArmy]:
    # Custom ordering based on attack power
    stmt = (
        select(UserArmy)
        .options(selectinload(UserArmy.user))
        .order_by(desc(UserArmy.infantry_count * 5 + UserArmy.archer_count * 12 + UserArmy.siege_count * 50))
        .limit(limit)
    )
    res = await session.execute(stmt)
    return res.scalars().all()
