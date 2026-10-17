from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User
from database.crud.army_crud import (
    train_troops,
    upgrade_barracks,
    TROOP_PRICES
)
from services.battle_engine import get_current_raid_horns, recharge_war_horn
from keyboards.inline import army_actions_keyboard

router = Router(name="army")

def format_army_card(user: User) -> str:
    army = user.army
    max_capacity = army.barracks_level * 150
    infantry_pwr = army.infantry_count * 5
    archer_pwr = army.archer_count * 12
    siege_pwr = army.siege_count * 50
    total_pwr = army.total_attack_power
    next_barracks_cost = army.barracks_level * 2000

    horns, rem_secs = get_current_raid_horns(user)
    if horns >= 3:
        horn_info = "📯 **War Horns (Raid Energy):** `3 / 3` *(Full Strength)*"
    else:
        mins, secs = divmod(rem_secs, 60)
        horn_info = f"📯 **War Horns (Raid Energy):** `{horns} / 3` *(+1 in {mins}m {secs}s)*"

    return (
        f"⚔️ **MILITARY WAR ROOM & BARRACKS** ⛺\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"🎖️ **Commander:** `{user.full_name}`\n"
        f"⛺ **Barracks Level:** `Lv.{army.barracks_level}`\n"
        f"🪖 **Capacity:** `{army.total_troops} / {max_capacity} Troops`\n"
        f"💥 **Total Strike Power:** `{total_pwr}` ATK\n"
        f"{horn_info}\n\n"
        f"📋 **Standing Divisions:**\n"
        f"• ⚔️ **Infantry:** `{army.infantry_count}` units (Power: `{infantry_pwr}`)\n"
        f"   *Fast front-line warriors (Cost: 20 🪙 each)*\n"
        f"• 🏹 **Archers:** `{army.archer_count}` units (Power: `{archer_pwr}`)\n"
        f"   *Ranged defense piercers (Cost: 50 🪙 each)*\n"
        f"• 🛡️ **Siege Engines:** `{army.siege_count}` units (Power: `{siege_pwr}`)\n"
        f"   *Massive fortress wall destroyers (Cost: 250 🪙 each)*\n\n"
        f"⛺ Upgrade Barracks: `{next_barracks_cost:,} 🪙`\n"
        f"━━━━━━━━━━━━━━━━━━━━━\n"
        f"💡 *Command: `/train <infantry|archer|siege> <amount>` to recruit custom batches!*"
    )

@router.message(Command("army"))
@router.message(Command("barracks"))
@router.message(F.text == "⚔️ Army")
async def show_army_message(message: Message, current_user: User):
    await message.answer(
        format_army_card(current_user),
        reply_markup=army_actions_keyboard(),
        parse_mode="Markdown"
    )

@router.callback_query(F.data == "view_army")
async def show_army_callback(call: CallbackQuery, current_user: User):
    await call.message.edit_text(
        format_army_card(current_user),
        reply_markup=army_actions_keyboard(),
        parse_mode="Markdown"
    )
    await call.answer()

@router.callback_query(F.data == "train_infantry_10")
async def cb_train_infantry_10(call: CallbackQuery, current_user: User, session: AsyncSession):
    success, msg = await train_troops(session, current_user, "infantry", 10)
    await call.answer(msg, show_alert=True)
    if success:
        await call.message.edit_text(
            format_army_card(current_user),
            reply_markup=army_actions_keyboard(),
            parse_mode="Markdown"
        )

@router.callback_query(F.data == "train_archer_10")
async def cb_train_archer_10(call: CallbackQuery, current_user: User, session: AsyncSession):
    success, msg = await train_troops(session, current_user, "archer", 10)
    await call.answer(msg, show_alert=True)
    if success:
        await call.message.edit_text(
            format_army_card(current_user),
            reply_markup=army_actions_keyboard(),
            parse_mode="Markdown"
        )

@router.callback_query(F.data == "train_siege_2")
async def cb_train_siege_2(call: CallbackQuery, current_user: User, session: AsyncSession):
    success, msg = await train_troops(session, current_user, "siege", 2)
    await call.answer(msg, show_alert=True)
    if success:
        await call.message.edit_text(
            format_army_card(current_user),
            reply_markup=army_actions_keyboard(),
            parse_mode="Markdown"
        )

@router.callback_query(F.data == "army_up_barracks")
async def cb_up_barracks(call: CallbackQuery, current_user: User, session: AsyncSession):
    success, msg = await upgrade_barracks(session, current_user)
    await call.answer(msg, show_alert=True)
    if success:
        await call.message.edit_text(
            format_army_card(current_user),
            reply_markup=army_actions_keyboard(),
            parse_mode="Markdown"
        )

@router.callback_query(F.data == "recharge_horn")
async def cb_recharge_horn(call: CallbackQuery, current_user: User, session: AsyncSession):
    success, msg = await recharge_war_horn(session, current_user)
    await call.answer(msg, show_alert=True)
    if success:
        await call.message.edit_text(
            format_army_card(current_user),
            reply_markup=army_actions_keyboard(),
            parse_mode="Markdown"
        )

@router.message(Command("train"))
async def cmd_train(message: Message, current_user: User, session: AsyncSession):
    # Syntax: /train <troop_type> <amount>
    args = message.text.split() if message.text else []
    if len(args) < 3:
        await message.answer(
            "⚠️ **Usage:** `/train <type> <amount>`\n"
            "• Types: `infantry` (20 🪙), `archer` (50 🪙), `siege` (250 🪙)\n"
            "• Example: `/train infantry 50`",
            parse_mode="Markdown"
        )
        return

    troop_type = args[1].lower()
    try:
        amount = int(args[2])
    except ValueError:
        await message.answer("❌ Amount must be a valid integer number!")
        return

    success, msg = await train_troops(session, current_user, troop_type, amount)
    await message.answer(msg, parse_mode="Markdown")
