# Tottenham vs Crystal Palace -- Goals Market Analysis

**Match Date:** 2026-03-05 | **Venue:** Tottenham Hotspur Stadium | **Referee:** Andy Madley (3.4 YC/game avg)
**Competition:** Premier League Matchweek 29

---

## Phase 1 -- Statistical Analysis

### 1A. Data Cleaning

**Tottenham:** 20 games available. 4 excluded from primary analysis -- 3 Champions League (Eintracht Frankfurt, Borussia Dortmund, Slavia Prague) and 1 FA Cup (Aston Villa) -- all lack xG data and feature non-PL opponents. **16 valid Premier League games** with complete xG and shot data remain. All opponents are same-league.

**Crystal Palace:** 20 games available. 5 excluded -- 4 Conference League (Zrinjski Mostar x2, KuPS Kuopio, Shelbourne) and 1 FA Cup (Macclesfield FC) -- all lack xG data and feature drastically weaker opposition. **15 valid Premier League games** with complete xG and shot data remain. All opponents are same-league.

### 1B. Tottenham (Home) -- Goal Stats

**Venue-filtered (8 Home PL games):**

| Metric | Mean | Median | Variance | Range |
|--------|------|--------|----------|-------|
| Scored | 1.25 | 1.0 | 0.19 | 1-2 |
| Conceded | 1.88 | 2.0 | 1.11 | 0-4 |
| Match Total | 3.12 | 3.0 | 0.86 | 2-5 |

**All-games baseline (16 PL games):**

| Metric | Mean | Median | Variance | Range |
|--------|------|--------|----------|-------|
| Scored | 1.12 | 1.0 | 0.48 | 0-2 |
| Conceded | 1.81 | 2.0 | 1.15 | 0-4 |
| Match Total | 2.94 | 3.0 | 1.68 | 0-5 |

**Venue vs overall delta:** Scored +0.12, Conceded +0.06, Total +0.19. The home boost is marginal. The slightly higher home conceding rate reflects the quality of home opponents faced (Arsenal, Newcastle, Man City, Liverpool, West Ham).

**Trend -- Recent 6 PL vs Older 10 PL:**

| Period | Scored | Conceded | Total | xG Scored | xG Conceded |
|--------|--------|----------|-------|-----------|-------------|
| Recent 6 | 1.17 | 2.33 | 3.50 | 1.28 | 2.31 |
| Older 10 | 1.10 | 1.50 | 2.60 | 1.24 | 1.23 |

The recent surge in match totals is driven entirely by defensive deterioration. Scoring output is flat. The defensive collapse is supported by xG (2.31 conceded recently vs 1.23 before), reflecting both tougher recent fixtures and genuine decline -- the 4-game Romero suspension, ongoing injury crisis, and managerial transition from Thomas Frank to Igor Tudor are structural causes.

**xG analysis:**
- Home: xG scored 1.43, actual 1.25 -- goals/xG ratio **0.87** (slight underperformance)
- All PL: xG scored 1.26, actual 1.12 -- goals/xG ratio **0.89**
- Home xG conceded 1.66, actual conceded 1.88 -- opponents overperforming xG by 13%

The 0.87 scoring ratio is within normal range -- no strong regression signal. The opponent overperformance against Spurs on conceding (1.13 ratio) suggests some bad defensive fortune, but also reflects poor defending in high-value situations. Overall xG generation (1.26 all, 1.43 home) is mediocre for a club of Tottenham's ambitions.

**Shots efficiency:**

| Subset | Shots/Goal | SoT/Goal |
|--------|-----------|----------|
| All PL | 10.9 | 3.6 |
| Home PL | 11.2 | 3.7 |

Poor conversion. PL average is roughly 9-10 shots per goal. Tottenham are below average.

**Threshold frequencies:**

| Line | All PL (16) | Home PL (8) |
|------|-------------|-------------|
| Over 1.5 | 88% (14/16) | 100% (8/8) |
| Over 2.5 | 69% (11/16) | 75% (6/8) |
| Over 3.5 | 31% (5/16) | 25% (2/8) |

**BTTS frequency:** All PL **69%** (11/16). Home PL **88%** (7/8). The home BTTS rate is striking -- Tottenham have kept only one home PL clean sheet all season (Brentford 2-0 on Dec 6).

**Clean sheet & fail to score:**
- Clean sheet: All 19% (3/16), Home **12%** (1/8)
- Fail to score: All 19% (3/16), Home **0%** (0/8)

Tottenham have scored in every home PL game but almost never keep clean sheets at home.

**First-half goals:**
- Home HT scored: 0.50/game, Home HT conceded: 0.88/game
- Tottenham start slowly at home and tend to concede in the first half.

**Goal timing (Tottenham PL goals scored, n=18 timed goals):**
- 1-30': 3 goals (17%)
- 31-60': 6 goals (33%)
- 61-90+': 9 goals (50%)

Tottenham are a second-half team offensively, with half their goals coming after the 60th minute.

**Goals conceded timing (n=28 timed goals conceded):**
- 1-30': 7 (25%)
- 31-60': 10 (36%)
- 61-90+': 11 (39%)

