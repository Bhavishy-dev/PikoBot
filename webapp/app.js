// Piko Kingdom - Telegram Mini App Production Engine
const tg = window.Telegram?.WebApp;

// 1. Telegram WebApp Detection (No forced redirect to enable web landing page & demo exploration)


// 2. Initialize Telegram WebApp Environment
if (tg) {
  tg.ready();
  tg.expand();
  if (tg.setHeaderColor) tg.setHeaderColor('#080a0f');
  if (tg.setBackgroundColor) tg.setBackgroundColor('#080a0f');
}

// 2. Tactile Haptic Feedback
function triggerHaptic(type = 'light') {
  if (tg?.HapticFeedback) {
    if (type === 'heavy') tg.HapticFeedback.impactOccurred('heavy');
    else if (type === 'medium') tg.HapticFeedback.impactOccurred('medium');
    else if (type === 'selection') tg.HapticFeedback.selectionChanged();
    else tg.HapticFeedback.impactOccurred('light');
  }
}

// 3. Royal Celebration FX
function fireRoyalConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#38bdf8', '#10b981', '#ffffff']
    });
  }
}

// 4. 7-Day Progressive Streak Rewards
const STREAK_DAYS = [
  { day: 1, gold: 500, diamonds: 0, shield: false, title: 'Day 1', iconImg: 'assets/coin.png' },
  { day: 2, gold: 1000, diamonds: 2, shield: false, title: 'Day 2', iconImg: 'assets/diamond.png' },
  { day: 3, gold: 2500, diamonds: 5, shield: false, title: 'Day 3', iconImg: 'assets/coin.png' },
  { day: 4, gold: 5000, diamonds: 10, shield: false, title: 'Day 4', iconImg: 'assets/diamond.png' },
  { day: 5, gold: 10000, diamonds: 15, shield: false, title: 'Day 5', iconImg: 'assets/swords.png' },
  { day: 6, gold: 20000, diamonds: 25, shield: false, title: 'Day 6', iconImg: 'assets/diamond.png' },
  { day: 7, gold: 50000, diamonds: 50, shield: true, title: 'Day 7 👑 Grand Royal', iconImg: 'assets/victory_cup.png' }
];

// 5. Fortune Wheel Prizes (8 Segments with clear icons & labels)
const WHEEL_PRIZES = [
  { label: '1,000 🪙', gold: 1000, diamonds: 0, troops: 0, icon: '🪙', bg: '#1e293b' },
  { label: '10 💎', gold: 0, diamonds: 10, troops: 0, icon: '💎', bg: '#0369a1' },
  { label: '50 ⚔️', gold: 0, diamonds: 0, troops: 50, troopType: 'infantry', icon: '⚔️', bg: '#b45309' },
  { label: '10 🏹', gold: 0, diamonds: 0, troops: 10, troopType: 'archers', icon: '🏹', bg: '#1e293b' },
  { label: '5,000 🪙', gold: 5000, diamonds: 0, troops: 0, icon: '💰', bg: '#d97706' },
  { label: '2 🛡️', gold: 0, diamonds: 0, troops: 2, troopType: 'siege', icon: '🛡️', bg: '#0284c7' },
  { label: '25 💎', gold: 0, diamonds: 25, troops: 0, icon: '💎', bg: '#1e293b' },
  { label: '12h Shield', gold: 0, diamonds: 0, shield: true, icon: '🛡️', bg: '#059669' }
];

// 6. Supabase Client Credentials
const SUPABASE_CONFIG = {
  url: (typeof window !== 'undefined' && window.__ENV__?.SUPABASE_URL) || 'https://uuledydsayjunvujumte.supabase.co',
  anonKey: (typeof window !== 'undefined' && window.__ENV__?.SUPABASE_ANON_KEY) || 'sb_publishable_QKnGLtNrt6_0cyQxqlJMJQ_X7KRq-wL'
};

let supabaseClient = null;

// 7. Initial Real State Configuration
const DEFAULT_STATE = {
  user: {
    id: 10001,
    name: 'Lord Commander',
    username: 'commander',
    photo_url: null,
    is_vip: false,
    gold: 1000,
    diamonds: 25,
    current_streak: 1,
    last_streak_claim: 0,
    last_wheel_spin: 0,
    raid_horns: 3,
    max_horns: 3,
    last_horn_regen: Date.now()
  },
  base: {
    hq_level: 1,
    wall_level: 1,
    wall_hp: 500,
    max_wall_hp: 500,
    turret_level: 1,
    defense_power: 100,
    collector_level: 1,
    shield_active: false,
    shield_until: null,
    last_collected: Date.now()
  },
  army: {
    barracks_level: 1,
    infantry: 10,
    archers: 5,
    siege: 0
  },
  market: [],
  targets: [],
  threat_logs: []
};

// Clean Text / Name Sanitizer: strips weird mathematical unicode fonts & prevents overflowing
function cleanPlayerName(name, maxChars = 14) {
  if (!name || typeof name !== 'string') return 'Commander';
  // Normalize mathematical unicode serif/italic fonts (e.g. 𝑺𝑯𝑨𝑵𝑲𝑺 -> SHANKS)
  let cleaned = name.normalize('NFKD');
  // Strip non-printable and zero-width characters
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');
  // Condense spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  if (cleaned.length > maxChars) {
    cleaned = cleaned.slice(0, maxChars).trim() + '…';
  }
  return cleaned || 'Commander';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// State Loading & Sync with Telegram User Profile
let state = JSON.parse(localStorage.getItem('pikobot_royal_state_v4')) || DEFAULT_STATE;

// Purge any legacy mock market items (sellerId === null or mock IDs 101-104) so only real server listings appear
if (state.market && Array.isArray(state.market)) {
  state.market = state.market.filter(item => item.sellerId !== null && item.sellerId !== undefined && item.id > 110);
} else {
  state.market = [];
}

// Ensure new war fields exist
if (state.user.raid_horns === undefined) state.user.raid_horns = 3;
if (!state.user.max_horns) state.user.max_horns = 3;
if (!state.user.last_horn_regen) state.user.last_horn_regen = Date.now();
if (!state.threat_logs) state.threat_logs = [];

if (tg?.initDataUnsafe?.user) {
  const tgUser = tg.initDataUnsafe.user;
  state.user.id = tgUser.id || state.user.id;
  state.user.name = tgUser.first_name || state.user.name;
  if (tgUser.last_name) state.user.name += ' ' + tgUser.last_name;
  state.user.username = tgUser.username || state.user.username;
  state.user.photo_url = tgUser.photo_url || null;
}

// Background Debounced Remote Persistence (Optimistic Instant UI)
let persistDebounceTimer = null;
function debouncePersist() {
  clearTimeout(persistDebounceTimer);
  persistDebounceTimer = setTimeout(persistStateToSupabase, 800);
}

async function persistStateToSupabase() {
  if (!supabaseClient || !state.user.id) return;
  try {
    // 1. Consolidated users table update
    const userUpdate = {
      gold_coins: state.user.gold,
      diamonds: state.user.diamonds,
      membership_tier: state.user.is_vip ? 'VIP' : 'FREE',
      raid_horns: state.user.raid_horns ?? 3,
      last_horn_regen: state.user.last_horn_regen
        ? new Date(state.user.last_horn_regen).toISOString()
        : new Date().toISOString(),
      last_active_at: new Date().toISOString()
    };
    if (state.user.last_streak_claim) {
      userUpdate.daily_claimed_at = new Date(state.user.last_streak_claim).toISOString();
    }
    await supabaseClient.from('users').update(userUpdate).eq('telegram_id', state.user.id);

    // 2. Build user_bases update
    const isShieldValid = state.base.shield_active && state.base.shield_until && state.base.shield_until > Date.now();
    const basesUpdate = {
      hq_level: state.base.hq_level,
      wall_level: state.base.wall_level,
      wall_hp: state.base.wall_hp,
      max_wall_hp: state.base.max_wall_hp,
      defense_turret_level: state.base.turret_level,
      defense_power: state.base.defense_power,
      collector_level: state.base.collector_level,
      last_collected_at: state.base.last_collected
        ? new Date(state.base.last_collected).toISOString()
        : new Date().toISOString(),
      shield_until: isShieldValid ? new Date(state.base.shield_until).toISOString() : null
    };
    await supabaseClient.from('user_bases').update(basesUpdate).eq('user_id', state.user.id);

    // 3. Build user_armies update
    await supabaseClient.from('user_armies').update({
      infantry_count: state.army.infantry,
      archer_count: state.army.archers,
      siege_count: state.army.siege,
      barracks_level: state.army.barracks_level
    }).eq('user_id', state.user.id);
  } catch (err) {
    console.error('Remote persistence notice:', err);
  }
}

function saveState(triggerPersist = true) {
  localStorage.setItem('pikobot_royal_state_v4', JSON.stringify(state));
  renderUI();
  if (triggerPersist) {
    debouncePersist();
  }
}

// Royal Toast Notification
let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerText = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  const displayDuration = Math.min(5000, Math.max(2800, message.length * 65));
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, displayDuration);
}

// 8. RENDER USER PROFILE & TELEGRAM AVATAR (EXACT ELEMENT IDS)
function renderUserProfile() {
  const nameEl = document.getElementById('user-name');
  if (nameEl) nameEl.innerText = state.user.name || 'Lord Commander';

  const avatarInitial = document.getElementById('user-avatar');
  const avatarImg = document.getElementById('user-avatar-img');

  if (state.user.photo_url && avatarImg) {
    avatarImg.src = state.user.photo_url;
    avatarImg.style.display = 'block';
    if (avatarInitial) avatarInitial.style.display = 'none';
  } else if (avatarInitial) {
    avatarInitial.innerText = state.user.name ? state.user.name.charAt(0).toUpperCase() : '👑';
    avatarInitial.style.display = 'flex';
    if (avatarImg) avatarImg.style.display = 'none';
  }

  // VIP Badge vs FREE Badge
  const vipBadge = document.getElementById('vip-badge');
  const freeBadge = document.getElementById('free-badge');
  if (state.user.is_vip) {
    if (vipBadge) vipBadge.style.display = 'inline-flex';
    if (freeBadge) freeBadge.style.display = 'none';
  } else {
    if (vipBadge) vipBadge.style.display = 'none';
    if (freeBadge) freeBadge.style.display = 'inline-flex';
  }

  const rankEl = document.getElementById('empire-rank');
  if (rankEl) {
    rankEl.innerText = `Citadel Lv.${state.base.hq_level} • Fortress`;
  }

  // Live Currency Chips
  const goldVal = document.getElementById('gold-val');
  if (goldVal) goldVal.innerText = (state.user.gold || 0).toLocaleString();

  const diamondVal = document.getElementById('diamond-val');
  if (diamondVal) diamondVal.innerText = (state.user.diamonds || 0).toLocaleString();
}

