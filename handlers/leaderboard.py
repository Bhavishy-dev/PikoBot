from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from sqlalchemy.ext.asyncio import AsyncSession
from database.crud.user_crud import get_top_richest
from database.crud.base_crud import get_top_bases
from database.crud.army_crud import get_top_armies
from keyboards.inline import leaderboard_menu_keyboard

router = Router(name="leaderboard")

LEADERBOARD_MAIN = (
    "🏆 **PIKO REALM LEADERBOARDS** 🌟\n"
    "━━━━━━━━━━━━━━━━━━━━━\n"
    "Select a ranking category below to view the most legendary emperors in the realm!"
)

@router.message(Command("top"))
@router.message(Command("leaderboard"))
@router.message(F.text == "🏆 Leaderboard")
async def show_leaderboard_menu(message: Message):
    await message.answer(
        LEADERBOARD_MAIN,
        reply_markup=leaderboard_menu_keyboard(),
        parse_mode="Markdown"
    )

@router.callback_query(F.data == "view_leaderboard")
async def cb_view_leaderboard(call: CallbackQuery):
    await call.message.edit_text(
        LEADERBOARD_MAIN,
        reply_markup=leaderboard_menu_keyboard(),
        parse_mode="Markdown"
    )
    await call.answer()

from aiogram.exceptions import TelegramBadRequest

async def safe_edit(call: CallbackQuery, text: str, reply_markup=None):
    try:
        await call.message.edit_text(text, reply_markup=reply_markup, parse_mode="Markdown")
    except TelegramBadRequest as e:
        if "message is not modified" in str(e):
            pass
        else:
            raise

@router.callback_query(F.data == "lb_richest")
async def cb_lb_richest(call: CallbackQuery, session: AsyncSession):
    richest = await get_top_richest(session, limit=10)
    lines = [
        "💰 **TOP RICHEST EMPIRES** 🪙",
        "━━━━━━━━━━━━━━━━━━━━━"
    ]
    medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
    for idx, user in enumerate(richest):
        medal = medals[idx] if idx < len(medals) else f"{idx + 1}."
        if user.is_vip:
            name_str = f"✨👑 [VIP] **{user.full_name}** 👑✨"
        else:
            name_str = f"**{user.full_name}**"
        lines.append(f"{medal} {name_str} — `{user.gold_coins:,}` 🪙 | `{user.diamonds}` 💎")

    lines.append("━━━━━━━━━━━━━━━━━━━━━")
    lines.append("💡 *VIP Emperors shine with glowing Royal Distinction & priority!*")
    await safe_edit(call, "\n".join(lines), reply_markup=leaderboard_menu_keyboard())
    await call.answer()

@router.callback_query(F.data == "lb_bases")
async def cb_lb_bases(call: CallbackQuery, session: AsyncSession):
    bases = await get_top_bases(session, limit=10)
    lines = [
        "🏰 **STRONGEST FORTRESSES** 🛡️",
        "━━━━━━━━━━━━━━━━━━━━━"
    ]
    medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
    for idx, base in enumerate(bases):
        owner_name = base.user.full_name if base.user else "Unknown"
        is_vip = base.user.is_vip if base.user else False
        medal = medals[idx] if idx < len(medals) else f"{idx + 1}."
        if is_vip:
            name_str = f"✨👑 [VIP] **{owner_name}** 👑✨"
        else:
            name_str = f"**{owner_name}**"
        lines.append(f"{medal} {name_str} — `HQ Lv.{base.hq_level}` | Defense: `{base.defense_power}` 🛡️")

    lines.append("━━━━━━━━━━━━━━━━━━━━━")
    lines.append("💡 *VIP Emperors shine with glowing Royal Distinction & priority!*")
    await safe_edit(call, "\n".join(lines), reply_markup=leaderboard_menu_keyboard())
    await call.answer()

@router.callback_query(F.data == "lb_armies")
async def cb_lb_armies(call: CallbackQuery, session: AsyncSession):
    armies = await get_top_armies(session, limit=10)
    lines = [
        "⚔️ **MIGHTIEST GENERALS & ARMIES** 💥",
        "━━━━━━━━━━━━━━━━━━━━━"
    ]
    medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
    for idx, army in enumerate(armies):
        owner_name = army.user.full_name if army.user else "Unknown"
        is_vip = army.user.is_vip if army.user else False
        medal = medals[idx] if idx < len(medals) else f"{idx + 1}."
        if is_vip:
            name_str = f"✨👑 [VIP] **{owner_name}** 👑✨"
        else:
            name_str = f"**{owner_name}**"
        lines.append(f"{medal} {name_str} — `{army.total_attack_power}` ATK | `{army.total_troops}` troops")

    lines.append("━━━━━━━━━━━━━━━━━━━━━")
    lines.append("💡 *VIP Emperors shine with glowing Royal Distinction & priority!*")
    await safe_edit(call, "\n".join(lines), reply_markup=leaderboard_menu_keyboard())
    await call.answer()
