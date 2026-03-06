Now I have substantial contextual information. Let me compile the complete analysis despite the significant data limitations.

---

# PSG vs AS Monaco — Match Analysis Report

**Date**: 2026-03-06 | **Venue**: Parc des Princes (Paris) | **Competition**: Ligue 1 Matchday 25

---

## ⚠️ CRITICAL DATA LIMITATIONS

Before proceeding, the following must be stated clearly:

1. **PSG (Home) match-by-match data: ZERO games available.** No individual match xG, PPDA, deep completions, lineups, or goal events. This cripples the standard Phase 1 methodology.
2. **No odds available.** The report states "Event not found — odds unavailable." Without bookmaker lines, **Phase 3 (Value Identification) is impossible.** No edge calculations can be performed.
3. **No formal H2H section**, though we can extract three PSG-Monaco games from Monaco's data.

Given these constraints, I will construct the best analysis possible using: (a) Monaco's 20-game dataset, (b) PSG's season-level stats, (c) PSG's home record from web-sourced league tables, and (d) the three embedded H2H fixtures from Monaco's perspective. However, **no value picks can be recommended** without odds.

---

## Phase 1 — Statistical Analysis

### 1A. Data Cleaning

**Monaco**: 20 matches available. However, xG/npxG data is missing for 7 games (all Champions League: matches 2, 4, 8, 10, 14, 17, 20). These are marked with shots but no xG values. That leaves **13 valid Ligue 1 games** with full xG data. I flag CL matches (2, 4, 8, 10, 14, 17, 20 = 7 games) as non-league opponents; Ligue 1 games (1, 3, 5, 6, 7, 9, 11, 12, 13, 15, 16, 18, 19 = 13 games) are comparable.

**PSG**: 0 games. I will rely entirely on aggregated data from external sources.

### 1B. Team A (Home) — PSG

**From web search (league tables and Wikipedia):**

- **Ligue 1 overall**: P24, W18, D3, L3, GF 53, GA 19 → 2.21 GF/m, 0.79 GA/m
- **Ligue 1 HOME**: P11, W10, D1, L0, GF 30, GA 4 → **2.73 GF/m, 0.36 GA/m**
- **Home form (WWWWWWWWWDW)**: The StatMuse data shows the full home results:
  - Toulouse 3-0, Montpellier 6-0, Angers 4-0, AJ Auxerre 3-1, Metz 2-0, Nantes 1-0, Strasbourg 3-3, Nice 1-0, Le Havre 3-0, Rennes 5-0, Paris FC 2-1, Lille 3-0, Marseille 5-0, Metz 3-0 — though some of these span to the current date

From the StatMuse data (20 home Ligue 1 games listed with total 51 GF): this includes more than 11 games from the current season. Using the sportstats365 home table showing 11 played, 30:4 ratio:

| Metric | PSG Home (Ligue 1) |
|--------|---------------------|
| Games | 11 |
| GF avg | 2.73 |
| GA avg | 0.36 |
| Total avg | 3.09 |
| Clean sheets | ~8 out of 11 (est. from 4 GA in 11 games) |
| Win rate | 90.9% |

Recent home results (from StatMuse, most recent first): Metz 3-0 (Feb 21), Marseille 5-0 (Feb 8), Lille 3-0 (Jan 16), Paris FC 2-1 (Jan 4), Rennes 5-0 (Dec 6). **PSG have been devastating at home**, conceding almost nothing.

**Season stats (Understat, all competitions):**
- 34 matches, 142G (4.18/m), xG 159.0 (4.68/m), npxG 149.9 (4.41/m)
- **Goals/xG ratio**: 142/159.0 = **0.89** → PSG are underperforming their xG across all competitions
- **npxG vs xG gap**: 159.0 - 149.9 = 9.1 → ~0.27 xG/m from penalties. Moderate penalty dependence (roughly 1 penalty every ~4 games contributing 0.27 xG/m)
- xA 3.64/m, KP 25.6/m — elite creative output
- Shots 31.3/m — highest-volume attack in the analysis scope

**Key PSG attackers** (from web): Barcola (9G), Dembélé (8G, 2 pen), João Neves (5G), Gonçalo Ramos (5G, 1 pen), Kvaratskhelia (4G), Doué (4G).

**PSG absences** (from web): Dembélé has been injured since the CL 2nd leg vs Monaco. Nuno Mendes was in rehabilitation. Hakimi and Fabián Ruiz availability unclear (Hakimi expected to start per predicted lineups). The predicted lineup from multiple sources: Safonov; Hakimi, Zabarnyi, Pacho, Hernández; Zaïre-Emery, Vitinha, João Neves; Barcola, Kvaratskhelia, Doué (or Lee Kang-in if Doué rested for Chelsea CL).