Conceding is more evenly distributed but still slightly back-loaded.

### 1C. Crystal Palace (Away) -- Goal Stats

**Venue-filtered (8 Away PL games):**

| Metric | Mean | Median | Variance | Range |
|--------|------|--------|----------|-------|
| Scored | 1.00 | 1.0 | 0.25 | 0-2 |
| Conceded | 1.50 | 1.5 | 1.50 | 0-4 |
| Match Total | 2.50 | 2.5 | 1.50 | 1-5 |

**All-games baseline (15 PL games):**

| Metric | Mean | Median | Variance | Range |
|--------|------|--------|----------|-------|
| Scored | 0.87 | 1.0 | 0.38 | 0-2 |
| Conceded | 1.53 | 1.0 | 1.58 | 0-4 |
| Match Total | 2.40 | 2.0 | 2.11 | 0-5 |

**Venue vs overall delta:** Scored +0.13 (slightly better away), Conceded -0.03 (flat), Total +0.10.

**Trend -- Recent 6 PL vs Older 9 PL:**

| Period | Scored | Conceded | Total | xG Scored | xG Conceded |
|--------|--------|----------|-------|-----------|-------------|
| Recent 6 | 1.17 | 1.50 | 2.67 | 1.59 | 1.59 |
| Older 9 | 0.67 | 1.56 | 2.22 | 1.40 | 1.72 |

Palace are scoring more recently (1.17 vs 0.67), supported by higher xG generation (1.59 vs 1.40). Defensive performance has also improved slightly. This is a genuine uptick in form.

**xG analysis:**
- Away: xG scored 1.20, actual 1.00 -- goals/xG ratio **0.83** (underperforming)
- All PL: xG scored 1.47, actual 0.87 -- goals/xG ratio **0.59** (severe underperformance)

The 0.59 overall ratio is extreme -- among the worst in the league. Palace create far more than they convert. Even the away figure (0.83) is below normal. This makes Palace a regression candidate upward, but the persistence across 15 PL games (not random noise) and the absence of both primary strikers (Mateta, Nketiah) suggest the finishing problem may continue.

**Shots efficiency:**

| Subset | Shots/Goal | SoT/Goal |
|--------|-----------|----------|
| All PL | 13.1 | 3.8 |
| Away PL | 8.6 | 3.0 |

The all-games figure of 13.1 shots per goal is very poor. The better away figure (8.6) may be partly noise given 8-game sample.

**Threshold frequencies:**

| Line | All PL (15) | Away PL (8) |
|------|-------------|-------------|
| Over 1.5 | 67% (10/15) | 75% (6/8) |
| Over 2.5 | 47% (7/15) | 50% (4/8) |
| Over 3.5 | 20% (3/15) | 12% (1/8) |

Only 50% of Palace away PL games clear Over 2.5. Only 12% (1/8) clear Over 3.5.

**BTTS frequency:** All PL **53%** (8/15). Away PL **62%** (5/8).

**Clean sheet & fail to score:**
- Clean sheet: All 27% (4/15), Away 25% (2/8)
- Fail to score: All **27%** (4/15), Away **12%** (1/8)

**First-half goals:**
- Away HT scored: 0.62/game, Away HT conceded: 0.62/game
- More balanced than Tottenham's first-half patterns.

**Goal timing (Palace PL goals scored, n=11 timed goals):**
- 1-30': 4 (36%)
- 31-60': 3 (27%)
- 61-90+': 4 (36%)

Balanced distribution across periods.

### 1D. Outlier Check

**Tottenham:** Mean total 2.94, SD 1.34, 2-sigma threshold 5.62. No games exceed this. Home average with/without outliers: 3.12 (unchanged). No outlier-driven distortion.

**Crystal Palace:** Mean total 2.40, SD 1.50, 2-sigma threshold 5.40. No games exceed this. Away average with/without outliers: 2.50 (unchanged). No outlier-driven distortion.

### 1E. Head-to-Head

| Date | Venue | Result | xG Tot | xG CP | Total | BTTS |
|------|-------|--------|--------|-------|-------|------|
| 2025-12-28 | Selhurst Park | Tot 1-0 CP | 0.87 | 0.93 | 1 | No |
| 2025-05-11 | Tot Stadium | Tot 0-2 CP | 0.81 | 3.99 | 2 | No |
| 2024-10-27 | Selhurst Park | Tot 1-0 CP | 1.02 | 0.98 | 1 | No |

**H2H averages:** Tottenham 0.67 goals, Crystal Palace 0.67 goals, Total **1.33**. **BTTS: 0/3** (0%).

**Same-venue H2H (Tottenham home):** Only the 2025-05-11 fixture (Tot 0-2 CP, xG 0.81-3.99). This is ~10 months old with significant squad and managerial changes on both sides. Heavily discounted due to age, different manager (neither Tudor nor Frank was in charge), and limited personnel overlap (~4/11 starters matching expected XI).

