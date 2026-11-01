# 🎨 EventCraft UI/Frontend Testing Setup

This guide helps you run EventCraft to verify the frontend design and UI without needing real API keys.

## ✅ Current Configuration

Your environment is configured with:
- **LLM Provider**: `fake` (simulates AI responses, no API key needed)
- **Database**: PostgreSQL in Docker
- **Auth Secret**: Generated and configured
- **Fake LLM Delay**: 500ms (simulates realistic API response times)

## 🚀 Quick Start

### Option 1: Automated Script (Recommended)

Run the startup script:

```powershell
.\start-server.ps1
```

This will:
1. Check Docker status
2. Start PostgreSQL database
3. Wait for database to be healthy
4. Run database migrations
5. Start the development server

### Option 2: Manual Steps

**1. Start Docker Desktop**
- Open Docker Desktop from Start Menu
- Wait until it's fully running

**2. Start Database**
```powershell
docker compose up db -d
```

**3. Run Migrations**
```powershell
pnpm db:migrate
```

**4. Start Development Server**
```powershell
pnpm dev
```

## 🌐 Access the Application

Once the server starts, open your browser to:

**http://localhost:3000**

## 🎭 Features You Can Test

With the fake LLM provider, you can test all UI features:

### ✅ Authentication Flow
- Sign up with email/password
- Sign in functionality
- Account management

### ✅ Event Management
- **Create Events**: Wedding, Birthday, Community events
- **Event Types**: Test different event type templates
- **Event Settings**: Edit event details, date, location

### ✅ Budget Management
- View budget allocation across categories
- Lock/unlock budget categories
- Add expenses to categories
- Track spent vs allocated amounts
- Visual budget progress bars

### ✅ Timeline/Tasks
- View scheduled tasks
- Mark tasks as complete
- See task priorities (high/medium/low)
- Task dependencies and scheduling

### ✅ Vendor Checklist
- View vendor needs by category
- Update vendor status (not_started → contacted → quoted → booked/declined)
- Add vendor names and notes
- Questions to ask vendors

### ✅ Ideas & Suggestions
- View AI-generated ideas (simulated)
- Like/dislike ideas
- Save favorite ideas
- Filter by saved/liked
- Regenerate ideas

### ✅ AI Assistant
- Context-aware chat interface
- Streaming response simulation (500ms delay)
- Chat history display
- Message sending UI

### ✅ Export Features
- Export timeline to .ics (calendar)
- Export event plan to Markdown

### ✅ UI Components to Verify
- Navigation and layout
- Forms and inputs
- Tables and data displays
- Dialogs and modals
- Toast notifications
- Loading states and skeletons
- Progress indicators
- Responsive design
- Accessibility features

## 🎨 What the Fake LLM Provides

The fake provider generates:
- **Budget allocations**: Realistic category percentages
- **Timeline tasks**: Scheduled tasks with descriptions
- **Vendor needs**: Vendor types with questions
- **Ideas**: Creative suggestions for events
- **Assistant responses**: Contextual chat replies

All responses are **instant** and **deterministic** - perfect for UI testing!

## 🐛 Troubleshooting

### Docker Desktop Not Running
```
Error: failed to connect to the docker API
```
**Solution**: Start Docker Desktop and wait for it to initialize

### Port Already in Use
```
Error: Port 3000 is already in use
```
**Solution**: 
```powershell
# Find and kill process using port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Ensure database is running
```powershell
docker compose up db -d
```

### Migration Errors
```
Error: relation "..." already exists
```
**Solution**: This is usually safe to ignore if migrating an existing database

## 🔄 Resetting the Database

If you need a fresh start:

```powershell
# Stop all services
docker compose down

# Remove database volume
docker volume rm eventcraft_postgres_data

# Start fresh
.\start-server.ps1
```

## 📝 After UI Testing

Once you're satisfied with the frontend design, you can add real API keys:

1. Open `.env` file
2. Change `LLM_PROVIDER=fake` to `LLM_PROVIDER=anthropic`
3. Add your real `ANTHROPIC_API_KEY=sk-ant-...`
4. Restart the server

## 🎯 Focus Areas for UI Verification

### Visual Design
- [ ] Color scheme and branding
- [ ] Typography and readability
- [ ] Spacing and layout consistency
- [ ] Component styling (buttons, inputs, cards)
- [ ] Icons and visual indicators

### User Experience
- [ ] Navigation flow
- [ ] Form validation and error messages
- [ ] Loading states and feedback
- [ ] Empty states
- [ ] Success/error notifications
- [ ] Mobile responsiveness

### Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Focus indicators
- [ ] Color contrast
- [ ] ARIA labels

### Interactions
- [ ] Button hover/active states
- [ ] Form input interactions
- [ ] Modal/dialog behavior
- [ ] Tab switching
- [ ] Dropdown selections

## 📊 Test Data

The fake LLM generates consistent test data. Try creating:
- Wedding event with 150 guests, $50,000 budget
- Birthday event for a 5-year-old
- Community fundraiser event

Each will show different templates and suggestions!

## 🛑 Stopping the Server

Press `Ctrl+C` in the terminal running the dev server.

To stop the database:
```powershell
docker compose down
```

---

**Happy UI Testing! 🎨✨**
