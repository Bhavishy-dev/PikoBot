import random
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User
from database.crud.user_crud import get_user
from services.battle_engine import execute_attack

router = Router(name="battle")

@router.message(Command("attack"))
@router.message(Command("raid"))
async def cmd_attack(message: Message, current_user: User, session: AsyncSession):
    defender = None

    # Option 1: Reply to a user's message in a group
    if message.reply_to_message and message.reply_to_message.from_user:
        target_tg_user = message.reply_to_message.from_user
        if target_tg_user.is_bot:
            await message.answer("🤖 You cannot attack bots, Commander!")
            return
        defender = await get_user(session, target_tg_user.id)
        if not defender:
            await message.answer("❌ This user hasn't registered in PikoBot yet!")
            return

    # Option 2: Provide username or user ID: /attack @username or /attack 123456
    else:
        args = message.text.split() if message.text else []
        if len(args) < 2:
            await message.answer(
                "⚔️ **Battle Command Usage:**\n"
                "• **In Group:** Reply to any player's message with `/attack`\n"
                "• **By Username:** `/attack @username`\n"
                "• **By Empire ID:** `/attack <telegram_id>`\n"
                "• Or press **Find Raid Target** in `/army` menu!",
                parse_mode="Markdown"
            )
            return

        target_str = args[1].replace("@", "")
        if target_str.isdigit():
            defender = await get_user(session, int(target_str))
        else:
            stmt = (
                select(User)
                .options(selectinload(User.base), selectinload(User.army))
                .where(User.username == target_str)
            )
            res = await session.execute(stmt)
            defender = res.scalar_one_or_none()

        if not defender:
            await message.answer(f"❌ Could not find an active empire with identifier `{target_str}`.")
            return

    # Execute attack
    success, report, _ = await execute_attack(session, current_user, defender)
    await message.answer(report, parse_mode="Markdown")

from keyboards.inline import battle_report_keyboard

@router.callback_query(F.data == "find_target")
async def cb_find_target(call: CallbackQuery, current_user: User, session: AsyncSession):
    # Find random eligible targets who are not shielded and not self
    stmt = (
        select(User)
        .options(selectinload(User.base), selectinload(User.army))
        .where(User.telegram_id != current_user.telegram_id)
        .limit(20)
    )
    res = await session.execute(stmt)
    all_users = res.scalars().all()

    candidates = [u for u in all_users if not u.base.is_shielded]
    if not candidates:
        await call.answer("🔍 No unshielded enemy bases found right now! Check back soon.", show_alert=True)
        return

    target = random.choice(candidates)
    success, report, _ = await execute_attack(session, current_user, target)
    await call.answer("⚔️ Assault initiated!")
    await call.message.edit_text(report, reply_markup=battle_report_keyboard(), parse_mode="Markdown")