**Personnel continuity:**
- 2025-12-28 (~3 months ago): Moderate relevance. ~6-7/11 starters expected to overlap for both teams. Different Tottenham manager (Thomas Frank). Most recent and most relevant H2H, but at Selhurst Park, not Tottenham Stadium.
- 2025-05-11 (~10 months ago): Low relevance. Different managers for both clubs, ~4/11 starter overlap for Tottenham.
- 2024-10-27 (~17 months ago): Heavily discounted. Very different squad composition for both sides.

**Key takeaway:** The H2H data strongly points toward low-scoring encounters and BTTS No, but the 3-game sample is tiny. The pattern is directionally useful but statistically fragile -- removing the 0-2 game makes the average even lower (1.00). No single game flips the direction of the signal.

### 1F. Lineup, Substitution & Formation

**Tottenham formations in PL:**

| Formation | Games | Avg Scored | Avg Conceded | Avg Total |
|-----------|-------|------------|--------------|-----------|
| 4-2-3-1 | 7 | 1.29 | 1.57 | 2.86 |
| 4-3-3 | 3 | 0.33 | 1.33 | 1.67 |
| 3-4-2-1 | 2 | 2.00 | 2.00 | 4.00 |
| 4-2-2-2 | 2 | 1.00 | 2.00 | 3.00 |
| 4-4-2 | 1 | 1.00 | 2.00 | 3.00 |
| 3-5-2 | 1 | 1.00 | 4.00 | 5.00 |

The expected formation is **4-3-3**. In the 3 PL games Spurs have used 4-3-3 (vs Newcastle home, Man Utd away, Brentford away), they scored an abysmal 0.33 goals/game (1 goal in 3 games). However, Tudor has only managed 2 games (3-5-2 vs Arsenal, 4-4-2 vs Fulham), so the 4-3-3 under Tudor is untested. **Small-sample flag applies** to all formation data under the new manager.

**Crystal Palace formations in PL:** All 15 PL games used **3-4-2-1** (avg scored 0.87, conceded 1.53, total 2.40). The predicted XI is a **3-4-3** with Johnson-Strand Larsen-Sarr up front. The 3-4-3 was used only in Conference League (vs Zrinjski, KuPS, Shelbourne). No PL data exists for this shape.

### 1G. Absence Impact

**Tottenham confirmed absences:**

| Player | Position | Status | Impact Assessment |
|--------|----------|--------|-------------------|
| James Maddison | CAM | ACL, season | Elite creator. Absent all season -- already reflected in data. |
| Dejan Kulusevski | RW/CM | Knee, season | Key attacker. Absent all season -- reflected in data. |
| Cristian Romero | CB | 4-game ban (final match) | Best defender. Without him, Spurs' defensive structure deteriorates. Danso (5 mins for club) replaces. |
| Wilson Odobert | LW | Knee, season | Appeared in some sample games with limited impact. |
| Mohammed Kudus | AM/RW | Injury, after March break | Not in recent sample. |
| Rodrigo Bentancur | CM | Hamstring surgery | Long-term, reflected in data. |
| Lucas Bergvall | CM | Ankle surgery | Reflected in data. |
| Ben Davies | CB | Injury, April | Limited recent role. |
| Destiny Udogie | LB | Hamstring, could return March | If out, 19-year-old Souza starts. |
| Djed Spence | RB | Calf, miss this match | Porro (returned vs Fulham) covers. |

**Returning for Tottenham:** Richarlison (cleared to start -- scored 2 PL goals from limited minutes this season: vs Fulham 66' and vs Liverpool 83'). Pedro Porro (played 90 vs Fulham). Kevin Danso (5-min sub vs Fulham, first appearance).

**Crystal Palace confirmed absences:**

| Player | Position | Status | Impact Assessment |
|--------|----------|--------|-------------------|
| Jean-Philippe Mateta | ST | Knee, could train next Monday | Joint-top scorer. Major attacking loss. |
| Eddie Nketiah | ST | Thigh, late March | Backup striker. Out. |
| Maxence Lacroix | CB | Red card, 1-match ban | Starting CB, scored vs Man Utd. Weakens back three. |
| Cheick Doucoure | CM | ACL, long-term | Reflected in data. |

**Returning for Palace:** Jefferson Lerma (thigh -- 15-20 min sub only, not fit to start).

**Net assessment:** Both squads are heavily depleted. Tottenham's entire creative midfield is unavailable (Maddison, Kulusevski, Kudus). Palace are missing both primary strikers (Mateta, Nketiah) and a key centre-back (Lacroix). The absence severity on both sides favours a lower-scoring game than the raw averages suggest.

### 1H. Contextual Factors

**League baseline:** The Premier League 2025-26 season averages approximately 2.7-2.8 goals per game. Tottenham's overall match average (2.94) is slightly above; Palace's (2.40) is below.

