from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from core.config import settings

def main_menu_keyboard(is_private: bool = True) -> InlineKeyboardMarkup:
    if is_private:
        launch_btn = InlineKeyboardButton(text="🎮 Launch Piko Mini App 🚀", web_app=WebAppInfo(url=settings.MINI_APP_URL))
    else:
        # In Group Chats, using t.me/<bot>/<app> launches the Mini App directly inside Telegram
        launch_btn = InlineKeyboardButton(
            text="🎮 Launch Piko Mini App 🚀",
            url=f"https://t.me/{settings.BOT_USERNAME}/{settings.MINI_APP_SHORT_NAME}"
        )
        
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [launch_btn],
            [
                InlineKeyboardButton(text="👤 My Profile", callback_data="view_profile"),
                InlineKeyboardButton(text="🏰 Kingdom Base", callback_data="view_base")
            ],
            [
                InlineKeyboardButton(text="⚔️ Military Barracks", callback_data="view_army"),
                InlineKeyboardButton(text="🏪 Marketplace", callback_data="view_market")
            ],
            [
                InlineKeyboardButton(text="🎁 Claim Daily", callback_data="claim_daily"),
                InlineKeyboardButton(text="🏆 Leaderboard", callback_data="view_leaderboard")
            ],
            [
                InlineKeyboardButton(text="👑 VIP Membership", callback_data="view_vip")
            ]
        ]
    )

def base_actions_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="⛏️ Collect Mine", callback_data="base_collect"),
                InlineKeyboardButton(text="🛠️ Repair Wall", callback_data="base_repair")
            ],
            [
                InlineKeyboardButton(text="🏰 Upgrade HQ", callback_data="base_up_hq"),
                InlineKeyboardButton(text="⛏️ Upgrade Mine", callback_data="base_up_mine")
            ],
            [
                InlineKeyboardButton(text="🧱 Upgrade Wall", callback_data="base_up_wall"),
                InlineKeyboardButton(text="🗼 Upgrade Turret", callback_data="base_up_turret")
            ],
            [
                InlineKeyboardButton(text="🛡️ Buy Shield (10 💎)", callback_data="base_shield")
            ],
            [
                InlineKeyboardButton(text="🔙 Back to Main Menu", callback_data="main_menu")
            ]
        ]
    )

def army_actions_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="⚔️ Train 10 Infantry (200 🪙)", callback_data="train_infantry_10"),
                InlineKeyboardButton(text="🏹 Train 10 Archers (500 🪙)", callback_data="train_archer_10")
            ],
            [
                InlineKeyboardButton(text="🛡️ Train 2 Sieges (500 🪙)", callback_data="train_siege_2"),
                InlineKeyboardButton(text="⛺ Upgrade Barracks", callback_data="army_up_barracks")
            ],
            [
                InlineKeyboardButton(text="🏴‍☠️ Find Raid Target", callback_data="find_target"),
                InlineKeyboardButton(text="⚡ Recharge +1 📯 (3 💎)", callback_data="recharge_horn")
            ],
            [
                InlineKeyboardButton(text="🔙 Back to Main Menu", callback_data="main_menu")
            ]
        ]
    )

def battle_report_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="⚔️ Raid Another Empire", callback_data="find_target"),
                InlineKeyboardButton(text="⚡ Recharge 📯 (3 💎)", callback_data="recharge_horn")
            ],
            [
                InlineKeyboardButton(text="🏰 My Citadel", callback_data="view_base"),
                InlineKeyboardButton(text="⛺ Military Barracks", callback_data="view_army")
            ]
        ]
    )

def flood_warning_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text=f"🔐 Verify in DM (@{settings.BOT_USERNAME})", url=f"https://t.me/{settings.BOT_USERNAME}?start=verify")
            ]
        ]
    )

def flood_verify_dm_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="🤖 I am Human (Verify 3s)", callback_data="do_verify_flood")
            ]
        ]
    )

def market_actions_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="🔄 Refresh Listings", callback_data="market_refresh"),
                InlineKeyboardButton(text="➕ Sell Item Guide", callback_data="market_sell_guide")
            ],
            [
                InlineKeyboardButton(text="👑 Become VIP (Trade 💎)", callback_data="view_vip"),
                InlineKeyboardButton(text="🔙 Back", callback_data="main_menu")
            ]
        ]
    )

def leaderboard_menu_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="💰 Richest Empires", callback_data="lb_richest"),
                InlineKeyboardButton(text="🏰 Strongest Bases", callback_data="lb_bases")
            ],
            [
                InlineKeyboardButton(text="⚔️ Mightiest Armies", callback_data="lb_armies"),
                InlineKeyboardButton(text="🔙 Back", callback_data="main_menu")
            ]
        ]
    )

def vip_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="💎 2 Days VIP (100 💎)", callback_data="buy_vip_2d"),
                InlineKeyboardButton(text="⭐ 7 Days VIP (300 💎)", callback_data="buy_vip_7d")
            ],
            [
                InlineKeyboardButton(text="👑 28 Days Royal Crown (1,000 💎)", callback_data="buy_vip_28d")
            ],
            [
                InlineKeyboardButton(text="🔙 Back", callback_data="main_menu")
            ]
        ]
    )
