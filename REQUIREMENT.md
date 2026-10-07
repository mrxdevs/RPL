# RPL - Raptee Premier League: Project Requirements

## Infrastructure

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Hosting**: Vercel
- **Data Layer**: No external database. All persistent data is stored in local JSON files served through Next.js API route handlers. JSON files act as the single source of truth for teams, players, matches, budgets, and scores.

---

## User Roles

The system has three privileged roles in addition to the general public. Each role has a distinct set of actions and a restricted dashboard accessible only after authentication.

| Role | Description |
|---|---|
| Admin | Full control over tournament setup, teams, players, auctions, and scheduling |
| Captain | Team-level control over batting order and player role assignment |
| Umpire | Match-level control over ball-by-ball scoring, decisions, and result declaration |
| Public | Read-only access to scoreboard, schedule, player profiles, and auction status |

---

## Role Permissions

### Admin

The Admin is responsible for setting up and managing the entire tournament.

- Create and name teams
- Set a fixed budget for each team at tournament start
- Register players and assign a base auction price to each
- Assign a Captain to a team
- Run the player auction: sell players to teams and automatically deduct the sold price from the buying team's remaining budget
- Assign an Umpire to a match
- Schedule matches: set date, time, venue, and participating teams
- Publish a match to make it live and publicly visible
- Release a player from a team before the tournament starts, restoring the cost to the team budget

### Captain

The Captain manages their team's in-match setup.

- Arrange the batting order for each innings
- Assign a primary role to each player: Batter, Bowler, or All-rounder
- View the team's full squad and budget summary

### Umpire

The Umpire controls all live match activity.

- Record each ball outcome: 0, 1, 2, 3, 4, 6, Wide, No-ball, Bye, Leg-bye, Wicket
- Record the wicket type for each dismissal: Bowled, Caught, LBW, Run Out, Stumped, Hit Wicket
- Record the fielder or bowler responsible for each dismissal
- Update the active batsman and bowler at the crease
- Mark a ball as a legal or illegal delivery (wide and no-ball do not increment the ball count)
- Declare the innings closed and transition to the next innings
- Declare the match result and winner

---

## Pages and UI

### Public Pages (accessible without login)

| Page | Purpose |
|---|---|
| Landing Page | Tournament overview, featured match highlight, quick navigation to all sections |
| Scoreboard | Live and completed match scores, wickets, overs, run rate, required run rate |
| Match Schedule | Upcoming matches with date, time, venue, and team names. Past results listed below |
| Match Detail | Full ball-by-ball commentary, batting card, bowling card, fall of wickets, partnerships |
| Auction Status | Real-time view of which players have been sold, their sold price, and the buying team |
| Team Detail | Team roster, total budget, amount spent, amount remaining, and squad composition |
| Player Profile | Individual player stats: matches played, runs scored, wickets taken, strike rate, economy |

### Authenticated Pages (role-restricted)

| Page | Accessible By | Purpose |
|---|---|---|
| Login | All roles | Single login page with role detection. Redirects each role to their respective dashboard after authentication |
| Admin Dashboard | Admin | Central hub for team creation, player registration, auction management, match scheduling, and umpire assignment |
| Captain Dashboard | Captain | Batting order management and player role assignment for their team |
| Umpire Dashboard | Umpire | Ball-by-ball scoring interface for the assigned live match |

### Activity Feed

A time-stamped activity feed visible on the public landing page and within each match detail page. Records and displays:

- Every ball outcome with over and ball number
- Wicket events with dismissal type and player names
- Auction events: player sold, team, and sold price
- Match status changes: scheduled, live, innings break, completed
- Score milestones: half-centuries, centuries, five-wicket hauls

---

## Data Model (JSON Files)

All data lives in `src/data/` as JSON files. API route handlers in `src/app/api/` read and write these files.

| File | Contents |
|---|---|
| `teams.json` | Team names, budgets, squad lists, captain assignment |
| `players.json` | Player registry with base price, role, and auction status |
| `matches.json` | Match schedule, status, assigned umpire, innings data |
| `auction.json` | Bid history, sold prices, unsold players |
| `users.json` | Hashed credentials and role assignments for privileged users |
| `activity.json` | Time-stamped activity log for all system events |

---

## Constraints and Edge Cases

- A match cannot be scheduled if either team has fewer than 11 players.
- A team cannot bid in an auction beyond their remaining budget.
- A wide or no-ball delivery must not advance the legal ball count for the over.
- The target score in the second innings must be displayed at all times on the Umpire dashboard and the public scoreboard.
- A player released after the tournament has started cannot be re-auctioned.
- Only one match may be live at any given time per umpire assignment.