**League position & motivation:**
- Tottenham: **16th, 29 points, 4 points above relegation.** 10 PL games winless (joint-worst in club PL history). Tudor has lost both matches in charge (4-1 vs Arsenal, 2-1 at Fulham). Reports suggest Tudor could be sacked if Spurs do not win. This creates a "must-win" dynamic. Tudor's post-Fulham assessment was damning: "We lack when we attack. We are lacking in the middle to run. We are lacking behind to stay there and suffer and not concede the goal." He also stated "the style is second because it's a question of life and death." This suggests a pragmatic, defence-first approach rather than all-out attack.
- Crystal Palace: **14th, 35 points, 10 points above relegation.** Comfortable. No urgent motivation beyond accumulating points. Palace's recent PL form is middling (W2 D1 L3 in last 6). Their recent wins (Brighton 1-0, Wolves 1-0) have been tight, low-scoring affairs under Oliver Glasner.

**Score-state patterns:** Tottenham's high-scoring recent games (Arsenal 1-4, Fulham 1-2, Newcastle 1-2) all involved trailing and chasing. Under Tudor, this pattern continued. If Palace score first, Spurs may push forward desperately and concede on the break. If Spurs score first, Palace are disciplined enough to sit deep in their 3-back.

**Brennan Johnson subplot:** Johnson returns to Tottenham Stadium for the first time since his transfer to Crystal Palace. While difficult to quantify, former-club motivation is a real psychological factor.

---

## Phase 2 -- Predicted Distribution

### Tottenham Goals Scored (lambda_A)

**Primary input -- Tottenham's own scoring patterns:**
- Home PL actual: 1.25
- Home PL xG: 1.43
- All PL actual: 1.12
- All PL xG: 1.26
- Recent 6 PL: 1.17 scored, 1.28 xG
- Never failed to score at home (0/8)

**Secondary context -- Palace's defensive record:**
- Away conceded: 1.50 actual, 1.69 xG
- All conceded: 1.53 actual, 1.67 xG
- Lacroix suspended, weakening the back three
- Palace keep away clean sheet 25% of the time

**Adjustments:**
- *Upward:* Richarlison returns as a proven PL finisher. 100% home scoring record is robust (8/8). Palace's Lacroix suspension weakens their defence. Tudor's desperation creates attacking urgency. Home advantage.
- *Downward:* Creative midfield gutted (Maddison, Kulusevski, Kudus all out). Tudor explicitly prioritising defensive solidity ("question of life and death"). 10-game winless run reflects genuine dysfunction. Tottenham's xG generation at home (1.43) is mediocre, and this is with personnel now unavailable. 4-3-3 formation produced 0.33 goals/game in PL (tiny sample but concerning).
- *Net:* The structural creative deficiencies slightly outweigh the motivational boost and Palace's weakness. I anchor to the home PL actual (1.25) and shade down for the unprecedented absence list and tactical conservatism under Tudor.

**Central estimate: lambda_A = 1.15.** Range: 0.8-1.5.

### Crystal Palace Goals Scored (lambda_B)

**Primary input -- Palace's own scoring patterns:**
- Away PL actual: 1.00
- Away PL xG: 1.20
- All PL actual: 0.87
- All PL xG: 1.47
- Recent 6 PL: 1.17 scored, 1.59 xG
- Failed to score in only 1/8 away PL games (12%)

**Secondary context -- Tottenham's defensive record:**
- Home conceded: 1.88 actual, 1.66 xG
- All conceded: 1.81 actual, 1.64 xG
- Romero suspended; Danso (5 minutes of club football) replaces
- Only 1 home PL clean sheet all season (12%)
- League-high 5 errors leading to goals in 2026

**Adjustments:**
- *Upward:* Tottenham's home defence is genuinely poor (1.88 conceded). Romero's absence further weakens it. Palace's xG numbers (1.20 away) suggest they create enough -- someone just needs to finish. Error-prone Spurs create chances on turnovers. Palace rarely blank away (12%).
- *Downward:* Both Mateta and Nketiah absent. Strand Larsen (2 PL goals in 15 starts) is not a proven PL goalscorer. The 0.59 goals/xG ratio reflects a genuine finishing quality issue that persists with a weaker striker. Glasner may adopt a conservative setup given Palace's comfortable league position and missing key players.
- *Net:* The striker absences are significant but partially offset by Tottenham's defensive fragility. Palace should create chances; converting them is the question. With both main strikers out, I shade below the away actual rate.

**Central estimate: lambda_B = 0.85.** Range: 0.5-1.2.

### Match Totals

Per-team sum: 1.15 + 0.85 = **2.00 total goals.**

**Cross-checks against raw data:**
- Tottenham home average total: 3.12
- Palace away average total: 2.50
- Average of venue-filtered: (3.12 + 2.50) / 2 = 2.81
- H2H average: 1.33 (small sample, discounted)
- Combined venue-filtered xG: (1.43 + 1.66) / 2 = 1.55 for home total, (1.20 + 1.69) / 2 = 1.45 for away total -- these are per-perspective numbers

**Why 2.00 and not ~2.80?** The gap between the raw venue-filtered average and my estimate reflects four factors: (1) exceptional combined absences -- losing both main strikers (Palace) and all senior creative midfielders (Spurs) simultaneously is unprecedented in either team's sample; (2) Tudor's explicit defensive pragmatism; (3) the H2H directional signal toward low scoring; (4) Palace's recent away wins being consistently tight (1-0, 1-0, 1-1).

