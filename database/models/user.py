from datetime import datetime
from sqlalchemy import BigInteger, String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base

class User(Base):
    __tablename__ = "users"

    telegram_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    username: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), default="Warrior")
    
    # Currency & Wealth
    gold_coins: Mapped[int] = mapped_column(BigInteger, default=1000)
    diamonds: Mapped[int] = mapped_column(Integer, default=25)
    
    # VIP Membership
    membership_tier: Mapped[str] = mapped_column(String(32), default="FREE")  # "FREE" or "VIP"
    membership_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Activities & Timestamps
    daily_claimed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_attacked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    raid_horns: Mapped[int] = mapped_column(Integer, default=3)
    last_horn_regen: Mapped[datetime | None] = mapped_column(DateTime, default=datetime.utcnow, nullable=True)
    last_active_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    base: Mapped["UserBase"] = relationship("UserBase", back_populates="user", uselist=False, cascade="all, delete-orphan")
    army: Mapped["UserArmy"] = relationship("UserArmy", back_populates="user", uselist=False, cascade="all, delete-orphan")
    market_items: Mapped[list["MarketItem"]] = relationship("MarketItem", back_populates="seller", cascade="all, delete-orphan")

    @property
    def is_vip(self) -> bool:
        if self.membership_tier == "VIP":
            if self.membership_expires_at is None:
                return True
            return datetime.utcnow() < self.membership_expires_at
        return False
