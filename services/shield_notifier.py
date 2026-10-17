import asyncio
from datetime import datetime
from aiogram import Bot
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.exceptions import TelegramAPIError
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from core.database import AsyncSessionLocal
from core.config import settings
from core.logger import logger
from database.models import UserBase

# In-memory tracking of sent alert thresholds: set of (user_id, shield_until_iso, threshold_tag)
_sent_shield_alerts = set()

def get_shield_alert_keyboard() -> InlineKeyboardMarkup:
    buttons = [
        [
            InlineKeyboardButton(text="🛡️ Renew Shield (10 💎)", callback_data="base_shield"),
            InlineKeyboardButton(text="🏰 Inspect Citadel", callback_data="view_base")
        ],
        [
            InlineKeyboardButton(text="🎮 Open Citadel in Mini App 🚀", web_app=WebAppInfo(url=settings.MINI_APP_URL))
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

async def check_and_send_shield_alerts(bot: Bot) -> None:
    now = datetime.utcnow()
    try:
        async with AsyncSessionLocal() as session:
            stmt = select(UserBase).options(selectinload(UserBase.user)).where(
                UserBase.shield_until.is_not(None),
                UserBase.shield_until > now
            )
            res = await session.execute(stmt)
            bases = res.scalars().all()

            for base in bases:
                user = base.user
                if not user:
                    continue

                diff = base.shield_until - now
                rem_seconds = int(diff.total_seconds())
                shield_iso = base.shield_until.isoformat()
                user_id = user.telegram_id
                gold_at_risk = int(user.gold_coins * 0.70)
                user_name = user.full_name or "Emperor"

                # Thresholds to notify: 6h (21600s), 2h (7200s), 30m (1800s), 5m (300s)
                # We check in descending order of urgency
                targets = [
                    (300, "5m", (
                        "🚨🔥 **CRITICAL CITADEL EMERGENCY: 5 MINUTES LEFT!** 🔥🚨\n"
                        "━━━━━━━━━━━━━━━━━━━━━\n"
                        f"Emperor `{user_name}`, your Divine Peace Shield expires in **ONLY 5 MINUTES**!\n\n"
                        f"💀 In moments, rival kingdoms will be able to raid your base and plunder up to `{gold_at_risk:,} 🪙` Gold!\n\n"
                        "⚡ **Act immediately:** Tap below to renew your Peace Treaty or reinforce defenses right now!"
                    )),
                    (1800, "30m", (
                        "⚠️⚡ **CITADEL DEFENSE WARNING: 30 MINUTES REMAINING!** ⚡⚠️\n"
                        "━━━━━━━━━━━━━━━━━━━━━\n"
                        f"Emperor `{user_name}`, enemy scouts are approaching your fortress!\n\n"
                        f"🛡️ Your protection treaty falls in **30 minutes**.\n"
                        f"💰 Vault Exposure: `{gold_at_risk:,} 🪙` Gold at risk of plundering.\n\n"
                        "👉 Be active, prepare your army garrison, or renew your Peace Treaty immediately!"
                    )),
                    (7200, "2h", (
                        "🔔🏰 **CITADEL DEFENSE NOTICE: 2 HOURS REMAINING** 🛡️\n"
                        "━━━━━━━━━━━━━━━━━━━━━\n"
                        f"Emperor `{user_name}`, war drums can be heard beyond the valley.\n\n"
                        f"⏳ Your Citadel Peace Shield will expire in **2 hours**.\n"
                        f"🏦 Unprotected treasury: `{gold_at_risk:,} 🪙` Gold.\n\n"
                        "Log in, check your Wall HP, and ensure your base stays protected!"
                    )),
                    (21600, "6h", (
                        "🛡️🏰 **CITADEL PEACE TREATY: 6 HOURS REMAINING** ⏳\n"
                        "━━━━━━━━━━━━━━━━━━━━━\n"
                        f"Emperor `{user_name}`, this is your kingdom's early defense alert.\n\n"
                        f"🕊️ Your base shield will expire in **6 hours**.\n"
                        "Make sure to remain active today, collect accumulated gold from your mine, and keep your defenses strong!"
                    ))
                ]

                for threshold_seconds, tag, alert_text in targets:
                    alert_key = (user_id, shield_iso, tag)
                    if rem_seconds <= threshold_seconds and alert_key not in _sent_shield_alerts:
                        # Mark as sent immediately to avoid duplicates
                        _sent_shield_alerts.add(alert_key)
                        try:
                            await bot.send_message(
                                chat_id=user_id,
                                text=alert_text,
                                reply_markup=get_shield_alert_keyboard(),
                                parse_mode="Markdown"
                            )
                            logger.info(f"Sent {tag} shield expiration alert to user {user_id} ({user_name})")
                        except TelegramAPIError as tg_err:
                            logger.debug(f"Could not send shield alert to user {user_id}: {tg_err}")
                        except Exception as e:
                            logger.error(f"Error sending shield alert to {user_id}: {e}")
                        break  # Only send the most specific trigger for this tick

        # Periodic cleanup of old alert keys
        if len(_sent_shield_alerts) > 10000:
            _sent_shield_alerts.clear()

    except Exception as e:
        logger.error(f"Error in shield expiration notifier loop: {e}")

async def run_shield_expiration_monitor(bot: Bot) -> None:
    logger.info("Starting Citadel Shield Expiration Background Monitor (6h, 2h, 30m, 5m alerts)...")
    while True:
        try:
            await check_and_send_shield_alerts(bot)
        except Exception as e:
            logger.error(f"Unexpected error in shield monitor: {e}")
        await asyncio.sleep(45)  # Check every 45 seconds for precision