**Key context**: PSG face Chelsea in the CL Round of 16 on March 11 (5 days after this match). Rotation is plausible, but PSG's squad depth is excellent and they're chasing the league title (4 points clear).

### 1C. Team B (Away) — AS Monaco

#### Venue-filtered (Away games, n=10)

Away matches: #3 (Lens 3-2), #6 (Nice 0-0), #9 (Le Havre 0-0), #13 (Marseille 0-1), #15 (Brest 0-1), #18 (Rennes 1-4), plus CL away: #2 (PSG 2-2), #10 (Real Madrid 1-6), #17 (Pafos 2-2), #20 (Bodo 1-0).

Pre-computed: Scored 1.00, Conceded 1.80, Total 2.80.

Let me verify with raw data: Away goals scored: 3, 0, 0, 0, 0, 1, 2, 1, 2, 1 = 10/10 = **1.00** ✓
Away goals conceded: 2, 0, 0, 1, 1, 4, 2, 6, 2, 0 = 18/10 = **1.80** ✓
Totals: 5, 0, 0, 1, 1, 5, 4, 7, 4, 1 = 28/10 = **2.80** ✓

**Ligue 1-only away** (n=6): Scored: 3, 0, 0, 0, 0, 1 = 4/6 = **0.67**. Conceded: 2, 0, 0, 1, 1, 4 = 8/6 = **1.33**. Total: 2.00.

This is a significant distinction: Monaco's league-only away scoring is **far weaker** (0.67 vs 1.00 all-away). The CL games inflate the average (2-2 at PSG, 1-6 at RM, 2-2 at Pafos, 1-0 at Bodo = 6G in 4 CL away games, vs 4G in 6 L1 away games).

**Variance** (away, all 10 games):
- Scored: Mean 1.00, values [3,0,0,0,0,1,2,1,2,1]. Variance = [(3-1)²+(0-1)²×4+(1-1)²×2+(2-1)²×2]/10 = [4+1+1+1+1+0+1+0+1+0]/10 = 9/10 = **0.90**. SD = 0.95.
- Conceded: Mean 1.80, values [2,0,0,1,1,4,2,6,2,0]. Variance = [0.04+3.24+3.24+0.64+0.64+4.84+0.04+17.64+0.04+3.24]/10 = 33.6/10 = **3.36**. SD = 1.83. (High variance driven by the 6 at Real Madrid — overdispersed.)
- Total: Mean 2.80, values [5,0,0,1,1,5,4,7,4,1]. Variance = [4.84+7.84+7.84+3.24+3.24+4.84+1.44+17.64+1.44+3.24]/10 = 55.6/10 = **5.56**. SD = 2.36.

**Median** (away scored): sorted [0,0,0,0,0,1,1,1,2,3] → median **0.5**
**Median** (away conceded): sorted [0,0,0,1,1,2,2,2,4,6] → median **1.5**
**Range**: Scored 0-3, Conceded 0-6, Total 0-7.

#### All-games (n=20)

Pre-computed: Scored 1.30, Conceded 1.60, Total 2.90.

**Variance** (all 20, scored): values [2,2,3,2,3,0,4,0,0,1,1,1,0,1,0,1,2,1,1,1] = 26/20 = 1.30 ✓
Sum of squared deviations from 1.30: (0.49+0.49+2.89+0.49+2.89+1.69+7.29+1.69+1.69+0.09+0.09+0.09+1.69+0.09+1.69+0.09+0.49+0.09+0.09+0.09) = 24.20/20 = **1.21**. SD = 1.10.

#### Trend analysis (recent 6 vs older)

**Last 6 Monaco games** (matches 1-6, Feb 8 – Feb 28):
Scored: 2, 2, 3, 2, 3, 0 = 12/6 = **2.00**
Conceded: 0, 2, 2, 3, 1, 0 = 8/6 = **1.33**
Total: 2, 4, 5, 5, 4, 0 = 20/6 = **3.33**

**Older 14 games** (matches 7-20):
Scored: 4, 0, 0, 1, 1, 1, 0, 1, 0, 1, 2, 1, 1, 1 = 14/14 = **1.00**
Conceded: 0, 0, 0, 6, 3, 3, 1, 0, 1, 0, 2, 4, 4, 0 = 24/14 = **1.71**

