from datetime import datetime, timedelta
from typing import Sequence
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, MarketItem

ALLOWED_ITEM_TYPES = {
    "SHIELD": "🛡️ 12-Hour Base Shield",
    "TROOP_CRATE": "📦 Mystery Troop Crate (100-250 Troops)",
    "WALL_REPAIR": "🧱 Wall Reinforcement (+500 HP)",
    "RESOURCE_PACK": "💰 Treasure Chest (+25,000 Gold)",
}

async def get_active_listings(session: AsyncSession, limit: int = 10) -> Sequence[MarketItem]:
    stmt = (
        select(MarketItem)
        .options(selectinload(MarketItem.seller))
        .where(MarketItem.is_active == True)
        .order_by(desc(MarketItem.created_at))
        .limit(limit)
    )
    res = await session.execute(stmt)
    return res.scalars().all()

async def create_market_listing(
    session: AsyncSession,
    user: User,
    item_type: str,
    currency: str,
    price: int
) -> tuple[bool, str]:
    item_type = item_type.upper()
    currency = currency.upper()

    if item_type not in ALLOWED_ITEM_TYPES:
        types_str = ", ".join([f"`{k}`" for k in ALLOWED_ITEM_TYPES.keys()])
        return False, f"Invalid item type! Available items: {types_str}"

    if currency not in ["GOLD", "DIAMOND"]:
        return False, "Currency must be either `GOLD` or `DIAMOND`."

    if price <= 0 or price > 10_000_000:
        return False, "Price must be between 1 and 10,000,000."

    # VIP check for Diamond selling
    if currency == "DIAMOND" and not user.is_vip:
        return False, (
            "🔒 **VIP Feature Locked!**\n"
            "Selling items for **Piko Diamonds 💎** is exclusive to **Piko VIP Members**.\n"
            "Upgrade your membership using `/vip` or sell using `GOLD` 🪙!"
        )

    listing = MarketItem(
        seller_id=user.telegram_id,
        item_name=ALLOWED_ITEM_TYPES[item_type],
        item_type=item_type,
        quantity=1,
        currency=currency,
        price=price,
        is_active=True,
        created_at=datetime.utcnow()
    )
    session.add(listing)
    await session.commit()
    
    curr_emoji = "💎" if currency == "DIAMOND" else "🪙"
    return True, f"🏪 Listed **{ALLOWED_ITEM_TYPES[item_type]}** on Marketplace for **{price:,} {curr_emoji}** (Listing ID: `#{listing.id}`)!"

async def buy_market_item(session: AsyncSession, buyer: User, listing_id: int) -> tuple[bool, str]:
    stmt = (
        select(MarketItem)
        .options(selectinload(MarketItem.seller))
        .where(MarketItem.id == listing_id, MarketItem.is_active == True)
    )
    res = await session.execute(stmt)
    item = res.scalar_one_or_none()
    
    if not item:
        return False, "Item not found or already purchased!"
    
    if item.seller_id == buyer.telegram_id:
        return False, "You cannot buy your own listed item!"
    
    seller = item.seller
    # Verify balance
    if item.currency == "DIAMOND":
        if buyer.diamonds < item.price:
            return False, f"Insufficient Diamonds! You need {item.price:,} 💎 (You have: {buyer.diamonds:,} 💎)."
        buyer.diamonds -= item.price
        if seller:
            seller.diamonds += item.price
    else:
        if buyer.gold_coins < item.price:
            return False, f"Insufficient Gold! You need {item.price:,} 🪙 (You have: {buyer.gold_coins:,} 🪙)."
        buyer.gold_coins -= item.price
        if seller:
            seller.gold_coins += item.price

    # Apply item effect to buyer
    effect_msg = ""
    if item.item_type == "SHIELD":
        now = datetime.utcnow()
        current = buyer.base.shield_until if buyer.base.shield_until and buyer.base.shield_until > now else now
        buyer.base.shield_until = current + timedelta(hours=12)
        effect_msg = "🛡️ Base Shield extended by 12 hours!"
    elif item.item_type == "TROOP_CRATE":
        buyer.army.infantry_count += 100
        buyer.army.archer_count += 50
        effect_msg = "⚔️ Crate Opened: +100 Infantry and +50 Archers added to your army!"
    elif item.item_type == "WALL_REPAIR":
        buyer.base.wall_hp = min(buyer.base.max_wall_hp + 500, buyer.base.wall_hp + 500)
        effect_msg = "🧱 Wall reinforced with +500 HP!"
    elif item.item_type == "RESOURCE_PACK":
        buyer.gold_coins += 25000
        effect_msg = "💰 Vault filled with +25,000 Gold Coins!"

    item.is_active = False
    await session.commit()
    return True, f"🎉 Successfully bought **{item.item_name}** for {item.price:,} {item.currency}!\n{effect_msg}"
