# 🏰 PikoBot — Telegram RPG Base-Building & Group Engagement Bot

<p align="center">
  <img src="https://raw.githubusercontent.com/Bhavishy-dev/PikoBot/main/webapp/assets/citadel.png" alt="PikoBot Citadel" width="220" style="border-radius: 20px; box-shadow: 0 8px 30px rgba(0,0,0,0.3);"/>
</p>

<p align="center">
  <b>A state-of-the-art Telegram RPG strategy bot & Telegram Mini App (TMA) featuring Base Building, Army Recruitment, PvP Raids, Dual-Currency Economy, P2P Marketplace, and Interactive Group Drops.</b>
</p>

<p align="center">
  <a href="https://github.com/Bhavishy-dev/PikoBot/stargazers"><img src="https://img.shields.io/github/stars/Bhavishy-dev/PikoBot?style=for-the-badge&color=gold" alt="Stars"></a>
  <a href="https://github.com/Bhavishy-dev/PikoBot/network/members"><img src="https://img.shields.io/github/forks/Bhavishy-dev/PikoBot?style=for-the-badge&color=blue" alt="Forks"></a>
  <a href="https://github.com/Bhavishy-dev/PikoBot/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License"></a>
  <a href="https://www.python.org/downloads/"><img src="https://img.shields.io/badge/Python-3.10%2B-blue.svg?style=for-the-badge&logo=python" alt="Python 3.10+"></a>
  <a href="https://docs.aiogram.dev/"><img src="https://img.shields.io/badge/Framework-Aiogram%203.x-2ca5e0.svg?style=for-the-badge&logo=telegram" alt="Aiogram 3.x"></a>
  <a href="https://pages.cloudflare.com/"><img src="https://img.shields.io/badge/Hosted%20On-Cloudflare%20Pages-F38020.svg?style=for-the-badge&logo=cloudflare" alt="Cloudflare Pages"></a>
</p>

---

## 🌟 Live Demo & Experience

