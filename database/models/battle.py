from datetime import datetime
from sqlalchemy import BigInteger, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base

class BattleLog(Base):
    __tablename__ = "battle_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    attacker_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.telegram_id"), index=True)
    defender_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.telegram_id"), index=True)
    
    winner_id: Mapped[int] = mapped_column(BigInteger)
    loot_gold: Mapped[int] = mapped_column(BigInteger, default=0)
    loot_diamonds: Mapped[int] = mapped_column(Integer, default=0)
    
    attacker_losses: Mapped[int] = mapped_column(Integer, default=0)
    wall_damage: Mapped[int] = mapped_column(Integer, default=0)
    summary: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