**Sensitivity to this estimate:** At 2.20 total (lambda_A=1.20, lambda_B=1.00), the Under 2.5 probability is still 64.1%. At 2.40 total (lambda_A=1.30, lambda_B=1.10), it drops to 57.0%. The Under 2.5 thesis remains value-positive across a wide range.

### Goal Spread (Tottenham - Palace)

Central estimate: 1.15 - 0.85 = **+0.30** (Tottenham slight favourite).
Range: -2.0 to +3.0.

### BTTS Probability

**Poisson model:** P(BTTS Yes) = 1 - P(Tot=0) - P(CP=0) + P(0-0) = 1 - 0.3166 - 0.4274 + 0.1353 = **39.1%**

**Empirical cross-check:**
- Tottenham home BTTS: 88% (7/8)
- Palace away BTTS: 62% (5/8)
- H2H BTTS: 0% (0/3)

The model's 39.1% is much lower than the empirical venue-filtered rates (~75% average). The gap arises because: (a) the Poisson model's low total (2.00) produces high zero-goal probabilities for each team; (b) the independence assumption underestimates the in-game correlation (when Spurs concede, the game opens up and they tend to score too).

**Adjusted estimate: ~47%.** I weight the empirical signal from Tottenham's home games upward but recognise that the extreme depletion on both sides increases the clean-sheet probability relative to normal games. Even at 47%, BTTS No remains more likely than Yes.

### Match Result Probabilities

| Outcome | Poisson Model | Adjusted |
|---------|---------------|----------|
| Home win | 42.6% | 40% |
| Draw | 30.4% | 30% |
| Away win | 27.0% | 30% |

Tudor's winless start and Palace's recent resilience justify shading toward a more even contest than the raw Poisson suggests.

### Clean Sheet Probabilities

- Tottenham CS (Palace fail to score): Model 42.7%, empirical home rate 12%. **Adjusted: ~25%.** The gap reflects Spurs' chronic inability to keep clean sheets at home, but with both Palace strikers absent, the model's higher estimate has merit.
- Palace CS (Tottenham fail to score): Model 31.7%, empirical away rate 25%. **Adjusted: ~20%.** Spurs have never failed to score at home this season, and even depleted, they have enough quality (Solanke, Richarlison, Simons) to fashion at least one goal.

### Reconciliation of Contradictions

**1. Model total (2.00) vs empirical venue-filtered averages (~2.80):**
The absence impact accounts for the difference. Both teams' available samples include games with significantly stronger attacking personnel than will be available for this match. I trust the absence-adjusted estimate. However, if the absences prove less impactful than estimated, the model underestimates totals. This is the primary uncertainty.

**2. Model BTTS (39%) vs Spurs home BTTS (88%):**
Significant gap. The 88% figure reflects Tottenham's inability to keep clean sheets AND their reliable home scoring. The model's lower total (2.00) suppresses BTTS by increasing both teams' zero-goal probabilities. I split the difference at ~47%, acknowledging the game-dynamics correlation that Poisson misses.

**3. Tottenham home scoring reliability (0% fail to score) vs depleted attack:**
The strongest tension. Spurs have always scored at home, but they have never been this depleted. Tudor has never selected this team for a home match. I trust the directional signal (they will likely score) but keep lambda_A at 1.15 rather than boosting it, reflecting the unprecedented creative absence.

**4. Palace xG underperformance (0.59) vs striker absences:**
A team that should be scoring more based on xG is simultaneously losing its best finishers. These partially cancel. The regression upward from xG meets the regression downward from personnel. Net effect: approximately neutral -- I set lambda_B at 0.85, slightly below the away actual rate of 1.00.

All contradictions resolved. Proceeding to Phase 3.

---

## Phase 3 -- Value Identification

### Distribution Model

**Model choice:** Poisson. Checking for overdispersion: Tottenham home scoring variance (0.19) is well below mean (1.25) -- underdispersed. Palace away scoring variance (0.25) below mean (1.00). Conceded variances are closer to means but not overdispersed. Standard Poisson is appropriate and somewhat conservative for under/low-goal markets.

**Parameters:** lambda_A = 1.15 (Tottenham), lambda_B = 0.85 (Crystal Palace).

### Scoreline Probability Matrix

```
          CP 0     CP 1     CP 2     CP 3     CP 4     CP 5
Tot 0 |  13.5%    11.5%     4.9%     1.4%     0.3%     0.1%
Tot 1 |  15.6%    13.2%     5.6%     1.6%     0.3%     0.1%
Tot 2 |   8.9%     7.6%     3.2%     0.9%     0.2%     0.0%
Tot 3 |   3.4%     2.9%     1.2%     0.4%     0.1%     0.0%
Tot 4 |   1.0%     0.8%     0.4%     0.1%     0.0%     0.0%
Tot 5 |   0.2%     0.2%     0.1%     0.0%     0.0%     0.0%
```

**Most likely scorelines:** 1-0 (15.6%), 0-0 (13.5%), 1-1 (13.2%), 0-1 (11.5%), 2-0 (8.9%), 2-1 (7.6%).

### Match Result Probabilities from Model

