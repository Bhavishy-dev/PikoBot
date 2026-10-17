from datetime import datetime
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command
from database.models import User

router = Router(name="profile")

def format_profile_card(user: User) -> str:
    if user.is_vip and user.membership_expires_at:
        diff = user.membership_expires_at - datetime.utcnow()
        days_left = max(0, diff.days)
        hours_left = int(diff.seconds // 3600)
        vip_status = f"✨👑 **[VIP ROYAL EMPEROR]** ({days_left}d {hours_left}h left) 👑✨"
    elif user.is_vip:
        vip_status = "✨👑 **[VIP ROYAL EMPEROR]** 👑✨"
    else:
        vip_status = "🌱 Free Citizen"

    base_hq = user.base.hq_level if user.base else 1
    wall_status = f"{user.base.wall_hp}/{user.base.max_wall_hp} HP" if user.base else "N/A"
    defense_pwr = user.base.defense_power if user.base else 0
    shield_status = "🛡️ Active" if (user.base and user.base.is_shielded) else "❌ Exposed"

    army_troops = user.army.total_troops if user.army else 0
    army_power = user.army.total_attack_power if user.army else 0

    from services.battle_engine import get_current_raid_horns
    horns, rem_secs = get_current_raid_horns(user)
    horn_txt = f"{horns}/3" if horns >= 3 else f"{horns}/3 (+1 in {rem_secs//60}m)"

    return (
        f"👤 **EMPEROR PROFILE** 🏛️\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"🏷️ **Name:** `{user.full_name}`\n"
        f"🆔 **Empire ID:** `{user.telegram_id}`\n"
        f"🎖️ **Rank:** {vip_status}\n\n"
        f"💰 **Treasury & Wealth:**\n"
        f"• 🪙 **Gold Coins:** `{user.gold_coins:,}` Piko Coins\n"
        f"• 💎 **Diamonds:** `{user.diamonds:,}` Piko Gems\n\n"
        f"🏰 **Fortress & Defense:**\n"
        f"• HQ Level: `Lv.{base_hq}`\n"
        f"• Wall Integrity: `{wall_status}`\n"
        f"• Defense Rating: `{defense_pwr}` 🛡️\n"
        f"• Peace Shield: {shield_status}\n\n"
        f"⚔️ **Military Assets:**\n"
        f"• Standing Troops: `{army_troops}` units\n"
        f"• Army Attack Power: `{army_power}` 💥\n"
        f"• 📯 War Horns (Energy): `{horn_txt}`\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"💡 *Upgrade your base or train troops to increase your influence!*"
    )

def profile_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="🏰 View Base", callback_data="view_base"),
                InlineKeyboardButton(text="⚔️ View Army", callback_data="view_army")
            ],
            [
                InlineKeyboardButton(text="🔙 Main Menu", callback_data="main_menu")
            ]
        ]
    )

@router.message(Command("profile"))
@router.message(Command("me"))
@router.message(Command("balance"))
@router.message(F.text == "👤 Profile")
async def show_profile_message(message: Message, current_user: User):
    await message.answer(
        format_profile_card(current_user),
        reply_markup=profile_keyboard(),
        parse_mode="Markdown"
    )

from aiogram.exceptions import TelegramBadRequest

@router.callback_query(F.data == "view_profile")
async def show_profile_callback(call: CallbackQuery, current_user: User):
    try:
        await call.message.edit_text(
            format_profile_card(current_user),
            reply_markup=profile_keyboard(),
            parse_mode="Markdown"
        )
    except TelegramBadRequest as e:
        if "message is not modified" in str(e):
            pass
        else:
            raise
    await call.answer()