| Service | Access Link | Description |
| :--- | :--- | :--- |
| 🤖 **Telegram Bot** | [@Piko_Officialbot](https://t.me/Piko_Officialbot) | Interactive bot in direct messages or group chats |
| 📱 **Telegram Mini App** | [pikobot-app.pages.dev](https://pikobot-app.pages.dev) | High-performance Web3/TMA interface with tactile haptics |

---

## ⚡ Core Features

### 🏰 1. Base Building & Citadel Defense
- **Headquarters (`HQ`)**: Expanding your HQ unlocks superior defense tech and higher mine productivity.
- **Fortress Walls (`Wall HP`)**: Fortified barrier protecting your gold vaults against enemy raids.
- **Defense Turrets**: Inflicts counter-damage onto attacking armies.
- **Mine Generator**: Accumulates passive Gold Coins every second; collect anytime with one tap.
- **🛡️ Divine Peace Shield**: 12-hour invulnerability bubble safeguarding your empire from all raids.

### ⚔️ 2. Warfare & Strategic Combat Engine
- **Troop Recruitment**:
  - 🗡️ **Infantry**: Resilient frontline soldiers.
  - 🏹 **Archers**: High-damage ranged snipers.
  - ☄️ **Siege Catapults**: Heavy siege engines engineered to breach fortified fortress walls.
- **PvP Raids (`/attack`)**: Target rivals directly by username, attack via group message replies, or scan the live radar.
- **Dynamic Combat RNG**: Calculates real-time casualty rates, defensive turret counter-strikes, wall breaches, and plundered loot without gold inflation.

### 🪙 3. Dual-Currency Economy
- **🪙 Piko Gold Coins**: Used for standard upgrades, troop training, wall repairs, and marketplace purchases.
- **💎 Piko Diamonds**: Rare currency for divine peace shields, VIP marketplace listings, and luxury items.
- **Daily Rewards (`/daily`)**: Earn streaks of free Gold and Diamonds every 24 hours.

### 🏪 4. Decentralized P2P Marketplace
- Buy and sell weapons, shields, resources, and VIP passes directly with other players.
- Currency choice: Trade in Gold or unlock Diamond trading via **👑 Piko VIP Membership**.
- Instant in-app transaction processing with automated escrow balance checks.

### 👥 5. Group Engagement Mechanics
- **Automatic Greetings**: Dynamic welcomes to new members joining your group.
- **🎁 Random Lucky Treasure Drops**: Spawns surprise treasure chests in active group chats for the fastest member to claim!
- **Group PvP**: Challenge group members directly inside any Telegram group.

### 📱 6. Telegram Mini App (Web App)
- Modern, dark-mode cyberpunk aesthetic tailored for mobile devices.
- Interactive animated Base Citadel, recruitment sliders, and radar scanner.
- Native Telegram tactile haptics, seamless profile synchronization, and zero-latency sound effects.

---

## 🏗️ Project Architecture

```
PikoBot/
├── .env.example              # Template for environment configuration
├── .gitignore                # Excludes secrets, databases & build caches
├── LICENSE                   # MIT Open Source License
├── Procfile                  # Worker entry point for cloud deployment
├── render.yaml               # 1-Click Render infrastructure blueprint
├── requirements.txt          # Python dependencies
├── main.py                   # Main bot polling runner & router registration
├── core/
│   ├── config.py             # Pydantic v2 settings & database URL normalizer
│   ├── database.py           # SQLAlchemy 2.0 async sessionmaker & engine
│   └── logger.py             # Structured colorized logging system
├── database/
│   ├── models/               # Declarative async models (User, Base, Army, Market)
│   └── crud/                 # Optimized async CRUD database operations
├── middlewares/
│   ├── rate_limit.py         # Anti-spam throttling middleware
│   └── auth_check.py         # Auto-registration & database session injector
├── services/
│   └── battle_engine.py      # PvP mathematical combat formulas & loot logic
├── handlers/                 # Modular Aiogram 3 command routers
│   ├── start.py              # /start and /help commands
│   ├── profile.py            # /profile and /balance commands
│   ├── base.py               # Base overview, upgrades & shield activation
│   ├── army.py               # Troop training & army statistics
│   ├── battle.py             # PvP raids, matchmaking & battle summaries
│   ├── market.py             # P2P marketplace, listings & VIP shop
│   ├── leaderboard.py        # /top rankings across 3 categories
│   └── group.py              # Group welcomes & random treasure drops
├── keyboards/
│   ├── inline.py             # Interactive inline keyboards & WebApp buttons
│   └── reply.py              # Main persistent navigation keyboard
└── webapp/                   # Telegram Mini App (TMA Frontend)
    ├── index.html            # Mini App layout with semantic components
    ├── style.css             # Glassmorphism design system & responsive styling
    ├── app.js                # Game state engine, haptics & database sync
    ├── assets/               # High-res graphics (HQ, troops, badges)
    └── components/           # Modular HTML modals & tabs
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- Python 3.10 or higher
- Git
- A Telegram Bot Token from [@BotFather](https://t.me/BotFather)

### 1. Clone the Repository
```bash
git clone https://github.com/Bhavishy-dev/PikoBot.git
cd PikoBot
```

### 2. Set Up Virtual Environment
```bash
# On Linux/macOS
python3 -m venv venv
source venv/bin/activate

# On Windows
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:
```env
# Telegram Bot Token from @BotFather
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ

# Bot Username & Mini App Short Name
BOT_USERNAME=Piko_Officialbot
MINI_APP_SHORT_NAME=app

# Database URL (Default: SQLite for local dev)
DATABASE_URL=sqlite+aiosqlite:///./pikobot.db

# Live WebApp URL
MINI_APP_URL=https://pikobot-app.pages.dev
```

### 5. Launch PikoBot
```bash
python main.py
```

The database tables will be automatically initialized on first startup!

---

## 📜 Commands Reference

| Command | Scope | Description |
| :--- | :--- | :--- |
| `/start` | Private / Group | Initializes profile and opens main interactive menu |
| `/help` | Private / Group | Displays complete game rules and gameplay guide |
| `/profile` | Private | View your empire stats, rank, and resource balances |
| `/base` | Private | Manage Citadel HQ, Wall HP, and Gold Mines |
| `/shield` | Private | Activate 12-hour divine protection against attacks |
| `/army` | Private | View infantry, archers, and catapult garrison |
| `/train` | Private | Recruit new military units to defend or attack |
| `/attack` | Group / Private | Launch a tactical raid against a rival empire |
| `/market` | Private | Browse the decentralized P2P trading post |
| `/sell` | Private | List an item or unit on the global marketplace |
| `/vip` | Private | Purchase VIP status for exclusive diamond perks |
| `/top` | Private / Group | View global leaderboards (Wealth, Wall HP, Army) |
| `/daily` | Private / Group | Collect your daily Gold & Diamond bonus |

---

## 📱 Telegram Mini App Setup

### Linking with BotFather
1. Open [@BotFather](https://t.me/BotFather) on Telegram.
2. Send `/mybots` and select your bot.
3. Select **Bot Settings** → **Menu Button** → **Configure menu button**.
4. Set the URL to your Mini App URL (e.g., `https://pikobot-app.pages.dev`).
5. (Optional) Use `/newapp` to register a short name (e.g., `app`) for inline sharing.

### Deploying Frontend to Cloudflare Pages
The `webapp/` folder contains the standalone client application. Deploy it globally with Cloudflare Wrangler:
```bash
npx wrangler pages deploy webapp --project-name pikobot-app --branch main
```

---

## ☁️ Cloud Deployment

### 1-Click Deployment on Render
This repository includes a [`render.yaml`](render.yaml) configuration for automated deployment:

1. Fork or push this repository to GitHub.
2. Sign in to [Render.com](https://render.com) and click **New** → **Blueprint**.
3. Connect your repository. Render will automatically provision:
   - A **Managed PostgreSQL Database**
   - A **Background Worker** running `python main.py`
4. Supply your `BOT_TOKEN` in the Render environment settings.
5. Click **Apply Blueprint**!

---

## 🛡️ Security & Best Practices

- **Strict Secret Management**: Environment variables are managed with Pydantic BaseSettings. `.env` and local database files are excluded from version control.
- **SQL Injection Defense**: 100% parameterization using SQLAlchemy 2.0 ORM expressions.
- **Anti-Spam Throttling**: Built-in sliding-window rate-limiting middleware to prevent flood attacks.
- **Database Resilience**: Supports both lightweight SQLite for testing and high-throughput async PostgreSQL/Supabase for production.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<p align="center">
  Crafted with ❤️ by <a href="https://github.com/Bhavishy-dev">Bhavishy-dev</a>
</p>
