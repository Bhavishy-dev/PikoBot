from datetime import datetime
from sqlalchemy import BigInteger, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base

class UserBase(Base):
    __tablename__ = "user_bases"

    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.telegram_id", ondelete="CASCADE"), primary_key=True)
    
    # Base Structures
    hq_level: Mapped[int] = mapped_column(Integer, default=1)
    wall_level: Mapped[int] = mapped_column(Integer, default=1)
    wall_hp: Mapped[int] = mapped_column(Integer, default=500)
    max_wall_hp: Mapped[int] = mapped_column(Integer, default=500)
    
    defense_turret_level: Mapped[int] = mapped_column(Integer, default=1)
    defense_power: Mapped[int] = mapped_column(Integer, default=100)
    
    # Economy Generator (Gold Mine)
    collector_level: Mapped[int] = mapped_column(Integer, default=1)
    last_collected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Shield & Protection
    shield_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="base")

    @property
    def is_shielded(self) -> bool:
        if self.shield_until:
            return datetime.utcnow() < self.shield_until
        return False