Monaco's recent form shows a **sharp uptick in scoring** (2.00 vs 1.00) while conceding less (1.33 vs 1.71). This is significant. The return of Balogun, Adingra, and tactical adjustments under Pocognoli appear to be working. However, only 1 of those 6 recent games was away (match 6: Nice 0-0, match 3: Lens 3-2).

**Last 6 away only**: Lens 3-2 and Nice 0-0 are the two most recent away league games. Tiny sample but shows volatility.

#### xG analysis (Ligue 1 only, n=13 with xG data)

Monaco xG values: 1.67, 2.34, 2.20, 0.83, 2.29, 0.56, 1.31, 0.80, 1.95, 0.49, 0.64, 1.61, 2.41 = 19.10/13 = **1.47/m**
Monaco actual goals (same 13): 2, 3, 3, 0, 4, 0, 1, 1, 0, 0, 1, 1, 1 = 17/13 = **1.31/m**
**Goals/xG ratio**: 17/19.10 = **0.89** → Monaco are underperforming xG in Ligue 1

Monaco xGA: 0.61, 1.83, 1.01, 0.46, 0.43, 0.17, 1.17, 1.96, 2.02, 1.14, 1.48, 3.07, 3.24 = 18.59/13 = **1.43/m**
Monaco actual GA (same 13): 0, 2, 1, 0, 0, 0, 3, 3, 1, 1, 0, 4, 4 = 19/13 = **1.46/m**
**GA/xGA ratio**: 19/18.59 = **1.02** → conceding roughly in line with xG against

**Away-filtered xG** (Ligue 1 away only, n=6): 2.34, 0.83, 0.56, 1.95, 0.49, 1.61 = 7.78/6 = **1.30/m** (matches pre-computed)
Away xGA (L1 away, n=6): 1.83, 0.46, 0.17, 2.02, 1.14, 3.07 = 8.69/6 = **1.45/m**

#### npxG analysis

All npxG values are identical to xG for 12 of 13 games. Only match 19 (Lens home) diverges: xG 2.41 vs npxG 0.75 — Monaco scored a penalty in that game (PKG: 1, PKS: 2). This is the only penalty-inflated game.

Monaco overall npxG (L1): replace 2.41 with 0.75 → 17.44/13 = **1.34/m** vs xG 1.47/m. The gap is mostly from that one Lens game. **Monaco are not penalty-dependent** — only 1 PKG in 20 games.

#### Shots efficiency

Away games (all 10, using shots data):
Monaco shots: 10, 10, 10, 18, 10, 13, 10, 20, 14, 9 = 124/10 = **12.4 shots/m**
Monaco SoT: 4, 5, 2, 7, 2, 3, 4, 6, 6, 2 = 41/10 = **4.1 SoT/m**
Goals scored away: 10 total → **12.4 shots/goal**, **4.1 SoT/goal**

Opponents' blocked shots vs Monaco (away): 9, 5, 2, 4, 3, 5, 1, 10, 7, 6 = 52/10 = **5.2 blocked/m** → Opposition teams are blocking a lot of Monaco shots when they're away, suggesting Monaco struggle to get clean looks.

#### PPDA analysis (Ligue 1 with data, n=13)

Monaco PPDA: 7.5, 11.2, 8.9, 5.0, 8.1, 5.3, 8.8, 8.9, 12.3, 6.4, 11.7, 10.5, 10.2 = 114.8/13 = **8.83/m**
Opponent PPDA: 23.5, 8.6, 11.7, 8.8, 12.0, 16.8, 21.6, 13.1, 15.1, 8.3, 8.0, 25.3, 8.9 = 181.7/13 = **13.98/m**

Monaco press aggressively (8.83 < league avg ~13). Opponents sit back (13.98). **Away PPDA** (L1 away, n=6): 11.2, 5.0, 5.3, 12.3, 6.4, 10.5 = 50.7/6 = **8.45/m** — still aggressive away.

League average home PPDA is 12.4 — PSG at home are likely well below this (they dominate possession and press). This sets up a **pressing vs pressing clash**, which typically opens up the game.

#### Deep completions (L1 only, n=13)

Monaco deep: 9, 5, 5, 6, 7, 10, 8, 5, 11, 5, 14, 5, 6 = 96/13 = **7.38/m**
Opp deep: 2, 8, 10, 3, 11, 3, 8, 11, 14, 4, 12, 2, 16 = 104/13 = **8.00/m**

Away deep (L1 away, n=6): 5, 6, 10, 11, 5, 5 = 42/6 = **7.00/m** (above league away avg of 5.8)

