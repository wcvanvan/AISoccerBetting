Based on my extensive research, I now have enough information to produce a thorough analysis despite the critical data gaps. Let me compile what I've gathered from external sources alongside the Monaco match data provided.

---

# PSG vs AS Monaco — Corner Kick Analysis (2026-03-06)

## ⚠️ CRITICAL DATA LIMITATIONS — FRONT AND CENTRE

**This analysis cannot be conducted to the standard required by the methodology.** Two of the three essential inputs are missing:

1. **PSG (Home/Team A):** Zero matches provided in the report. The entire home team's 20-game dataset is absent.
2. **Corner odds:** Listed as "Event not found — odds unavailable." Without bookmaker lines, no value identification is possible.
3. **H2H section:** No dedicated H2H data provided, though Monaco's 20-game history includes three PSG encounters.

**Without PSG match-level data (formations, lineups, corner splits by game, substitution patterns) and without bookmaker corner lines, the core analytical framework — statistical modelling, threshold frequency calculation, and edge identification — cannot be executed.** What follows is the best partial analysis possible, supplemented by external aggregate data, but it falls well short of the standard required for confident betting recommendations.

---

## Phase 1 — Statistical Analysis (Partial)

### 1A. Data Cleaning

| Team | Games in Report | Valid (corners present) | Excluded |
|------|----------------|----------------------|----------|
| PSG (Home) | 0 | 0 | N/A |
| Monaco (Away) | 20 | 20 | 0 |

All 20 Monaco games have complete corner data. Of these, 5 are Champions League games (vs PSG ×2, Juventus, Real Madrid, Bodø/Glimt, Pafos, Galatasaray — actually 6 CL games). Pafos and Bodø/Glimt are non-comparable opponents; the rest are reasonable benchmarks.

**PSG data is sourced externally from betoncorners.com and apwin.com.** I was able to reconstruct PSG's Ligue 1 match-by-match corner data but NOT their full lineup, substitution, or formation data. This limits player-correlation and formation analysis to Monaco only.

### 1B. PSG (Home) — Corner Stats (from external sources)

**Season-long Ligue 1 aggregates (24 games):**
- PSG corners won per game: **6.00** (league-leading alongside Lens/Lyon)
- PSG corners conceded per game: **2.67** (fewest in Ligue 1 by significant margin)
- PSG match total average (Ligue 1): **8.96**

**Champions League (5 league-phase games):**
- PSG corners won per game: **6.60**
- PSG corners conceded per game: **2.80**

**Available Ligue 1 match-by-match from betoncorners.com (H:A corner FT):**

| Date | Opponent | Venue | PSG:Opp Corners | Total |
|------|----------|-------|----------------|-------|
| 28/02 | Le Havre | A | — | — |
| 21/02 | Metz | H | 3:0 (?) | — |
| 13/02 | Rennes | A | — | — |
| 08/02 | Marseille | H | 5:0 (?) | — |
| 01/02 | Strasbourg | A | — | — |
| 16/01 | Lille | H | — | — |
| 11/01 | Paris FC | H | — | — |
| 04/01 | Nantes | H | — | — |

The external data I found includes the following **all-competitions match totals** (most recent 10):

| Opponent | Corner Split (PSG:Opp) | Total |
|----------|----------------------|-------|
| Tottenham (H, CL) | 5:5 | 10 |
| Lyon (A, L1) | 5:5 | 10 |
| Bayern (H, CL) | 9:1 | 10 |
| Nice (H, L1) | 11:1 | 12 |
| Lorient (A, L1) | 0:8 | 8 |
| Brest (A, L1) | 2:7 | 9 |
| Leverkusen (A, CL) | 3:4 | 7 |
| Strasbourg (H, L1) | 4:1 | 5 |
| Lille (A, L1) | 3:5 | 8 |
| Barcelona (A, CL) | 4:9 | 13 |

These are from Oct–Nov 2025, roughly 3–4 months old. More recent data (Dec 2025–Feb 2026) was not available at match-by-match granularity.

**PSG Home Ligue 1 subset (from the partial data):**
Identifiable home Ligue 1 games from the external data: vs Nice (12 total, 11-1), vs Strasbourg (5 total, 4-1), vs Auxerre (10 total, 5-5), vs Lens (7 total, 4-3), vs Angers (12 total, 12-0).

