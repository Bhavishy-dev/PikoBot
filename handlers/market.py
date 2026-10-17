from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User
from database.crud.user_crud import buy_vip
from database.crud.market_crud import (
    get_active_listings,
    create_market_listing,
    buy_market_item,
    ALLOWED_ITEM_TYPES
)
from keyboards.inline import market_actions_keyboard, vip_keyboard

router = Router(name="market")

async def format_market_overview(session: AsyncSession) -> tuple[str, InlineKeyboardMarkup]:
    listings = await get_active_listings(session, limit=10)
    
    if not listings:
        text = (
            "🏪 **PIKO DECENTRALIZED MARKETPLACE** 🪙💎\n"
            "━━━━━━━━━━━━━━━━━━━━━\n"
            "📦 *No active items listed right now!*\n\n"
            "Be the first merchant to list an item using:\n"
            "`/sell <item_type> <price> <currency>`\n\n"
            "💡 Available Item Types:\n"
            + "\n".join([f"• `{k}`: {v}" for k, v in ALLOWED_ITEM_TYPES.items()])
        )
        return text, market_actions_keyboard()

    lines = [
        "🏪 **PIKO DECENTRALIZED MARKETPLACE** 🪙💎",
        "━━━━━━━━━━━━━━━━━━━━━",
        "🛒 *Current Live Listings:*\n"
    ]

    inline_buttons = []
    for item in listings:
        curr_emoji = "💎" if item.currency == "DIAMOND" else "🪙"
        seller_name = item.seller.full_name if item.seller else "Merchant"
        lines.append(
            f"🏷️ **Listing #{item.id}:** {item.item_name}\n"
            f"   💰 Price: `{item.price:,} {curr_emoji}` | 👤 Seller: `{seller_name}`\n"
            f"   👉 Buy command: `/buy {item.id}`\n"
        )
        inline_buttons.append([
            InlineKeyboardButton(
                text=f"🛒 Buy #{item.id} ({item.price:,} {curr_emoji})",
                callback_data=f"buy_item_{item.id}"
            )
        ])

    lines.append("━━━━━━━━━━━━━━━━━━━━━")
    lines.append("💡 *List your own:* `/sell <type> <price> <GOLD|DIAMOND>`")
    lines.append("👑 *Selling for Diamonds requires VIP Membership!*")

    # Add navigation buttons
    inline_buttons.append([
        InlineKeyboardButton(text="🔄 Refresh", callback_data="market_refresh"),
        InlineKeyboardButton(text="👑 VIP Membership", callback_data="view_vip")
    ])
    inline_buttons.append([
        InlineKeyboardButton(text="🔙 Main Menu", callback_data="main_menu")
    ])

    return "\n".join(lines), InlineKeyboardMarkup(inline_keyboard=inline_buttons)

@router.message(Command("market"))
@router.message(F.text == "🏪 Market")
async def cmd_market(message: Message, session: AsyncSession):
    text, kb = await format_market_overview(session)
    await message.answer(text, reply_markup=kb, parse_mode="Markdown")

@router.callback_query(F.data == "view_market")
@router.callback_query(F.data == "market_refresh")
async def cb_market(call: CallbackQuery, session: AsyncSession):
    text, kb = await format_market_overview(session)
    try:
        await call.message.edit_text(text, reply_markup=kb, parse_mode="Markdown")
    except Exception:
        pass
    await call.answer("Market refreshed!")

@router.callback_query(F.data == "market_sell_guide")
async def cb_sell_guide(call: CallbackQuery):
    guide = (
        "📖 **Marketplace Seller's Guide** 🏪\n\n"
        "To list an item for sale, use the command:\n"
        "`/sell <item_type> <price> <currency>`\n\n"
        "📌 **Available Item Types:**\n"
        "• `SHIELD` - 12-Hour Divine Protection\n"
        "• `TROOP_CRATE` - 100 Infantry + 50 Archers\n"
        "• `WALL_REPAIR` - +500 Wall HP Reinforcement\n"
        "• `RESOURCE_PACK` - +25,000 Gold Coins\n\n"
        "💎 **Currency:**\n"
        "• `GOLD` - Available to all merchants.\n"
        "• `DIAMOND` - Exclusively for **👑 Piko VIP Members**!\n\n"
        "👉 *Example:* `/sell TROOP_CRATE 4500 GOLD`"
    )
    back_kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="🔙 Back to Marketplace", callback_data="view_market")]])
    await call.message.edit_text(guide, reply_markup=back_kb, parse_mode="Markdown")
    await call.answer()

