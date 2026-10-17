from aiogram import Dispatcher
from handlers.start import router as start_router
from handlers.profile import router as profile_router
from handlers.base import router as base_router
from handlers.army import router as army_router
from handlers.battle import router as battle_router
from handlers.market import router as market_router
from handlers.leaderboard import router as leaderboard_router
from handlers.group import router as group_router

def register_all_routers(dp: Dispatcher) -> None:
    dp.include_router(start_router)
    dp.include_router(profile_router)
    dp.include_router(base_router)
    dp.include_router(army_router)
    dp.include_router(battle_router)
    dp.include_router(market_router)
    dp.include_router(leaderboard_router)
    dp.include_router(group_router)
