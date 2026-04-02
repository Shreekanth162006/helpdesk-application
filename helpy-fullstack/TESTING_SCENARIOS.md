# Testing Scenarios – How to Check Everything Works

Use these step-by-step scenarios to verify the helpdesk project end-to-end.

---

## Before You Start

### 1. Start backend and frontend

**Terminal 1 – Backend**
```powershell
cd backend
npm run dev
```
Expect: `API running at http://localhost:4000`

**Terminal 2 – Frontend**
```powershell
cd frontend
npm run dev
```
Expect: `Local: http://localhost:5173`

### 2. Seed the database (if not done yet)

**Terminal 3**
```powershell
cd backend
npm run db:seed
```
Expect: `Created default Super Admin: admin@helpy.local / admin123` (or "already exists"), plus forums and categories.

### 3. Open the app

- Browser: **http://localhost:5173**
- You should see the **login type** page: "Welcome to Helpy" with **Official Login** and **Customer Login**.

---

## Scenario 1: Super Admin – First login and dashboard

**Goal:** Check default Super Admin login and dashboard.

1. Go to **http://localhost:5173**
2. Click **Official Login**
3. Log in:
   - **Email:** `admin@helpy.local`
   - **Password:** `admin123`
   - **Role:** Super Admin
4. Click **Log in**

**Expected:**
- Success toast, redirect to Dashboard
- Dashboard shows: Tickets, Open, Forums, Categories
- **Reports & Analytics** section visible (SLA Breached, Resolved, Avg resolution, By status, By priority)
- Top nav: Dashboard, Tickets, **Users**, Knowledge

---

## Scenario 2: Customer – Register and create a ticket

**Goal:** Check customer registration and ticket creation.

1. Log out (if logged in): click **Logout**
2. On login-type page, click **Customer Login**
3. Click **You don't have an account? Create account**
4. Register:
   - **Name:** Test Customer
   - **Email:** customer1@test.com
   - **Password:** pass1234
5. Click **Create account**

**Expected:**
- Success, redirect to Dashboard
- Nav: Dashboard, Tickets, Knowledge (no Users – customer role)

6. Click **Tickets** → **Create Ticket**
7. Create ticket:
   - **Subject:** Cannot reset password
   - **Description:** I forgot my password and the reset link does not work.
   - **Priority:** HIGH (optional)
8. Submit

**Expected:**
- Ticket created, you see it in the ticket list
- Ticket has Status (e.g. Open), Priority, SLA column (due date or Breached), Assigned (Unassigned)

---

## Scenario 3: Super Admin – Create an Agent and see notification

**Goal:** Check user creation and in-app notification for Super Admin.

1. Log out and log in as **Official** → `admin@helpy.local` / `admin123` / Super Admin
2. Go to **Users**
3. In **Create User**:
   - **Email:** agent1@test.com
   - **Role:** Agent
4. Click **Create User**

**Expected:**
- Toast: "User created"
- User appears in the table with role **Agent**
- In **Notifications** (above Create User), a new notification: "Official account created" – "New official user created: agent1@test.com …"
- (If you have a way to send credentials to the new user, use that; otherwise note that the new agent’s password was auto-generated and would need to be set or reset by an admin for real use.)

---

## Scenario 4: Agent – Login, assign ticket, reply and add note

**Goal:** Check official (Agent) login, ticket list, assign, reply to customer, internal note.

**Prerequisite:** You need an Agent user. If you didn’t create one in Scenario 3, create it as Super Admin (Users → Create User: agent1@test.com, Role: Agent). Then set a known password: Users → find agent1@test.com → **Reset Pass** (default becomes `123456`).

1. Log out
2. **Official Login** → **Email:** `agent1@test.com` → **Password:** `123456` → **Role:** Agent → Log in
3. Go to **Tickets**

**Expected:**
- You see the ticket created by the customer (e.g. "Cannot reset password")
- You can click the subject to open **Ticket detail**

4. On ticket detail, click **Assign Me** (or use Assign Me from the list if your UI has it there)

**Expected:**
- Ticket shows as assigned to you (or you see it in the list as assigned to agent1@test.com)

5. In the reply box type: `We have received your request. Our team will look into the password reset issue.`
6. Click **Send reply to customer**

**Expected:**
- New message appears with kind "reply"
- Toast: "Reply sent"

7. In the same box type: `Internal: Check if user has verified email.`
8. Click **Add internal note**

**Expected:**
- New message appears with kind "note"
- Toast: "Internal note added"

9. Use **Next Status** (or equivalent) to move ticket to **In Progress** (if your UI exposes it)

**Expected:**
- Status badge updates (e.g. In Progress)

---