| Outcome | Model Prob |
|---------|-----------|
| Home win | 42.6% |
| Draw | 30.4% |
| Away win | 27.0% |

### Moneyline (1X2) Value

**FanDuel overround:** 1/2.40 + 1/3.30 + 1/3.00 = 0.4167 + 0.3030 + 0.3333 = 1.0530 (5.3%).
**DraftKings overround:** 1/2.40 + 1/3.35 + 1/3.00 = 0.4167 + 0.2985 + 0.3333 = 1.0485 (4.9%).

**FanDuel fair (overround-adjusted) probabilities:** Home 39.6%, Draw 28.8%, Away 31.7%.

| Outcome | Model | FD Fair Prob | Edge vs Fair | FD Raw Implied | Edge vs Raw |
|---------|-------|-------------|-------------|----------------|-------------|
| Home | 42.6% | 39.6% | +3.1% | 41.7% | +1.0% |
| Draw | 30.4% | 28.8% | +1.6% | 30.3% | +0.1% |
| Away | 27.0% | 31.7% | -4.7% | 33.3% | -6.3% |

No moneyline outcome clears the 5% edge threshold vs fair probabilities.

### Totals Markets

| Line | Model Over | Model Under | Book | Over Odds | Over Implied | Under Odds | Under Implied | Under Edge (raw) |
|------|-----------|-------------|------|-----------|-------------|------------|---------------|-----------------|
| 1.5 | 59.4% | 40.6% | FD | 1.26 | 79.4% | 3.90 | 25.6% | **+15.0%** |
| 2.25 | 39.1% | 60.9% | DK | 1.62 | 61.7% | 2.15 | 46.5% | **+14.4%** |
| 2.5 | 32.3% | 67.7% | FD | 1.85 | 54.1% | 1.96 | 51.0% | **+16.7%** |
| 2.5 | 32.3% | 67.7% | DK | 1.83 | 54.6% | 1.87 | 53.5% | **+14.2%** |
| 2.75 | 27.8% | 72.2% | DK | 2.05 | 48.8% | 1.69 | 59.2% | **+13.0%** |
| 3.5 | 14.3% | 85.7% | FD | 3.20 | 31.2% | 1.36 | 73.5% | **+12.2%** |
| 4.5 | 5.3% | 94.7% | FD | 6.40 | 15.6% | 1.12 | 89.3% | +5.5% |

The Under markets show consistent and substantial edges across every line. The strongest value by raw edge is **Under 2.5 at FD 1.96** (+16.7%).

### BTTS

| Market | Model Prob | Adj. Prob | FD Odds | FD Implied | Edge (model) | Edge (adj.) |
|--------|-----------|-----------|---------|-----------|-------------|------------|
| BTTS Yes | 39.1% | ~47% | 1.66 | 60.2% | -21.1% | -13.2% |
| BTTS No | 60.9% | ~53% | 2.20 | 45.5% | **+15.4%** | **+7.5%** |

Even at the conservatively adjusted BTTS No probability of 53%, the edge at 2.20 odds is +7.5% -- above the 5% threshold.

### Double Chance

| Market | Model Prob | FD Odds | FD Implied | Edge |
|--------|-----------|---------|-----------|------|
| 1X (Home or Draw) | 73.0% | 1.40 | 71.4% | +1.6% |
| 12 (Home or Away) | 69.6% | 1.29 | 77.5% | -7.9% |
| X2 (Draw or Away) | 57.4% | 1.54 | 64.9% | -7.6% |

No value exceeding 5% edge in double chance markets.

### Asian Handicap / Spreads

| Market | Model Prob | Odds | Implied | Edge |
|--------|-----------|------|---------|------|
| Tot -0.5 (DK) | 42.6% | 2.25 | 44.4% | -1.8% |
| Tot -0.25 (DK) | 50.2% | 1.95 | 51.3% | -1.1% |
| Tot 0 DNB (DK) | 57.8% | 1.67 | 59.9% | -2.1% |
| Tot +0.25 (DK) | 65.4% | 1.49 | 67.1% | -1.7% |
| Tot +1.5 (FD) | 91.1% | 1.11 | 90.1% | +1.0% |
| CP +0.5 (DK) | 57.4% | 1.56 | 64.1% | -6.7% |
| CP 0 DNB (DK) | 42.2% | 2.05 | 48.8% | -6.6% |
| CP -0.25 (DK) | 34.6% | 2.45 | 40.8% | -6.2% |
| CP -1.5 (FD) | 8.9% | 6.40 | 15.6% | -6.8% |

No spread market clears the 5% edge threshold for Tottenham. All Crystal Palace handicap lines show negative edge -- the market overprices Palace relative to the model.

### Cross-Checks

- Under 2.5 (67.7%) is consistent with BTTS No (60.9%): both expect a low-scoring game with at least one clean sheet.
- Home win (42.6%) aligns with 1-0 being the most likely single scoreline (15.6%).
- The model's 13.5% for 0-0 is high relative to the PL average (~8%), reflecting reduced firepower on both sides.
- The moneyline probabilities sum correctly to ~100% and are consistent with the spread probabilities.

### Sensitivity Analysis

