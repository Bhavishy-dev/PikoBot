import os
import asyncio
from aiohttp import web
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.types import BotCommand, MenuButtonWebApp, WebAppInfo

from core.config import settings
from core.logger import logger
from core.database import init_db
from middlewares.rate_limit import ThrottlingMiddleware
from middlewares.auth_check import AuthAndDatabaseMiddleware
from handlers import register_all_routers

async def start_render_health_server() -> None:
    port_str = os.environ.get("PORT")
    if not port_str:
        return

    try:
        port = int(port_str)
        async def handle_ping(request):
            return web.Response(text="PikoBot is online and polling! 🚀")

        app = web.Application()
        app.router.add_get("/", handle_ping)
        app.router.add_get("/health", handle_ping)

        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, "0.0.0.0", port)
        await site.start()
        logger.info(f"Render Web Service port binding detected & listening on port {port}")
    except Exception as e:
        logger.warning(f"Could not bind to Render PORT: {e}")

async def set_default_commands(bot: Bot) -> None:
    commands = [
        BotCommand(command="start", description="🏰 Open Main Dashboard"),
        BotCommand(command="profile", description="👤 View Empire Profile & Treasury"),
        BotCommand(command="base", description="🏛️ Inspect Fortress & Defense"),
        BotCommand(command="army", description="⚔️ Military Barracks & Troops"),
        BotCommand(command="attack", description="🏴‍☠️ Launch PvP Raid on a Base"),
        BotCommand(command="shield", description="🛡️ Activate Divine Peace Shield"),
        BotCommand(command="daily", description="🎁 Claim Daily Gold & Diamonds"),
        BotCommand(command="market", description="🏪 Open P2P Marketplace"),
        BotCommand(command="top", description="🏆 View Global Leaderboards"),
        BotCommand(command="vip", description="👑 Piko VIP Membership Perks"),
        BotCommand(command="help", description="📜 View Guide & Commands"),
    ]
    await bot.set_my_commands(commands)

async def main() -> None:
    logger.info("Starting PikoBot initialization...")

    # 1. Initialize Database Schema
    await init_db()

    # 2. Setup Bot & Dispatcher
    bot = Bot(
        token=settings.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN)
    )
    dp = Dispatcher()

    # 3. Register Middlewares
    dp.message.outer_middleware(ThrottlingMiddleware(rate_limit=0.8))
    dp.callback_query.outer_middleware(ThrottlingMiddleware(rate_limit=0.5))

    dp.message.middleware(AuthAndDatabaseMiddleware())
    dp.callback_query.middleware(AuthAndDatabaseMiddleware())

    # 4. Register Feature Routers
    register_all_routers(dp)

    # 5. Set Telegram UI Commands & WebApp Menu Button
    try:
        await set_default_commands(bot)
        await bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(
                type="web_app",
                text="Play Piko 🎮",
                web_app=WebAppInfo(url=settings.MINI_APP_URL)
            )
        )
        bot_user = await bot.get_me()
        logger.info(f"Bot connected successfully as @{bot_user.username} (ID: {bot_user.id})")
        logger.info(f"Telegram Mini App configured at: {settings.MINI_APP_URL}")
    except Exception as e:
        logger.error(f"Failed to fetch bot info or set commands: {e}")

    # 6. Start Shield Expiration Background Notifier (6h, 2h, 30m, 5m DM alerts)
    from services.shield_notifier import run_shield_expiration_monitor
    asyncio.create_task(run_shield_expiration_monitor(bot))

    # 7. Start Render Port Binding (Required if deployed as a Render Web Service)
    await start_render_health_server()

    logger.info("PikoBot is active and polling updates...")
    await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("PikoBot stopped cleanly.")