## Scenario 5: Light Agent – Only internal note (no customer reply)

**Goal:** Check that Light Agent cannot send customer replies, only internal notes.

1. As Super Admin, go to **Users** → Create User: **Email:** light1@test.com, **Role:** Light Agent → Create User → **Reset Pass** for that user (password `123456`)
2. Log out
3. **Official Login** → **Email:** light1@test.com → **Password:** `123456` → **Role:** Light Agent → Log in
4. Go to **Tickets** → open the same ticket (or any ticket)

**Expected:**
- You see **Add internal note** button
- You do **not** see **Send reply to customer** button
- If you try to send a reply via API (e.g. Postman) with `kind: 'reply'`, you get 403 "Light Agent can only add internal notes."

5. Type: `Technical note: Password reset uses JWT.` → Click **Add internal note**

**Expected:**
- Note is added; toast "Internal note added"

---

## Scenario 6: Manager / Admin – Reports and User management

**Goal:** Check Manager/Admin dashboard analytics and user list.

1. Log in as Super Admin (`admin@helpy.local` / `admin123`) or create a Manager user and log in as Manager
2. Go to **Dashboard**

**Expected:**
- **Reports & Analytics** section with:
  - SLA Breached count
  - Resolved count
  - Avg resolution (hrs)
  - Total tickets
  - **By status** (e.g. Open, In Progress)
  - **By priority** (e.g. HIGH, LOW)

3. Go to **Users**

**Expected:**
- List of all users (Super Admin, Agent, Light Agent, Customer, etc.)
- You can Activate/Deactivate, Reset Pass
- (Only Super Admin sees Notifications; Admin/Manager see user list and actions.)

---

## Scenario 7: SLA – Due date and breach display

**Goal:** Check that SLA due dates are set and breach is shown.

1. Log in as Customer (or any user who can create tickets)
2. **Tickets** → **Create Ticket**
3. Create ticket with **Priority:** **CRITICAL** (or HIGH), subject/description any
4. Save

**Expected:**
- In ticket list, this ticket has **SLA** column: a due date (e.g. resolution in 4 hours for CRITICAL)
- Open the ticket: you see "Resolution due: &lt;date/time&gt;"

5. (Optional) To see **SLA Breached** without waiting: in backend you can temporarily set `resolutionDueAt` in the past for that ticket and refresh – the ticket should show **Breached** in the list and "SLA Breached" on detail. (Revert or fix the date after testing.)

---

## Scenario 8: Knowledge Base

**Goal:** Check categories and docs.

1. Log in as any user (Customer or Official)
2. Go to **Knowledge**

**Expected:**
- List of categories (e.g. Getting Started, FAQ from seed)
- If categories have docs, they are listed under each category
- No errors; page loads

---

## Scenario 9: Forgot password

**Goal:** Check reset-password flow.

1. Log out
2. On Customer or Login page, click **Forgot Password?**
3. Enter an existing user email (e.g. customer1@test.com) and a **new password** (e.g. newpass1234), optionally select role
4. Submit

**Expected:**
- Message like "Password reset successfully" or similar
5. Log in with the same email and the **new** password

**Expected:**
- Login succeeds

---

## Scenario 10: Customer vs Official login type

**Goal:** Check that Customer and Official flows are separate and correct.

1. Open **http://localhost:5173**
2. Click **Customer Login**

**Expected:**
- Login form: "Customer Login", no **Role** dropdown
- Password has show/hide (eye) icon

3. Go back (or open login-type again), click **Official Login**

**Expected:**
- Login form: "Official Login", **Role** dropdown (Super Admin, Admin, Manager, Agent)
- Password has show/hide icon
- Role is required for officials

---

## Quick checklist (all scenarios)

| # | Scenario                          | What to check                          |
|---|-----------------------------------|----------------------------------------|
| 1 | Super Admin login & dashboard     | Login, Dashboard, Reports & Analytics, Users in nav |
| 2 | Customer register & create ticket | Register, Create Ticket, ticket in list with SLA |
| 3 | Create Agent + SA notification    | User created, notification for Super Admin |
| 4 | Agent: assign, reply, note        | Assign Me, Send reply, Add internal note, status change |
| 5 | Light Agent: note only            | No "Send reply", only "Add internal note" |
| 6 | Manager/Admin reports & users     | Analytics on dashboard, User list and actions |
| 7 | SLA due and breach                | Due date on ticket, Breached when past due |
| 8 | Knowledge Base                    | Categories and docs load               |
| 9 | Forgot password                   | Reset success, login with new password |
| 10| Customer vs Official login         | No role for Customer, Role for Official, eye icon |

If all these pass, the main PRD functionality is working end-to-end.
