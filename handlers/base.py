from datetime import datetime
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User
from database.crud.base_crud import (
    upgrade_hq,
    upgrade_wall,
    repair_wall,
    upgrade_turret,
    upgrade_mine,
    collect_mine,
    activate_shield
)
from keyboards.inline import base_actions_keyboard

router = Router(name="base")

def format_base_card(user: User) -> str:
    base = user.base
    if base.is_shielded and base.shield_until:
        rem = base.shield_until - datetime.utcnow()
        hrs, mins = divmod(int(rem.total_seconds()), 3600)
        shield_info = f"🛡️ **Peace Treaty Active:** `{hrs}h {mins // 60}m remaining`\n   *Vault Safe • 0 🪙 at risk from raids*"
    else:
        at_risk = int(user.gold_coins * 0.70)
        shield_info = f"⚠️ **THREAT STATUS: EXPOSED (HIGH RISK)**\n   *Rivals can raid up to `{at_risk:,} 🪙` right now!*\n   *(Defenders keep 30% safe, but activate Divine Shield (10 💎) or reinforce walls!)*"

    # Wall HP health bar
    hp_pct = max(0, min(100, int((base.wall_hp / base.max_wall_hp) * 100)))
    bars = int(hp_pct / 10)
    health_bar = "🟩" * bars + "⬛" * (10 - bars)

    next_hq_cost = base.hq_level * 1500
    next_wall_cost = base.wall_level * 1000
    next_turret_cost = base.defense_turret_level * 1200
    next_mine_cost = base.collector_level * 1000
    vip_mine_rate = int(base.collector_level * 5 * 1.5)

    return (
        f"🏰 **KINGDOM CITADEL & DEFENSE** 🛡️\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"👑 **Ruler:** `{user.full_name}`\n"
        f"🏛️ **Headquarters:** `Level {base.hq_level}` (Upgrade: {next_hq_cost:,} 🪙)\n"
        f"🧱 **Fortress Wall:** `Level {base.wall_level}`\n"
        f"   HP: `{base.wall_hp} / {base.max_wall_hp}` [{health_bar} {hp_pct}%]\n"
        f"   (Upgrade Wall: {next_wall_cost:,} 🪙)\n\n"
        f"🗼 **Defense Turrets:** `Level {base.defense_turret_level}`\n"
        f"   Total Defense Power: `{base.defense_power}` 🛡️\n"
        f"   (Upgrade Turrets: {next_turret_cost:,} 🪙)\n\n"
        f"⛏️ **Gold Mine Generator:** `Level {base.collector_level}` (Upgrade: {next_mine_cost:,} 🪙)\n"
        f"   Status: Generating ~`{base.collector_level * 5}` Gold/min (VIP: ~`{vip_mine_rate}` Gold/min)\n\n"
        f"🔰 **Protection Status:**\n"
        f"{shield_info}\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"🪙 Treasury: `{user.gold_coins:,}` Gold | 💎 `{user.diamonds}` Diamonds"
    )

@router.message(Command("base"))
@router.message(F.text == "🏰 My Base")
async def show_base_message(message: Message, current_user: User):
    await message.answer(
        format_base_card(current_user),
        reply_markup=base_actions_keyboard(),
        parse_mode="Markdown"
    )

from aiogram.exceptions import TelegramBadRequest

async def safe_edit_base(call: CallbackQuery, user: User):
    try:
        await call.message.edit_text(
            format_base_card(user),
            reply_markup=base_actions_keyboard(),
            parse_mode="Markdown"
        )
    except TelegramBadRequest as e:
        if "message is not modified" in str(e):
            pass
        else:
            raise

@router.callback_query(F.data == "view_base")
async def show_base_callback(call: CallbackQuery, current_user: User):
    await safe_edit_base(call, current_user)
    await call.answer()

@router.callback_query(F.data == "base_collect")
async def cb_collect_mine(call: CallbackQuery, current_user: User, session: AsyncSession):
    success, amount, msg = await collect_mine(session, current_user)
    await call.answer(msg, show_alert=True)
    if success:
        await safe_edit_base(call, current_user)

@router.callback_query(F.data == "base_repair")
async def cb_repair_wall(call: CallbackQuery, current_user: User, session: AsyncSession):
    success, msg = await repair_wall(session, current_user)
    await call.answer(msg, show_alert=True)
    if success:
        await safe_edit_base(call, current_user)

@router.callback_query(F.data == "base_up_hq")
async def cb_upgrade_hq(call: CallbackQuery, current_user: User, session: AsyncSession):
    success, msg = await upgrade_hq(session, current_user)
    await call.answer(msg, show_alert=True)
    if success:
        await safe_edit_base(call, current_user)

@router.callback_query(F.data == "base_up_mine")
async def cb_upgrade_mine(call: CallbackQuery, current_user: User, session: AsyncSession):
    success, msg = await upgrade_mine(session, current_user)
    await call.answer(msg, show_alert=True)
    if success:
        await safe_edit_base(call, current_user)

@router.callback_query(F.data == "base_up_wall")
async def cb_upgrade_wall(call: CallbackQuery, current_user: User, session: AsyncSession):
    success, msg = await upgrade_wall(session, current_user)
    await call.answer(msg, show_alert=True)
    if success:
        await safe_edit_base(call, current_user)

@router.callback_query(F.data == "base_up_turret")
async def cb_upgrade_turret(call: CallbackQuery, current_user: User, session: AsyncSession):
    success, msg = await upgrade_turret(session, current_user)
    await call.answer(msg, show_alert=True)
    if success:
        await safe_edit_base(call, current_user)

@router.message(Command("shield"))
@router.callback_query(F.data == "base_shield")
async def cb_buy_shield(event: Message | CallbackQuery, current_user: User, session: AsyncSession):
    success, msg = await activate_shield(session, current_user)
    if isinstance(event, CallbackQuery):
        await event.answer(msg, show_alert=True)
        if success:
            await safe_edit_base(event, current_user)
    else:
        await event.answer(msg, parse_mode="Markdown")