@router.message(Command("sell"))
async def cmd_sell(message: Message, current_user: User, session: AsyncSession):
    # Syntax: /sell <item_type> <price> <currency>
    args = message.text.split() if message.text else []
    if len(args) < 4:
        await message.answer(
            "⚠️ **Format:** `/sell <type> <price> <GOLD|DIAMOND>`\n"
            "• Example: `/sell SHIELD 15000 GOLD`\n"
            "• Types: `SHIELD`, `TROOP_CRATE`, `WALL_REPAIR`, `RESOURCE_PACK`",
            parse_mode="Markdown"
        )
        return

    item_type = args[1]
    try:
        price = int(args[2])
    except ValueError:
        await message.answer("❌ Price must be a valid number!")
        return

    currency = args[3]
    success, msg = await create_market_listing(session, current_user, item_type, currency, price)
    await message.answer(msg, parse_mode="Markdown")

@router.message(Command("buy"))
async def cmd_buy(message: Message, current_user: User, session: AsyncSession):
    args = message.text.split() if message.text else []
    if len(args) < 2:
        await message.answer("⚠️ **Format:** `/buy <listing_id>` (e.g. `/buy 1`)")
        return

    try:
        listing_id = int(args[1])
    except ValueError:
        await message.answer("❌ Listing ID must be a number!")
        return

    success, msg = await buy_market_item(session, current_user, listing_id)
    await message.answer(msg, parse_mode="Markdown")

@router.callback_query(F.data.startswith("buy_item_"))
async def cb_buy_item(call: CallbackQuery, current_user: User, session: AsyncSession):
    item_id_str = call.data.split("_")[-1]
    if item_id_str.isdigit():
        success, msg = await buy_market_item(session, current_user, int(item_id_str))
        await call.answer(msg, show_alert=True)
        # Update overview
        text, kb = await format_market_overview(session)
        await call.message.edit_text(text, reply_markup=kb, parse_mode="Markdown")

# VIP Handlers
@router.message(Command("vip"))
@router.callback_query(F.data == "view_vip")
async def show_vip_menu(event: Message | CallbackQuery, current_user: User):
    from datetime import datetime
    now = datetime.utcnow()
    if current_user.is_vip and current_user.membership_expires_at and current_user.membership_expires_at > now:
        diff = current_user.membership_expires_at - now
        days = diff.days
        hours = diff.seconds // 3600
        status = f"✨👑 **ACTIVE ROYAL VIP** ({days}d {hours}h remaining) 👑✨"
    else:
        status = "🌱 **STANDARD CITIZEN** (Free Tier)"

    text = (
        f"👑 **PIKO ROYAL VIP CHAMBER** 💎\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"🎖️ Status: {status}\n"
        f"💎 Your Balance: `{current_user.diamonds:,}` Diamonds\n\n"
        f"🌟 **VIP Exclusive Perks & Royal Honors:**\n"
        f"• ✨👑 **Chamchamata Golden Name**: Glowing golden prestige in leaderboards, group chats & profiles!\n"
        f"• 💎 **Diamond Market Trading**: List & sell kingdom assets for pure Diamonds!\n"
        f"• 🎁 **2x Daily Rewards**: Double gold & double diamonds on `/daily` claims!\n"
        f"• ⛏️ **Mining Overdrive**: +50% extra Gold output from your Base Mine.\n"
        f"• 🛡️ **Priority Citadel Alerts**: Fast threat alerts and shield expiration pings.\n"
        f"• 🔮 **Upcoming Privileges**: Royal Legion siege units, tax exemptions & custom kingdom titles!\n\n"
        f"💎 **Choose Your Membership Plan:**\n"
        f"• 💎 `100 💎` ➔ **2 Days VIP Pass**\n"
        f"• ⭐ `300 💎` ➔ **7 Days Imperial VIP**\n"
        f"• 👑 `1,000 💎` ➔ **28 Days Sovereign Crown**\n"
        f"*(Purchases automatically stack with existing VIP duration!)*"
    )
    if isinstance(event, CallbackQuery):
        try:
            await event.message.edit_text(text, reply_markup=vip_keyboard(), parse_mode="Markdown")
        except Exception:
            pass
        await event.answer()
    else:
        await event.answer(text, reply_markup=vip_keyboard(), parse_mode="Markdown")

@router.callback_query(F.data == "buy_vip_2d")
async def cb_buy_vip_2d(call: CallbackQuery, current_user: User, session: AsyncSession):
    success, msg = await buy_vip(session, current_user, plan_key="2d")
    await call.answer(msg, show_alert=True)
    if success:
        await show_vip_menu(call, current_user)

@router.callback_query(F.data == "buy_vip_7d")
async def cb_buy_vip_7d(call: CallbackQuery, current_user: User, session: AsyncSession):
    success, msg = await buy_vip(session, current_user, plan_key="7d")
    await call.answer(msg, show_alert=True)
    if success:
        await show_vip_menu(call, current_user)

@router.callback_query(F.data == "buy_vip_28d")
async def cb_buy_vip_28d(call: CallbackQuery, current_user: User, session: AsyncSession):
    success, msg = await buy_vip(session, current_user, plan_key="28d")
    await call.answer(msg, show_alert=True)
    if success:
        await show_vip_menu(call, current_user)