| lambda_A | lambda_B | Total | P(U2.5) | Edge vs FD 1.96 | P(BTTS No) | Edge vs 2.20 |
|----------|----------|-------|---------|-----------------|-----------|--------------|
| 1.05 | 0.80 | 1.85 | 71.7% | +20.7% | 64.2% | +18.7% |
| **1.15** | **0.85** | **2.00** | **67.7%** | **+16.7%** | **60.9%** | **+15.4%** |
| 1.25 | 0.90 | 2.15 | 63.6% | +12.6% | 57.7% | +12.2% |
| 1.10 | 0.90 | 2.00 | 67.7% | +16.7% | 60.4% | +14.9% |
| 1.20 | 0.80 | 2.00 | 67.7% | +16.7% | 61.5% | +16.0% |
| 1.30 | 1.00 | 2.30 | 57.7% | +6.7% | 53.0% | +7.5% |
| 1.40 | 1.10 | 2.50 | 54.4% | +3.4% | 49.1% | +3.6% |

**Under 2.5 breaks even at approximately lambda total 2.60** (e.g., Tot 1.40, CP 1.20). This would require both teams to significantly exceed their venue-filtered PL scoring rates while simultaneously dealing with unprecedented absences. The edge is robust.

**BTTS No breaks even at approximately lambda total 2.45.** Also robust.

---

## Phase 4 -- Output

### Statistical Summary

| Metric | Tottenham (Home) | Crystal Palace (Away) |
|--------|-------------------|----------------------|
| PL goals scored (venue, n=8) | 1.25 | 1.00 |
| PL goals conceded (venue, n=8) | 1.88 | 1.50 |
| xG scored (venue) | 1.43 | 1.20 |
| xG conceded (venue) | 1.66 | 1.69 |
| Goals/xG ratio (venue) | 0.87 | 0.83 |
| BTTS frequency (venue) | 88% | 62% |
| Clean sheet frequency (venue) | 12% | 25% |
| Fail to score (venue) | 0% | 12% |
| Over 2.5 frequency (venue) | 75% | 50% |
| Recent 6 PL scored | 1.17 | 1.17 |
| Recent 6 PL conceded | 2.33 | 1.50 |
| Key absences | Romero (susp), Maddison, Kulusevski, Kudus, Odobert, Bentancur, Bergvall, Spence, Davies, Udogie | Mateta, Nketiah, Lacroix (susp), Doucoure |

### Predictions

| Prediction | Value |
|-----------|-------|
| **Predicted score** | Tottenham 1-0 Crystal Palace (most likely single scoreline at 15.6%) |
| **Expected goals** | Tottenham 1.15, Crystal Palace 0.85 |
| **Predicted total** | 2.00 (range: 1.5-2.5) |
| **Home win** | 42.6% |
| **Draw** | 30.4% |
| **Away win** | 27.0% |
| **BTTS Yes** | 39-47% |
| **BTTS No** | 53-61% |
| **Over 2.5** | 32.3% |
| **Under 2.5** | 67.7% |
| **Tottenham clean sheet** | 20-43% |
| **Crystal Palace clean sheet** | 20-32% |

### Value Picks

| # | Pick | Book | Odds | Model Prob | Implied Prob | Edge | Confidence |
|---|------|------|------|-----------|-------------|------|------------|
| 1 | **Under 2.5 Goals** | FanDuel | 1.96 | 67.7% | 51.0% | **+16.7%** | High |
| 2 | **BTTS No** | FanDuel | 2.20 | 53-61% | 45.5% | **+7.5 to +15.4%** | Medium-High |
| 3 | **Under 3.5 Goals** | FanDuel | 1.36 | 85.7% | 73.5% | **+12.2%** | High |
| 4 | **Under 1.5 Goals** | FanDuel | 3.90 | 40.6% | 25.6% | **+15.0%** | Medium |

---

**Pick 1 -- Under 2.5 Goals @ 1.96 (FanDuel).** The model assigns 67.7% probability to Under 2.5 against a raw implied probability of 51.0%, producing a +16.7% edge. This is the highest-conviction pick. Tottenham have never scored more than 2 in a home PL game this season (range 1-2), while Crystal Palace away PL games go Over 2.5 only 50% of the time -- and that includes a 1-4 loss at Leeds that pushes the average up. Both teams are missing their primary attacking weapons: Tottenham's creative midfield is gutted (Maddison, Kulusevski, Kudus all out), and Palace are without both main strikers (Mateta, Nketiah). Tudor's explicit emphasis on defensive pragmatism ("question of life and death") and the H2H record (average 1.33 total across 3 meetings) reinforce the lean. The edge remains positive at +6.7% even under the most generous assumption (lambda total = 2.30), and breaks even only at total ~2.60 -- a threshold requiring both teams to exceed their venue-filtered scoring rates despite unprecedented personnel depletion.

