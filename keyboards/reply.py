from aiogram.types import ReplyKeyboardMarkup, KeyboardButton

def main_reply_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="🏰 My Base"),
                KeyboardButton(text="👤 Profile"),
                KeyboardButton(text="⚔️ Army")
            ],
            [
                KeyboardButton(text="🏪 Market"),
                KeyboardButton(text="🎁 Daily"),
                KeyboardButton(text="🏆 Leaderboard")
            ]
        ],
        resize_keyboard=True,
        input_field_placeholder="Select an option or type /help..."
    )