Home Ligue 1 totals from these 5 games: 12, 5, 10, 7, 12 → **mean 9.2, median 10, range 5–12**
PSG home corners won from these 5: 11, 4, 5, 4, 12 → **mean 7.2**
PSG home corners conceded: 1, 1, 5, 3, 0 → **mean 2.0**

The APWin data confirms PSG concede only **2.36 corners per home game** and the over 9.5 total corners percentage in PSG home games is only **27%** (home only, from APWin's detailed breakdown). This is critical: PSG's home dominance suppresses opponent corners dramatically.

### 1C. Monaco (Away) — Corner Stats

**Away games in Monaco's 20-game dataset:**
Games 2 (PSG CL), 3 (Lens L1), 6 (Nice L1), 9 (Le Havre L1), 10 (Real Madrid CL), 13 (Marseille L1), 15 (Brest L1), 17 (Pafos CL), 18 (Rennes L1), 20 (Bodø/Glimt CL) = **10 away games**

| # | Opponent | Monaco Won | Monaco Conceded | Total |
|---|----------|-----------|----------------|-------|
| 2 | PSG (CL) | 4 | 8 | 12 |
| 3 | Lens (L1) | 2 | 7 | 9 |
| 6 | Nice (L1) | 6 | 8 | 14 |
| 9 | Le Havre (L1) | 6 | 5 | 11 |
| 10 | Real Madrid (CL) | 6 | 10 | 16 |
| 13 | Marseille (L1) | 7 | 3 | 10 |
| 15 | Brest (L1) | 3 | 2 | 5 |
| 17 | Pafos (CL) | 3 | 5 | 8 |
| 18 | Rennes (L1) | 6 | 4 | 10 |
| 20 | Bodø/Glimt (CL) | 4 | 4 | 8 |

**Monaco away corners won:** 4, 2, 6, 6, 6, 7, 3, 3, 6, 4
- Mean: 47/10 = **4.70**
- Median: (6+4)/2 = **5.0**
- Range: 2–7
- Variance: Σ(x−μ)² = (0.49+7.29+1.69+1.69+1.69+5.29+2.89+2.89+1.69+0.49) = 26.10 → Var = 26.10/10 = **2.61**, SD = **1.62**

**Monaco away corners conceded:** 8, 7, 8, 5, 10, 3, 2, 5, 4, 4
- Mean: 56/10 = **5.60**
- Median: 5
- Range: 2–10
- Variance: Σ(x−μ)² = (5.76+1.96+5.76+0.36+19.36+6.76+12.96+0.36+2.56+2.56) = 58.40 → Var = 58.40/10 = **5.84**, SD = **2.42**

**Monaco away match totals:** 12, 9, 14, 11, 16, 10, 5, 8, 10, 8
- Mean: 103/10 = **10.30**
- Median: 10
- Range: 5–16
- Variance: Σ(x−μ)² = (2.89+1.69+13.69+0.49+32.49+0.09+28.09+5.29+0.09+5.29) = 90.10 → Var = 90.10/10 = **9.01**, SD = **3.00**

**All-games baseline (all 20 Monaco games):**

Monaco corners won: 5, 4, 2, 1, 9, 6, 5, 6, 6, 6, 4, 7, 7, 8, 3, 4, 3, 6, 5, 4
- Sum = 101, Mean = **5.05**
- Median = 5
- Variance: computing deviations from 5.05... = (0.0025+1.1025+9.3025+16.4025+15.6025+0.9025+0.0025+0.9025+0.9025+0.9025+1.1025+3.8025+3.8025+8.7025+4.2025+1.1025+4.2025+0.9025+0.0025+1.1025) = 74.95 → Var = 74.95/20 = **3.75**, SD = **1.94**

Monaco corners conceded: 2, 8, 7, 8, 3, 8, 2, 0, 5, 10, 3, 2, 3, 3, 2, 4, 5, 4, 4, 4
- Sum = 87, Mean = **4.35**
- Median = 4
- Variance: from 4.35... = (5.52+13.32+7.02+13.32+1.82+13.32+5.52+18.92+0.42+31.92+1.82+5.52+1.82+1.82+5.52+0.12+0.42+0.12+0.12+0.12) = 128.55 → Var = 128.55/20 = **6.43**, SD = **2.54**

Monaco all-game totals: 7, 12, 9, 9, 12, 14, 7, 6, 11, 16, 7, 9, 10, 11, 5, 8, 8, 10, 9, 8
- Sum = 188, Mean = **9.40**
- Median = 9
- Range: 5–16
- Variance: from 9.4... = (5.76+6.76+0.16+0.16+6.76+21.16+5.76+11.56+2.56+43.56+5.76+0.16+0.36+2.56+19.36+1.96+1.96+0.36+0.16+1.96) = 138.80 → Var = 138.80/20 = **6.94**, SD = **2.63**

**Venue vs overall delta (Monaco away vs all-games):**
- Away corners won 4.70 vs all-games 5.05: **−0.35** (win fewer corners away)
- Away corners conceded 5.60 vs all-games 4.35: **+1.25** (concede more away)
- Away match total 10.30 vs all-games 9.40: **+0.90** (away games are higher-corner affairs)

**Trend — Recent 6 games vs older 14:**

Recent 6 (games 1–6, most recent): totals = 7, 12, 9, 9, 12, 14 → mean **10.50**
Older 14 (games 7–20): totals = 7, 6, 11, 16, 7, 9, 10, 11, 5, 8, 8, 10, 9, 8 → mean 125/14 = **8.93**

Recent Monaco corners won: 5, 4, 2, 1, 9, 6 → mean **4.50**
Older Monaco corners won: 5, 6, 6, 6, 4, 7, 7, 8, 3, 4, 3, 6, 5, 4 → mean 78/14 = **5.57**

The recent trend shows Monaco winning *fewer* corners recently (4.50 vs 5.57) but playing in *higher total* games (10.50 vs 8.93), suggesting they concede more corners recently. This aligns with a difficult run of fixtures (PSG ×2, Lens, Angers, Nice).

**Recent away games only (last 4 away):** PSG CL (12), Lens L1 (9), Nice L1 (14), Le Havre L1 (11) → mean **11.50**. This is notably higher than the full away average of 10.30, though Real Madrid (16) dropping out partially explains it.

### 1D. Outlier Check

Monaco all-games total corners: mean 9.40, SD 2.63. Two-sigma threshold: 9.40 + 2×2.63 = **14.66**.

**Flagged outlier:** Game 10 vs Real Madrid (16 total) — a 1:6 blowout where Monaco conceded 10 corners. This is > 2σ. The context (heavy defeat at the Bernabéu) makes this non-representative of a standard away Ligue 1 game.

Away average **without** the Real Madrid outlier: (103 − 16)/9 = **9.67** (vs 10.30 with it).
Away corners conceded without it: (56 − 10)/9 = **5.11** (vs 5.60 with it).

The Nice game (14 total) is close to the threshold but below it. It was a 0-0 draw, suggesting genuine tactical open play rather than a scoreline-driven anomaly.

### 1E. Head-to-Head

Three PSG-Monaco games appear in Monaco's dataset:

| # | Date | Venue | Comp | Monaco Won | Monaco Conceded | Total | Score |
|---|------|-------|------|-----------|----------------|-------|-------|
| 2 | 25/02/26 | Away (PSG home) | CL | 4 | 8 | 12 | 2:2 |
| 4 | 17/02/26 | Home (Monaco home) | CL | 1 | 8 | 9 | 2:3 |
| 16 | 29/11/25 | Home (Monaco home) | L1 | 4 | 4 | 8 | 1:0 |

**Same-venue H2H (PSG at home, i.e., game 2 only):** Monaco 4w, PSG 8w, total 12. n=1 — extremely small sample.

**All H2H (3 games):**
- Monaco avg corners won: (4+1+4)/3 = **3.0**
- PSG avg corners won: (8+8+4)/3 = **6.67**
- Average total: (12+9+8)/3 = **9.67**
- Corner spread (PSG−Monaco): (4+7+0)/3 = **+3.67**

The CL games (25/02, 17/02) are very recent — less than 2 weeks old. High personnel overlap expected. The Ligue 1 game (29/11/25) is ~3 months old — moderate discount, but same season so still relevant.

**Personnel continuity:**
- Game 2 (25/02, CL away at PSG): Köhn, Zakaria (off 24'), Faes, Kehrer, Camara, Coulibaly, Bamba (off 62'), Caio Henrique, Vanderson (off 48'), Balogun (off 74'), Akliouche (off 45'). Expected XI for March 6: Köhn, Kehrer, Zakaria, Faes, Vanderson, Teze, Camara, Henrique, Akliouche, Golovin, Balogun. **~7/11 starters overlap** — strong relevance.
- Game 4 (17/02, CL home): Köhn, Faes, Teze, Caio Henrique, Vanderson (off 70'), Golovin, Zakaria, Camara, Balogun (off 1'!), Adingra (off 70'), Akliouche (off 18'). Balogun went off at minute 1 (injury?) and Akliouche at 18' — this game was severely disrupted. **Discount significantly.**
- Game 16 (29/11, L1 home): Hradecky, Salisu, Kehrer, Caio Henrique, Vanderson (off 65'), Minamino (off 68'), Camara, Teze, Balogun (off 85'), Golovin (off 68'), Akliouche. **~6/11 overlap** with expected XI, but Hradecky/Salisu/Minamino are injured now, and it was Monaco's home. Moderate relevance.

**Key H2H takeaway:** In these three meetings, PSG dominated corners — averaging 6.67 won to Monaco's 3.0. In the most relevant game (game 2, at Parc des Princes, CL), PSG won 8 corners to Monaco's 4. However, that was a CL knockout atmosphere, not a Ligue 1 fixture.

### 1F. Lineup, Substitution & Formation (Monaco only)

**Formation correlation (Monaco):**

| Formation | Games | Avg Won | Avg Conceded | Avg Total |
|-----------|-------|---------|-------------|-----------|
| 3-4-2-1 | 5 (games 1,6,7,8,18) | 5.6 | 3.2 | 8.8 |
| 4-2-3-1 | 7 (games 4,5,13,14,15,16,17) | 4.57 | 3.86 | 8.43 |
| 3-1-4-2 | 3 (games 3,19,20) | 3.67 | 5.0 | 8.67 |
| 3-5-2 | 1 (game 2) | 4.0 | 8.0 | 12.0 |
| 4-2-2-2 | 2 (games 9,11) | 5.0 | 4.0 | 9.0 |
| 4-3-1-2 | 1 (game 12) | 7.0 | 2.0 | 9.0 |
| 4-2-3-1 (expected) | 7 games | 4.57 won | 3.86 conceded | 8.43 total |

The expected 3-4-2-1/3-5-2 wing-back system (likely formation per reports) has limited data but suggests **moderate corner output** (5.6 won in 3-4-2-1) and **lower conceding** (3.2).

However, the expected lineup per Sportsmole is: Köhn; Kehrer, Zakaria, Faes; Vanderson, Teze, Camara, Henrique; Akliouche, Golovin; Balogun — which is a **3-4-2-1** or **3-4-1-2**.

**Notable player-corner correlations (Monaco, away games):**

| Player | Away Games In | Avg Won In | Avg Won Out | Avg Total In | Avg Total Out |
|--------|-------------|-----------|------------|-------------|--------------|
| Akliouche | 8/10 | 4.75 | 4.5 | 10.5 | 9.5 |
| Golovin | 6/10 | 5.17 | 3.75 | 10.33 | 10.25 |
| Vanderson | 7/10 | 4.86 | 4.33 | 10.71 | 9.33 |
| Adingra | 3/10 | 4.33 | 4.86 | 11.0 | 10.0 |
| Balogun | 9/10 | 4.56 | 6.0 | 10.0 | 14.0 |

Balogun's absence (1 away game without him — Rennes L1, 10 total) produces an oddly high total that is a single-game artifact. Golovin's presence correlates with slightly higher Monaco corners won (5.17 vs 3.75 without), but the "without" sample is just 4 games. Not robust enough to be actionable.

**Early subs:** Zakaria was subbed at 24' in game 2 (PSG CL away) — total was 12. Akliouche off at 45' in same game. Game 4 had Balogun off at minute 1 and Akliouche at 18' — total was 9. These disrupted games (especially game 4) are unreliable for systemic analysis.

### 1G. Absence Impact

**Monaco confirmed absences:**
- Mohammed Salisu (knee) — CB, played in games 12–20. Without him (games 1–11): Monaco avg total = 10.27. With him (games 12–20, 9 games): avg total = 8.44. His absence correlates with *higher* match totals, possibly because the defence is less secure → more corners for opponents.
- Takumi Minamino (knee) — AM/winger, played games 13–17, 20. Peripheral impact on corners.
- Krépin Diatta (thigh) — winger, rotational player, unlikely major impact.
- Kassoum Ouattara (calf) — wing-back, similar.
- Paul Pogba (knee) — barely played.
- Eric Dier (hamstring) — started only games 9–11.
- Lukas Hradecky (knee) — GK, no direct corner impact.

**Doubts for Monaco:** Biereth (illness), Zakaria (precautionary), Teze (rest). If Zakaria misses, this is significant — he has been a regular CB/defensive anchor.

**PSG injuries:** Mayulu (calf), Dembélé (calf — major attacking threat), Fabián Ruiz (knee), João Neves (ankle, questionable), Ndjantou Mbitcha (hamstring).

**Dembélé's absence could be critical:** He's PSG's most creative wide player. Per the PSG stats page, Dembélé has been involved in 40 goals in 2025 across all competitions. His absence could reduce PSG's attacking corner generation from wide play. However, PSG's depth (Doué, Barcola) is strong.

### 1H. Contextual Factors

**League baseline:** Ligue 1 2025/26 averages **9.38 corners per match** (per APWin). This is slightly below the Premier League typical ~10.0–10.5.

**PSG matches average 8.96 total corners** in Ligue 1 — **below the league baseline** by 0.42 corners. This is consistent with PSG's territorial dominance: they have so much possession that opponents cannot sustain attacking pressure, resulting in fewer opponent corners — but PSG themselves don't always need many corners to score.

**Monaco matches average:** From their 14 Ligue 1 games in the dataset: totals = 7, 9, 12, 14, 7, 11, 7, 9, 10, 5, 8, 10, 9, 8 (I need to separate). Actually, from the Ligue 1 stats site, Monaco's season averages in Ligue 1: 4.25 won, 4.75 conceded, ~9.0 total. **Slightly below league baseline.**

**Key APWin insight:** PSG home games go over 9.5 total corners only **27% of the time** (from home-only data). This is extremely low and suggests PSG at home produce tightly controlled, lower-corner games.

**Score-state:** In the H2H, game 2 (2:2) was a high-corner game (12), but this was a competitive CL match. In Ligue 1 game 16 (1:0 Monaco win), total was only 8. When Monaco leads/draws and sits deep, corners stay low.

**Motivation:** PSG are 1st (57 pts), 4 points clear. Monaco are 7th (37 pts). PSG are massive home favourites (-295 ML, per Action Network). PSG's home record is 10-1-0. This context suggests PSG will dominate possession and territory, potentially suppressing Monaco's corner output while generating their own — but Monaco may sit very deep, which can paradoxically reduce total corners (PSG work the ball into the box from possession rather than hitting long shots that generate corners).

---

## Phase 2 — Predicted Distribution

### Team A (PSG) Corners Won — Central Estimate

**Primary inputs:**
- PSG season average corners won (Ligue 1): **6.00**
- PSG home corners won (limited data, 5 games from external source): **~7.2** (but includes an outlier 12-0 corner game vs Angers and 11-1 vs Nice — both against very weak opposition)
- PSG corners won in H2H: **6.67** (3 games), but 8 in the single game at Parc des Princes (CL)
- Betoncorners.com season data: PSG win 6.50 corners per game across all Ligue 1 and concede only 2.67

**Secondary context:**
- Monaco's all-game corners conceded average: **4.35** (all venues), **5.60** away
- Monaco conceded 8, 8, and 4 corners in the three H2H games

**Assessment:** PSG at home are the most dominant team in Ligue 1. Their 6.00+ corners won average is driven by relentless attacking pressure. At home, this likely rises to 6.5–7.0. Against Monaco away (who concede 5.60 per away game), PSG should find plenty of corners. The H2H data (8, 8, 4) includes one Ligue 1 game where PSG won only 4 — but they were away in that game. At the Parc des Princes (CL), PSG had 8 corners.

I weight PSG's own attacking propensity (6.0–6.5) as the primary anchor, boosted slightly by the home factor and Monaco's high away concession rate. Dembélé's likely absence is a modest drag (~-0.5).

**PSG corners won prediction: 5.5–7.5, central estimate 6.5**

### Team B (Monaco) Corners Won — Central Estimate

**Primary inputs:**
- Monaco away corners won: **4.70** (10 games, SD 1.62)
- Monaco all-games corners won: **5.05**
- Monaco recent 6-game trend: corners won **4.50** (slight dip)
- Monaco corners won in H2H: 4, 1, 4 → **3.0 average**

**Secondary context:**
- PSG concede only **2.67** corners per game in Ligue 1, and likely around **2.0–2.4** at home (from the limited home data showing conceded corners of 1, 1, 5, 3, 0 → mean 2.0)
- PSG's home dominance suppresses opponent corners dramatically: opponents concede territory and rarely sustain pressure

**Key contradiction:** Monaco's own away propensity says ~4.7 corners won, but PSG's home concession rate says ~2.0–2.4. These are dramatically different.

**Resolution:** PSG at home are unlike any other Ligue 1 opponent. Their possession rate (~68%) and pressing intensity mean Monaco will have significantly less attacking territory than usual. I lean heavily toward PSG's home conceded rate being the dominant signal here. Monaco's 4.7 away average is inflated by games against weaker teams (Le Havre 6, Rennes 6, Nice 6). Against elite opposition away (PSG CL: 4, Real Madrid: 6), Monaco's output varies — but the 6 at Real Madrid came in a 1-6 thrashing where Monaco were chasing.

The Ligue 1 H2H at Monaco's home produced only 4 PSG corners won (and 4 Monaco) — but at PSG's home in the CL, Monaco managed only 4. I expect this pattern to hold.

**Monaco corners won prediction: 2.5–4.5, central estimate 3.5**

### Total Match Corners — Central Estimate

Per-team sum: 6.5 + 3.5 = **10.0**

**Cross-check with venue-filtered totals:**
- PSG home match total average: ~8.96 (season Ligue 1) to ~9.2 (limited home sample)
- PSG home over 9.5 rate: only **27%** (from APWin)
- Monaco away match total: **10.30** (but inflated by Real Madrid outlier; 9.67 without)
- H2H totals: 12, 9, 8 → mean 9.67

The PSG home suppression factor (only 27% over 9.5) is powerful data. However, Monaco are a better opponent than PSG's typical home visitor, which could push totals slightly higher. The CL game at Parc des Princes produced 12 corners, but CL games often run more open.

For Ligue 1, I expect a tighter, more controlled game. PSG will dominate possession. Monaco will sit in a compact mid-to-low block, limiting space but also limiting their own counter-attack opportunities for corners.

**Total match corners prediction: 8.5–11.5, central estimate 9.5–10.0**

### Corner Spread (PSG − Monaco)

Central estimate: 6.5 − 3.5 = **+3.0** in PSG's favour.
H2H spreads: +4, +7, 0 → mean +3.67.
Range: +1.0 to +5.0.

### Reconciliation of Contradictions

1. **Monaco away total (10.30) vs PSG home total (~9.0):** I trust PSG's home data more because it reflects their territorial control. The compromise at 9.5–10.0 gives slightly more weight to PSG's suppression.

2. **Monaco away corners won (4.70) vs PSG home corners conceded (~2.0–2.4):** Massive gap. I lean toward PSG's home concession rate (60–65% weight) because the mechanism is clear: PSG's possession starves opponents of attacking opportunities. The 3.5 central estimate is a compromise.

3. **H2H CL game (12 total) vs Ligue 1 H2H (8 total):** The CL game's higher total likely reflects the knockout-stage intensity and tactical openness. The Ligue 1 game is more representative. I discount the CL total partially.

---

## Phase 3 — Value Identification

### ⛔ CANNOT COMPLETE

**No corner odds are available in the report.** Without bookmaker lines (over/under totals, spreads, team corners), it is impossible to:
1. Calculate implied probabilities
2. Compare model probabilities to market prices
3. Identify edges
4. Make value picks

This is the binding constraint that prevents any betting recommendations.

---

## Phase 4 — Output

### Statistical Summary

| Metric | PSG (Home) | Monaco (Away) |
|--------|-----------|---------------|
| Venue-filtered avg corners won | ~7.0* (n≈5–11, external) | 4.70 (n=10) |
| Venue-filtered avg corners conceded | ~2.0–2.4* (n≈5–11, external) | 5.60 (n=10) |
| All-games avg corners won | 6.00–6.50* (n≈24, external) | 5.05 (n=20) |
| All-games avg corners conceded | 2.67* (external) | 4.35 (n=20) |
| H2H avg corners (matching venue) | 8.0 (n=1) | 4.0 (n=1) |
| H2H avg corners (all) | 6.67 (n=3) | 3.0 (n=3) |
| H2H avg total | 9.67 (n=3) | — |
| League avg total | ~9.38 | — |

*\* PSG figures from external aggregate sources (betoncorners.com, apwin.com, statmuse.com), not from match report data*

**Predicted total: 8.5–11.5 (central 9.5–10.0)**
**Predicted spread: PSG −3.0 (range −1.0 to −5.0)**
**PSG corners won: 6.5 (range 5.5–7.5)**
**Monaco corners won: 3.5 (range 2.5–4.5)**

### Value Picks

| # | Pick | Line | Odds | Est. Prob | Implied Prob | Edge | Confidence |
|---|------|------|------|-----------|--------------|------|------------|
| — | **No picks possible** | — | — | — | — | — | — |

**No corner odds were provided in the report.** Without lines to bet against, no value identification can be performed.

### Directional Leanings (for monitoring if lines become available)

Based on the analysis, if I were to see odds, I would focus on:

1. **Under total corners (9.5 or 10.5):** PSG home games go under 9.5 approximately 73% of the time per APWin. Even accounting for Monaco being a stronger opponent, the under looks attractive. If the market centres on 10.5, the under would be strongly favoured by the data.

2. **PSG corner handicap/spread −2.5 or −3.5:** PSG's massive corner differential (winning ~6.5, conceding ~2.0–2.4 at home) combined with Monaco's away struggles (winning 4.7, but likely compressed to ~3.5 here) suggests a spread of around −3.0. A line at −2.5 could offer value.

3. **Monaco team corners under 4.5:** PSG concede the fewest corners in Ligue 1 (2.67 overall, likely ~2.0–2.4 at home). Monaco winning only 3–4 corners is the most likely outcome.

### Bets to Avoid

1. **Over total corners at any line above 10.5** — PSG's home suppression effect is very strong. Only 27% of their home games exceed 9.5 total corners. Chasing overs here is fighting the strongest single data point in the analysis.

2. **Monaco corner handicap positive (e.g., Monaco +0.5 or +1.5)** — All evidence suggests PSG will dominate the corner count significantly, as they have in all three H2H meetings.

### Caveats

1. **PSG data is entirely from external aggregate sources**, not from the match report. I have no match-by-match detail for PSG's lineup, formation, substitutions, or game-by-game corner splits for recent months. This is the most significant limitation.

2. **No odds available** means the entire value-identification phase is void. The analysis provides directional guidance only — not actionable betting picks.

3. **Dembélé, Neves, and Ruiz are injury doubts for PSG.** If all three miss, PSG's attacking output could be materially reduced, which would lower their corner generation. Conversely, if Zakaria, Teze, or Biereth miss for Monaco, the defensive structure weakens and PSG's corners could increase.

4. **The PSG home "only 27% over 9.5" stat** is derived from their season so far, which included some weak opponents at home (Angers, Strasbourg, Le Havre). Monaco are a step up in quality, which could produce a more open game — but PSG's dominance is so extreme that even quality opponents are stifled.

5. **Small H2H sample (3 games, only 1 at this venue)** makes H2H conclusions fragile. The single Parc des Princes game was a CL fixture, not Ligue 1.

6. **This analysis should not be used for staking decisions** given the severity of the data gaps. It provides a framework for when full data becomes available.