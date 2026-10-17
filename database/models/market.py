from datetime import datetime
from sqlalchemy import BigInteger, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base

class MarketItem(Base):
    __tablename__ = "market_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    seller_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.telegram_id", ondelete="CASCADE"), index=True)
    
    item_name: Mapped[str] = mapped_column(String(100))
    item_type: Mapped[str] = mapped_column(String(50))  # "TROOP_CRATE", "SHIELD", "WALL_REPAIR", "RESOURCE"
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    
    currency: Mapped[str] = mapped_column(String(20), default="GOLD")  # "GOLD" or "DIAMOND"
    price: Mapped[int] = mapped_column(Integer)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    seller: Mapped["User"] = relationship("User", back_populates="market_items")