**Pick 2 -- BTTS No @ 2.20 (FanDuel or DraftKings).** The Poisson model gives BTTS No at 60.9% against an implied 45.5%, yielding a +15.4% edge. Even the adjusted estimate (accounting for Tottenham's high empirical home BTTS rate of 88%) of ~53% produces a +7.5% edge -- above the 5% threshold. The H2H record is 0/3 BTTS, and this match features the weakest combined attacking lineups these sides have fielded against each other. Crystal Palace with Strand Larsen (2 PL goals) as the lone striker face a different proposition than with Mateta available. Tottenham have always scored at home this season, which is the primary counterargument -- but the Spurs home BTTS rate of 88% is inflated by games against Arsenal, Man City, Liverpool, Newcastle, and West Ham, all superior attacking teams to this Palace side. The pick correlates with Pick 1 (both favour low-scoring) but at significantly better odds.

**Pick 3 -- Under 3.5 Goals @ 1.36 (FanDuel).** The model gives 85.7% probability against an implied 73.5%, yielding a +12.2% edge. This is the safest pick in the portfolio -- the probability of 4+ goals is only 14.3%. Tottenham home games have exceeded 3.5 total goals only 25% of the time (2/8: Arsenal 5, Man City 4). Palace away games have exceeded 3.5 total just once in 8 games (the 1-4 loss at Leeds -- a blowout against a much stronger attack). At odds of 1.36, the payout is modest but the hit rate should be very high. Even at the most aggressive lambda estimate (total 2.50), Under 3.5 holds at ~78% probability.

**Pick 4 -- Under 1.5 Goals @ 3.90 (FanDuel).** The model gives 40.6% probability against an implied 25.6%, yielding a +15.0% edge. This is the highest-risk, highest-reward pick. The 0-0 scoreline alone has a 13.5% model probability; add 1-0 either way (15.6% + 11.5%) and 40.6% of the probability mass is at 0 or 1 total goals. The H2H has produced Under 1.5 in 2 of 3 meetings. The price of 3.90 generously compensates for the risk. **Fragility note:** this pick is more sensitive to model inputs than the others. At a total of 2.20, Under 1.5 drops to ~36.7%, and the edge shrinks to +11.1% -- still positive. At total 2.50, it drops to ~28.7% (+3.1%) -- marginal. This is the pick most likely to be a losing bet on any given night, but the price offers substantial compensation for the probability.

### Bets to Avoid

**1. Over 2.5 Goals (any book).** The model assigns only 32.3% probability against implied odds of ~54%. The market appears to be pricing Tottenham's elevated home match-total average (3.12) without adjusting for the extraordinary absence list on both sides. This is the flip side of the Under 2.5 value.

**2. BTTS Yes @ 1.66 (FanDuel).** Even at the adjusted BTTS Yes probability of ~47%, the edge is -13.2% against the 60.2% implied probability. Tottenham's 88% home BTTS rate is the primary surface-level attraction, but it is inflated by top-quality opponents and does not account for Palace's striker-less attack.

**3. Crystal Palace Asian Handicap lines.** CP +0.5 @1.56, CP 0 @2.05, and CP -0.25 @2.45 all show negative edges of -6% to -7%. The market prices Palace too generously given their attacking limitations.

**4. Tottenham Moneyline @ 2.40.** Edge of only +1.0% vs raw implied, +3.1% vs fair. Below the 5% threshold. The 10-match winless streak and managerial instability are significant concerns that the market has reasonably incorporated.

### Caveats

1. **Tudor tactical unknown.** Igor Tudor has managed 2 Tottenham games with 2 different formations. His predicted 4-3-3 has no PL data under his management. The tactical setup could meaningfully shift goal expectations. If Tudor deploys an unexpectedly aggressive formation, the Under thesis weakens.

2. **Crystal Palace 3-4-3 unknown.** Palace may deploy a 3-4-3 for the first time in the PL this season. With Brennan Johnson on the wing, this is more attacking than their usual 3-4-2-1. The effectiveness in a PL context against a fragile defence is uncertain and could produce more goals than the model anticipates.

3. **Model total of 2.00 vs venue-filtered ~2.81.** The 0.81-goal discount is driven by absence adjustments, which are inherently judgmental. If the absences prove less impactful than estimated (e.g., Richarlison delivers a vintage performance, or Strand Larsen has a breakthrough game), the model total is too low. The sensitivity analysis shows the Under 2.5 edge survives even at total 2.30, providing a buffer.

4. **Motivation effects are not quantifiable.** Tudor's "question of life and death" framing could make Spurs either more cautious (supporting Unders) or more desperate/erratic (supporting Overs). The model cannot capture this duality.

5. **Small H2H sample (3 games).** The 1.33 average total and 0/3 BTTS are directionally useful but statistically insufficient to anchor conclusions. No single game removal flips the direction, but the magnitude of the signal is unreliable.

6. **Poisson independence assumption.** The model treats each team's goals as independent. In practice, game-state dynamics (trailing team pushes forward, leading team counters) create positive correlation. This means the true BTTS probability may be higher than the pure model suggests (reflected in the adjusted 47% estimate) and extreme scorelines slightly more probable.

7. **Referee penalty factor.** Andy Madley has awarded penalties in 18.8% of his matches. A penalty in a low-scoring game could determine the margin. This is a random variable the model treats as part of the lambda but which in practice could create a single decisive event.

