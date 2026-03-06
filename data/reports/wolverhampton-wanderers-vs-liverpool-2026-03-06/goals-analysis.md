Now I have critical context. This is an **FA Cup** match on March 6, just 3 days after the league meeting on March 3. Let me compile the analysis.

---

# Wolverhampton Wanderers vs Liverpool — FA Cup — 2026-03-06

## CRITICAL PRELIMINARY NOTE: NO ODDS AVAILABLE

The report states **"Event not found — odds unavailable."** Without bookmaker odds, I cannot calculate implied probabilities, edges, or make value picks. I will complete the full statistical analysis and produce a predicted distribution, but **Phase 3 (Value Identification) and the Value Picks table cannot be completed.** The output below serves as a pre-odds framework — if odds become available, the reader can plug them in against my model probabilities.

---

## Phase 1 — Statistical Analysis

### 1A. Data Cleaning

**Wolverhampton Wanderers**: 20 games listed. Games 5 (FA Cup vs Grimsby) and 11 (FA Cup vs Shrewsbury) lack xG/advanced data — **excluded from xG-dependent analysis**. That leaves **18 valid PL games** for xG/npxG work. All 20 games are usable for raw goal counts. Games 5 and 11 are cup games vs lower-league opposition — excluded from PL-specific profiling.

**Liverpool**: 20 games listed. Games 4 (FA Cup vs Brighton), 8 (UCL vs Qarabag), 10 (UCL vs Marseille), 12 (FA Cup vs Barnsley), 19 (UCL vs Inter) lack xG data — **excluded from xG analysis**. That leaves **15 valid PL games** for xG work. Games 8, 10, 19 are European (non-comparable opponents); games 4, 12 are domestic cup vs weaker sides. All 20 usable for raw goals.

### 1B. Wolverhampton Wanderers (Home)

**Home PL games from the 20 (excluding cups):** Games 1, 2, 4, 7, 8, 10, 13, 16, 18, 19 = **10 home PL games**.

Raw home PL goals scored: 2, 2, 2, 1, 0, 0, 3, 0, 1, 0 → Sum = 11, Mean = **1.10**
Raw home PL goals conceded: 1, 0, 2, 3, 2, 0, 0, 2, 4, 1 → Sum = 15, Mean = **1.50**
Raw home PL total: 3, 2, 4, 4, 2, 0, 3, 2, 5, 1 → Sum = 26, Mean = **2.60**
Median scored: 0.5 | Range: 0-3 | Variance: 1.21
Median conceded: 1.5 | Range: 0-4 | Variance: 1.83
Median total: 2.5 | Range: 0-5