#### xPts analysis (L1, n=13)

Monaco xPts: 2.33, 1.76, 2.24, 1.71, 2.66, 1.69, 1.51, 0.45, 1.32, 0.70, 0.72, 0.51, 0.83 = 18.43/13 = **1.42 xPts/m**
Actual points from these 13 L1 games (W5, D2, L6): 17 actual pts → **1.31 pts/m**
Monaco have **fewer actual points than xPts** (17 vs 18.43), suggesting slight bad luck. But the gap is small.

#### Threshold frequencies

Pre-computed (all 20 games): Over 1.5: 60%, Over 2.5: 55%, Over 3.5: 55%
Away (10): Over 1.5: 50%, Over 2.5: 50%, Over 3.5: 50%

#### BTTS/Clean sheet

All games: BTTS 50%, CS 40%, FTS 25%
Away: BTTS 50%, CS 30%, FTS 40%

**Monaco fail to score in 40% of away games** — a major vulnerability.

#### Goal timing

Scored (25 goals all games): 61-75' cluster at 28% — Monaco are second-half scorers, peaking in the 61-75' window.
Conceded (31 goals): 46-60' peak at 23%, broad second-half weakness (46-FT: 58% of concessions).

#### Monaco injuries (from web)

- **Salisu**: Cruciate ligament injury — OUT
- **Hradecky**: Knee injury — OUT
- **Akliouche**: Hip injury since Feb 20 — DOUBTFUL/OUT
- **Mawissa**: Hamstring — OUT
- **Dier**: Calf injury — OUT
- **Ouattara**: Calf injury — OUT
- **Zakaria**: Precautionary gym work — DOUBTFUL
- **Biereth**: Ill — DOUBTFUL

This is a **devastating injury list**. Monaco are missing their backup GK (Hradecky — Köhn starts), a starting CB (Salisu), two other defenders (Mawissa, Dier), a LB option (Ouattara), and possibly their key creative midfielder (Akliouche) and box-to-box anchor (Zakaria). Biereth as a super-sub option is also uncertain.

### 1D. Outlier Check (Monaco)

All 20 games total goals: [2, 4, 5, 5, 4, 0, 4, 0, 0, 7, 4, 4, 1, 1, 1, 1, 4, 5, 5, 1]
Mean = 2.90, SD = 2.05
2σ threshold = 2.90 + 2×2.05 = **6.99**
Outlier: Match 10 (Real Madrid 1-6, total 7) barely exceeds threshold.

**Without outlier** (n=19): Total = 51/19 = **2.68**
Away without outlier (n=9): Total = 21/9 = **2.33**

### 1E. Head-to-Head

Three PSG-Monaco games extractable from Monaco's data:

| # | Date | Venue (Monaco's) | Score | Competition | Notes |
|---|------|------------------|-------|-------------|-------|
| 2 | Feb 25 | Away (at PSG) | 2-2 | CL Playoff 2L | PSG progressed 5-4 agg |
| 4 | Feb 17 | Home | 2-3 | CL Playoff 1L | PSG came from 2-0 down |
| 16 | Nov 29 | Home | 1-0 | Ligue 1 | Monaco won; xG 0.64-1.48 to PSG |

**Key H2H patterns:**
- **All 3 games**: BTTS in 2/3 (67%), totals: 4, 5, 1 → avg 3.33
- **At Parc des Princes (this venue)**: Only match 2 — the CL 2nd leg was 2-2, with PSG having 21 shots to Monaco's 10. Monaco equalised at 90'+1.
- **Recency**: All 3 are within the last ~3 months — highly relevant, no discount needed.
- **Personnel**: Match 16 (Nov 29) featured Hradecky in goal (now injured), Salisu (now out), Minamino (no longer in squad). Match 4 had Golovin sent off in 2H, dramatically changing the game. Match 2 saw Zakaria off at 24' (injured).

**Critical context from CL ties**: PSG dominated shots and territory across both legs (51 shots to 17, with 16 SoT vs 8). Monaco scored from counter-attacks and set pieces. PSG's Doué was the difference-maker off the bench in the 1st leg.

In the Ligue 1 reverse fixture (match 16, Nov 29), **PSG created 1.48 xG vs Monaco's 0.64** but lost 0-1. This is a classic overperformance/underperformance scenario — PSG were the better team but lost.

### 1F. Formation Analysis (Monaco)

