import time
from typing import Callable, Dict, Any, Awaitable, Set, List
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, Message, CallbackQuery
from keyboards.inline import flood_warning_keyboard

# Global state for users flagged for rapid flooding
blocked_flood_users: Set[int] = set()
warned_flood_users: Dict[int, float] = {}

def unblock_user_flood(user_id: int) -> bool:
    """Clears flood flag once human verification completes."""
    if user_id in blocked_flood_users:
        blocked_flood_users.remove(user_id)
        return True
    return False

def is_user_flood_blocked(user_id: int) -> bool:
    return user_id in blocked_flood_users

class ThrottlingMiddleware(BaseMiddleware):
    def __init__(self, rate_limit: float = 0.8, flood_window: float = 4.0, max_requests_in_window: int = 3):
        self.rate_limit = rate_limit
        self.flood_window = flood_window
        self.max_requests_in_window = max_requests_in_window
        self.user_timestamps: Dict[int, float] = {}
        self.user_group_history: Dict[int, List[float]] = {}

    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any]
    ) -> Any:
        user_id = None
        is_group = False
        message_obj = None

        if isinstance(event, Message) and event.from_user:
            user_id = event.from_user.id
            is_group = event.chat.type in ["group", "supergroup"]
            message_obj = event
        elif isinstance(event, CallbackQuery) and event.from_user:
            user_id = event.from_user.id
            is_group = event.message and event.message.chat.type in ["group", "supergroup"]
            message_obj = event.message

        if not user_id:
            return await handler(event, data)

        now = time.time()

        # 1. Check if user is already locked by anti-flood
        if user_id in blocked_flood_users:
            if is_group:
                if isinstance(event, CallbackQuery):
                    await event.answer("⚠️ You are flagged for rapid commands! Verify in DM @Piko_Officialbot first.", show_alert=True)
                return None  # Discard group spam

        # 2. Group Anti-Flood Detection (Sliding Window)
        if is_group:
            history = self.user_group_history.get(user_id, [])
            # Keep only timestamps within window
            history = [t for t in history if now - t < self.flood_window]
            history.append(now)
            self.user_group_history[user_id] = history

            if len(history) > self.max_requests_in_window:
                blocked_flood_users.add(user_id)
                # Warn user in group only once every 30 seconds
                last_warn = warned_flood_users.get(user_id, 0)
                if now - last_warn > 30.0:
                    warned_flood_users[user_id] = now
                    user_mention = event.from_user.full_name or "Commander"
                    warn_text = (
                        f"🛑 **FLOOD PROTECTION ACTIVE!**\n\n"
                        f"[{user_mention}](tg://user?id={user_id}), you are sending commands too quickly and triggering Telegram server limits!\n\n"
                        f"🔒 **Your commands are suspended in this group.**\n"
                        f"Please verify yourself in private DM to continue using PikoBot."
                    )
                    if isinstance(event, CallbackQuery):
                        await event.answer("⚠️ Command flood detected! Verify in DM.", show_alert=True)
                        if message_obj:
                            await message_obj.answer(warn_text, reply_markup=flood_warning_keyboard(), parse_mode="Markdown")
                    elif message_obj:
                        await message_obj.answer(warn_text, reply_markup=flood_warning_keyboard(), parse_mode="Markdown")
                return None

        # 3. Standard rapid tap throttle
        last_time = self.user_timestamps.get(user_id, 0)
        if now - last_time < self.rate_limit:
            if isinstance(event, CallbackQuery):
                await event.answer("⏳ Please slow down! Don't spam.", show_alert=False)
            return None

        self.user_timestamps[user_id] = now
        return await handler(event, data)
