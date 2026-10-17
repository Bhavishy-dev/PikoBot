import asyncio
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import CommandStart, Command
from database.models import User
from keyboards.inline import main_menu_keyboard, flood_verify_dm_keyboard
from keyboards.reply import main_reply_keyboard
from middlewares.rate_limit import is_user_flood_blocked, unblock_user_flood

router = Router(name="start")

START_TEXT = (
    "👑 **Welcome to PikoBot - The Ultimate Telegram Kingdom!** 🏰\n\n"
    "Step into a world of empire building, tactical warfare, and real-time decentralized economy!\n\n"
    "✨ **Your Command Headquarters:**\n"
    "• 🎮 **Telegram Mini App**: Tap **'Play Piko 🎮'** or the button below for a full visual experience!\n"
    "• 🪙 **Piko Gold Coins**: The standard coin of trade, training, & fortress upgrades.\n"
    "• 💎 **Piko Diamonds**: Rare royal gems used for energy shields & premium VIP listings.\n"
    "• 🏰 **Base & Kingdom**: Upgrade your HQ, reinforce Walls, and activate defense Turrets.\n"
    "• ⚔️ **Army & Raids**: Train fierce troops and raid other players' bases for treasure!\n"
    "• 🏪 **P2P Marketplace**: Trade valuable assets for Gold or Diamonds.\n"
    "• 🏆 **Leaderboards**: Compete for the Richest Emperor and Mightiest General titles!\n\n"
    "👇 *Choose an action below to begin your journey:* "
)

@router.message(CommandStart())
async def cmd_start(message: Message, current_user: User):
    is_private = (message.chat.type == "private")
    args = message.text.split()[1] if len(message.text.split()) > 1 else ""

    # Check if user arrived via flood verification link or is currently flood blocked
    if is_private and (args == "verify" or is_user_flood_blocked(current_user.telegram_id)):
        await message.answer(
            "🛡️ **ANTI-FLOOD SECURITY CLEARANCE**\n\n"
            "Your account was flagged for rapid command execution in a group chat.\n\n"
            "To prevent Telegram API rate limits and restore your command access, please tap the button below to verify yourself:",
            reply_markup=flood_verify_dm_keyboard(),
            parse_mode="Markdown"
        )
        return

    reply_kb = main_reply_keyboard() if is_private else None
    await message.answer(
        START_TEXT,
        reply_markup=reply_kb,
        parse_mode="Markdown"
    )
    await message.answer(
        "🕹️ **Quick Navigation Panel:**",
        reply_markup=main_menu_keyboard(is_private=is_private)
    )

@router.callback_query(F.data == "do_verify_flood")
async def cb_do_verify_flood(call: CallbackQuery):
    await call.answer("Verifying credentials...")
    try:
        await call.message.edit_text(
            "⏳ **Verifying security credentials...**\n"
            "`[⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛]` 0%\n"
            "Inspecting rate telemetry & clearing queue...",
            parse_mode="Markdown"
        )
        await asyncio.sleep(1.5)
        await call.message.edit_text(
            "⏳ **Verifying security credentials...**\n"
            "`[🟩🟩🟩🟩🟩⬛⬛⬛⬛⬛]` 50%\n"
            "Validating identity & lifting group restriction...",
            parse_mode="Markdown"
        )
        await asyncio.sleep(1.5)
        unblock_user_flood(call.from_user.id)
        is_private = (call.message.chat.type == "private")
        await call.message.edit_text(
            "✅ **VERIFICATION COMPLETE!** 🛡️\n\n"
            "Your account has been verified as authentic.\n"
            "All command restrictions in group chats have been lifted!\n\n"
            "You may now return to your group and command your empire freely.",
            reply_markup=main_menu_keyboard(is_private=is_private),
            parse_mode="Markdown"
        )
    except Exception as e:
        unblock_user_flood(call.from_user.id)
        await call.message.answer("✅ Verification cleared! You can now use PikoBot.")

@router.message(Command("help"))
async def cmd_help(message: Message):
    help_text = (
        "📜 **PikoBot Command Handbook:**\n\n"
        "🎮 **Core Commands:**\n"
        "• `/profile` or `/me` - View your empire profile & bank balance\n"
        "• `/base` - Inspect your Fortress HQ, Wall HP & Mine\n"
        "• `/army` or `/barracks` - Manage troops & recruit soldiers\n"
        "• `/attack` - Raid an enemy (Reply to a user or `/attack @username`)\n"
        "• `/shield` - Protect your base from attacks for 12 hours (10 💎)\n"
        "• `/daily` - Claim your daily Gold & Diamonds\n"
        "• `/market` - View live P2P marketplace listings\n"
        "• `/sell <type> <price> <currency>` - List an item on marketplace\n"
        "• `/buy <listing_id>` - Purchase an item from the market\n"
        "• `/top` or `/leaderboard` - View rankings\n"
        "• `/vip` - Unlock Piko VIP Membership perks"
    )
    await message.answer(help_text, parse_mode="Markdown")

@router.callback_query(F.data == "main_menu")
async def cb_main_menu(call: CallbackQuery):
    is_private = (call.message.chat.type == "private")
    try:
        await call.message.edit_text(
            START_TEXT,
            reply_markup=main_menu_keyboard(is_private=is_private),
            parse_mode="Markdown"
        )
    except Exception:
        pass
    await call.answer()