| Formation | Games | Avg Scored | Avg Conceded | Avg Total |
|-----------|-------|------------|--------------|-----------|
| 4-2-3-1 | 7 | 0.71 | 1.57 | 2.29 |
| 3-4-2-1 | 4 | 1.75 | 1.00 | 2.75 |
| 3-1-4-2 | 3 | 1.67 | 3.33 | 5.00 |
| 4-2-2-2 | 2 | 0.50 | 1.50 | 2.00 |
| 3-5-2 | 1 | 2.00 | 2.00 | 4.00 |
| 4-3-1-2 | 1 | 1.00 | 3.00 | 4.00 |
| 4-2-3-1 | 2 (CL) | 1.50 | 1.00 | 2.50 |

Monaco have been most effective in 3-4-2-1 (1.75 avg scored, 1.00 conceded). Their 4-2-3-1 has been leaky and low-scoring. Given the personnel available and Pocognoli's recent preferences, a 3-4-2-1 or 3-5-2 is likely for this match.

**Key player-goal correlations:**

| Player | Games In | Total Goals In | Without |
|--------|----------|----------------|---------|
| Balogun | 19 (all but 1 start) | 25 scored | 1G in 1 game |
| Adingra | 13 | 20 scored (1.54/m) | 5G in 7 (0.71/m) |
| Akliouche | 16 | 22 scored (1.38/m) | 3G in 4 (0.75/m) |
| Zakaria | 15 | 20 scored (1.33/m) | 5G in 5 (1.00/m) |

With Akliouche likely OUT and Zakaria DOUBTFUL, Monaco lose significant creative and box-to-box quality. Adingra's availability is crucial — Monaco score nearly twice per game with him vs without.

### 1G. Absence Impact

**Monaco key absences:**
- **Akliouche** (hip): Started 16/20 games. Creative hub. Team scored 1.38/m with him vs 0.75 without. Major loss if absent.
- **Zakaria** (precautionary): Started 15/20. Versatile midfielder/defender. Team scored 1.33/m with vs 1.00 without. Important but less impactful.
- **Salisu**: Played in games 12-20 (earlier games). CB. With injuries to Dier, Mawissa, and Salisu, Monaco's CB options are severely limited to Faes, Kehrer, and perhaps Teze/Caio Henrique in defence.
- **Biereth** (ill): Super-sub. Monaco scored 4G in the 4-0 vs Rennes without him starting. Impact is secondary.

**PSG key absences:**
- **Dembélé**: 8G in L1, rating 3.9 (highest). Significant but Doué deputised brilliantly in the CL ties (2G, 1A off bench vs Monaco). Doué may actually be a more dynamic threat against Monaco's back line.
- **Fabián Ruiz**: Midfield depth reduced.
- **Nuno Mendes**: In rehabilitation. Hernández is a capable deputy.

### 1H. League Context & Motivation

**League standings**: PSG 1st (57 pts, 24 games), Monaco 7th (37 pts). PSG lead Lens by 4 points. Monaco are 20 points behind — title is not in play, but they're competing for European spots.

**PSG context**: Unbeaten at home in L1 (W10, D1). Also have Chelsea CL in 5 days — some rotation possible but PSG typically field strong XIs at home. Home form: 30 GF in 11 games (2.73/m), only 4 GA (0.36/m). **PSG have conceded 0 or 1 in virtually every home game.**

**Monaco context**: Moderate away form (W3, D3, L5 in 11 away L1 games, 13 GF, 17 GA). Form improving recently (2 away wins in last 3 L1 away games: 3-2 at Lens, 0-0 at Nice) but the trip to Parc des Princes is a different challenge entirely. Heavily depleted squad.

**League baselines**:
- League avg goals/match: 2.79. PSG home pushes this well above average.
- League BTTS: 54.2%. Monaco away BTTS at 50%, but PSG home clean sheet rate appears ~70-75%.
- League over-2.5: 53%. PSG home games likely well above this (est. ~64% from 30G in 11 = 2.73 avg scored alone).

---

## Phase 2 — Predicted Distribution

### PSG Goals Scored

**Factors pushing UP:**
- PSG average 2.73 goals/m at home in L1 — elite level
- Season xG of 4.68/m (all comps) and actual goals of 4.18/m → underperforming xG, suggesting finishing quality will normalize upward
- Monaco's away defence concedes 1.80/m (all) and 1.33/m (L1 away) — above league average
- Monaco missing up to 6 first-team players (Salisu, Dier, Mawissa, Ouattara, possibly Zakaria and Akliouche) — defensive structure severely compromised
- H2H: PSG generated 1.48 xG when visiting Monaco (L1), and had 51 shots across two CL legs. At home, they should create more.
- PSG's PPDA likely very aggressive at home. Monaco under Pocognoli press too, creating an open transition game

