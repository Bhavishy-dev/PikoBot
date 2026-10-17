import random
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import User, BattleLog
from core.config import settings

class BattleResult:
    def __init__(
        self,
        is_victory: bool,
        loot_gold: int,
        loot_diamonds: int,
        attacker_losses: int,
        wall_damage: int,
        battle_report: str
    ):
        self.is_victory = is_victory
        self.loot_gold = loot_gold
        self.loot_diamonds = loot_diamonds
        self.attacker_losses = attacker_losses
        self.wall_damage = wall_damage
        self.battle_report = battle_report

def get_current_raid_horns(user: User) -> tuple[int, int]:
    """Calculate current horns and seconds until next regeneration."""
    now = datetime.utcnow()
    horns = user.raid_horns if user.raid_horns is not None else 3
    last_regen = user.last_horn_regen or user.created_at or now

    if horns < 3:
        elapsed = (now - last_regen).total_seconds()
        regen_secs = 15 * 60  # 15 minutes per horn
        horns_added = int(elapsed // regen_secs)
        if horns_added > 0:
            horns = min(3, horns + horns_added)
            user.raid_horns = horns
            user.last_horn_regen = now - timedelta(seconds=(elapsed % regen_secs))

    if horns < 3:
        elapsed = (now - (user.last_horn_regen or now)).total_seconds()
        rem_secs = max(0, int((15 * 60) - (elapsed % (15 * 60))))
    else:
        rem_secs = 0

    return horns, rem_secs

async def recharge_war_horn(session: AsyncSession, user: User) -> tuple[bool, str]:
    horns, _ = get_current_raid_horns(user)
    if horns >= 3:
        return False, "📯 War Horns are already at maximum capacity (3/3)!"
    if user.diamonds < 3:
        return False, "❌ Insufficient Diamonds! Need 3 💎 Diamonds to recharge +1 War Horn."
    
    user.diamonds -= 3
    user.raid_horns = min(3, horns + 1)
    user.last_horn_regen = datetime.utcnow()
    await session.commit()
    return True, f"📯 **War Horn Sounded!** +1 Raid Energy ready ({user.raid_horns}/3) (-3 💎)."

async def execute_attack(
    session: AsyncSession,
    attacker: User,
    defender: User
) -> tuple[bool, str, BattleResult | None]:
    # 1. Validation Checks
    if attacker.telegram_id == defender.telegram_id:
        return False, "❌ You cannot attack your own base, General!", None

    if attacker.army.total_troops < 5:
        return False, "❌ You need at least 5 troops in your Army to launch an attack! Train more in `/barracks`.", None

    now = datetime.utcnow()
    
    # Check War Horns (Anti-Spam Energy)
    horns, rem_secs = get_current_raid_horns(attacker)
    if horns < 1:
        mins, secs = divmod(rem_secs, 60)
        return False, (
            f"📯 **NO WAR HORNS REMAINING! (0 / 3)**\n\n"
            f"Your battle vanguard is fatigued and cannot launch a raid right now.\n"
            f"⏳ **Next Horn in:** `{mins}m {secs}s` (15m recovery per horn)\n\n"
            f"💡 *Recharge instantly for 3 💎 Diamonds in `/army` or below!*"
        ), None

    # Check defender shield
    if defender.base.is_shielded:
        rem = defender.base.shield_until - now
        hrs, mins = divmod(int(rem.total_seconds()), 3600)
        return False, f"🛡️ **Peace Treaty Active!**\nTarget base is protected by a divine shield for another **{hrs}h {mins // 60}m**.", None

    # Deduct 1 War Horn
    attacker.raid_horns = horns - 1
    attacker.last_horn_regen = now
    attacker.last_attacked_at = now

    # 2. Combat Calculation
    attacker_power = attacker.army.total_attack_power
    siege_bonus = attacker.army.siege_count * 50
    attacker_effective = attacker_power + siege_bonus
    attacker_roll = int(attacker_effective * random.uniform(0.9, 1.1))

    defender_defense = defender.base.defense_power
    defender_troops_def = int(defender.army.total_attack_power * 0.5)
    defender_wall = defender.base.wall_hp
    defender_effective = defender_defense + defender_troops_def + defender_wall
    defender_roll = int(defender_effective * random.uniform(0.9, 1.1))

    if attacker_roll > defender_roll:
        # VICTORY FOR ATTACKER
        wall_damage = min(defender.base.wall_hp, random.randint(150, 400) + (attacker.army.siege_count * 20))
        defender.base.wall_hp = max(0, defender.base.wall_hp - wall_damage)

        # Loot formula: Direct P2P Plunder (Zero inflation)
        # Defender ALWAYS retains at least 30% of their gold vault!
        if defender.gold_coins < 150:
            loot_gold = 0
        else:
            max_loot = int(defender.gold_coins * 0.70)
            loot_percent = random.uniform(0.50, 0.70)
            loot_gold = max(50, min(max_loot, int(defender.gold_coins * loot_percent)))

        defender_retained = defender.gold_coins - loot_gold
        defender.gold_coins = defender_retained
        attacker.gold_coins += loot_gold

        # Diamonds loot if defender is wealthy
        loot_diamonds = 0
        if defender.diamonds >= 10 and random.random() < 0.40:
            loot_diamonds = random.randint(1, 3)
            defender.diamonds -= loot_diamonds
            attacker.diamonds += loot_diamonds

        # Casualties: Attacker loses ~15% infantry
        infantry_lost = int(attacker.army.infantry_count * random.uniform(0.10, 0.20))
        attacker.army.infantry_count = max(0, attacker.army.infantry_count - infantry_lost)

        # 2-Hour Post-Raid Truce Shield for defender (Prevents bullying)
        defender.base.shield_until = now + timedelta(hours=2)

        report = (
            f"⚔️ **VICTORY REPORT: RAID SUCCESSFUL!** 💥\n\n"
            f"🏴‍☠️ **Attacker:** [{attacker.full_name}](tg://user?id={attacker.telegram_id})\n"
            f"🏰 **Defender:** [{defender.full_name}](tg://user?id={defender.telegram_id})\n\n"
            f"📊 **Combat Stats:**\n"
            f"• Attack Force: `{attacker_roll:,}` 🔥\n"
            f"• Defense Force: `{defender_roll:,}` 🛡️\n\n"
            f"💰 **Loot Plundered (P2P Exchange):**\n"
            f"• 🪙 **+{loot_gold:,} Piko Gold Coins** (Vault looted up to 70%)\n"
            f"• 🛡️ **Defender Safe Reserve:** `{defender_retained:,} 🪙` (30% Protected)\n"
            + (f"• 💎 **+{loot_diamonds} Piko Diamonds**\n" if loot_diamonds > 0 else "") +
            f"🧱 **Wall Damage:** `-{wall_damage} HP`\n"
            f"🪖 **Casualties:** Lost `{infantry_lost}` Infantry in battle.\n"
            f"📯 **War Horns Remaining:** `{attacker.raid_horns} / 3`\n\n"
            f"🛡️ Target base granted a **2-Hour Truce Shield** to recover without repeated harassment."
        )

        battle_result = BattleResult(
            is_victory=True,
            loot_gold=loot_gold,
            loot_diamonds=loot_diamonds,
            attacker_losses=infantry_lost,
            wall_damage=wall_damage,
            battle_report=report
        )

        log = BattleLog(
            attacker_id=attacker.telegram_id,
            defender_id=defender.telegram_id,
            winner_id=attacker.telegram_id,
            loot_gold=loot_gold,
            loot_diamonds=loot_diamonds,
            attacker_losses=infantry_lost,
            wall_damage=wall_damage,
            summary=f"Attacker won and looted {loot_gold} gold",
            created_at=now
        )
        session.add(log)
        await session.commit()
        return True, report, battle_result

    else:
        # DEFEAT FOR ATTACKER
        infantry_lost = int(attacker.army.infantry_count * random.uniform(0.30, 0.50))
        attacker.army.infantry_count = max(0, attacker.army.infantry_count - infantry_lost)
        wall_damage = min(defender.base.wall_hp, random.randint(20, 80))
        defender.base.wall_hp = max(0, defender.base.wall_hp - wall_damage)

        # Defender collects defense bounty (5% of attacker gold, up to 10,000)
        defense_bounty = min(10000, max(50, int(attacker.gold_coins * 0.05)))
        attacker.gold_coins = max(0, attacker.gold_coins - defense_bounty)
        defender.gold_coins += defense_bounty

        report = (
            f"🛡️ **BATTLE REPORT: ATTACK REPELLED!** ❌\n\n"
            f"🏰 **Defender's fortress stood resolute!**\n\n"
            f"🏴‍☠️ **Attacker:** [{attacker.full_name}](tg://user?id={attacker.telegram_id})\n"
            f"🏰 **Defender:** [{defender.full_name}](tg://user?id={defender.telegram_id})\n\n"
            f"📊 **Combat Stats:**\n"
            f"• Attack Force: `{attacker_roll:,}` 🔥\n"
            f"• Defense Force: `{defender_roll:,}` 🛡️\n\n"
            f"💀 **Casualties:** You suffered heavy losses! `{infantry_lost}` Infantry fell in battle.\n"
            f"💸 **Bounty Lost:** Target seized `{defense_bounty:,}` 🪙 from retreating forces.\n"
            f"🧱 **Wall Damage Dealt:** `-{wall_damage} HP`\n"
            f"📯 **War Horns Remaining:** `{attacker.raid_horns} / 3`"
        )

        battle_result = BattleResult(
            is_victory=False,
            loot_gold=0,
            loot_diamonds=0,
            attacker_losses=infantry_lost,
            wall_damage=wall_damage,
            battle_report=report
        )

        log = BattleLog(
            attacker_id=attacker.telegram_id,
            defender_id=defender.telegram_id,
            winner_id=defender.telegram_id,
            loot_gold=defense_bounty,
            loot_diamonds=0,
            attacker_losses=infantry_lost,
            wall_damage=wall_damage,
            summary=f"Defender repelled raid and seized {defense_bounty} gold bounty",
            created_at=now
        )
        session.add(log)
        await session.commit()
        return True, report, battle_result