// 9. RENDER CITADEL & FORTRESS (EXACT ELEMENT IDS)
function renderCitadel() {
  const hqPill = document.getElementById('hq-level-pill');
  if (hqPill) {
    hqPill.innerHTML = `<img src="assets/hq_palace.png" class="clay-badge-mini" alt="HQ" /> HQ LEVEL ${state.base.hq_level}`;
  }

  if (state.base.shield_until) {
    const isStillActive = state.base.shield_until > Date.now();
    state.base.shield_active = isStillActive;
    if (!isStillActive) {
      state.base.shield_until = null;
    }
  }

  let shieldRemStr = '';
  if (state.base.shield_active && state.base.shield_until) {
    const diffMs = state.base.shield_until - Date.now();
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    shieldRemStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }

  const shieldPill = document.getElementById('shield-status-pill');
  if (shieldPill) {
    if (state.base.shield_active) {
      shieldPill.innerHTML = `<img src="assets/shield.png" class="clay-badge-mini" alt="Shield" /> SHIELDED (${shieldRemStr || 'Active'})`;
      shieldPill.className = 'shield-status-pill shielded';
    } else {
      shieldPill.innerHTML = `<span class="exposed-beacon"></span> EXPOSED`;
      shieldPill.className = 'shield-status-pill exposed';
    }
  }

  // Wall Integrity
  const wallHpStats = document.getElementById('wall-hp-stats');
  const wallPct = Math.min(100, Math.max(0, Math.round(((state.base.wall_hp || 0) / (state.base.max_wall_hp || 500)) * 100)));
  if (wallHpStats) {
    wallHpStats.innerText = `${(state.base.wall_hp || 0).toLocaleString()} / ${(state.base.max_wall_hp || 500).toLocaleString()} HP (${wallPct}%)`;
  }

  const wallThumb = document.getElementById('wall-hp-thumb');
  if (wallThumb) {
    wallThumb.style.width = `${wallPct}%`;
    if (wallPct < 30) wallThumb.style.background = '#ef4444';
    else if (wallPct < 70) wallThumb.style.background = '#f59e0b';
    else wallThumb.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
  }

  // Gold Mine
  const mineLvl = document.getElementById('mine-level-num');
  if (mineLvl) mineLvl.innerText = state.base.collector_level;

  const mineSpeed = document.getElementById('mine-speed-num');
  if (mineSpeed) {
    let rate = state.base.collector_level * 5;
    if (state.user.is_vip) rate = Math.floor(rate * 1.5);
    mineSpeed.innerText = rate;
  }

  // Mine Upgrade Cost
  const costMineUp = document.getElementById('cost-mine-up');
  if (costMineUp) costMineUp.innerText = (state.base.collector_level * 1000).toLocaleString();

  // Headquarters (HQ) Card
  const cardHqLvl = document.getElementById('card-hq-lvl');
  if (cardHqLvl) cardHqLvl.innerText = state.base.hq_level;

  const costHqUp = document.getElementById('cost-hq-up');
  if (costHqUp) costHqUp.innerText = (state.base.hq_level * 1500).toLocaleString();

  // Wall Card
  const cardWallLvl = document.getElementById('card-wall-lvl');
  if (cardWallLvl) cardWallLvl.innerText = state.base.wall_level;

  const costWallUp = document.getElementById('cost-wall-up');
  if (costWallUp) costWallUp.innerText = (state.base.wall_level * 1000).toLocaleString();

  // Wall Repair Status
  const repairLabel = document.getElementById('repair-btn-label');
  const repairTag = document.getElementById('repair-cost-tag');
  const costRepair = document.getElementById('cost-wall-repair');
  const btnRepair = document.getElementById('btn-repair-wall');
  const missingHp = Math.max(0, state.base.max_wall_hp - state.base.wall_hp);

  if (missingHp === 0) {
    if (repairLabel) repairLabel.innerText = 'Wall Perfect 100% ✓';
    if (repairTag) repairTag.style.display = 'none';
    if (btnRepair) {
      btnRepair.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      btnRepair.style.color = '#34d399';
    }
  } else {
    const repairCost = Math.ceil(missingHp * 0.5);
    if (repairLabel) repairLabel.innerText = 'Repair';
    if (repairTag) repairTag.style.display = 'inline-flex';
    if (costRepair) costRepair.innerText = repairCost.toLocaleString();
    if (btnRepair) {
      btnRepair.style.borderColor = 'rgba(251, 191, 36, 0.3)';
      btnRepair.style.color = '#fbbf24';
    }
  }

  // Turret Card
  const cardTurretLvl = document.getElementById('card-turret-lvl');
  if (cardTurretLvl) cardTurretLvl.innerText = state.base.turret_level;

  const statTurretPwr = document.getElementById('stat-turret-pwr');
  if (statTurretPwr) statTurretPwr.innerText = state.base.defense_power;

  const costTurretUp = document.getElementById('cost-turret-up');
  if (costTurretUp) costTurretUp.innerText = (state.base.turret_level * 1200).toLocaleString();

  // Divine Shield Button
  const btnShield = document.getElementById('btn-activate-shield');
  if (btnShield) {
    if (state.base.shield_active) {
      btnShield.innerHTML = `<img src="assets/shield.png" class="clay-diamond-micro" alt="Shield" /> Active Peace Treaty (${shieldRemStr || 'Active'})`;
      btnShield.disabled = true;
    } else {
      btnShield.innerHTML = '10 <img src="assets/diamond.png" class="clay-diamond-micro" alt="Diamond" /> Activate Peace Shield';
      btnShield.disabled = false;
    }
  }

  // Citadel Vulnerability & Threat Radar Alert
  const threatBox = document.getElementById('citadel-threat-box');
  const threatIcon = document.getElementById('threat-icon');
  const threatLabel = document.getElementById('threat-label');
  const threatDesc = document.getElementById('threat-desc');
  const threatAtRisk = document.getElementById('threat-at-risk');

  if (threatBox) {
    if (state.base.shield_active) {
      threatBox.className = 'citadel-threat-alert shielded-safe';
      if (threatIcon) threatIcon.innerText = '🛡️';
      if (threatLabel) threatLabel.innerText = `THREAT STATUS: SHIELDED (${shieldRemStr || 'SAFE'})`;
      if (threatDesc) {
        threatDesc.innerHTML = `Divine Peace Treaty is active (${shieldRemStr} left). <strong>0 🪙 Gold at risk</strong>. Rivals cannot attack your citadel!`;
      }
    } else {
      const atRisk = Math.floor((state.user.gold || 0) * 0.70);
      threatBox.className = 'citadel-threat-alert';
      if (threatIcon) threatIcon.innerText = '⚠️';
      if (threatLabel) threatLabel.innerText = 'THREAT STATUS: EXPOSED (HIGH RISK)';
      if (threatDesc) {
        threatDesc.innerHTML = `Rivals can plunder up to <strong id="threat-at-risk">${atRisk.toLocaleString()} 🪙</strong> right now! 30% vault is permanently protected, but activate Divine Shield (10 💎) or upgrade wall to safeguard all!`;
      }
      if (threatAtRisk) {
        threatAtRisk.innerText = `${atRisk.toLocaleString()} 🪙`;
      }
    }
  }
}

// 10. RENDER ARMY & BARRACKS (EXACT ELEMENT IDS)
function renderArmy() {
  const totalTroops = (state.army.infantry || 0) + (state.army.archers || 0) + (state.army.siege || 0);
  const totalPower = ((state.army.infantry || 0) * 5) + ((state.army.archers || 0) * 12) + ((state.army.siege || 0) * 50);

  const totalTroopsEl = document.getElementById('total-troops-num');
  if (totalTroopsEl) totalTroopsEl.innerText = totalTroops.toLocaleString();

  const totalPowerEl = document.getElementById('total-power-num');
  if (totalPowerEl) totalPowerEl.innerText = totalPower.toLocaleString();

  const barracksLvlEl = document.getElementById('barracks-lvl-num');
  if (barracksLvlEl) barracksLvlEl.innerText = `Lv.${state.army.barracks_level}`;

  const maxCap = state.army.barracks_level * 150;
  const capPct = Math.min(100, Math.max(0, Math.round((totalTroops / maxCap) * 100)));
  const capacityMeter = document.getElementById('capacity-meter');
  if (capacityMeter) capacityMeter.innerText = `${totalTroops.toLocaleString()} / ${maxCap.toLocaleString()} (${capPct}%)`;

  const capThumb = document.getElementById('capacity-bar-thumb');
  if (capThumb) {
    capThumb.style.width = `${capPct}%`;
    if (capPct >= 95) capThumb.style.background = '#ef4444';
    else if (capPct >= 75) capThumb.style.background = '#f59e0b';
    else capThumb.style.background = 'linear-gradient(90deg, #6366f1, #8b5cf6)';
  }

  const ownedInf = document.getElementById('owned-infantry');
  if (ownedInf) ownedInf.innerText = (state.army.infantry || 0).toLocaleString();

  const ownedArch = document.getElementById('owned-archers');
  if (ownedArch) ownedArch.innerText = (state.army.archers || 0).toLocaleString();

  const ownedSiege = document.getElementById('owned-siege');
  if (ownedSiege) ownedSiege.innerText = (state.army.siege || 0).toLocaleString();

  const nextCap = document.getElementById('next-barracks-limit');
  if (nextCap) nextCap.innerText = ((state.army.barracks_level + 1) * 150).toLocaleString();

  const costBarracks = document.getElementById('cost-barracks-up');
  if (costBarracks) costBarracks.innerText = (state.army.barracks_level * 2000).toLocaleString();
}

// 11. RENDER ACTIVITY STATUS (STREAK & WHEEL)
function renderActivityIndicators() {
  const now = Date.now();
  const streakReady = (now - state.user.last_streak_claim) >= 24 * 3600 * 1000;
  const streakInd = document.getElementById('streak-indicator');
  if (streakInd) {
    streakInd.innerText = streakReady ? `Claim Day ${state.user.current_streak}` : 'Claimed ✓';
    streakInd.style.color = streakReady ? '#fbbf24' : '#10b981';
  }

  const wheelReady = (now - state.user.last_wheel_spin) >= 24 * 3600 * 1000;
  const wheelStatus = document.getElementById('wheel-status-text');
  if (wheelStatus) {
    wheelStatus.innerText = wheelReady ? 'Free Spin!' : 'Cooldown';
    wheelStatus.style.color = wheelReady ? '#fbbf24' : '#94a3b8';
  }
}

// 12. WAR ROOM & ENERGY SYSTEMS (3 WAR HORNS + ZERO-INFLATION 70/30 RAID)
function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Recently';
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function updateRaidHorns() {
  const hornsEl = document.getElementById('raid-horns-count');
  const timerEl = document.getElementById('raid-horns-timer');
  const pipsRow = document.getElementById('horn-pips-row');
  if (!hornsEl || !timerEl) return;

  const maxHorns = state.user.max_horns || 3;
  if (state.user.raid_horns === undefined) state.user.raid_horns = 3;
  if (!state.user.last_horn_regen) state.user.last_horn_regen = Date.now();

  const now = Date.now();
  const regenInterval = 15 * 60 * 1000; // 15 minutes per horn
  const timeSince = now - state.user.last_horn_regen;

  if (state.user.raid_horns < maxHorns) {
    const hornsToAdd = Math.floor(timeSince / regenInterval);
    if (hornsToAdd > 0) {
      state.user.raid_horns = Math.min(maxHorns, state.user.raid_horns + hornsToAdd);
      state.user.last_horn_regen = now - (timeSince % regenInterval);
      saveState(false);
      if (supabaseClient && state.user.id) {
        supabaseClient.from('users').update({
          raid_horns: state.user.raid_horns,
          last_horn_regen: new Date(state.user.last_horn_regen).toISOString()
        }).eq('telegram_id', state.user.id).then(() => {});
      }
    }
  }

  hornsEl.innerText = `${state.user.raid_horns} / ${maxHorns}`;

  if (pipsRow) {
    pipsRow.innerHTML = Array.from({ length: maxHorns }).map((_, i) =>
      `<span class="horn-pip ${i < state.user.raid_horns ? 'active' : ''}"></span>`
    ).join('');
  }

  if (state.user.raid_horns >= maxHorns) {
    timerEl.innerText = 'Full Strength (Ready to Raid)';
    timerEl.style.color = '#10b981';
  } else {
    const msToNext = regenInterval - ((now - state.user.last_horn_regen) % regenInterval);
    const m = Math.floor(msToNext / 60000);
    const s = Math.floor((msToNext % 60000) / 1000);
    timerEl.innerText = `+1 Horn in ${m}m ${s < 10 ? '0' : ''}${s}s`;
    timerEl.style.color = '#fbbf24';
  }
}