**Factors pulling DOWN:**
- Possible rotation for Chelsea CL (5 days later). Doué may be rested.
- Monaco CAN be organized (0-0 at Nice, 0-0 at Le Havre recently)
- Dembélé absent reduces width/creativity
- Monaco showed they can frustrate PSG: 1-0 win at home (L1), 2-2 in CL at Parc des Princes

**Assessment**: The defensive absences for Monaco are the dominant factor. PSG's home record of 2.73 GF/m already factors in playing against teams trying to defend deep. Against a weakened Monaco defence, I'd expect at least that level. However, CL rotation moderates slightly.

**Central estimate: PSG 2.3 goals** (range 1.5 – 3.5)

### Monaco Goals Scored

**Factors pushing UP:**
- Balogun in excellent recent form (4G in last 6 games)
- Adingra has been a dynamic addition since January
- Recent scoring trend: 2.00/m in last 6 games overall
- Monaco scored 2 at the Parc des Princes just 9 days ago (CL)
- Late-goal profile (28% of goals 61-75') — even if trailing, they find goals

**Factors pulling DOWN:**
- Away L1 scoring just 0.67/m — very poor
- Failed to score in 40% of away games (50% in L1 away: 3 out of 6)
- PSG home GA is just 0.36/m — best defensive home record in the league
- Akliouche (key creator) likely out; Zakaria doubtful
- xG away is 1.30/m but actual away scoring only 1.00 (and 0.67 in L1) → Monaco are already underperforming their away xG
- PSG's 4 GA in 11 home games suggests a clean sheet probability of ~65-70%

**Assessment**: Monaco's L1 away scoring is genuinely poor (0.67/m), and PSG's home defence is the league's best. The CL games showed Monaco CAN score at the Parc des Princes, but the CL environment is different (Monaco were more motivated/desperate). With key creative absences, I lean toward the lower end.

**Central estimate: Monaco 0.7 goals** (range 0.2 – 1.3)

### Match Totals

PSG 2.3 + Monaco 0.7 = **3.0 total** (range 2.0 – 4.5)

### Goal Spread

2.3 - 0.7 = **+1.6 in favour of PSG** (range +0.5 to +3.0)

### BTTS Probability

PSG fail to score at home: ~0% based on L1 home record (scored in 10/11, and the draw was 3-3).
Monaco fail to score: ~55-60% based on L1 away data (failed to score in 3/6) and PSG's defensive home record.

P(BTTS Yes) ≈ 1 - P(Monaco blanked) = 1 - 0.57 = **~43%**

Cross-check: Poisson with λ_Monaco = 0.7 → P(Monaco = 0) = e^(-0.7) = 0.497. So P(BTTS Yes) ≈ 1 - 0.497 - P(PSG=0)×(1-0.497) ≈ 1 - 0.497 - 0.10×0.503 ≈ 1 - 0.497 - 0.050 = **0.453 ≈ 45%**

Actually, more precisely: P(BTTS) = 1 - P(A=0) - P(B=0) + P(A=0 ∧ B=0)
P(A=0) = e^(-2.3) = 0.100
P(B=0) = e^(-0.7) = 0.497
P(A=0 ∧ B=0) = 0.100 × 0.497 = 0.050 (assuming independence)
P(BTTS) = 1 - 0.100 - 0.497 + 0.050 = **0.453 ≈ 45%**

### Match Result Probabilities

Using Poisson (λ_A = 2.3, λ_B = 0.7):

Let me build the scoreline matrix for key outcomes:

| Score | P(A=a) | P(B=b) | Joint |
|-------|--------|--------|-------|
| 0-0 | 0.1003 | 0.4966 | 0.0498 |
| 1-0 | 0.2307 | 0.4966 | 0.1145 |
| 2-0 | 0.2653 | 0.4966 | 0.1317 |
| 3-0 | 0.2034 | 0.4966 | 0.1010 |
| 4-0 | 0.1170 | 0.4966 | 0.0581 |
| 5-0 | 0.0538 | 0.4966 | 0.0267 |
| 0-1 | 0.1003 | 0.3476 | 0.0349 |
| 1-1 | 0.2307 | 0.3476 | 0.0802 |
| 2-1 | 0.2653 | 0.3476 | 0.0922 |
| 3-1 | 0.2034 | 0.3476 | 0.0707 |
| 4-1 | 0.1170 | 0.3476 | 0.0407 |
| 5-1 | 0.0538 | 0.3476 | 0.0187 |
| 0-2 | 0.1003 | 0.1217 | 0.0122 |
| 1-2 | 0.2307 | 0.1217 | 0.0281 |
| 2-2 | 0.2653 | 0.1217 | 0.0323 |
| 3-2 | 0.2034 | 0.1217 | 0.0248 |
| 0-3 | 0.1003 | 0.0284 | 0.0028 |
| 1-3 | 0.2307 | 0.0284 | 0.0066 |
| 2-3 | 0.2653 | 0.0284 | 0.0075 |
| 3-3 | 0.2034 | 0.0284 | 0.0058 |

**P(Home win)**: Sum where A > B
= (1-0)0.1145 + (2-0)0.1317 + (3-0)0.1010 + (4-0)0.0581 + (5-0)0.0267
+ (2-1)0.0922 + (3-1)0.0707 + (4-1)0.0407 + (5-1)0.0187
+ (3-2)0.0248 + (4-2)0.0142 + (5-2)0.0066
+ (4-3)0.0033 + (5-3)0.0015
+ (5-4)0.0003
= 0.1145+0.1317+0.1010+0.0581+0.0267+0.0922+0.0707+0.0407+0.0187+0.0248+0.0142+0.0066+0.0033+0.0015+0.0003
= **0.705 ≈ 70.5%**

**P(Draw)**: Sum where A = B
= (0-0)0.0498 + (1-1)0.0802 + (2-2)0.0323 + (3-3)0.0058 + (4-4)0.0007 + (5-5)0.0001
= **0.169 ≈ 16.9%**

**P(Away win)** = 1 - 0.705 - 0.169 = **0.126 ≈ 12.6%**

### Clean Sheet Probabilities

P(PSG clean sheet) = P(Monaco = 0) = e^(-0.7) = **49.7%**
P(Monaco clean sheet) = P(PSG = 0) = e^(-2.3) = **10.0%**

### Reconciliation of Contradictions

1. **Monaco scored 2 at Parc des Princes 9 days ago (CL), but Ligue 1 away scoring is 0.67/m**: The CL game was a high-stakes tie where Monaco needed goals. The 90'+1 equalizer (Teze) was extraordinary. CL intensity ≠ league rhythm. PSG also had 21 shots to 10 — they dominated. I trust the L1 away baseline more heavily but bump it slightly for the tactical familiarity Monaco now have with PSG's setup. Net: I keep λ_B at 0.7, slightly above the 0.67 L1 away baseline.

2. **PSG's season xG (4.68/m) vs my projected 2.3 goals**: The season xG includes all comps (some against weaker CL opponents like Bodo, Leverkusen 7-2). PSG's home L1 output of 2.73 GF/m is the better reference. With CL rotation possible and Monaco being a quality opponent, 2.3 is appropriate — below the home average but reflecting opponent quality.

3. **Monaco's recent scoring trend (2.00/m in last 6) vs away scoring (0.67-1.00/m)**: The recent trend includes 4 home games and only 2 away. Both recent away games produced 3 goals (Lens) and 0 goals (Nice). I weight the away-specific data more for this away match.

---

## Phase 3 — Value Identification

### ❌ NO ODDS AVAILABLE

The report explicitly states "Event not found — odds unavailable." Without bookmaker odds, **no edge calculations can be performed**, and **no value picks can be recommended.**

### Poisson Model Outputs for Reference

Using λ_PSG = 2.3, λ_Monaco = 0.7:

| Market | Model Probability |
|--------|-------------------|
| PSG Win | 70.5% |
| Draw | 16.9% |
| Monaco Win | 12.6% |
| Over 1.5 | 84.2% |
| Over 2.5 | 62.8% |
| Over 3.5 | 38.6% |
| BTTS Yes | 45.3% |
| BTTS No | 54.7% |
| PSG -1.5 AH | 45.5% |
| PSG -2.5 AH | 23.6% |
| PSG Clean Sheet | 49.7% |

Most likely scorelines: **2-0 (13.2%)**, **1-0 (11.5%)**, **3-0 (10.1%)**, **2-1 (9.2%)**, **1-1 (8.0%)**.

---

## Phase 4 — Output

### Statistical Summary

| Metric | PSG (Home) | Monaco (Away) |
|--------|------------|---------------|
| Venue-filtered avg scored | 2.73 (n=11, L1) | 1.00 (n=10, all) / 0.67 (n=6, L1) |
| Venue-filtered avg conceded | 0.36 | 1.80 (all) / 1.33 (L1) |
| All-games avg scored | 2.21 (n=24, L1) | 1.30 (n=20) |
| All-games avg conceded | 0.79 | 1.60 |
| Venue-filtered xG avg | N/A | 1.30 (L1 away) |
| Venue-filtered npxG avg | N/A | ~1.30 (L1 away) |
| xG-to-goals ratio | 0.89 (season) | 0.89 (L1) |
| npxG-to-goals ratio | N/A | ~0.94 |
| Avg PPDA (venue) | Est. <10 | 8.45 (L1 away) |
| Avg deep completions (venue) | N/A | 7.00 (L1 away) |
| BTTS % (venue) | Est. ~27% | 50% (all away) |
| Clean sheet % (venue) | Est. ~70% | 30% (all away) |
| H2H avg total (last 3) | 3.33 | - |
| League avg goals/match | 2.79 | - |
| League BTTS% | 54.2% | - |
| League over-2.5% | 53% | - |

**Predicted scoreline**: PSG **2.3** - **0.7** Monaco
**Match result**: Home **70.5%** / Draw **16.9%** / Away **12.6%**
**Predicted total**: 2-4 (central **3.0**)
**BTTS**: **45%**

### Value Picks

| # | Market | Pick | Line | Odds | Est. Prob | Implied Prob | Edge | Confidence |
|---|--------|------|------|------|-----------|--------------|------|------------|
| — | **No odds available** | — | — | — | — | — | — | — |

**No value picks can be identified.** Odds were not provided in the report. The model probabilities above should be compared against any lines the reader can source independently.

### Markets to Monitor (if odds become available)

1. **PSG Win** (70.5% model probability): If available at implied probability ≤ 65%, there would be edge. PSG's home dominance (W10, D1, L0), Monaco's depleted squad, and the quality gap all support this.

2. **Under 3.5 goals** (61.4% model probability): Despite PSG's prolific attack, Monaco's low away scoring (0.67/m in L1) and their tendency toward cagey away displays (three 0-0s in last 7 away games) compress the total. The most likely cluster of scorelines (2-0, 1-0, 3-0, 2-1) all fall under 3.5.

3. **BTTS No** (54.7% model probability): PSG's home clean sheet rate (~70% from league data) is extraordinary. Monaco fail to score in 40-50% of away games and are missing Akliouche. Any BTTS No line implying ≤ 48% would have value.

4. **PSG -1.5 Asian Handicap** (45.5% model probability): Represents the modal outcome cluster (2-0, 3-0, 3-1). Would need odds implying ≤ 40% to hold clear value.

### Bets to Avoid

1. **Over 2.5 goals** at typical prices: While model gives 62.8%, Monaco's L1 away profile is heavily defensive (total avg 2.00 in L1 away, median 1.0). Three 0-0 draws in their last 7 away games means this market is fragile — if Monaco park the bus and PSG rotate, a 1-0 or 2-0 is highly plausible.

2. **BTTS Yes**: At 45% model probability, this is below the typical implied probability at standard BTTS Yes odds (-110 to -120). PSG's home defence is too good to back Monaco to score at market prices.

### Caveats

1. **PSG match-by-match data is entirely missing.** All PSG estimates rely on aggregate league tables and season stats, with no xG, PPDA, deep completion, or lineup-level granularity. This is the most severe limitation — my PSG projections carry wide uncertainty bands.

2. **No odds available.** Without bookmaker lines, no edge or value can be formally identified. The analysis provides model probabilities only.

3. **CL rotation risk**: PSG face Chelsea in 5 days. If Luis Enrique rests Vitinha, Barcola, or Kvaratskhelia, PSG's attacking output could drop significantly. This is an unquantifiable downside risk to the PSG goals estimate.

4. **Monaco injury updates are partially sourced from pre-match press conferences** — Zakaria and Biereth were "doubtful" as of the last report. If both start, Monaco's attacking quality improves materially (perhaps +0.15 to λ_Monaco).

5. **Small sample sizes**: Monaco L1 away = 6 games. PSG home = 11 games. H2H at this venue = 1 game (CL, different competition context). All conclusions should be treated with appropriate caution.

6. **Poisson assumption**: Monaco's away goals conceded show significant overdispersion (variance 3.36 vs mean 1.80). A Negative Binomial might better model the tails, but the central tendencies remain similar. The Poisson likely underestimates the probability of extreme scorelines (0-0 and 5-0+ type results).