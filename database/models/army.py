from sqlalchemy import BigInteger, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base

class UserArmy(Base):
    __tablename__ = "user_armies"

    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.telegram_id", ondelete="CASCADE"), primary_key=True)
    
    # Army Troop Units
    infantry_count: Mapped[int] = mapped_column(Integer, default=10)  # Power: 5 per unit
    archer_count: Mapped[int] = mapped_column(Integer, default=5)     # Power: 12 per unit
    siege_count: Mapped[int] = mapped_column(Integer, default=0)      # Power: 50 per unit (High wall-breaker)
    
    barracks_level: Mapped[int] = mapped_column(Integer, default=1)

    user: Mapped["User"] = relationship("User", back_populates="army")

    @property
    def total_attack_power(self) -> int:
        return (
            (self.infantry_count * 5) +
            (self.archer_count * 12) +
            (self.siege_count * 50)
        )

    @property
    def total_troops(self) -> int:
        return self.infantry_count + self.archer_count + self.siege_count
