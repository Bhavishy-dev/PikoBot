from typing import Callable, Dict, Any, Awaitable
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, Message, CallbackQuery
from core.database import AsyncSessionLocal
from database.crud.user_crud import get_or_create_user

class AuthAndDatabaseMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any]
    ) -> Any:
        from_user = None
        if isinstance(event, Message) and event.from_user:
            from_user = event.from_user
        elif isinstance(event, CallbackQuery) and event.from_user:
            from_user = event.from_user

        if not from_user or from_user.is_bot:
            return await handler(event, data)

        async with AsyncSessionLocal() as session:
            try:
                user = await get_or_create_user(
                    session=session,
                    telegram_id=from_user.id,
                    username=from_user.username,
                    full_name=from_user.full_name or "Warrior"
                )
                data["session"] = session
                data["current_user"] = user
                
                return await handler(event, data)
            except Exception:
                await session.rollback()
                raise