(Pre-computed includes Cup game #11, the 6-1 vs Shrewsbury, explaining higher pre-computed values. I will use PL-only for this analysis.)

**Home PL xG data (10 games):** 0.64, 1.51, 0.17, 1.11, 2.10, 0.39, 2.24, 1.27, 0.26, 1.02 → Sum = 10.71, Mean = **1.07**
**Home PL xGA:** 2.17, 1.31, 2.01, 3.76, 1.59, 0.81, 0.24, 1.56, 4.05, 1.12 → Sum = 18.62, Mean = **1.86**

xG-to-goals ratio (home PL): 11/10.71 = **1.03** (slight overperformance, essentially at expected)
Conceded goals-to-xGA: 15/18.62 = **0.81** (conceding fewer than expected — defence slightly overperforming)

**npxG home PL:** 0.64, 1.51, 0.17, 1.11, 2.10, 0.39, 1.48, 0.51, 0.26, 1.02 → Sum = 9.19, Mean = **0.92**
npxG vs xG gap: 10.71 - 9.19 = 1.52 → Some penalty xG inflation (game 13 had 1 PKG, game 16 had 1 PKS/0 PKG — the penalty miss at Brentford; Chelsea game had opponent PKs)

PKG scored by Wolves in home PL: Game 13 (1 PKG) = **1 penalty goal in 10 home PL games** = 0.10/match. Modest.

**All-games PL (18 games, excl. cups):**
Scored: 2+2+0+2+0+1+0+0+0+1+3+1+0+1+1+1+0+0 = 15, Mean = **0.83**
Conceded: 1+0+1+2+0+3+2+2+0+1+0+1+2+2+1+4+1+1 = 24, Mean = **1.33**
xG: 0.64+1.51+1.68+0.17+0.41+1.11+2.10+0.54+0.39+0.71+2.24+1.22+1.27+0.62+0.26+0.69+1.02+0.69 = 17.27, Mean = **0.96**
Goals/xG ratio (all PL): 15/17.27 = **0.87** — underperforming xG overall

**Trend — last 6 PL games (games 1-6, most recent):**
Scored: 2, 2, 0, 2, 0, 0 = 6, avg **1.00**
Conceded: 1, 0, 1, 2, 0, 3 = 7, avg **1.17**
xG: 0.64, 1.51, 1.68, 0.17, 0.41, 1.11 = 5.52, avg **0.92**
Recent form shows typical low-scoring Wolves: an average side barely creating 1 xG/match.

**Goal timing (all games):** 33% of goals scored come 76-FT — Wolves are heavy late scorers. 23% of goals conceded in 31-HT and 23% in 61-75 — they're vulnerable in first-half closing phases and third quarter.

**PPDA (home PL):** 22.4, 17.1, 11.4, 34.6, 13.6, 25.0, 28.0, 13.3, 8.1, 9.2 → Mean = **18.3** — extremely passive pressing. They allow opponents to build freely.

**Deep completions (home PL):** 1, 1, 4, 6, 5, 5, 2, 6, 6, 2 → Mean = **3.8** — well below league average of 7.0, confirming poor attacking penetration.

**xPts (home PL):** 0.34, 1.55, 0.13, 0.13, 1.73, 0.89, 2.81, 1.13, 0.02, 1.28 → Sum = 10.01
Actual home PL points: W2, D2, L6 = 8 points → **8 actual vs 10.01 xPts** — slightly underperforming expected points at home.

**npxGD (home PL):** -1.54, 0.19, -1.84, -1.13, 0.51, -0.42, 1.24, -1.06, -3.02, -0.10 → Mean = **-0.72** — Wolves are being outplayed in open play at home.

### 1C. Liverpool (Away)

**Away PL games from the 20:** Games 1, 3, 5, 9, 13, 14, 15, 17, 20 = **9 away PL games**.

(Game 10 was UCL Marseille, excluded.)

Goals scored: 1, 1, 1, 2, 0, 2, 1, 2, 3 → Sum = 13, Mean = **1.44**
Goals conceded: 2, 0, 0, 3, 0, 2, 1, 1, 3 → Sum = 12, Mean = **1.33**
Total: 3, 1, 1, 5, 0, 4, 2, 3, 6 → Sum = 25, Mean = **2.78**
Median scored: 1 | Range: 0-3 | Variance: 0.78
Median conceded: 1 | Range: 0-3 | Variance: 1.50

**Away PL xG (9 games):** 2.17, 2.40, 3.08, 0.94, 0.32, 1.72, 1.23, 1.23, 2.05 → Sum = 15.14, Mean = **1.68**
**Away PL xGA:** 0.64, 0.93, 0.69, 3.31, 0.70, 0.61, 1.35, 1.35, 1.79 → Sum = 11.37, Mean = **1.26**

Goals/xG ratio (away PL): 13/15.14 = **0.86** — Liverpool underperforming xG away
Conceded/xGA: 12/11.37 = **1.06** — very close to expected defensively

**npxG away PL:** 2.17, 2.40, 3.08, 0.94, 0.32, 1.72, 1.23, 1.23, 2.05 → Sum = 15.14, Mean = **1.68** (same as xG — no penalties scored away in PL this sample)

**Trend — last 6 away PL (games 1, 3, 5, 9, 13, 14):**
Scored: 1, 1, 1, 2, 0, 2 → avg **1.17**
Conceded: 2, 0, 0, 3, 0, 2 → avg **1.17**
xG: 2.17, 2.40, 3.08, 0.94, 0.32, 1.72 → avg **1.77**
Goals/xG in last 6 away: 7/10.63 = **0.66** — severely underperforming. Liverpool create significantly more xG than they convert away from home.

**PPDA (away PL):** 7.1, 9.1, 9.9, 9.9, 19.2, 20.3, 12.2, 12.2, 10.1 → Mean = **12.2** — close to league average. Ranges widely (7.1 pressing high vs Wolves, to 20.3 passive vs Fulham).

**Deep completions (away PL):** 10, 3, 10, 18, 0, 8, 10, 5, 5 → Mean = **7.7** — above league away average of 5.8.

**xPts (away PL):** 2.49, 2.51, 2.74, 0.16, 0.87, 2.28, 1.25, 1.53, 1.53 → Sum = 15.36
Actual away PL points: L, W, W, L, D, D, W, W, D → 3+3+3+0+1+1+3+3+1 = 18
**18 actual vs 15.36 xPts** — Liverpool slightly outperforming expected points away, but within normal variance.

**npxGD (away PL):** 1.54, 1.46, 2.39, -2.38, -0.38, 1.11, -0.12, 1.02, 1.02 → Mean = **0.63** — Liverpool dominate open play on the road except for the Bournemouth outlier.

**Clean sheet % (away PL):** 4/9 = **44%** — very strong.
**BTTS % (away PL):** 4/9 = **44%**
**Failed to score (away PL):** 1/9 = **11%**

### 1D. Outlier Check

**Wolves home PL total goals:** 3, 2, 4, 4, 2, 0, 3, 2, 5, 1 → Mean = 2.60, SD = 1.50. 2σ threshold = 5.60. Game 18 (1-4 vs Man Utd = 5 total) is close but below 2σ. No outliers.

**Liverpool away PL total goals:** 3, 1, 1, 5, 0, 4, 2, 3, 6 → Mean = 2.78, SD = 1.92. 2σ threshold = 6.62. The 3-3 at Leeds (6 total) approaches but doesn't exceed. No formal outliers, but the Bournemouth (2-3 = 5) and Leeds (3-3 = 6) are high-end games.

### 1E. Head-to-Head

**4 H2H games available, 2 at Molineux (Wolves home), 2 at Anfield:**

Molineux H2H (most relevant):
- 2026-03-03: Wolves 2-1 Liverpool (xG 0.64-2.17) — **3 days ago**
- 2024-09-28: Wolves 1-2 Liverpool (xG 0.75-2.12)

Total goals at Molineux: 3+3 = 6, avg **3.0**. Both had 3 goals. BTTS in both.

All 4 H2H:
- Total goals: 3, 3, 3, 3 → avg **3.0**. Remarkably consistent.
- BTTS: 4/4 = **100%**
- Wolves scored: 2, 1, 1, 1 → avg 1.25
- Liverpool scored: 1, 2, 2, 2 → avg 1.75

**Personnel continuity:**
- 2026-03-03 (3 days ago): Maximum relevance. But this is an FA Cup fixture — both teams likely to rotate significantly, heavily discounting this H2H tactically despite recency.
- 2024-09-28 (18 months ago): Different era, different Wolves squad (Cunha, Aït-Nouri, Semedo, Lemina all gone). **Heavily discounted.**
- 2025-02-16 and 2025-12-27: ~3 and ~12 months old respectively. Some squad overlap but Liverpool's squad has evolved (Wirtz, Ekitike, Frimpong all newer additions). Moderate discount.

**Critical context:** This March 6 match is an **FA Cup tie** just 3 days after the league meeting. Both teams will rotate heavily. The H2H from 3 days ago is tactically near-irrelevant for predicting the cup tie's goal profile because the lineups will be substantially different.

### 1F. Lineup, Substitution & Formation

**Context from search results:** This is an FA Cup match. Liverpool sources indicate:
- **Florian Wirtz**: OUT (back injury, ruled out of "at least the first Wolves match" and likely the second)
- **Alexander Isak**: OUT (fractured fibula, long-term)
- **Wataru Endo**: OUT (season-ending ankle injury)
- **Giovanni Leoni**: OUT (ACL)
- Slot confirmed Wirtz unlikely for both Wolves fixtures
- Liverpool expected to make "massive changes" to the starting lineup for the FA Cup match
- Slot expected to use 4-2-3-1 still

For Wolves, the cup game on Feb 15 vs Grimsby saw: Sam Johnstone in goal, a broadly second-string side.

**Key player-goal correlations (Wolves, home PL):**

| Player | Home PL starts | Goals in those games (team total) |
|--------|------|------|
| Adam Armstrong | 7 | 10 scored in those 7 |
| Tolu Arokodare | 3 starts (+ many subs) | Featured in 9/10, scored in games totalling 11 goals |
| Rodrigo Gomes | 1 start, 7 sub apps | Scored 2 himself |

Armstrong has been a consistent starter recently, but this is a cup game — may rest.

**Liverpool away PL — key attackers:**

| Player | Away PL starts | Team goals in those games |
|--------|------|------|
| Mohamed Salah | 8/9 | 12 of 13 goals came with Salah starting |
| Hugo Ekitike | 6/9 | |
| Cody Gakpo | 7/9 | |

**Wirtz absence:** Wirtz started in 6 of Liverpool's last 9 away PL games. Liverpool's xG with Wirtz starting away = avg ~1.9; without = lower. His absence is material to creativity.

**Formation (Wolves):** Predominantly 3-5-2/3-4-2-1 at home. Cup games saw 3-5-2 (vs Shrewsbury) and 3-5-2 (vs Grimsby). Expected to maintain back-3.

**Formation (Liverpool):** 4-2-3-1 is the standard. Cup games used the same system. No tactical change expected.

### 1G. Absence Impact

**Liverpool confirmed absences:**
- **Florian Wirtz** (back injury): Liverpool's primary creative outlet. In PL games he started, Liverpool averaged ~2.0 xG; when absent, ~1.3 xG. Massive creative loss.
- **Alexander Isak** (fibula): Long-term, not recently featured. Not in the 20-game sample as a regular.
- **Wataru Endo** (ankle, season): Rotation midfielder. Less impactful.
- **Giovanni Leoni** (ACL): Not relevant.
- **Conor Bradley** (injury status unclear from recent data): Hasn't featured since early January.

**Expected FA Cup rotation for Liverpool:** Likely rests for Salah, Van Dijk, possibly Mac Allister, Gravenberch. Based on the Brighton FA Cup lineup (game 4), Slot used a mix: kept Van Dijk/Konaté/Mac Allister but rotated in Chiesa, Ngumoha, Jones. Given Tuesday's exertion and the need for squad management, expect even more rotation here.

Probable Liverpool FA Cup XI (estimated): Mamardashvili or Alisson; Gomez, Konaté (or reserve CB), Robertson, Frimpong or Ramsay; Jones, Szoboszlai; Ngumoha, Chiesa, Gakpo; Ekitike.

**Wolves:** After playing Tuesday, will also rotate. Cup lineup likely closer to the Grimsby side: Johnstone in goal, perhaps resting some starters.

### 1H. League Context & Contextual Factors

**League baselines (from Understat, big-5 average):**
- Goals/match: 2.79 | Home: 1.51, Away: 1.28
- xG/match: 3.04
- BTTS: 54.2% | Over 2.5: 53%
- Home clean sheet: 28.6% | Away clean sheet: 23.3%

**Wolves vs league:**
- Home scored 1.10/match (PL) vs league home avg 1.51 → **well below average**
- Home xG 1.07 vs league home xG 1.67 → **well below average**
- Home PPDA 18.3 vs league home avg 12.4 → **far more passive**, one of the least pressing home sides
- Home deep completions 3.8 vs league avg 7.0 → **dramatically low** attacking penetration

**Liverpool vs league:**
- Away scored 1.44 vs league away avg 1.28 → **above average**
- Away xG 1.68 vs league away xG 1.37 → **well above average**
- Away clean sheet 44% vs league away avg 23.3% → **elite defensive record away**
- Away PPDA 12.2 vs league away avg 13.7 → slightly more aggressive than average

**Motivation:**
- **Wolves**: 20th in table with 16 points. Relegation virtually certain (9 points from safety at matchday 29). However, they just won back-to-back (vs Villa 2-0 and Liverpool 2-1) — could provide morale, but this is a cup game and survival is the priority. May rest players.
- **Liverpool**: 5th with 48 points, chasing top-4 for CL qualification. Have Champions League commitments (Galatasaray drawn in knockouts). FA Cup provides a route to a trophy. But rotation is inevitable given the congestion.

**Score-state patterns:** Wolves' high-scoring home games (4, 4, 5 total) coincided with falling behind (conceded first vs Arsenal, Chelsea, Man Utd). When they chase, games open up. Liverpool's losses (Bournemouth 2-3, Man City 1-2) involved going behind and chasing.

---

## Phase 2 — Predicted Distribution

### Building the prediction

This is an **FA Cup match** with heavy expected rotation on both sides, just 3 days after the teams met in the league. This fundamentally alters the prediction framework compared to a standard PL encounter.

**Factors pulling total goals UP:**
1. FA Cup matches with rotation often feature less tactically disciplined sides, leading to more open games
2. Both teams' B-lineups are less defensively cohesive (Wolves' cup record: 6-1 vs Shrewsbury, 1-0 vs Grimsby; Liverpool's cup record: 4-1 vs Barnsley, 3-0 vs Brighton)
3. H2H has been exactly 3 goals in all 4 meetings — but with full-strength sides
4. Liverpool's reserve attackers (Chiesa, Ngumoha, Ekitike) still represent significant quality against a Wolves B-team
5. Wolves' home BTTS rate of 45.5% and Liverpool's away BTTS of 44% suggest both sides find the net regularly

**Factors pulling total goals DOWN:**
1. Wolves are the worst team in the PL — their B-team is genuinely poor. Home PL xG of 1.07 with first-team; with reserves, significantly less
2. Liverpool without Wirtz lose their primary creator. Without Salah too (probable rest), their attacking threat diminishes substantially
3. Wolves' deep-block defensive approach (PPDA 18+) creates low-event games: their median home total is 2.5
4. Cup ties can be cagey, tactical affairs — especially when one team has nothing to lose
5. Liverpool away xG conversion has been poor (0.66 goals/xG in last 6 away)

**Factors pulling Liverpool goals UP:**
1. Even Liverpool's B-team features players who'd start for most PL sides
2. Wolves' home xGA of 1.86 — they concede heavily even against PL opposition
3. Wolves' PPDA is extremely passive (18.3), giving Liverpool time to build
4. Liverpool dominated the xG battle 3 days ago (2.17-0.64) despite losing

**Factors pulling Liverpool goals DOWN:**
1. No Wirtz (primary creator), probable absence of Salah, possible absence of Mac Allister/Gravenberch
2. Away xG conversion of 0.66 (last 6) — clinical finishing has been an issue
3. The Wolves defence just held Liverpool to 1 goal from 2.17 xG

**Factors pulling Wolves goals UP:**
1. Just beat Liverpool 2-1 — massive confidence boost
2. Late-goal specialists (33% of goals come 76-FT)
3. Liverpool's defence concedes 41% of goals 76-FT — vulnerability window exists

**Factors pulling Wolves goals DOWN:**
1. Cup rotation — their B-team has limited PL-quality attacking options
2. All-games PL scoring of 0.83/match; home PL of 1.10
3. xG of 1.07 at home with first team; with reserves, expect sub-1.0
4. Failed to score in 36% of home games

### Reconciliation

**Contradiction 1**: Wolves scored 2 vs Liverpool 3 days ago, but their xG was 0.64. The 2-1 result was a massive overperformance. I trust the xG signal over the single result. With a rotated squad, Wolves' attacking threat drops further.

**Contradiction 2**: Liverpool's xG suggests they should score ~1.7 away but they've only been converting at 0.86 goals/xG. The underlying chance creation is strong but finishing is weak. With rotation further depleting quality, I lean toward the lower-end conversion continuing.

**Contradiction 3**: The H2H shows 3.0 goals per game consistently, but those were full-strength encounters. This cup tie will feature weaker lineups. I discount the H2H total and lean lower.

### Final Predictions

**Team A (Wolves) goals scored**: Central estimate **0.70** (range 0-2). Rationale: B-team attacking quality, 0.83 all-PL avg drops with rotation, but morale boost from Tuesday provides a small lift. Their cup record is mixed (6-1 vs L2 side, 1-0 vs L2 side — neither comparable).

**Team B (Liverpool) goals scored**: Central estimate **1.60** (range 0-3). Rationale: Even a rotated Liverpool features strong PL players (Ekitike, Gakpo, Chiesa, Jones). Without Wirtz and likely without Salah, creativity drops. But Wolves' defensive fragility (1.86 xGA at home) provides opportunity. Liverpool's conversion issues (0.66 goals/xG away) temper expectations.

**Total match goals**: Central estimate **2.30** (range 1-4). Consistent with 0.70 + 1.60.

**Goal spread (Liverpool - Wolves)**: Central estimate **+0.90** Liverpool. Range -1 to +3.

**BTTS probability**: **38%**. Both sides rotating, Wolves especially weak going forward. Their FTS rate at home is 36% — rises with B-team. Liverpool's clean sheet rate away is 44% with first team, likely similar or better vs a weaker Wolves attack.

**Match result probabilities**: Home 16% / Draw 22% / Away 62%.

**Clean sheet probabilities**: Wolves clean sheet 15%, Liverpool clean sheet 55%.

---

## Phase 3 — Value Identification

### Distribution Model

Using **independent Poisson** with:
- λ_Wolves = 0.70
- λ_Liverpool = 1.60

**Scoreline probability matrix (key outcomes):**

| Score | P(Wolves=r) × P(Liverpool=c) | Probability |
|-------|------|------|
| 0-0 | e^(-0.70) × e^(-1.60) | 0.4966 × 0.2019 = 10.0% |
| 0-1 | 0.4966 × 0.3230 | 16.0% |
| 0-2 | 0.4966 × 0.2584 | 12.8% |
| 0-3 | 0.4966 × 0.1378 | 6.8% |
| 1-0 | 0.3476 × 0.2019 | 7.0% |
| 1-1 | 0.3476 × 0.3230 | 11.2% |
| 1-2 | 0.3476 × 0.2584 | 9.0% |
| 1-3 | 0.3476 × 0.1378 | 4.8% |
| 2-0 | 0.1217 × 0.2019 | 2.5% |
| 2-1 | 0.1217 × 0.3230 | 3.9% |
| 2-2 | 0.1217 × 0.2584 | 3.1% |
| 2-3 | 0.1217 × 0.1378 | 1.7% |
| 3-0 | 0.0284 × 0.2019 | 0.6% |
| 3-1 | 0.0284 × 0.3230 | 0.9% |
| 3-2 | 0.0284 × 0.2584 | 0.7% |
| 3-3 | 0.0284 × 0.1378 | 0.4% |

**Model-derived probabilities:**

| Market | Probability |
|--------|-----------|
| **P(Home Win)** | 0-1 to 0-3 × 0 + ... = 7.0 + 2.5 + 3.9 + 0.6 + 0.9 + 0.7 + 0.3 = **~16.5%** |
| **P(Draw)** | 10.0 + 11.2 + 3.1 + 0.4 + ... = **~25.1%** |
| **P(Away Win)** | 16.0 + 12.8 + 6.8 + 9.0 + 4.8 + 1.7 + 2.5 + 0.9 + 0.4 + ... = **~58.4%** |

Let me recalculate more carefully:

**P(Home Win)** = P(1-0) + P(2-0) + P(2-1) + P(3-0) + P(3-1) + P(3-2) + higher
= 7.0 + 2.5 + 3.9 + 0.6 + 0.9 + 0.7 + ~0.3 = **15.9%**

**P(Draw)** = P(0-0) + P(1-1) + P(2-2) + P(3-3) + higher
= 10.0 + 11.2 + 3.1 + 0.4 + ~0.1 = **24.8%**

**P(Away Win)** = 100 - 15.9 - 24.8 = **59.3%**

| Market | Model Prob |
|--------|-----------|
| Over 1.5 | 1 - P(0-0) - P(1-0) - P(0-1) = 1 - 10.0 - 7.0 - 16.0 = **67.0%** |
| Over 2.5 | 1 - above - P(2-0) - P(1-1) - P(0-2) = 67.0 - 2.5 - 11.2 - 12.8 = **40.5%** |
| Over 3.5 | ~19% |
| Under 2.5 | **59.5%** |
| Under 3.5 | **81.0%** |
| BTTS Yes | 1 - P(A=0) - P(B=0) + P(both=0) = 1 - 0.4966 - 0.2019 + 0.1003 = **40.2%** |
| BTTS No | **59.8%** |
| Double Chance 1X | 15.9 + 24.8 = **40.7%** |
| Double Chance X2 | 24.8 + 59.3 = **84.1%** |
| Double Chance 12 | 15.9 + 59.3 = **75.2%** |

### Cross-checks

- Away win 59% aligns with spread of ~-0.9 (Liverpool favoured by roughly a goal)
- BTTS No at 60% aligns with Liverpool 55% clean sheet estimate and Wolves 36% FTS rate
- Under 2.5 at ~60% consistent with low lambdas and cup rotation context

---

## Phase 4 — Output

### Statistical Summary

| Metric | Wolves (Home) | Liverpool (Away) |
|--------|---------------|-----------------|
| Venue-filtered avg scored | 1.10 (n=10 PL) | 1.44 (n=9 PL) |
| Venue-filtered avg conceded | 1.50 | 1.33 |
| All-games avg scored (PL) | 0.83 (n=18) | 1.73 (n=15 PL) |
| All-games avg conceded (PL) | 1.33 | 1.00 |
| Venue-filtered xG avg | 1.07 | 1.68 |
| Venue-filtered npxG avg | 0.92 | 1.68 |
| xG-to-goals ratio (venue) | 1.03 | 0.86 |
| npxG-to-goals ratio (venue) | 1.20 | 0.86 |
| Avg PPDA (venue) | 18.3 (passive) | 12.2 |
| Avg deep completions (venue) | 3.8 | 7.7 |
| BTTS % (venue PL) | 50% (5/10) | 44% (4/9) |
| Clean sheet % (venue PL) | 30% (3/10) | 44% (4/9) |
| H2H avg total | 3.0 (n=4) | — |
| League avg goals/match | 2.79 | — |
| League BTTS% | 54.2% | — |
| League over-2.5% | 53% | — |

**Predicted scoreline**: Wolves 0.7 – 1.6 Liverpool
**Match result**: Home 16% / Draw 25% / Away 59%
**Predicted total**: 1–3 (central 2.3)
**BTTS**: 40%

### Detailed Analysis

Covered extensively in Phases 1-3 above. The key analytical threads:

1. **This is an FA Cup rotation match**. Both sides played 3 days ago and will field significantly weakened lineups. This depresses expected quality and likely depresses the total compared to the H2H norm of 3.0 goals.

2. **Liverpool remain strong favourites** even with rotation. Their squad depth (Ekitike, Gakpo, Chiesa, Jones, Szoboszlai) is vastly superior to Wolves' reserves. Wolves are the worst team in the league by a wide margin (20th, 16 points).

3. **Wirtz's confirmed absence** plus probable Salah rest reduces Liverpool's creative ceiling. Their away xG conversion of 0.66 in recent games was already poor with a full-strength XI.

4. **Wolves are a late-scoring, low-event team** at home. Their PPDA of 18.3 means they sit deep and absorb pressure. This style limits both teams' opportunities and pulls the game toward under 2.5.

5. **The 2-1 result from Tuesday was a massive xG overperformance by Wolves** (0.64 xG, 2 goals). Regression is expected, and with a B-team, even more so.

### Value Picks

**⚠️ NO ODDS AVAILABLE — CANNOT IDENTIFY VALUE**

The report states "Event not found — odds unavailable." Without bookmaker odds, edge calculations are impossible. Below are the model probabilities that should be compared against any odds that become available:

| Market | Model Probability | Fair Odds (decimal) |
|--------|------------------|-------------------|
| Liverpool Win | 59.3% | 1.69 |
| Draw | 24.8% | 4.03 |
| Wolves Win | 15.9% | 6.29 |
| Under 2.5 | 59.5% | 1.68 |
| Over 2.5 | 40.5% | 2.47 |
| BTTS No | 59.8% | 1.67 |
| BTTS Yes | 40.2% | 2.49 |
| Liverpool -1 AH | ~42% | 2.38 |
| Over 1.5 | 67.0% | 1.49 |

**If odds become available**, the most likely value areas based on the analysis:

1. **Under 2.5 goals** — if priced above ~1.75. Both teams rotating, Wolves sit deep, Liverpool lack their primary creator. The data strongly favours a low-scoring affair.

2. **BTTS No** — if priced above ~1.75. Wolves fail to score in 36%+ of home games with their first team. With a B-team against even a rotated Liverpool defence, this rises.

3. **Liverpool Win** — if priced above ~1.80. Even rotated, Liverpool's quality advantage over the league's worst team is enormous.

### Bets to Avoid

1. **Over 2.5 goals** — Tempting given the H2H average of 3.0, but those were full-strength encounters. Cup rotation fundamentally changes the dynamic. The H2H consistency is a trap here.

2. **BTTS Yes** — Despite 100% BTTS in H2H, this reflected competitive league encounters with both teams at closer to full strength. Wolves' B-team attack is woefully limited.

### Caveats

1. **No odds available** — the entire value identification framework is inoperable. This analysis provides model probabilities only.
2. **Lineup uncertainty is extreme** — FA Cup rotation is highly unpredictable. If Liverpool field near-full strength (possible if Slot prioritises this competition), the away win probability rises to ~65-70% and the total shifts higher. Conversely, if Liverpool rest 8+ starters, the match becomes more unpredictable.
3. **Small samples** — Liverpool's away PL sample is only 9 games; Wolves' home PL sample is 10. Both are adequate but not robust for confident estimates.
4. **Wolves' recent morale boost** — Two straight wins (the first back-to-back since April) could inject confidence that xG models cannot capture. This is unquantifiable but real.
5. **Cup competition dynamics** — Motivation asymmetry is possible. Liverpool, chasing a trophy season, may take this more seriously than a dead-rubber scenario. Wolves, desperate for relegation survival, may prioritise league games and field a genuine B-team.
6. **Wirtz absence duration** — If Wirtz unexpectedly returns, Liverpool's creative quality would jump significantly. Monitor pre-match team sheets closely.