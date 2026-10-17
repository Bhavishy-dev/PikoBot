import random
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton, ChatMemberUpdated
from aiogram.filters import Command, ChatMemberUpdatedFilter, JOIN_TRANSITION
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User
from database.crud.user_crud import claim_daily_reward

router = Router(name="group")

# In-memory active drops per chat: chat_id -> amount
active_chat_drops: dict[int, int] = {}

# Daily Claim Handler
@router.message(Command("daily"))
@router.message(F.text == "🎁 Daily")
async def cmd_daily(message: Message, current_user: User, session: AsyncSession):
    success, gold, diamonds, text = await claim_daily_reward(session, current_user)
    if success:
        await message.answer(
            f"🎁 **Daily Reward Claimed!** 🎉\n\n"
            f"• 🪙 **+{gold:,} Piko Gold Coins**\n"
            f"• 💎 **+{diamonds} Piko Diamonds**\n\n"
            f"Come back tomorrow for your next reward!",
            parse_mode="Markdown"
        )
    else:
        await message.answer(
            f"⏳ You have already claimed your daily reward!\n"
            f"Please wait **{text}** before claiming again.",
            parse_mode="Markdown"
        )

@router.callback_query(F.data == "claim_daily")
async def cb_claim_daily(call: CallbackQuery, current_user: User, session: AsyncSession):
    success, gold, diamonds, text = await claim_daily_reward(session, current_user)
    if success:
        await call.answer(
            f"🎁 Daily Claimed! +{gold} Gold, +{diamonds} Diamonds!",
            show_alert=True
        )
    else:
        await call.answer(
            f"⏳ Already claimed! Wait: {text}",
            show_alert=True
        )

# Group Welcome
@router.chat_member(ChatMemberUpdatedFilter(JOIN_TRANSITION))
async def welcome_new_member(event: ChatMemberUpdated):
    new_user = event.new_chat_member.user
    if new_user.is_bot:
        return
    welcome_text = (
        f"👋 Welcome [{new_user.full_name}](tg://user?id={new_user.id}) to the Realm!\n\n"
        f"🏰 Build your Kingdom, train troops, and conquer your rivals with **PikoBot**!\n"
        f"Type `/start` or `/help` to build your base!"
    )
    await event.answer(welcome_text, parse_mode="Markdown")

# Random Group Coin Drops & Chat Engagement
@router.message(F.chat.type.in_({"group", "supergroup"}))
async def group_chat_engagement(message: Message, session: AsyncSession):
    if not message.from_user or message.from_user.is_bot:
        return

    chat_id = message.chat.id
    
    # 2.5% chance per message to spawn a Lucky Treasure Drop in the group!
    if chat_id not in active_chat_drops and random.random() < 0.025:
        drop_amount = random.randint(150, 600)
        active_chat_drops[chat_id] = drop_amount

        drop_keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text=f"🎁 Grab Treasure ({drop_amount} 🪙)!",
                        callback_data=f"claim_drop_{chat_id}_{drop_amount}"
                    )
                ]
            ]
        )

        await message.answer(
            "💎✨ **A MYSTERIOUS TREASURE CHEST DROPPED IN THE CHAT!** ✨💎\n\n"
            f"A treasure chest containing **{drop_amount:,} Piko Gold Coins** appeared!\n"
            "Be the fastest general to grab it!",
            reply_markup=drop_keyboard,
            parse_mode="Markdown"
        )

@router.callback_query(F.data.startswith("claim_drop_"))
async def cb_claim_drop(call: CallbackQuery, current_user: User, session: AsyncSession):
    parts = call.data.split("_")
    chat_id = int(parts[2])
    drop_amount = int(parts[3])

    if chat_id in active_chat_drops:
        del active_chat_drops[chat_id]
        current_user.gold_coins += drop_amount
        await session.commit()

        await call.message.edit_text(
            f"🎉 [{call.from_user.full_name}](tg://user?id={call.from_user.id}) was the fastest and claimed the **{drop_amount:,} 🪙 Piko Gold Coins**! 💰",
            parse_mode="Markdown"
        )
        await call.answer("💰 You claimed the treasure chest!", show_alert=True)
    else:
        await call.answer("⚡ Too late! Someone already claimed this chest.", show_alert=True)
