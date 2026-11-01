# 🎨 EventCraft UI Testing - Quick Start Guide

## ✅ Setup Complete!

Your EventCraft codebase is configured and ready for **UI/Frontend testing** without needing real API keys!

## 📋 What's Been Configured

✅ Environment variables set to use **FAKE LLM provider**  
✅ Secure authentication secret generated  
✅ Database credentials configured  
✅ Startup scripts created  

## 🚀 How to Start

### Step 1: Start Docker Desktop

Docker Desktop must be running first.

**Check if Docker is running:**
```powershell
.\check-docker.ps1
```

**If Docker is NOT running:**
1. Press Windows key
2. Type "Docker Desktop"
3. Click to open
4. Wait for the Docker icon in system tray to turn green
5. Run `.\check-docker.ps1` again to verify

### Step 2: Start the Server

Once Docker is running:

```powershell
.\start-server.ps1
```

This automated script will:
- Start PostgreSQL database
- Wait for database to be healthy
- Run migrations
- Start the development server

### Step 3: Open in Browser

Visit: **http://localhost:3000**

## 🎯 What You Can Test

### Full UI/UX without API Keys!

The fake LLM provider simulates all AI features, so you can test:

- ✅ **Sign up / Sign in** - Authentication flows
- ✅ **Create events** - Wedding, Birthday, Community templates
- ✅ **Budget management** - Categories, expenses, tracking
- ✅ **Timeline/Tasks** - Scheduling, priorities, completion
- ✅ **Vendor management** - Status pipeline, notes, questions
- ✅ **Ideas & suggestions** - Like/dislike, save, regenerate
- ✅ **AI Assistant** - Context-aware chat with streaming
- ✅ **Export features** - Calendar (.ics) and Markdown
- ✅ **All UI components** - Forms, tables, dialogs, notifications

### Design Verification Checklist

- [ ] Visual design and color scheme
- [ ] Typography and readability
- [ ] Component styling (buttons, inputs, cards)
- [ ] Layout and spacing
- [ ] Navigation flow
- [ ] Form validation and errors
- [ ] Loading states and animations
- [ ] Mobile responsiveness
- [ ] Accessibility (keyboard, screen readers)
- [ ] Dark mode (if applicable)

## 📁 Files Created

```
EventCraft/
├── .env                    # Configured with fake LLM
├── check-docker.ps1        # Check Docker status
├── start-server.ps1        # Automated startup script
├── START_HERE.md           # This file
└── SETUP_UI_TESTING.md     # Detailed testing guide
```

## 🛠 Useful Commands

```powershell
# Check Docker status
.\check-docker.ps1

# Start everything
.\start-server.ps1

# Manual database start (if needed)
docker compose up db -d

# Run migrations manually
pnpm db:migrate

# Start dev server manually
pnpm dev

# Stop database
docker compose down

# View database logs
docker compose logs db

# Reset everything
docker compose down
docker volume rm eventcraft_postgres_data
.\start-server.ps1
```

## 🐛 Common Issues

### "Docker not responding"
**Solution**: Start Docker Desktop and wait 30-60 seconds

### "Port 3000 already in use"
**Solution**: Kill the process using port 3000
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### "Database connection refused"
**Solution**: Ensure database is running
```powershell
docker ps  # Check if eventcraft-db-1 is running
docker compose up db -d  # Start if not running
```

## 📚 More Information

See **SETUP_UI_TESTING.md** for:
- Detailed feature testing guide
- Troubleshooting tips
- Test data suggestions
- How to add real API keys later

## 🔄 Next Steps After UI Testing

Once you're happy with the frontend:

1. Open `.env` file
2. Change `LLM_PROVIDER=fake` to `LLM_PROVIDER=anthropic`
3. Add your real Anthropic API key
4. Restart the server

---

## 🚀 Ready to Start?

1. **Start Docker Desktop** (if not running)
2. Run: `.\check-docker.ps1` to verify
3. Run: `.\start-server.ps1` to launch
4. Open: **http://localhost:3000**

**Happy UI Testing! 🎨✨**