function renderTargetsList() {
  const container = document.getElementById('targets-stack');
  if (!container) return;

  const userPower = ((state.army.infantry || 0) * 5) + ((state.army.archers || 0) * 12) + ((state.army.siege || 0) * 50);
  const warPowerEl = document.getElementById('war-user-power');
  if (warPowerEl) warPowerEl.innerText = `${userPower.toLocaleString()} ATK`;

  const radarCountEl = document.getElementById('radar-count');
  if (radarCountEl) radarCountEl.innerText = state.targets.length;

  if (state.targets.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 28px 16px; background: #ffffff; border-radius: var(--radius-xl); border: 1px dashed rgba(239, 68, 68, 0.3); box-shadow: var(--clay-card-shadow);">
        <img src="assets/radar.png" style="width: 44px; height: 44px; margin-bottom: 8px; filter: drop-shadow(0 4px 8px rgba(239, 68, 68, 0.25));" alt="Radar" />
        <h4 style="color: var(--text-main); font-size: 15px; font-weight: 800;">Scanning for Rival Empires...</h4>
        <p class="caption" style="margin-top: 4px; color: var(--text-sub);">Live commanders will appear here once radar locks on.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.targets.map(target => {
    const targetDefense = (target.def || 100) + Math.floor((target.wallHp || 500) * 0.4);
    let winChance = Math.min(99, Math.max(10, Math.round((userPower / (targetDefense + userPower || 1)) * 100)));

    let chanceClass = 'chance-med';
    let chanceText = `🟡 ${winChance}% Win Chance (Even)`;
    if (winChance >= 70) {
      chanceClass = 'chance-high';
      chanceText = `🟢 ${winChance}% Win Chance (High)`;
    } else if (winChance < 45) {
      chanceClass = 'chance-low';
      chanceText = `🔴 ${winChance}% Win Chance (Risky)`;
    }

    const totalVault = target.totalGold || target.lootGold || 1000;
    const maxPlunder = Math.floor(totalVault * 0.70);

    let actionBtn = `
      <button class="btn raid-action-btn" onclick="startRaidBattle(${target.id})">
        <img src="assets/swords.png" class="btn-swords-micro" alt="Swords" />
        <span>Raid</span>
      </button>
    `;
    if (target.isShielded) {
      actionBtn = `
        <button class="btn truce-action-btn" disabled>
          <img src="assets/shield.png" class="btn-shield-micro" alt="Shield" />
          <span>Truce (${target.shieldRem || 'Shielded'})</span>
        </button>
      `;
    }

    const cleanedName = cleanPlayerName(target.name, 13);
    const escapedRawName = escapeHtml(target.name);
    const escapedCleanName = escapeHtml(cleanedName);
    const avatarSeed = encodeURIComponent(target.name || 'Target');
    const avatarUrl = target.photo_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

    return `
      <div class="target-row-card">
        <!-- Tier 1: Commander Profile & Raid Action -->
        <div class="target-card-top">
          <div class="target-commander-group">
            <div class="target-avatar-frame">
              <img src="${avatarUrl}" class="target-avatar-img" alt="${escapedRawName}" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${avatarSeed}&background=1e293b&color=fbbf24&bold=true';" />
            </div>
            <div class="target-commander-meta">
              <div class="target-name-line">
                <h4 title="${escapedRawName}">${escapedCleanName}</h4>
                <span class="target-lvl-badge">Lv.${target.level}</span>
              </div>
              <div class="target-def-stats">
                <span class="stat-pill def-pill">🛡️ ${target.def} DEF</span>
                <span class="stat-pill wall-pill">🧱 ${target.wallHp} HP</span>
              </div>
            </div>
          </div>
          ${actionBtn}
        </div>

        <!-- Tier 2: Unified Intel Bar -->
        <div class="target-intel-bar">
          <span class="intel-win-tag ${chanceClass}">${chanceText}</span>
          <span class="intel-loot-tag">
            <img src="assets/coin.png" style="width: 13px; height: 13px;" alt="Gold" />
            <span>Plunder up to <strong>${(maxPlunder || 0).toLocaleString()}</strong></span>
            <span class="safe-note">(70%)</span>
          </span>
        </div>
      </div>
    `;
  }).join('');
}

async function fetchAndRenderThreatLogs() {
  const container = document.getElementById('threat-logs-stack');
  if (!container) return;

  if (!supabaseClient) {
    container.innerHTML = `
      <div style="text-align: center; padding: 28px 16px; background: rgba(18, 24, 38, 0.5); border-radius: 14px;">
        <span style="font-size: 32px; display: block; margin-bottom: 8px;">🛡️</span>
        <h4 style="color: #f1f5f9; font-size: 14px;">Inbound Threat Activity</h4>
        <p class="caption">Connecting to defense radar...</p>
      </div>
    `;
    return;
  }

  try {
    const { data: logs, error } = await supabaseClient
      .from('battle_logs')
      .select('id, attacker_id, defender_id, winner_id, loot_gold, wall_damage, summary, created_at, users!attacker_id(full_name, username)')
      .eq('defender_id', state.user.id)
      .order('created_at', { ascending: false })
      .limit(15);

    if (error || !logs || logs.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 28px 16px; background: rgba(18, 24, 38, 0.5); border-radius: 14px; border: 1px dashed rgba(255, 255, 255, 0.1);">
          <span style="font-size: 36px; display: block; margin-bottom: 8px;">🛡️</span>
          <h4 style="color: #f1f5f9; font-size: 15px;">Citadel Vault Untouched</h4>
          <p class="caption" style="margin-top: 4px;">No rival commanders have breached your fortress recently.<br>Maintain high wall integrity and stay vigilant!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = logs.map(log => {
      const attackerName = log.users?.full_name || log.users?.username || `Rival #${log.attacker_id.toString().slice(-4)}`;
      const isDefended = log.winner_id === state.user.id;
      const timeAgo = formatTimeAgo(log.created_at);
      const cardClass = isDefended ? 'threat-log-card attack-defended' : 'threat-log-card';
      const icon = isDefended ? '🛡️' : '💥';
      const titleText = isDefended ? `Assault Repelled vs ${attackerName}` : `Citadel Raided by ${attackerName}`;
      const lootText = isDefended ? `Garrison held strong! 0 🪙 stolen` : `-${(log.loot_gold || 0).toLocaleString()} 🪙 Plundered from Vault`;
      const lossClass = isDefended ? 'stolen-loss-tag defense-win' : 'stolen-loss-tag';

      return `
        <div class="${cardClass}">
          <div class="threat-log-header">
            <div class="threat-log-title" style="display: flex; align-items: center; gap: 6px;">
              <img src="${isDefended ? 'assets/shield.png' : 'assets/swords.png'}" style="width: 18px; height: 18px; object-fit: contain;" alt="Badge" />
              <strong style="font-size: 13px;">${titleText}</strong>
            </div>
            <span class="threat-time-badge">${timeAgo}</span>
          </div>
          <p class="threat-log-body" style="font-size: 12px; color: var(--text-sub); margin: 6px 0;">
            ${log.summary || `Assault caused ${log.wall_damage || 0} wall damage.`}
          </p>
          <div class="threat-log-footer" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span class="${lossClass}" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 800;">
              <img src="assets/coin.png" style="width: 13px; height: 13px;" alt="Gold" />
              ${lootText}
            </span>
            <button class="btn btn-crimson btn-xs" style="display: inline-flex; align-items: center; gap: 4px;" onclick="startRaidBattle(${log.attacker_id})">
              <img src="assets/swords.png" style="width: 13px; height: 13px;" alt="Swords" />
              REVENGE
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Threat logs error:', err);
  }
}

window.startRaidBattle = async function(targetId) {
  triggerHaptic('heavy');
  
  // 1. War Horn Energy Check (Stops non-stop raid abuse)
  const currentHorns = state.user.raid_horns !== undefined ? state.user.raid_horns : 3;
  if (currentHorns < 1) {
    showToast('❌ No War Horns remaining! Wait 15 mins to rally or recharge for 3 💎.');
    return;
  }

  // 2. Minimum Army Size Check
  const totalTroops = (state.army.infantry || 0) + (state.army.archers || 0) + (state.army.siege || 0);
  if (totalTroops < 5) {
    showToast('❌ You need at least 5 troops in your Army to launch a raid! Recruit more in Barracks.');
    return;
  }

  // 3. Target Verification
  let target = state.targets.find(t => t.id === targetId);
  if (!target) {
    // If revenge raid against someone not in current radar list, build basic target profile
    target = { id: targetId, name: `Rival #${targetId.toString().slice(-4)}`, def: 100, wallHp: 500, level: 1, totalGold: 1000 };
  }

  if (target.isShielded) {
    showToast(`🛡️ Target base is protected by a Truce Shield (${target.shieldRem || 'Active'})! Cannot raid.`);
    return;
  }

  let defenderGold = target.totalGold || target.lootGold || 1000;
  let defenderWallHp = target.wallHp || 500;

  // Real-time verification from Supabase
  if (supabaseClient) {
    try {
      const { data: realDef } = await supabaseClient
        .from('users')
        .select('full_name, username, gold_coins, user_bases(hq_level, wall_hp, shield_until, defense_power)')
        .eq('telegram_id', target.id)
        .single();

      if (realDef) {
        defenderGold = realDef.gold_coins ?? 1000;
        defenderWallHp = realDef.user_bases?.wall_hp ?? 500;
        target.name = realDef.full_name || realDef.username || target.name;
        target.def = realDef.user_bases?.defense_power || target.def;
        target.level = realDef.user_bases?.hq_level || target.level;

        if (realDef.user_bases?.shield_until && new Date(realDef.user_bases.shield_until) > new Date()) {
          showToast('🛡️ Target is protected by an active Peace Treaty / Truce Shield!');
          target.isShielded = true;
          renderTargetsList();
          return;
        }
      }
    } catch (e) {
      console.warn('Real-time defender check notice:', e);
    }
  }

  // Consume 1 War Horn
  state.user.raid_horns = currentHorns - 1;
  state.user.last_horn_regen = Date.now();

  const myPower = ((state.army.infantry || 0) * 5) + ((state.army.archers || 0) * 12) + ((state.army.siege || 0) * 50);
  const targetDefense = (target.def || 100) + Math.floor((defenderWallHp || 500) * 0.4);
  const isVictory = (myPower * (0.85 + Math.random() * 0.3)) > targetDefense;

  const modal = document.getElementById('battle-modal');
  const title = document.getElementById('battle-result-title');
  const body = document.getElementById('battle-result-body');

  if (isVictory) {
    // Low Wealth Sanctuary check (Prevents bankrupting destitute beginners)
    if (defenderGold < 150) {
      showToast('🛡️ Sanctuary Protection: Target has less than 150 🪙. Vault protected!');
      const casualties = 1;
      state.army.infantry = Math.max(0, state.army.infantry - casualties);
      if (title) title.innerText = '⚔️ CITADEL BREACHED (EMPTY VAULT)';
      if (body) {
        body.innerHTML = `
          <div style="text-align: center; margin-bottom: 14px;">
            <span style="font-size: 54px;">🏚️</span>
            <h4 style="color: #fbbf24; font-size: 19px; margin-top: 6px;">Depleted Vault!</h4>
          </div>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.7;">
            You smashed the defenses of <strong>${target.name}</strong>, but their vault is under 150 🪙 Sanctuary Protection.<br>
            💰 <strong>Plundered:</strong> 0 🪙 (Sanctuary rule)<br>
            🪖 <strong>Casualties:</strong> Lost ${casualties} Infantry.
          </p>
        `;
      }
    } else {
      // STRICT 70/30 ZERO-INFLATION P2P PLUNDER FORMULA:
      // Maximum 70% can be stolen.
      // Defender ALWAYS retains at least 30%!
      const maxLootable = Math.floor(defenderGold * 0.70);
      const plunderPct = 0.50 + Math.random() * 0.20; // 50% to 70%
      const rawSteal = Math.floor(defenderGold * plunderPct);
      const stolenGold = Math.max(50, Math.min(maxLootable, rawSteal));
      const defenderRetained = defenderGold - stolenGold; // Guaranteed >= 30%

      const casualties = Math.min(state.army.infantry, Math.floor(Math.random() * 2) + 1);
      state.army.infantry = Math.max(0, state.army.infantry - casualties);
      state.user.gold += stolenGold;

      // Update target locally
      target.totalGold = defenderRetained;
      target.lootGold = Math.floor(defenderRetained * 0.70);
      target.isShielded = true;
      target.shieldRem = '2h 00m';

      if (title) title.innerHTML = '<span style="color: #10b981;">🎉 VICTORY!</span> CITADEL BREACHED';
      if (body) {
        body.innerHTML = `
          <div class="battle-hero-banner victory">
            <div class="battle-hero-trophy-box">
              <img src="assets/victory_cup.png" class="battle-trophy-asset" alt="Victory Trophy" />
            </div>
            <h3 class="battle-banner-title">Fortress Breached!</h3>
            <p class="battle-banner-subtitle">Your forces shattered the defenses of <strong>${target.name}</strong>!</p>
            <div class="loot-plunder-showcase">
              <span class="plunder-label">PLUNDERED VAULT GOLD</span>
              <div class="plunder-amount">
                <img src="assets/coin.png" class="plunder-coin-lg" alt="Gold" />
                <span>+${stolenGold.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="battle-report-grid">
            <div class="battle-stat-card">
              <div class="stat-card-icon"><img src="assets/shield.png" class="stat-clay-icon" alt="Safe" /></div>
              <div class="stat-card-content">
                <span class="stat-card-title">Defender Retained</span>
                <span class="stat-card-val text-emerald">${defenderRetained.toLocaleString()} 🪙 (30% Safe)</span>
              </div>
            </div>
            <div class="battle-stat-card">
              <div class="stat-card-icon"><img src="assets/wall.png" class="stat-clay-icon" alt="Wall" /></div>
              <div class="stat-card-content">
                <span class="stat-card-title">Wall Damage</span>
                <span class="stat-card-val text-rose">-150 HP</span>
              </div>
            </div>
            <div class="battle-stat-card">
              <div class="stat-card-icon"><img src="assets/turret.png" class="stat-clay-icon" alt="Casualties" /></div>
              <div class="stat-card-content">
                <span class="stat-card-title">Your Casualties</span>
                <span class="stat-card-val text-rose">${casualties} Footmen</span>
              </div>
            </div>
            <div class="battle-stat-card">
              <div class="stat-card-icon"><img src="assets/horn.png" class="stat-clay-icon" alt="Horns" /></div>
              <div class="stat-card-content">
                <span class="stat-card-title">War Horns Left</span>
                <span class="stat-card-val text-amber">${state.user.raid_horns} / 3</span>
              </div>
            </div>
          </div>

          <div class="post-raid-truce-card">
            <img src="assets/shield.png" class="truce-shield-img" alt="Shield" />
            <div class="truce-info">
              <strong>Post-Raid Truce Active</strong>
              <p>${target.name} has been granted a 2-Hour Truce Shield to recover without being bullied.</p>
            </div>
          </div>
        `;
      }
      fireRoyalConfetti();

      // Persist battle results to Supabase (Zero Inflation - Exact Transfer)
      if (supabaseClient && target.id) {
        (async () => {
          try {
            await supabaseClient.from('users').update({ gold_coins: defenderRetained }).eq('telegram_id', target.id);
            const truceUntil = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
            await supabaseClient.from('user_bases').update({
              wall_hp: Math.max(0, defenderWallHp - 150),
              shield_until: truceUntil
            }).eq('user_id', target.id);
            await supabaseClient.from('battle_logs').insert({
              attacker_id: state.user.id,
              defender_id: target.id,
              winner_id: state.user.id,
              loot_gold: stolenGold,
              attacker_losses: casualties,
              wall_damage: 150,
              summary: `${state.user.name} plundered ${stolenGold} gold from ${target.name} (defender kept ${defenderRetained} gold safe).`
            });
          } catch (e) {
            console.error('Battle log sync error:', e);
          }
        })();
      }
    }
  } else {
    // Defeat
    const casualties = Math.min(state.army.infantry, Math.floor(Math.random() * 4) + 2);
    state.army.infantry = Math.max(0, state.army.infantry - casualties);
    if (title) title.innerHTML = '<span style="color: #ef4444;">💀 DEFEAT!</span> ASSAULT REPELLED';
    if (body) {
      body.innerHTML = `
        <div class="battle-hero-banner defeat">
          <div class="battle-hero-trophy-box defeat-crest-box">
            <img src="assets/defeat_crest.png" class="battle-trophy-asset" alt="Defeat Crest" />
          </div>
          <h3 class="battle-banner-title text-rose">Assault Repelled!</h3>
          <p class="battle-banner-subtitle">The walls and turrets of <strong>${target.name}</strong> held firm against your assault.</p>
          <div class="loot-plunder-showcase defeat-plunder">
            <span class="plunder-label">PLUNDERED GOLD</span>
            <div class="plunder-amount">
              <span style="color: #64748b; font-size: 20px; font-weight: 800;">0 🪙</span>
            </div>
          </div>
        </div>

        <div class="battle-report-grid">
          <div class="battle-stat-card">
            <div class="stat-card-icon"><img src="assets/coin.png" class="stat-clay-icon" alt="Gold" /></div>
            <div class="stat-card-content">
              <span class="stat-card-title">Gold Plundered</span>
              <span class="stat-card-val text-slate">0 🪙</span>
            </div>
          </div>
          <div class="battle-stat-card">
            <div class="stat-card-icon"><img src="assets/wall.png" class="stat-clay-icon" alt="Wall" /></div>
            <div class="stat-card-content">
              <span class="stat-card-title">Wall Damage Dealt</span>
              <span class="stat-card-val text-amber">-20 HP (Minor)</span>
            </div>
          </div>
          <div class="battle-stat-card">
            <div class="stat-card-icon"><img src="assets/turret.png" class="stat-clay-icon" alt="Casualties" /></div>
            <div class="stat-card-content">
              <span class="stat-card-title">Fallen Soldiers</span>
              <span class="stat-card-val text-rose">${casualties} Casualties</span>
            </div>
          </div>
          <div class="battle-stat-card">
            <div class="stat-card-icon"><img src="assets/horn.png" class="stat-clay-icon" alt="Horns" /></div>
            <div class="stat-card-content">
              <span class="stat-card-title">War Horns Left</span>
              <span class="stat-card-val text-amber">${state.user.raid_horns} / 3</span>
            </div>
          </div>
        </div>

        <div class="battle-advice-card">
          <span class="advice-bulb">💡</span>
          <div class="advice-content">
            <strong>Tactical Commander Advice:</strong>
            <p>Upgrade your Military Barracks and recruit Siege Rams to punch through high-defense stone walls!</p>
          </div>
        </div>
      `;
    }

    if (supabaseClient && target.id) {
      (async () => {
        try {
          await supabaseClient.from('battle_logs').insert({
            attacker_id: state.user.id,
            defender_id: target.id,
            winner_id: target.id,
            loot_gold: 0,
            attacker_losses: casualties,
            wall_damage: 20,
            summary: `${target.name} repelled an assault by ${state.user.name}!`
          });
        } catch (e) {
          console.error('Defeat log error:', e);
        }
      })();
    }
  }

  saveState();
  modal?.classList.add('active');
};

// 13. MARKETPLACE CONTROLLER
let activeMarketFilter = 'all';

function renderMarketItems() {
  const grid = document.getElementById('market-items-grid');
  if (!grid) return;

  const assetMap = {
    'SHIELD': 'assets/shield.png',
    'TROOP_CRATE': 'assets/swords.png',
    'WALL_REPAIR': 'assets/wall.png',
    'RESOURCE_PACK': 'assets/coin.png'
  };

  const categoryLabelMap = {
    'SHIELD': '🛡️ Defense',
    'TROOP_CRATE': '⚔️ Military',
    'WALL_REPAIR': '🧱 Fortress',
    'RESOURCE_PACK': '💰 Royal Vault'
  };

  const filtered = state.market.filter(item => {
    if (activeMarketFilter === 'all') return true;
    return item.type === activeMarketFilter;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="market-empty-card">
        <div class="market-empty-icon-box">
          <img src="assets/market_stall.png" class="market-empty-stall-img" alt="Market" />
        </div>
        <h4 style="color: var(--text-main); font-size: 15px; font-weight: 800; margin-top: 6px;">No Active Listings</h4>
        <p class="caption" style="color: var(--text-sub); margin-top: 4px;">No items listed in this category right now.</p>
        <button class="btn btn-gold btn-sm" onclick="document.getElementById('sell-modal')?.classList.add('active');" style="margin-top: 10px;">
          ➕ List an Item For Sale
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const isDiamond = item.currency === 'DIAMOND';
    const btnClass = isDiamond ? 'btn-diamond' : 'btn-gold';
    const iconSrc = assetMap[item.type] || 'assets/coin.png';
    const categoryLabel = categoryLabelMap[item.type] || '📦 Asset';
    const isMyListing = item.sellerId && String(item.sellerId) === String(state.user.id);
    const cleanItem = cleanPlayerName(item.name, 24);
    const cleanSeller = cleanPlayerName(item.seller || 'Empire Trader', 14);
    const typeClass = (item.type || 'resource').toLowerCase().replace('_', '-');

    return `
      <div class="market-trade-card">
        <div class="trade-left-cluster">
          <div class="trade-icon-frame frame-${typeClass}">
            <img src="${iconSrc}" class="trade-item-img" alt="${escapeHtml(item.name)}" />
          </div>
          <div class="trade-info-cluster">
            <div class="trade-cat-row">
              <span class="trade-cat-badge badge-${typeClass}">${categoryLabel}</span>
              ${isMyListing ? '<span class="trade-owner-badge">Your Listing</span>' : ''}
            </div>
            <h4 class="trade-item-title" title="${escapeHtml(item.name)}">${escapeHtml(cleanItem)}</h4>
            <div class="trade-seller-row">
              <span class="trade-seller-lbl">Seller:</span>
              <span class="trade-seller-val">${escapeHtml(cleanSeller)}</span>
            </div>
          </div>
        </div>

        <div class="trade-action-cluster">
          <div class="trade-price-pill ${isDiamond ? 'price-diamond' : 'price-gold'}">
            <img src="${isDiamond ? 'assets/diamond.png' : 'assets/coin.png'}" class="price-coin-micro" alt="Price" />
            <span>${item.price.toLocaleString()}</span>
          </div>
          ${isMyListing 
            ? `<button class="btn btn-secondary btn-xs trade-cancel-btn" onclick="cancelMarketListing(${item.id})">Cancel</button>` 
            : `<button class="btn ${btnClass} btn-sm trade-buy-btn" onclick="buyMarketItem(${item.id})">Buy Now</button>`
          }
        </div>
      </div>
    `;
  }).join('');
}

window.cancelMarketListing = async function(itemId) {
  triggerHaptic('medium');
  state.market = state.market.filter(i => i.id !== itemId);
  saveState();
  renderMarketItems();
  showToast('✅ Item listing withdrawn from Marketplace.');
  if (supabaseClient) {
    try {
      await supabaseClient.from('market_items').update({ is_active: false }).eq('id', itemId);
    } catch(e) {
      console.error('Cancel listing error:', e);
    }
  }
};

window.buyMarketItem = async function(itemId) {
  triggerHaptic('medium');
  const item = state.market.find(i => i.id === itemId);
  if (!item) return;

  if (item.currency === 'DIAMOND') {
    if (state.user.diamonds < item.price) {
      showToast('❌ Insufficient Diamonds!');
      return;
    }
    state.user.diamonds -= item.price;
  } else {
    if (state.user.gold < item.price) {
      showToast('❌ Insufficient Gold Coins!');
      return;
    }
    state.user.gold -= item.price;
  }

  if (item.type === 'SHIELD') {
    state.base.shield_active = true;
    const nowTs = Date.now();
    const currentExpiry = state.base.shield_until && state.base.shield_until > nowTs ? state.base.shield_until : nowTs;
    state.base.shield_until = currentExpiry + (12 * 3600 * 1000);
    showToast('🛡️ 12-Hour Divine Shield Activated!');
    if (supabaseClient && state.user.id) {
      supabaseClient.from('user_bases').update({
        shield_until: new Date(state.base.shield_until).toISOString()
      }).eq('user_id', state.user.id).then(() => {});
    }
  } else if (item.type === 'TROOP_CRATE') {
    state.army.infantry += 100;
    state.army.archers += 50;
    showToast('📦 Crate Opened: +100 Infantry & +50 Archers!');
    if (supabaseClient && state.user.id) {
      supabaseClient.from('user_armies').update({
        infantry_count: state.army.infantry,
        archer_count: state.army.archers
      }).eq('user_id', state.user.id).then(() => {});
    }
  } else if (item.type === 'RESOURCE_PACK') {
    state.user.gold += 25000;
    showToast('💰 Vault Credited: +25,000 Piko Gold!');
  } else if (item.type === 'WALL_REPAIR') {
    state.base.wall_hp = Math.min(state.base.max_wall_hp + 500, state.base.wall_hp + 500);
    showToast('🧱 Wall Reinforced with +500 HP!');
    if (supabaseClient && state.user.id) {
      supabaseClient.from('user_bases').update({
        wall_hp: state.base.wall_hp
      }).eq('user_id', state.user.id).then(() => {});
    }
  }

  // Remove purchased item locally
  state.market = state.market.filter(i => i.id !== itemId);
  fireRoyalConfetti();
  saveState();

  // Immediately sync buyer's updated wallet to Supabase
  if (supabaseClient && state.user.id) {
    supabaseClient.from('users').update({
      gold_coins: state.user.gold,
      diamonds: state.user.diamonds
    }).eq('telegram_id', state.user.id).then(() => {});
  }

  // Update Supabase
  if (supabaseClient) {
    try {
      await supabaseClient.from('market_items').update({ is_active: false }).eq('id', itemId);
      if (item.sellerId && item.sellerId !== state.user.id) {
        const { data: seller } = await supabaseClient.from('users').select('gold_coins, diamonds').eq('telegram_id', item.sellerId).single();
        if (seller) {
          if (item.currency === 'DIAMOND') {
            await supabaseClient.from('users').update({ diamonds: (seller.diamonds || 0) + item.price }).eq('telegram_id', item.sellerId);
          } else {
            await supabaseClient.from('users').update({ gold_coins: (seller.gold_coins || 0) + item.price }).eq('telegram_id', item.sellerId);
          }
        }
      }
    } catch (e) {
      console.error('Market purchase error:', e);
    }
  }
};

// 14. REAL EMPIRE LEADERBOARD (100% REAL SUPABASE DATA)
let currentLeaderboardType = 'rich';

async function fetchAndRenderLeaderboard(type = currentLeaderboardType) {
  currentLeaderboardType = type;
  const list = document.getElementById('lb-full-list');
  const goldName = document.getElementById('podium-gold-name');
  const goldScore = document.getElementById('podium-gold-score');
  const goldSub = document.getElementById('podium-gold-sub');
  const goldAvatar = document.getElementById('podium-gold-avatar-img');

  const silverName = document.getElementById('podium-silver-name');
  const silverScore = document.getElementById('podium-silver-score');
  const silverSub = document.getElementById('podium-silver-sub');
  const silverAvatar = document.getElementById('podium-silver-avatar-img');

  const bronzeName = document.getElementById('podium-bronze-name');
  const bronzeScore = document.getElementById('podium-bronze-score');
  const bronzeSub = document.getElementById('podium-bronze-sub');
  const bronzeAvatar = document.getElementById('podium-bronze-avatar-img');

  if (!supabaseClient) return;

  try {
    let rankedPlayers = [];

    const getAvatar = (name) => {
      const seed = encodeURIComponent(name || 'Empire');
      return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    };

    if (type === 'rich') {
      const { data, error } = await supabaseClient
        .from('users')
        .select('telegram_id, full_name, username, gold_coins, diamonds, membership_tier, user_bases(hq_level)')
        .order('gold_coins', { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        rankedPlayers = data.map((u, idx) => ({
          rank: idx + 1,
          id: u.telegram_id,
          name: u.full_name || u.username || `Emperor #${u.telegram_id.toString().slice(-4)}`,
          score: `${(u.gold_coins || 0).toLocaleString()} 🪙`,
          sub: `${u.membership_tier === 'VIP' ? '👑 VIP • ' : ''}Citadel Lv.${u.user_bases?.hq_level || 1}`,
          isVip: (u.membership_tier === 'VIP') || (u.telegram_id === state.user.id && state.user.is_vip),
          isYou: u.telegram_id === state.user.id,
          avatarUrl: getAvatar(u.full_name || u.username)
        }));
      }
    } else if (type === 'citadel') {
      const { data, error } = await supabaseClient
        .from('user_bases')
        .select('user_id, hq_level, wall_level, defense_power, users(telegram_id, full_name, username, membership_tier)')
        .order('hq_level', { ascending: false })
        .order('defense_power', { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        rankedPlayers = data.map((b, idx) => {
          const u = b.users || {};
          const pName = u.full_name || u.username || `Emperor #${b.user_id.toString().slice(-4)}`;
          return {
            rank: idx + 1,
            id: b.user_id,
            name: pName,
            score: `Citadel Lv.${b.hq_level}`,
            sub: `Wall Lv.${b.wall_level} • ${b.defense_power} DEF`,
            isVip: (u.membership_tier === 'VIP') || (b.user_id === state.user.id && state.user.is_vip),
            isYou: b.user_id === state.user.id,
            avatarUrl: getAvatar(pName)
          };
        });
      }
    } else if (type === 'army') {
      const { data, error } = await supabaseClient
        .from('user_armies')
        .select('user_id, infantry_count, archer_count, siege_count, barracks_level, users(telegram_id, full_name, username, membership_tier)')
        .limit(30);

      if (data && data.length > 0) {
        const calculated = data.map(a => {
          const u = a.users || {};
          const pName = u.full_name || u.username || `Emperor #${a.user_id.toString().slice(-4)}`;
          const strikePower = ((a.infantry_count || 0) * 5) + ((a.archer_count || 0) * 12) + ((a.siege_count || 0) * 50);
          return {
            id: a.user_id,
            name: pName,
            power: strikePower,
            score: `${strikePower.toLocaleString()} ATK`,
            sub: `Barracks Lv.${a.barracks_level || 1} • ${(a.infantry_count || 0) + (a.archer_count || 0) + (a.siege_count || 0)} Troops`,
            isVip: (u.membership_tier === 'VIP') || (a.user_id === state.user.id && state.user.is_vip),
            isYou: a.user_id === state.user.id,
            avatarUrl: getAvatar(pName)
          };
        });
        calculated.sort((a, b) => b.power - a.power);
        rankedPlayers = calculated.slice(0, 20).map((p, idx) => ({ ...p, rank: idx + 1 }));
      }
    }

    // Populate Top 3 Pedestals with Real Data
    const p1 = rankedPlayers[0];
    const p2 = rankedPlayers[1];
    const p3 = rankedPlayers[2];

    const formatPodiumName = (p, defaultLabel) => {
      if (!p) return defaultLabel;
      const clean = cleanPlayerName(p.name, 11);
      const escaped = escapeHtml(clean);
      if (p.isYou) return `<span class="you-podium-tag">👑 YOU</span>`;
      if (p.isVip) return `<span class="vip-chamchamata">${escaped}</span> <span class="vip-shimmer-badge">👑</span>`;
      return escaped;
    };

    if (goldName && goldScore) {
      goldName.innerHTML = formatPodiumName(p1, 'Vacant');
      goldScore.innerText = p1 ? p1.score : '-';
      if (goldSub) goldSub.innerText = p1 ? p1.sub : '';
      if (goldAvatar && p1) goldAvatar.src = p1.avatarUrl;
    }
    if (silverName && silverScore) {
      silverName.innerHTML = formatPodiumName(p2, 'Vacant');
      silverScore.innerText = p2 ? p2.score : '-';
      if (silverSub) silverSub.innerText = p2 ? p2.sub : '';
      if (silverAvatar && p2) silverAvatar.src = p2.avatarUrl;
    }
    if (bronzeName && bronzeScore) {
      bronzeName.innerHTML = formatPodiumName(p3, 'Vacant');
      bronzeScore.innerText = p3 ? p3.score : '-';
      if (bronzeSub) bronzeSub.innerText = p3 ? p3.sub : '';
      if (bronzeAvatar && p3) bronzeAvatar.src = p3.avatarUrl;
    }

    // Populate Ranks 4+ with Avatar Thumbnails & Clean Spacing
    if (list) {
      const rest = rankedPlayers.slice(3);
      if (rest.length === 0) {
        list.innerHTML = `<p class="caption" style="text-align: center; padding: 28px 16px; color: var(--text-sub);">Compete in PvP wars & upgrade your citadel to claim your place in the Hall of Fame!</p>`;
      } else {
        list.innerHTML = rest.map(r => {
          const cleanName = cleanPlayerName(r.name, 14);
          const escapedName = escapeHtml(cleanName);
          const escapedRaw = escapeHtml(r.name);
          return `
            <div class="lb-list-row ${r.isYou ? 'highlight-you' : ''}">
              <div class="lb-left-cluster">
                <span class="lb-rank-num">#${r.rank}</span>
                <div class="lb-avatar-frame">
                  <img src="${r.avatarUrl}" class="lb-avatar-img" alt="${escapedRaw}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=1e293b&color=fbbf24';" />
                </div>
                <div class="lb-player-meta">
                  <h4 class="lb-player-title" title="${escapedRaw}">
                    <span class="${r.isVip ? 'vip-chamchamata' : ''}">${escapedName}</span>
                    ${r.isVip ? '<span class="vip-shimmer-badge">👑 VIP</span>' : ''}
                    ${r.isYou ? '<span class="badge badge-gold" style="font-size:10px; padding:2px 6px; margin-left:4px;">YOU</span>' : ''}
                  </h4>
                  <span class="lb-player-sub">${escapeHtml(r.sub)}</span>
                </div>
              </div>
              <div class="lb-right-score">
                <span class="lb-score-val">${r.score}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error('Leaderboard error:', err);
  }
}

// 15. FULL RENDER MASTER
function renderUI() {
  renderUserProfile();
  renderCitadel();
  renderArmy();
  renderActivityIndicators();
  updateRaidHorns();
  renderTargetsList();
  renderMarketItems();
}

// 16. BOTTOM NAVIGATION (INSTANT TAB SWITCHING)
function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      triggerHaptic('light');
      const targetBtn = e.currentTarget;
      const targetTabId = targetBtn.getAttribute('data-tab');

      navBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      targetBtn.classList.add('active');
      const pane = document.getElementById(targetTabId);
      if (pane) {
        pane.classList.add('active');
      }

      if (targetTabId === 'tab-leaderboard') {
        fetchAndRenderLeaderboard(currentLeaderboardType);
      } else if (targetTabId === 'tab-war') {
        renderTargetsList();
        updateRaidHorns();
      } else if (targetTabId === 'tab-market') {
        renderMarketItems();
      }
    });
  });
}

// 17. BASE ACTIONS EVENT LISTENERS
function setupBaseActions() {
  // Collect Gold Mine
  document.getElementById('btn-collect-mine')?.addEventListener('click', async () => {
    triggerHaptic('medium');
    const diffSec = Math.floor((Date.now() - (state.base.last_collected || Date.now())) / 1000);
    const ratePerSec = (state.base.collector_level * 5) / 60;
    let accumulated = Math.floor(diffSec * ratePerSec);
    if (state.user.is_vip) accumulated = Math.floor(accumulated * 1.5);
    accumulated = Math.min(accumulated, state.base.collector_level * 1500);

    if (accumulated < 10) {
      showToast('⏳ Gold Mine needs a few seconds to produce gold!');
      return;
    }

    state.user.gold += accumulated;
    state.base.last_collected = Date.now();
    fireRoyalConfetti();
    showToast(`💰 Collected +${accumulated.toLocaleString()} Piko Gold!`);
    saveState();

    if (supabaseClient && state.user.id) {
      try {
        await supabaseClient.from('user_bases').update({
          last_collected_at: new Date(state.base.last_collected).toISOString()
        }).eq('user_id', state.user.id);
        await supabaseClient.from('users').update({
          gold_coins: state.user.gold
        }).eq('telegram_id', state.user.id);
      } catch (err) {
        console.error('Mine collection sync error:', err);
      }
    }
  });

  // Upgrade Gold Mine
  document.getElementById('btn-upgrade-mine')?.addEventListener('click', async () => {
    triggerHaptic('medium');
    const cost = state.base.collector_level * 1000;
    if (state.user.gold < cost) {
      showToast(`❌ Need ${cost.toLocaleString()} 🪙 to upgrade Gold Mine!`);
      return;
    }
    state.user.gold -= cost;
    state.base.collector_level += 1;
    fireRoyalConfetti();
    const prod = state.base.collector_level * 5;
    const vipProd = Math.floor(prod * 1.5);
    showToast(`⛏️ Royal Gold Mine upgraded to Lv.${state.base.collector_level}! Output: ~${state.user.is_vip ? vipProd : prod} 🪙/min!`);

    if (supabaseClient && state.user.id) {
      try {
        await supabaseClient.from('user_bases').update({
          collector_level: state.base.collector_level
        }).eq('user_id', state.user.id);
        await supabaseClient.from('users').update({
          gold_coins: state.user.gold
        }).eq('telegram_id', state.user.id);
      } catch (err) {
        console.error('Supabase mine update error:', err);
      }
    }
    saveState();
  });

  // Upgrade Headquarters (HQ)
  document.getElementById('btn-upgrade-hq')?.addEventListener('click', async () => {
    triggerHaptic('heavy');
    const cost = state.base.hq_level * 1500;
    if (state.user.gold < cost) {
      showToast(`❌ Need ${cost.toLocaleString()} 🪙 to upgrade Headquarters!`);
      return;
    }
    state.user.gold -= cost;
    state.base.hq_level += 1;
    state.base.max_wall_hp += 250;
    state.base.wall_hp = state.base.max_wall_hp;
    state.base.defense_power += 50;
    fireRoyalConfetti();
    showToast(`🏰 Citadel HQ upgraded to Lv.${state.base.hq_level}! Max Wall HP: ${state.base.max_wall_hp} & Defense: ${state.base.defense_power} 🛡️`);

    if (supabaseClient && state.user.id) {
      try {
        await supabaseClient.from('user_bases').update({
          hq_level: state.base.hq_level,
          max_wall_hp: state.base.max_wall_hp,
          wall_hp: state.base.wall_hp,
          defense_power: state.base.defense_power
        }).eq('user_id', state.user.id);
        await supabaseClient.from('users').update({
          gold_coins: state.user.gold
        }).eq('telegram_id', state.user.id);
      } catch (err) {
        console.error('Supabase HQ update error:', err);
      }
    }
    saveState();
  });

  // Repair Wall
  document.getElementById('btn-repair-wall')?.addEventListener('click', async () => {
    triggerHaptic('light');
    if (state.base.wall_hp >= state.base.max_wall_hp) {
      showToast('🧱 Wall integrity is already at 100%!');
      return;
    }
    const missingHp = state.base.max_wall_hp - state.base.wall_hp;
    const repairCost = Math.ceil(missingHp * 0.5);
    if (state.user.gold < repairCost) {
      showToast(`❌ Need ${repairCost.toLocaleString()} 🪙 to fully repair wall.`);
      return;
    }
    state.user.gold -= repairCost;
    state.base.wall_hp = state.base.max_wall_hp;
    showToast(`🛠️ Wall fully restored! (-${repairCost.toLocaleString()} 🪙)`);
    saveState();

    if (supabaseClient && state.user.id) {
      try {
        await supabaseClient.from('user_bases').update({
          wall_hp: state.base.wall_hp
        }).eq('user_id', state.user.id);
        await supabaseClient.from('users').update({
          gold_coins: state.user.gold
        }).eq('telegram_id', state.user.id);
      } catch (err) {
        console.error('Wall repair sync error:', err);
      }
    }
  });

  // Upgrade Wall
  document.getElementById('btn-upgrade-wall')?.addEventListener('click', async () => {
    triggerHaptic('medium');
    const cost = state.base.wall_level * 1000;
    if (state.user.gold < cost) {
      showToast(`❌ Need ${cost.toLocaleString()} 🪙 to upgrade Wall!`);
      return;
    }
    state.user.gold -= cost;
    state.base.wall_level += 1;
    state.base.max_wall_hp += 300;
    state.base.wall_hp = state.base.max_wall_hp;
    showToast(`🧱 Wall upgraded to Lv.${state.base.wall_level}! (+300 HP)`);
    saveState();

    if (supabaseClient && state.user.id) {
      try {
        await supabaseClient.from('user_bases').update({
          wall_level: state.base.wall_level,
          max_wall_hp: state.base.max_wall_hp,
          wall_hp: state.base.wall_hp
        }).eq('user_id', state.user.id);
        await supabaseClient.from('users').update({
          gold_coins: state.user.gold
        }).eq('telegram_id', state.user.id);
      } catch (err) {
        console.error('Wall upgrade sync error:', err);
      }
    }
  });

  // Upgrade Turret
  document.getElementById('btn-upgrade-turret')?.addEventListener('click', async () => {
    triggerHaptic('medium');
    const cost = state.base.turret_level * 1200;
    if (state.user.gold < cost) {
      showToast(`❌ Need ${cost.toLocaleString()} 🪙 to upgrade Turret!`);
      return;
    }
    state.user.gold -= cost;
    state.base.turret_level += 1;
    state.base.defense_power += 75;
    showToast(`🗼 Defense Turret upgraded to Lv.${state.base.turret_level}! (+75 Power)`);
    saveState();

    if (supabaseClient && state.user.id) {
      try {
        await supabaseClient.from('user_bases').update({
          defense_turret_level: state.base.turret_level,
          defense_power: state.base.defense_power
        }).eq('user_id', state.user.id);
        await supabaseClient.from('users').update({
          gold_coins: state.user.gold
        }).eq('telegram_id', state.user.id);
      } catch (err) {
        console.error('Turret upgrade sync error:', err);
      }
    }
  });

  // Activate Divine Shield
  document.getElementById('btn-activate-shield')?.addEventListener('click', async () => {
    triggerHaptic('heavy');
    if (state.user.diamonds < 10) {
      showToast('❌ Need 10 💎 Diamonds to activate Peace Shield!');
      return;
    }
    state.user.diamonds -= 10;
    state.base.shield_active = true;
    const now = Date.now();
    const currentExpiry = state.base.shield_until && state.base.shield_until > now ? state.base.shield_until : now;
    state.base.shield_until = currentExpiry + (12 * 3600 * 1000);
    fireRoyalConfetti();
    showToast('🛡️ Divine Peace Treaty Active! 12 Hours of Protection.');
    saveState();

    if (supabaseClient && state.user.id) {
      try {
        const shieldUntilISO = new Date(state.base.shield_until).toISOString();
        await supabaseClient.from('user_bases').update({
          shield_until: shieldUntilISO
        }).eq('user_id', state.user.id);
        await supabaseClient.from('users').update({
          diamonds: state.user.diamonds
        }).eq('telegram_id', state.user.id);
      } catch (err) {
        console.error('Shield sync error:', err);
      }
    }
  });

  // Upgrade Barracks
  document.getElementById('btn-upgrade-barracks')?.addEventListener('click', async () => {
    triggerHaptic('medium');
    const cost = state.army.barracks_level * 2000;
    if (state.user.gold < cost) {
      showToast(`❌ Need ${cost.toLocaleString()} 🪙 to expand Barracks!`);
      return;
    }
    state.user.gold -= cost;
    state.army.barracks_level += 1;
    showToast(`⛺ Barracks expanded to Lv.${state.army.barracks_level}! Capacity +150.`);
    saveState();

    if (supabaseClient && state.user.id) {
      try {
        await supabaseClient.from('user_armies').update({
          barracks_level: state.army.barracks_level
        }).eq('user_id', state.user.id);
        await supabaseClient.from('users').update({
          gold_coins: state.user.gold
        }).eq('telegram_id', state.user.id);
      } catch (err) {
        console.error('Barracks upgrade sync error:', err);
      }
    }
  });

  // Recharge War Horns (+1 for 3 Diamonds)
  document.getElementById('btn-recharge-horns')?.addEventListener('click', async () => {
    triggerHaptic('medium');
    const maxHorns = state.user.max_horns || 3;
    if (state.user.raid_horns >= maxHorns) {
      showToast('📯 War Horns are already at maximum capacity (3/3)!');
      return;
    }
    if (state.user.diamonds < 3) {
      showToast('❌ Need 3 💎 Diamonds to instantly rally troops!');
      return;
    }
    state.user.diamonds -= 3;
    state.user.raid_horns = Math.min(maxHorns, (state.user.raid_horns || 0) + 1);
    state.user.last_horn_regen = Date.now();
    fireRoyalConfetti();
    showToast('📯 Sounded War Horn! +1 Raid Energy ready.');
    saveState();
    // Immediately sync horn count and diamonds to Supabase
    if (supabaseClient && state.user.id) {
      try {
        await supabaseClient.from('users').update({
          raid_horns: state.user.raid_horns,
          last_horn_regen: new Date(state.user.last_horn_regen).toISOString(),
          diamonds: state.user.diamonds
        }).eq('telegram_id', state.user.id);
      } catch (err) {
        console.error('Horn sync error:', err);
      }
    }
  });

  // War Sub-tabs (Radar vs Inbound Threat Logs)
  document.getElementById('war-tab-radar')?.addEventListener('click', () => {
    triggerHaptic('light');
    document.getElementById('war-tab-radar')?.classList.add('active');
    document.getElementById('war-tab-logs')?.classList.remove('active');
    const targetsStack = document.getElementById('targets-stack');
    const logsStack = document.getElementById('threat-logs-stack');
    if (targetsStack) targetsStack.style.display = 'flex';
    if (logsStack) logsStack.style.display = 'none';
    renderTargetsList();
  });

  document.getElementById('war-tab-logs')?.addEventListener('click', () => {
    triggerHaptic('light');
    document.getElementById('war-tab-logs')?.classList.add('active');
    document.getElementById('war-tab-radar')?.classList.remove('active');
    const targetsStack = document.getElementById('targets-stack');
    const logsStack = document.getElementById('threat-logs-stack');
    if (targetsStack) targetsStack.style.display = 'none';
    if (logsStack) logsStack.style.display = 'flex';
    fetchAndRenderThreatLogs();
  });

  // Quick Match Raid
  document.getElementById('btn-quick-raid')?.addEventListener('click', () => {
    if (state.targets.length > 0) {
      const unshielded = state.targets.filter(t => !t.isShielded);
      const pool = unshielded.length > 0 ? unshielded : state.targets;
      const randomTarget = pool[Math.floor(Math.random() * pool.length)];
      startRaidBattle(randomTarget.id);
    } else {
      showToast('📡 No enemy empires located on radar yet.');
    }
  });

  // Close Battle Modal
  document.getElementById('btn-close-battle')?.addEventListener('click', () => {
    document.getElementById('battle-modal')?.classList.remove('active');
  });
  document.getElementById('btn-confirm-battle')?.addEventListener('click', () => {
    document.getElementById('battle-modal')?.classList.remove('active');
  });

  // Handbook / Lore Modal Listeners
  document.getElementById('btn-open-guide')?.addEventListener('click', () => {
    triggerHaptic('light');
    document.getElementById('guide-modal')?.classList.add('active');
  });
  document.getElementById('btn-close-guide')?.addEventListener('click', () => {
    document.getElementById('guide-modal')?.classList.remove('active');
  });
  document.getElementById('btn-confirm-guide')?.addEventListener('click', () => {
    document.getElementById('guide-modal')?.classList.remove('active');
  });
}

// 18. TROOP RECRUITMENT HELPER
window.recruitTroops = async function(type, count) {
  triggerHaptic('light');
  const prices = { infantry: 20, archer: 50, siege: 250 };
  const cost = prices[type] * count;

  const totalTroops = (state.army.infantry || 0) + (state.army.archers || 0) + (state.army.siege || 0);
  const maxCap = state.army.barracks_level * 150;
  if (totalTroops + count > maxCap) {
    showToast(`❌ Barracks capacity full! (${totalTroops}/${maxCap}) Upgrade Barracks!`);
    return;
  }

  if (state.user.gold < cost) {
    showToast(`❌ Not enough Gold! Need ${cost.toLocaleString()} 🪙.`);
    return;
  }

  state.user.gold -= cost;
  if (type === 'infantry') state.army.infantry += count;
  else if (type === 'archer') state.army.archers += count;
  else if (type === 'siege') state.army.siege += count;

  showToast(`⚔️ Recruited ${count} units for ${cost.toLocaleString()} 🪙!`);
  saveState();

  if (supabaseClient && state.user.id) {
    try {
      await supabaseClient.from('user_armies').update({
        infantry_count: state.army.infantry,
        archer_count: state.army.archers,
        siege_count: state.army.siege
      }).eq('user_id', state.user.id);
      await supabaseClient.from('users').update({
        gold_coins: state.user.gold
      }).eq('telegram_id', state.user.id);
    } catch (err) {
      console.error('Troop recruitment sync error:', err);
    }
  }
};

// 19. 7-DAY PROGRESSIVE STREAK CONTROLLER (CLEAN MODERN UI)
function setupStreakModal() {
  const streakModal = document.getElementById('streak-modal');
  document.getElementById('btn-open-streak')?.addEventListener('click', () => {
    triggerHaptic('medium');
    renderStreakGrid();
    streakModal?.classList.add('active');
  });

  document.getElementById('btn-close-streak')?.addEventListener('click', () => {
    streakModal?.classList.remove('active');
  });

  document.getElementById('btn-claim-streak')?.addEventListener('click', () => {
    triggerStreakClaim();
  });
}

window.triggerStreakClaim = async function() {
  const now = Date.now();
  const timeSinceClaim = now - (state.user.last_streak_claim || 0);
  const alreadyClaimedToday = timeSinceClaim < 24 * 3600 * 1000;

  if (alreadyClaimedToday) {
    triggerHaptic('light');
    const remainingMs = (24 * 3600 * 1000) - timeSinceClaim;
    const hoursLeft = Math.floor(remainingMs / (3600 * 1000));
    const minsLeft = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
    showToast(`⏳ Already claimed today! Next reward unlocks in ${hoursLeft}h ${minsLeft}m.`);
    return;
  }

  triggerHaptic('heavy');
  const streakIdx = Math.min((state.user.current_streak || 1) - 1, STREAK_DAYS.length - 1);
  const reward = STREAK_DAYS[streakIdx];
  const mult = state.user.is_vip ? 2 : 1;

  const goldGiven = reward.gold * mult;
  const diamondsGiven = (reward.diamonds || 0) * mult;

  state.user.gold += goldGiven;
  state.user.diamonds += diamondsGiven;
  if (reward.shield) {
    state.base.shield_active = true;
    const nowTs = Date.now();
    const currentExpiry = state.base.shield_until && state.base.shield_until > nowTs ? state.base.shield_until : nowTs;
    state.base.shield_until = currentExpiry + (12 * 3600 * 1000);
    if (supabaseClient && state.user.id) {
      supabaseClient.from('user_bases').update({
        shield_until: new Date(state.base.shield_until).toISOString()
      }).eq('user_id', state.user.id).then(() => {});
    }
  }

  state.user.last_streak_claim = now;
  state.user.current_streak = (state.user.current_streak % 7) + 1;

  fireRoyalConfetti();
  showToast(`🎁 Claimed Day ${reward.day}! +${goldGiven.toLocaleString()} 🪙` + (diamondsGiven > 0 ? `, +${diamondsGiven} 💎` : ''));
  renderStreakGrid();
  renderUI();
  saveState();

  if (supabaseClient && state.user.id) {
    try {
      await supabaseClient.from('users').update({
        gold_coins: state.user.gold,
        diamonds: state.user.diamonds,
        daily_claimed_at: new Date(now).toISOString()
      }).eq('telegram_id', state.user.id);
    } catch (err) {
      console.error('Streak claim remote sync error:', err);
    }
  }
};

function renderStreakGrid() {
  const grid = document.getElementById('streak-grid');
  if (!grid) return;

  const currentStreak = state.user.current_streak || 1;
  const now = Date.now();
  const timeSinceClaim = now - (state.user.last_streak_claim || 0);
  const alreadyClaimedToday = timeSinceClaim < 24 * 3600 * 1000;

  // Update streak counter badge and progress bar
  const streakCounter = document.getElementById('streak-counter-badge');
  if (streakCounter) streakCounter.innerText = `${currentStreak} of 7 Days`;
  const streakFill = document.getElementById('streak-progress-fill');
  if (streakFill) streakFill.style.width = `${Math.min(100, Math.round((currentStreak / 7) * 100))}%`;

  const days1to6 = STREAK_DAYS.slice(0, 6);
  const day7 = STREAK_DAYS[6];

  const renderCard = (s, isGrandDay = false) => {
    let cardClass = isGrandDay ? 'streak-card streak-card-grand' : 'streak-card';
    const isClaimed = s.day < currentStreak;
    const isCurrent = s.day === currentStreak;
    const isDone = isCurrent && alreadyClaimedToday;
    const isReady = isCurrent && !alreadyClaimedToday;

    if (isClaimed || isDone) cardClass += ' claimed';
    if (isReady) cardClass += ' ready-day';

    let statusBadge = '';
    if (isClaimed || isDone) {
      statusBadge = '<span class="streak-status-pill claimed-pill">✓ Done</span>';
    } else if (isReady) {
      statusBadge = '<span class="streak-status-pill ready-pill">🎁 CLAIM</span>';
    } else {
      statusBadge = `<span class="streak-status-pill locked-pill">🔒 Day ${s.day}</span>`;
    }

    const mult = state.user.is_vip ? 2 : 1;
    const rawGold = s.gold * mult;
    const goldDisplay = rawGold >= 1000 ? `${rawGold / 1000}k` : rawGold;
    const clickAttr = isReady ? 'onclick="triggerStreakClaim()"' : '';

    if (isGrandDay) {
      return `
        <div class="${cardClass}" ${clickAttr}>
          <div class="grand-card-top">
            <span class="grand-tag">👑 GRAND ROYAL BOUNTY</span>
            ${statusBadge}
          </div>
          <div class="grand-card-body">
            <div class="grand-trophy-frame">
              <img src="assets/victory_cup.png" class="grand-trophy-img" alt="Royal Cup" />
            </div>
            <div class="grand-rewards-wrap">
              <h4 class="grand-title">Day 7: Emperor's Treasure</h4>
              <div class="grand-pills-row">
                <span class="grand-pill gold-pill">+${goldDisplay} <img src="assets/coin.png" class="mini-asset-img" alt="Gold" /></span>
                <span class="grand-pill diamond-pill">+${s.diamonds * mult} <img src="assets/diamond.png" class="mini-asset-img" alt="Diamonds" /></span>
                <span class="grand-pill shield-pill">+12h Shield <img src="assets/shield.png" class="mini-asset-img" alt="Shield" /></span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="${cardClass}" ${clickAttr}>
        <div class="streak-card-header">
          <span class="streak-day-label">Day ${s.day}</span>
          ${isClaimed || isDone ? '<span class="streak-check-circle">✓</span>' : ''}
        </div>
        <div class="streak-icon-box">
          <img src="${s.iconImg}" class="streak-asset-icon" alt="Day ${s.day}" />
        </div>
        <div class="streak-pills-stack">
          <span class="reward-pill pill-gold">+${goldDisplay} <img src="assets/coin.png" class="micro-asset-img" alt="Gold" /></span>
          ${s.diamonds > 0 ? `<span class="reward-pill pill-diamond">+${s.diamonds * mult} <img src="assets/diamond.png" class="micro-asset-img" alt="Diamond" /></span>` : ''}
        </div>
        <div class="streak-card-status">
          ${statusBadge}
        </div>
      </div>
    `;
  };

  const days1to6Html = `<div class="streak-subgrid-6">${days1to6.map(s => renderCard(s, false)).join('')}</div>`;
  const day7Html = renderCard(day7, true);

  grid.innerHTML = days1to6Html + day7Html;

  const claimBtn = document.getElementById('btn-claim-streak');
  if (claimBtn) {
    if (alreadyClaimedToday) {
      const remainingMs = (24 * 3600 * 1000) - timeSinceClaim;
      const hoursLeft = Math.floor(remainingMs / (3600 * 1000));
      const minsLeft = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
      claimBtn.className = 'btn btn-secondary btn-block btn-streak-claimed';
      claimBtn.innerHTML = `⏳ Claimed for Today (Next in ${hoursLeft}h ${minsLeft}m)`;
    } else {
      claimBtn.className = 'btn btn-gold btn-block pulse-btn';
      claimBtn.innerHTML = `🎁 Claim Day ${currentStreak} Bounty!`;
    }
  }
}

// 20. FORTUNE WHEEL CONTROLLER (HIGH CONTRAST RETINA CANVAS)
let isSpinning = false;
let wheelCanvas = null;
let wheelCtx = null;
let currentWheelAngle = 0;

function setupWheelModal() {
  const wheelModal = document.getElementById('wheel-modal');
  wheelCanvas = document.getElementById('wheel-canvas');
  if (wheelCanvas) {
    wheelCtx = wheelCanvas.getContext('2d');
    drawWheel();
  }

  document.getElementById('btn-open-wheel')?.addEventListener('click', () => {
    triggerHaptic('medium');
    wheelModal?.classList.add('active');
    updateWheelButtonState();
    drawWheel();
  });

  document.getElementById('btn-close-wheel')?.addEventListener('click', () => {
    if (!isSpinning) wheelModal?.classList.remove('active');
  });

  document.getElementById('btn-spin-wheel')?.addEventListener('click', () => {
    if (isSpinning) return;
    const now = Date.now();
    const canFreeSpin = (now - state.user.last_wheel_spin) >= 24 * 3600 * 1000;

    if (!canFreeSpin) {
      if (state.user.diamonds < 5) {
        showToast('❌ Free spin on cooldown! Extra spin costs 5 💎 Diamonds.');
        return;
      }
      state.user.diamonds -= 5;
    }

    isSpinning = true;
    triggerHaptic('heavy');
    const spinBtn = document.getElementById('btn-spin-wheel');
    if (spinBtn) spinBtn.disabled = true;

    const winningIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
    const segmentAngle = (2 * Math.PI) / WHEEL_PRIZES.length;
    // Pointer is at the top (3*PI / 2)
    const targetAngle = (3 * Math.PI / 2) - (winningIndex * segmentAngle) - (segmentAngle / 2);
    const fullSpins = 8 + Math.floor(Math.random() * 3);
    const totalRotation = (fullSpins * 2 * Math.PI) + targetAngle;

    let start = null;
    const duration = 4500;
    const initialAngle = currentWheelAngle;

    function animateSpin(timestamp) {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // Quintic ease out for a dramatic slow down
      const ease = 1 - Math.pow(1 - progress, 5);

      currentWheelAngle = initialAngle + (ease * (totalRotation - (initialAngle % (2 * Math.PI))));
      drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        isSpinning = false;
        if (canFreeSpin) state.user.last_wheel_spin = now;
        awardWheelPrize(WHEEL_PRIZES[winningIndex]);
        updateWheelButtonState();
        saveState();
      }
    }

    requestAnimationFrame(animateSpin);
  });
}

function updateWheelButtonState() {
  const spinBtn = document.getElementById('btn-spin-wheel');
  const hintEl = document.getElementById('wheel-timer-hint');
  const now = Date.now();
  const timeSinceSpin = now - state.user.last_wheel_spin;
  const canFreeSpin = timeSinceSpin >= 24 * 3600 * 1000;

  if (spinBtn) {
    if (isSpinning) {
      spinBtn.disabled = true;
      spinBtn.innerText = 'Spinning the Wheel...';
    } else if (canFreeSpin) {
      spinBtn.disabled = false;
      spinBtn.className = 'btn btn-gold btn-block';
      spinBtn.innerText = '🎯 SPIN THE WHEEL (FREE)!';
      if (hintEl) hintEl.innerText = '1 Free Spin Available Today!';
    } else {
      spinBtn.disabled = false;
      spinBtn.className = 'btn btn-diamond btn-block';
      spinBtn.innerText = '💎 Extra Spin (Cost: 5 Diamonds)';
      const remainingMs = (24 * 3600 * 1000) - timeSinceSpin;
      const hours = Math.floor(remainingMs / (3600 * 1000));
      const mins = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
      if (hintEl) hintEl.innerText = `Free spin resets in ${hours}h ${mins}m`;
    }
  }
}

function drawWheel() {
  if (!wheelCtx || !wheelCanvas) return;
  const numSegments = WHEEL_PRIZES.length;
  const arc = (2 * Math.PI) / numSegments;
  const cx = wheelCanvas.width / 2;
  const cy = wheelCanvas.height / 2;
  const radius = cx - 8;

  wheelCtx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);

  for (let i = 0; i < numSegments; i++) {
    const angle = currentWheelAngle + (i * arc);
    const p = WHEEL_PRIZES[i];

    // Sector Wedge
    wheelCtx.beginPath();
    wheelCtx.fillStyle = p.bg;
    wheelCtx.moveTo(cx, cy);
    wheelCtx.arc(cx, cy, radius, angle, angle + arc);
    wheelCtx.lineTo(cx, cy);
    wheelCtx.fill();

    // Wedge Border
    wheelCtx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    wheelCtx.lineWidth = 1.5;
    wheelCtx.stroke();

    // Sector Text & Icon
    wheelCtx.save();
    wheelCtx.translate(cx, cy);
    wheelCtx.rotate(angle + (arc / 2));

    // Draw Icon
    wheelCtx.font = '20px sans-serif';
    wheelCtx.textAlign = 'center';
    wheelCtx.textBaseline = 'middle';
    wheelCtx.fillText(p.icon, radius - 26, 0);

    // Draw Text Label
    wheelCtx.fillStyle = '#ffffff';
    wheelCtx.font = 'bold 11px Outfit, sans-serif';
    wheelCtx.shadowColor = 'rgba(0,0,0,0.8)';
    wheelCtx.shadowBlur = 4;
    wheelCtx.fillText(p.label, radius - 62, 0);

    wheelCtx.restore();
  }

  // Outer Golden Rim
  wheelCtx.beginPath();
  wheelCtx.arc(cx, cy, radius, 0, 2 * Math.PI);
  wheelCtx.lineWidth = 6;
  wheelCtx.strokeStyle = '#f59e0b';
  wheelCtx.stroke();
}

function awardWheelPrize(prize) {
  fireRoyalConfetti();
  let prizeSummary = prize.label;

  if (prize.gold) state.user.gold += prize.gold;
  if (prize.diamonds) state.user.diamonds += prize.diamonds;
  if (prize.shield) {
    state.base.shield_active = true;
    const nowTs = Date.now();
    const currentExpiry = state.base.shield_until && state.base.shield_until > nowTs ? state.base.shield_until : nowTs;
    state.base.shield_until = currentExpiry + (12 * 3600 * 1000);
    if (supabaseClient && state.user.id) {
      supabaseClient.from('user_bases').update({
        shield_until: new Date(state.base.shield_until).toISOString()
      }).eq('user_id', state.user.id).then(() => {});
    }
  }
  if (prize.troops) {
    if (prize.troopType === 'infantry') state.army.infantry += prize.troops;
    else if (prize.troopType === 'archers') state.army.archers += prize.troops;
    else if (prize.troopType === 'siege') state.army.siege += prize.troops;
    if (supabaseClient && state.user.id) {
      supabaseClient.from('user_armies').update({
        infantry_count: state.army.infantry,
        archer_count: state.army.archers,
        siege_count: state.army.siege
      }).eq('user_id', state.user.id).then(() => {});
    }
  }

  showToast(`🎉 REWARD WON: ${prizeSummary}!`);

  if (supabaseClient && state.user.id) {
    supabaseClient.from('users').update({
      gold_coins: state.user.gold,
      diamonds: state.user.diamonds
    }).eq('telegram_id', state.user.id).then(() => {});
  }
}

// 21. MARKETPLACE ACTIONS & VIP
function setupMarketActions() {
  const sellModal = document.getElementById('sell-modal');
  
  // Dual trigger support for open sell modal
  ['btn-open-sell', 'btn-open-sell-modal'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      triggerHaptic('medium');
      sellModal?.classList.add('active');
    });
  });

  document.getElementById('btn-close-sell')?.addEventListener('click', () => {
    sellModal?.classList.remove('active');
  });

  // Dynamic Item Preview in Sell Modal
  const previewMap = {
    'SHIELD': { img: 'assets/shield.png', title: '12-Hour Divine Peace Shield', desc: 'Protects fortress citadel from all PvP raids while offline.' },
    'TROOP_CRATE': { img: 'assets/swords.png', title: 'Mystery Troop Crate (150 Soldiers)', desc: 'Instant reinforcements: +100 Footmen & +50 Archers.' },
    'WALL_REPAIR': { img: 'assets/wall.png', title: 'Wall Reinforcement (+500 HP)', desc: 'Fortifies fortress stone wall durability by +500 HP.' },
    'RESOURCE_PACK': { img: 'assets/coin.png', title: 'Royal Gold Vault (+25,000 Coins)', desc: 'Instant wealth injection directly into your Citadel vault.' }
  };

  const sellTypeSelect = document.getElementById('sell-select-type');
  sellTypeSelect?.addEventListener('change', (e) => {
    const item = previewMap[e.target.value] || previewMap['SHIELD'];
    const pImg = document.getElementById('sell-preview-img');
    const pTitle = document.getElementById('sell-preview-title');
    const pDesc = document.getElementById('sell-preview-desc');
    if (pImg) pImg.src = item.img;
    if (pTitle) pTitle.innerText = item.title;
    if (pDesc) pDesc.innerText = item.desc;
  });

  // Dynamic currency indicator in price input
  document.getElementById('sell-select-currency')?.addEventListener('change', (e) => {
    const ind = document.getElementById('sell-currency-indicator');
    if (ind) ind.innerText = e.target.value === 'DIAMOND' ? '💎 Diamonds' : '🪙 Coins';
  });

  // Category filter chips
  document.querySelectorAll('.category-chip, .filter-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      triggerHaptic('light');
      document.querySelectorAll('.category-chip, .filter-pill').forEach(p => p.classList.remove('active'));
      e.currentTarget.classList.add('active');
      activeMarketFilter = e.currentTarget.getAttribute('data-filter') || 'all';
      renderMarketItems();
    });
  });

  document.getElementById('btn-submit-listing')?.addEventListener('click', async () => {
    triggerHaptic('heavy');
    const type = document.getElementById('sell-select-type')?.value || 'SHIELD';
    const currency = document.getElementById('sell-select-currency')?.value || 'GOLD';
    const priceInput = document.getElementById('sell-input-price');
    const price = parseInt(priceInput?.value);

    if (!price || price <= 0) {
      showToast('❌ Please specify a valid price!');
      return;
    }

    if (currency === 'DIAMOND' && !state.user.is_vip) {
      showToast('🔒 Selling for Diamonds is locked to VIP Members!');
      return;
    }

    const itemNames = {
      'SHIELD': '12-Hour Divine Peace Shield',
      'TROOP_CRATE': 'Mystery Troop Crate (150 Soldiers)',
      'WALL_REPAIR': 'Wall Reinforcement (+500 HP)',
      'RESOURCE_PACK': 'Royal Gold Vault (+25,000 Coins)'
    };

    const newItem = {
      id: Date.now(),
      name: itemNames[type] || 'Royal Mystery Asset',
      type: type,
      price: price,
      currency: currency,
      sellerId: state.user.id,
      seller: state.user.name || 'Lord Emperor'
    };

    // Optimistic local update
    state.market.unshift(newItem);
    if (priceInput) priceInput.value = '500';
    sellModal?.classList.remove('active');
    showToast('✅ Item successfully listed on Marketplace!');
    renderMarketItems();
    saveState();

    // Supabase remote persistence with user foreign-key guarantee and created_at timestamp
    if (supabaseClient) {
      try {
        await supabaseClient.from('users').upsert({
          telegram_id: state.user.id,
          username: state.user.username || 'trader',
          full_name: state.user.name || 'Lord Emperor'
        }, { onConflict: 'telegram_id' });

        const { data: ins, error: insErr } = await supabaseClient.from('market_items').insert({
          seller_id: state.user.id,
          item_name: newItem.name,
          item_type: type,
          quantity: 1,
          currency: currency,
          price: price,
          is_active: true,
          created_at: new Date().toISOString()
        }).select().single();

        if (insErr) {
          console.warn('Supabase market listing note:', insErr.message);
        } else if (ins) {
          newItem.id = ins.id;
          saveState();
        }
      } catch (e) {
        console.error('Publish listing remote error:', e);
      }
    }
  });

  // Imperial VIP Chamber Integration
  setupVipModal();

  // Leaderboard sub-tabs
  document.querySelectorAll('.lb-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      triggerHaptic('light');
      document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const lbType = e.currentTarget.getAttribute('data-type') || 'rich';
      fetchAndRenderLeaderboard(lbType);
    });
  });
}

function openVipModal() {
  triggerHaptic('medium');
  const vipModal = document.getElementById('vip-modal');
  const banner = document.getElementById('vip-status-banner');
  if (banner) {
    if (state.user.is_vip) {
      banner.innerHTML = `
        <h4 class="vip-chamchamata">👑 Active Imperial VIP Member</h4>
        <p>Active Privileges: +50% Mine Output • 2x Daily Streak • Diamond Marketplace • Chamchamata Golden Name</p>
      `;
    } else {
      banner.innerHTML = `
        <h4 style="color:#ffffff;">🌱 Standard Citizen (Free Tier)</h4>
        <p>Upgrade to Imperial VIP to unlock 2x rewards, +50% mine speed, and golden leaderboard prestige.</p>
      `;
    }
  }
  vipModal?.classList.add('active');
}

function setupVipModal() {
  const vipModal = document.getElementById('vip-modal');
  document.getElementById('btn-open-vip-modal')?.addEventListener('click', openVipModal);
  document.getElementById('vip-badge')?.addEventListener('click', openVipModal);
  document.getElementById('btn-close-vip')?.addEventListener('click', () => {
    vipModal?.classList.remove('active');
  });

  // VIP Subscription Tiers: 2d (100💎), 7d (300💎), 28d (1000💎)
  const tierConfigs = {
    '2d': { days: 2, cost: 100, label: '2-Day VIP Pass' },
    '7d': { days: 7, cost: 300, label: '7-Day Imperial VIP' },
    '28d': { days: 28, cost: 1000, label: '28-Day Sovereign Crown' }
  };

  document.querySelectorAll('.btn-buy-tier').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      triggerHaptic('heavy');
      const plan = e.currentTarget.getAttribute('data-plan') || '2d';
      const cfg = tierConfigs[plan];
      if (!cfg) return;

      if (state.user.diamonds < cfg.cost) {
        showToast(`❌ Need ${cfg.cost} 💎 Diamonds for ${cfg.label}! You have ${state.user.diamonds} 💎.`);
        return;
      }

      state.user.diamonds -= cfg.cost;
      state.user.is_vip = true;
      fireRoyalConfetti();
      showToast(`🎉 Acquired ${cfg.label}! Enjoy VIP perks for +${cfg.days} days!`);

      // Update Supabase
      if (supabaseClient) {
        try {
          const expiresAt = new Date(Date.now() + cfg.days * 86400000).toISOString();
          await supabaseClient.from('users').update({
            diamonds: state.user.diamonds,
            membership_tier: 'VIP',
            membership_expires_at: expiresAt
          }).eq('telegram_id', state.user.id);
        } catch (err) {
          console.error('Supabase VIP update error:', err);
        }
      }

      saveState();
      openVipModal(); // Refresh modal view
    });
  });
}

// 22. SUPABASE DATABASE REAL-TIME CONNECTOR
function initSupabase() {
  if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      console.log('✅ Supabase Connected to PikoBot Realm!');
      syncRealDatabaseData();
    } catch (e) {
      console.error('Supabase init error:', e);
    }
  }
}

async function syncRealDatabaseData() {
  if (!supabaseClient) return;
  try {
    // 1. Sync or Create Current User
    const { data: dbUser } = await supabaseClient
      .from('users')
      .select('*, user_bases(*), user_armies(*)')
      .eq('telegram_id', state.user.id)
      .maybeSingle();

    if (dbUser) {
      state.user.name = dbUser.full_name || state.user.name;
      state.user.username = dbUser.username || state.user.username;
      state.user.gold = dbUser.gold_coins ?? state.user.gold;
      state.user.diamonds = dbUser.diamonds ?? state.user.diamonds;
      state.user.is_vip = dbUser.membership_tier === 'VIP';

      // 1. Sync War Horns (with offline regeneration)
      const maxHorns = state.user.max_horns || 3;
      let horns = (dbUser.raid_horns !== undefined && dbUser.raid_horns !== null) ? dbUser.raid_horns : 3;
      let lastRegen = dbUser.last_horn_regen ? new Date(dbUser.last_horn_regen).getTime() : Date.now();
      if (horns < maxHorns) {
        const elapsed = Date.now() - lastRegen;
        const regenInterval = 15 * 60 * 1000;
        const added = Math.floor(elapsed / regenInterval);
        if (added > 0) {
          horns = Math.min(maxHorns, horns + added);
          lastRegen = Date.now() - (elapsed % regenInterval);
          if (supabaseClient && state.user.id) {
            supabaseClient.from('users').update({
              raid_horns: horns,
              last_horn_regen: new Date(lastRegen).toISOString()
            }).eq('telegram_id', state.user.id).then(() => {});
          }
        }
      }
      state.user.raid_horns = horns;
      state.user.last_horn_regen = lastRegen;

      // 2. Sync Daily Streak Claim timestamp
      if (dbUser.daily_claimed_at) {
        state.user.last_streak_claim = new Date(dbUser.daily_claimed_at).getTime();
      }

      // 3. Sync Citadel Base
      const baseData = Array.isArray(dbUser.user_bases) ? dbUser.user_bases[0] : dbUser.user_bases;
      if (baseData) {
        state.base.hq_level = baseData.hq_level ?? state.base.hq_level;
        state.base.wall_level = baseData.wall_level ?? state.base.wall_level;
        state.base.wall_hp = baseData.wall_hp ?? state.base.wall_hp;
        state.base.max_wall_hp = baseData.max_wall_hp ?? state.base.max_wall_hp;
        state.base.turret_level = baseData.defense_turret_level ?? state.base.turret_level;
        state.base.defense_power = baseData.defense_power ?? state.base.defense_power;
        state.base.collector_level = baseData.collector_level ?? state.base.collector_level;
        if (baseData.last_collected_at) {
          state.base.last_collected = new Date(baseData.last_collected_at).getTime();
        }
        if (baseData.shield_until) {
          const shieldTime = new Date(baseData.shield_until).getTime();
          const isShieldActive = shieldTime > Date.now();
          state.base.shield_active = isShieldActive;
          state.base.shield_until = isShieldActive ? shieldTime : null;
        } else {
          state.base.shield_active = false;
          state.base.shield_until = null;
        }
      }

      // 4. Sync Army
      const armyData = Array.isArray(dbUser.user_armies) ? dbUser.user_armies[0] : dbUser.user_armies;
      if (armyData) {
        state.army.infantry = armyData.infantry_count ?? state.army.infantry;
        state.army.archers = armyData.archer_count ?? state.army.archers;
        state.army.siege = armyData.siege_count ?? state.army.siege;
        state.army.barracks_level = armyData.barracks_level ?? state.army.barracks_level;
      }
    } else {
      // Create user record in Supabase
      await supabaseClient.from('users').upsert({
        telegram_id: state.user.id,
        username: state.user.username,
        full_name: state.user.name,
        gold_coins: state.user.gold,
        diamonds: state.user.diamonds,
        membership_tier: state.user.is_vip ? 'VIP' : 'FREE'
      });
      await supabaseClient.from('user_bases').upsert({
        user_id: state.user.id,
        hq_level: state.base.hq_level,
        wall_level: state.base.wall_level,
        wall_hp: state.base.wall_hp,
        max_wall_hp: state.base.max_wall_hp,
        defense_turret_level: state.base.turret_level,
        defense_power: state.base.defense_power,
        collector_level: state.base.collector_level
      });
      await supabaseClient.from('user_armies').upsert({
        user_id: state.user.id,
        infantry_count: state.army.infantry,
        archer_count: state.army.archers,
        siege_count: state.army.siege,
        barracks_level: state.army.barracks_level
      });
    }

    // 2. Sync Real Targets (All other real players)
    const { data: realTargets } = await supabaseClient
      .from('users')
      .select('telegram_id, full_name, username, gold_coins, user_bases(hq_level, defense_power, wall_hp, defense_turret_level, shield_until)')
      .neq('telegram_id', state.user.id)
      .order('gold_coins', { ascending: false })
      .limit(20);

    if (realTargets && realTargets.length > 0) {
      state.targets = realTargets.map(t => {
        const totalCoins = t.gold_coins ?? 1000;
        const maxPlunder = Math.floor(totalCoins * 0.70);
        const isShielded = t.user_bases?.shield_until && new Date(t.user_bases.shield_until) > new Date();
        let shieldRem = '';
        if (isShielded) {
          const diffMs = new Date(t.user_bases.shield_until) - new Date();
          const hrs = Math.floor(diffMs / (3600 * 1000));
          const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
          shieldRem = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
        }
        return {
          id: t.telegram_id,
          name: t.full_name || t.username || `Emperor #${t.telegram_id.toString().slice(-4)}`,
          level: t.user_bases?.hq_level || 1,
          def: t.user_bases?.defense_power || 100,
          wallHp: t.user_bases?.wall_hp || 500,
          totalGold: totalCoins,
          lootGold: maxPlunder,
          isShielded: isShielded,
          shieldRem: shieldRem
        };
      });
    }

    // 3. Sync Real Active Marketplace Items
    const { data: realMarket } = await supabaseClient
      .from('market_items')
      .select('id, seller_id, item_name, item_type, quantity, currency, price, users!seller_id(full_name, username)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (realMarket && realMarket.length > 0) {
      state.market = realMarket.map(item => ({
        id: item.id,
        name: item.item_name,
        type: item.item_type,
        price: item.price,
        currency: item.currency,
        sellerId: item.seller_id,
        seller: item.users?.full_name || item.users?.username || 'Empire Trader'
      }));
    } else {
      state.market = [];
    }

    // 4. Update UI & Leaderboard with Real Data
    saveState(false);
    fetchAndRenderLeaderboard(currentLeaderboardType);
  } catch (err) {
    console.error('Supabase sync error:', err);
  }
}

// 23. LIVE MINE, SHIELD & RAID HORNS TICKER (1-sec intervals)
setInterval(() => {
  const diffSec = Math.floor((Date.now() - (state.base.last_collected || Date.now())) / 1000);
  const ratePerSec = (state.base.collector_level * 5) / 60;
  let accumulated = Math.floor(diffSec * ratePerSec);
  if (state.user.is_vip) accumulated = Math.floor(accumulated * 1.5);
  accumulated = Math.min(accumulated, state.base.collector_level * 1500);

  const accumEl = document.getElementById('mine-accumulated-num');
  if (accumEl) accumEl.innerText = accumulated.toLocaleString();

  // Live Horn Energy Countdown
  updateRaidHorns();

  // Live Shield Countdown & Auto-Expiry Check
  if (state.base.shield_until) {
    const isStillActive = state.base.shield_until > Date.now();
    if (state.base.shield_active !== isStillActive) {
      state.base.shield_active = isStillActive;
      if (!isStillActive) {
        state.base.shield_until = null;
        if (supabaseClient && state.user.id) {
          supabaseClient.from('user_bases').update({ shield_until: null }).eq('user_id', state.user.id).then(() => {});
        }
      }
      renderCitadel();
    } else if (state.base.shield_active) {
      const diffMs = state.base.shield_until - Date.now();
      const hrs = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const remStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
      const shieldPill = document.getElementById('shield-status-pill');
      if (shieldPill) {
        shieldPill.innerHTML = `<img src="assets/shield.png" class="clay-badge-mini" alt="Shield" /> SHIELDED (${remStr})`;
      }
      const btnShield = document.getElementById('btn-activate-shield');
      if (btnShield && btnShield.disabled) {
        btnShield.innerHTML = `<img src="assets/shield.png" class="clay-diamond-micro" alt="Shield" /> Active Peace Treaty (${remStr})`;
      }
    }
  }
}, 1000);

// Auto-Refresh from Supabase every 25 seconds when app is active
setInterval(() => {
  if (document.visibilityState === 'visible' && supabaseClient) {
    syncRealDatabaseData();
  }
}, 25000);

// Sync immediately when user switches back to the Mini App tab
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && supabaseClient) {
    syncRealDatabaseData();
  }
});

// 24. MODULAR COMPONENT LOADER
async function loadComponents() {
  const mainContent = document.getElementById('main-content');
  const modalsRoot = document.getElementById('modals-root');
  if (!mainContent) return;

  const componentFiles = [
    'components/citadel.html',
    'components/barracks.html',
    'components/war.html',
    'components/market.html',
    'components/leaderboard.html'
  ];

  try {
    const [tabHtmls, modalsHtml] = await Promise.all([
      Promise.all(componentFiles.map(file => fetch(file).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${file}`);
        return r.text();
      }))),
      fetch('components/modals.html').then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status} fetching modals.html`);
        return r.text();
      })
    ]);

    mainContent.innerHTML = tabHtmls.join('\n');
    if (modalsRoot) {
      modalsRoot.innerHTML = modalsHtml;
    }
  } catch (err) {
    console.error('Failed to load components:', err);
    if (window.location.protocol === 'file:') {
      mainContent.innerHTML = `
        <div style="padding: 24px 16px; text-align: center; color: #ef4444; background: #fff; border-radius: 16px; margin: 20px 0;">
          <h3>⚠️ Local File Protocol Notice</h3>
          <p style="font-size: 13px; color: #475569; margin-top: 8px;">Modern browsers restrict fetching external HTML files over <code>file:///</code>. On Cloudflare Pages or Telegram Mini App, components load instantly via HTTPS.</p>
        </div>
      `;
    }
  }
}

// 25. MASTER BOOTSTRAP
window.addEventListener('DOMContentLoaded', async () => {
  await loadComponents();
  setupNavigation();
  setupBaseActions();
  setupStreakModal();
  setupWheelModal();
  setupMarketActions();
  renderUI();
  initSupabase();
});
