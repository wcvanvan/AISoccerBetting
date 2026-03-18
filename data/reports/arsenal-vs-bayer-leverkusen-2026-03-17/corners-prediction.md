Let me compute exact probabilities and search for first-leg context before writing the full analysis.

Now I have all the data I need. The first leg context is crucial: only 5 total corners (Arsenal 3, Leverkusen 2) in a cagey game. Leverkusen scored from a Grimaldo corner (Andrich header). Timber is OUT with an ankle injury from the Everton game; Ødegaard remains OUT.

---

## Statistical Summary

| Metric | Arsenal (Home) | Bayer Leverkusen (Away) |
|--------|---------------|------------------------|
| Venue-filtered avg corners won | 5.56 (n=9) | 4.73 (n=11) |
| Venue-filtered avg corners conceded | 2.67 | 4.45 |
| PL-only home avg corners won | 5.33 (n=6) | — |
| All-games avg corners won | 5.61 (n=18) | 5.55 (n=20) |
| All-games avg corners conceded | 3.22 | 4.00 |
| H2H avg corners (matching venue) | No data | No data |
| H2H avg corners (all) | No data | No data |
| H2H avg total | No data | — |
| First leg total (BayArena) | 3 won | 2 won (5 total) |
| League avg total | ~10.0–10.5 | ~10.0–10.5 |

**Predicted total**: 7–13 (central 9.25)
**Predicted spread**: Arsenal −1.5 / +3.5 (central Arsenal +2.25)

---

## Detailed Analysis

### Phase 1A — Data Cleaning

**Arsenal**: Games 14 (Chelsea LC away, Jan 14) and 15 (Portsmouth FA Cup away, Jan 11) have corners marked "-". **18 valid games remain.** Of these, 9 are home (including Wigan FA Cup and Kairat Almaty CL — flagged as non-comparable opponents). Cup/European games with data: Wigan (FA Cup, League One — not comparable), Chelsea LC (same-league, comparable), Kairat Almaty (CL, Kazakh side — not comparable), Inter Milan (CL, comparable).

**Bayer Leverkusen**: All 20 games have corner data. **20 valid games.** CL games with data: 3× Olympiacos (Greek league — moderate comparability), Villarreal (La Liga, comparable), Newcastle (PL, comparable), Man City (PL, comparable).

### Phase 1B — Arsenal (Home) Corner Stats

**Venue-filtered (Home, n=9):**

Corners won: 5, 5, 5, 2, 11, 9, 3, 3, 7 → mean 5.56, median 5, range 2–11, variance 11.95

Corners conceded: 10, 0, 2, 5, 0, 2, 0, 3, 2 → mean 2.67, median 2, range 0–10

Total corners: 15, 5, 7, 7, 11, 11, 3, 6, 9 → mean 8.22, median 7, range 3–15, variance 11.95

**PL-only home (n=6):** Chelsea(5w/10c/15T), Sunderland(5w/2c/7T), Man Utd(9w/2c/11T), Liverpool(3w/0c/3T), Aston Villa(3w/3c/6T), Brighton(7w/2c/9T)
- Won: mean 5.33, median 5, variance 4.56
- Total: mean 8.50, median 8, variance 14.58

**All-games baseline (n=18):**
- Won: mean 5.61, median 5, variance 8.24
- Conceded: mean 3.22, median 2.5
- Total: mean 8.83, median 8, variance 13.36

**Venue vs overall delta:** Home corners won (5.56) vs all-games (5.61) = −0.05 (negligible). Home total (8.22) vs all-games (8.83) = −0.61 (home games slightly lower total, driven by Liverpool 3-total and Aston Villa 6-total).

**Trend (recent ~6 vs older):**
Most recent 6 all-games corners won: Brighton A(3), Chelsea H(5), Spurs A(5), Wolves A(3), Wigan H(5), Brentford A(4) → mean **4.17**
Older 12: mean **(101−25)/12 = 6.33**

Clear recent downtrend (−2.16 corners won). However, the recent-6 includes four away fixtures against organised defences (Brighton, Wolves, Brentford) and one FA Cup game. The two home games in the recent-6 produced 5 won each, which is exactly at the PL home median. The downtrend is venue-mix driven, not a genuine decline in home output. One possible concern: Arsenal have not produced a high-corner home game since Man Utd (Jan 25, 9 won) — the three PL home games since then yielded 5, 5, 3 won. But sample is tiny.

**Threshold frequencies (venue-filtered, home n=9):**

| Line | Home Over % | All-games Over % |
|------|-------------|------------------|
| 8.5 | 44.4% (4/9) | 50.0% (9/18) |
| 9.5 | 33.3% (3/9) | 44.4% (8/18) |
| 10.5 | 33.3% (3/9) | 38.9% (7/18) |
| 11.5 | 11.1% (1/9) | 22.2% (4/18) |

Arsenal's home games exceed the book's median line (9.5) only 33% of the time — well below 55%. Arsenal are **not** a high-corner-propensity team at home.

### Phase 1C — Bayer Leverkusen (Away) Corner Stats

**Venue-filtered (Away, n=11):**

Corners won: 7, 5, 3, 2, 3, 8, 5, 8, 7, 3, 1 → mean 4.73, median 5, range 1–8, variance 5.65

Corners conceded: 2, 4, 3, 2, 8, 2, 3, 2, 5, 9, 9 → mean 4.45, median 3, range 2–9

Total: 9, 9, 6, 4, 11, 10, 8, 10, 12, 12, 10 → mean 9.18, median 10, range 4–12, variance 5.42

**All-games baseline (n=20):**
- Won: mean 5.55, median 5, variance 5.31
- Conceded: mean 4.00, median 3
- Total: mean 9.55, median 10, variance 6.65

**Venue vs overall delta:** Away corners won (4.73) vs all-games (5.55) = −0.82 (notable; Leverkusen win fewer corners away). Away total (9.18) vs all-games (9.55) = −0.37.

**Trend (recent ~6 away vs older 5):**
Recent 6 away: Hamburg(9T), Union(9T), Olympiacos CL(6T), Gladbach(4T), Frankfurt(11T), Olympiacos CL(10T) → total mean **8.17**
Older 5 away: Hoffenheim(8T), Leipzig(10T), Augsburg(12T), Man City CL(12T), Wolfsburg(10T) → total mean **10.40**

Leverkusen's recent away totals have trended **down** (−2.23). This is partly due to the Gladbach game (4 total, season-low) and a cagey CL away at Olympiacos (6 total). Recent away corners won also declined slightly: recent-6 mean 4.67 vs older-5 mean 4.80. No single outlier drives this — it appears to be a genuine tightening of Leverkusen's away games.

**Threshold frequencies (venue-filtered, away n=11):**

| Line | Away Over % | All-games Over % |
|------|-------------|------------------|
| 8.5 | 72.7% (8/11) | 70.0% (14/20) |
| 9.5 | 54.5% (6/11) | 55.0% (11/20) |
| 10.5 | 27.3% (3/11) | 35.0% (7/20) |
| 11.5 | 18.2% (2/11) | 20.0% (4/20) |

Leverkusen's away games exceed 9.5 total 55% of the time — near the breakeven point. They exceed 10.5 only 27% of the time away, well below 55%.

### Phase 1D — Outlier Check

Combined dataset (38 games): mean 9.21, SD ≈ 3.14. 2σ threshold: 2.93–15.49.

**Flagged outliers:**
- **Arsenal vs Leeds A (16 total, 12w)**: 2.16σ above mean. Arsenal dominated 4-0 with 3.54 xG and 26 crosses. Leeds offered no resistance. An extreme performance against a weak, open team.
- **Arsenal vs Liverpool H (3 total)**: −1.98σ below mean. Tactical, low-tempo 0-0 with suppressed crossing (15 Arsenal, 9 Liverpool). Both teams controlled space rather than attacked.
- **Arsenal vs Chelsea H (15 total, 5w-10c)**: 1.84σ. Competitive match where Chelsea pressed high (oppPPDA 9.0) and generated 18 crosses.

**Venue-filtered averages with/without outliers (Arsenal home):**
- With all: mean 8.22 (n=9)
- Without Chelsea 15: mean 7.38 (n=8)
- Without Liverpool 3: mean 8.88 (n=8)
- Without both: mean 8.00 (n=7)

### Phase 1E — Head-to-Head

**No H2H data** from the last 2 seasons in the report. The first leg (March 11, BayArena, 1-1) is not included in either team's last-20 dataset.

From web search: the first leg produced **5 total corners** (Arsenal 3, Leverkusen 2). This was a cagey, tactical affair — Arsenal had 54.8% possession but only 6 shots (2 on target). Leverkusen scored from a Grimaldo corner delivery (Andrich header at 46'). Arsenal managed 3 corners in a game where they struggled to create.

**Personnel continuity with the first leg:**
- Arsenal first-leg XI included Saka, Martinelli, Gyökeres, Zubimendi, Rice, Timber. Expected second-leg XI drops Timber (injured vs Everton) and may adjust the attacking setup. ~8/11 starters overlap — high continuity.
- Leverkusen first-leg XI included Grimaldo, Andrich, Tapsoba, García, Palacios, Maza. Expected second-leg XI is very similar. ~9/11 overlap — high continuity.

Given the high personnel overlap and recency (6 days ago), **the first leg is the single most relevant data point**. Its 5-corner total should be weighted heavily, though the second leg's different context (home for Arsenal, more attacking intent) will push the total higher.

### Phase 1F — Lineup, Substitution & Formation

**Expected Arsenal XI (4-2-3-1):** Raya; Mosquera, Saliba, Gabriel, Calafiori; Zubimendi, Rice; Saka, Eze, Martinelli; Gyökeres

**Expected Leverkusen XI (3-4-2-1):** Blaswich; Quansah, Andrich, Tapsoba; Poku, Palacios, García, Grimaldo; Terrier, Maza; Schick

**Arsenal player–corner correlations (min 3 valid games):**

| Player | Games In | Avg Won In | Avg Won Out | Avg Total In | Avg Total Out |
|--------|----------|-----------|-------------|-------------|--------------|
| Saka (start, >10') | 9 | 5.00 | 6.44 | 8.22 | 9.44 |
| Eze (start) | 8 | 5.25 | 5.90 | 9.13 | 8.60 |
| Martinelli (start) | 7 | 5.43 | 5.73 | 8.43 | 9.09 |
| Gyökeres (start, >10') | 13 | 5.15 | 7.20 | 8.62 | 9.60 |

No player shows a statistically meaningful correlation after accounting for sample size and confounders. The apparent "more corners without Saka/Gyökeres" effect is driven by the Leeds (16T), Kairat (11T), and Forest (13T) games falling in their absence windows — those were matchup-driven, not personnel-driven.

**Leverkusen player–corner correlations:**

| Player | Games In | Avg Won In | Avg Won Out | Avg Total In | Avg Total Out |
|--------|----------|-----------|-------------|-------------|--------------|
| Grimaldo (start, >10') | 15 | 5.47 | 5.80 | 9.33 | 10.20 |
| Ernest Poku (start) | 9 | 6.11 | 5.09 | 10.78 | 8.55 |
| Ibrahim Maza (start) | 14 | 5.86 | 4.83 | 10.14 | 8.17 |

**Poku correlation is notable**: when Poku starts, Leverkusen's average total rises to 10.78 (vs 8.55 without). However, the non-Poku games include the lowest-total games (Gladbach 4T, Villarreal 5T, Olympiacos H 9T), so this partially reflects matchup quality. Poku is expected to start, which is a modest upward factor.

**Maza** shows a similar pattern (10.14 with, 8.17 without), again partly confounded by sample composition.

**Early subs:** Both teams rotate heavily due to injuries and congestion. No clean isolated effect from early attacking substitutions. Arsenal average ~3–4 subs before 70' across their games.

### Phase 1G — Absence Impact

**Arsenal confirmed absences:**
- **Martin Ødegaard** (injured since February): Arsenal's primary creative force. In games Ødegaard started (6 valid games), Arsenal averaged 5.83 corners won and 9.17 total. Without Ødegaard (12 games), 5.50 won and 8.67 total. The delta is small in raw corners, but the first leg showed Arsenal's creative struggles without him — only 6 shots from open play. This suppresses corner-generating chances.
- **Jurriën Timber** (ankle, injured vs Everton Mar 14): Regular RB/RCB. In his 13 starts, Arsenal averaged 4.62 won and 8.31 total. Without him (5 games): 8.20 won and 10.20 total. But those 5 games are confounded (Kairat, Man Utd) and the sample is too small to draw conclusions. Mosquera and Calafiori replace him in defence — Calafiori is an attacking LB who occasionally generates corners through overlapping runs.

**Leverkusen confirmed absences:**
- **Lucas Vázquez** (out): RWB/substitute who appeared in 7 games. His absence has no clear corner impact — Poku is the established starter.
- **Loïc Badé** (out): CB rotation option. Tapsoba/Quansah/Andrich cover.
- **Arthur** (out): Midfield rotation. García/Palacios/Fernández cover.
- **Martin Terrier** (ankle doubt): If he misses, Malik Tillman or Hofmann likely starts. Terrier started 5 valid games with 9.60 average total vs 9.53 without — no material impact.

### Phase 1H — Contextual Factors

**League baseline:** PL average ~10.0–10.5 total corners. Bundesliga similar (~10.0–10.5). Arsenal's home total (8.50 PL) is **below** baseline. Leverkusen's away total (9.18) is also slightly below.

**Score-state analysis:**
- Arsenal's highest corner games at home coincided with competitive/trailing score-states: Chelsea H (15T, 2-1 win but trailed on corners), Man Utd H (11T, 2-3 loss — Arsenal chasing). Conversely, comfortable leads produced fewer corners: Liverpool H (3T, 0-0), Aston Villa H (6T, led 1-0 at HT then scored 4).
- Leverkusen's highest away corner games were when trailing: Olympiacos A (10T, lost 0-2, chasing and generated 8 corners), Man City A (12T, won 2-0 but conceded 9 corners while sitting deep). When leading away, corner totals dropped: Hamburg (9T), Hoffenheim (8T).

This is critical for this match: the 1-1 aggregate means **both teams need to attack**, which should elevate corners above what a typical "comfortable" home game would produce. If Arsenal score first, Leverkusen must push forward (more corners for both). If Leverkusen score first, Arsenal push (same effect). The equilibrium is an open second half regardless of first-half score.

**Motivation:**
- Arsenal: 1st in PL (+9 pts), in League Cup final (Mar 22), chasing a potential quadruple. Extreme motivation. Arteta publicly promised a more aggressive approach after a "poor" first leg.
- Leverkusen: 6th in Bundesliga, 22 pts behind Bayern. CL is their most realistic silverware route. Fully motivated but also fatigued after a high-intensity 1-1 draw with Bayern three days ago.

**Fatigue factor:** Arsenal played Everton on Mar 14 (3 days ago) — a comfortable win where they made early subs. Leverkusen played Bayern on Mar 14 — a high-intensity game that went the full 90. Leverkusen may have a slight fatigue disadvantage, which could reduce their pressing intensity and crossing volume, marginally suppressing their corner generation.

**First-leg tactical template:** The first leg produced just 5 corners in a cagey game. Arsenal's possession (54.8%) did not translate to corners — they recycled safely rather than attacking into crossing positions. This directly illustrates the possession-corners decoupling principle. Arsenal had only 6 shots despite majority possession. Unless Arteta fundamentally changes the approach (and his comments suggest he will try), there's a risk of repeating this pattern. However, the home factor and crowd should encourage more directness.

### Phase 2 — Predicted Distribution

**Arsenal corners won:**

*Primary input — Arsenal's own patterns:* PL home average is 5.33 won (n=6), all-games 5.61 (n=18). The home median is exactly 5. Only twice in 6 PL home games did Arsenal exceed 6 corners won (Man Utd 9, Brighton 7), and one of those was while losing 2-3.

*Secondary input — Leverkusen's away corners conceded:* Home teams average 4.45 corners against Leverkusen away. But this includes strong performances from Frankfurt (8) and weaker teams. Recent 6 away: opponents averaged only 3.50 corners — Leverkusen have tightened defensively. However, Arsenal are a stronger home attacking team than Hamburg, Gladbach, or Olympiacos.

*Upward factors:* CL knockout at home with aggregate tied (+0.5); Arteta's stated aggressive intent (+0.25); Martinelli and Saka on the flanks generate crosses (Arsenal average 16+ crosses at home); Calafiori may overlap more than Timber, providing width.

*Downward factors:* Ødegaard absence reduces creative incision (first leg showed this — only 6 shots); Leverkusen's 3-at-the-back provides width to defend crosses; first leg Arsenal won only 3 corners despite majority possession; Leverkusen's recent defensive improvement (3.50 away conceded in last 6).

*Weighting:* Arsenal's own home data (5.33 PL average) is the primary anchor. The CL uplift and aggressive intent push this modestly upward, but Ødegaard's absence and the first leg's low output provide meaningful counterweight. **Central estimate: 5.75 corners won.** Range: 3–9.

**Leverkusen corners won:**

*Primary input — Leverkusen's own patterns:* Away average 4.73 won (n=11), all-games 5.55. Recent 6 away: 4.67 won.

*Secondary input — Arsenal's home conceded:* Arsenal concede only 2.67 corners at home (3.17 PL-only). Against top-6 PL sides at home: Chelsea(10), Man Utd(2), Liverpool(0) → average 4.0, median 2. The Chelsea 10 is a clear outlier; every other top-six side managed 0–2 corners.

*The key tension:* Leverkusen's own data says ~4.7, Arsenal's home defence says ~2.7–3.2. I lean toward Arsenal's home data being the stronger signal here: Arsenal's territorial dominance at the Emirates is a structural feature. They press high, win the ball in the opposition half, and restrict opponents to few attacking entries. The mechanism is clear — opponents simply don't get into crossing positions. Leverkusen, while better than most Arsenal opponents, will still face this pressure.

*Upward factors:* Grimaldo's set-piece delivery is elite (scored from a corner in the first leg); Leverkusen won't sit deep — they need a result; Poku's presence correlates with higher totals; Leverkusen play a wide formation with wing-backs generating crosses.

*Downward factors:* Arsenal's home dominance (0-2 corners for most top-six visitors); first leg produced only 2 Leverkusen corners despite a competitive game; Leverkusen's fatigue from the Bayern game 3 days ago; Arsenal's high press will restrict Leverkusen's build-up.

*Weighting:* Leverkusen's own away data (4.73) anchors, but I apply a significant discount given Arsenal's home defensive record and the first leg's suppressed output. **Central estimate: 3.5 corners won.** Range: 1–7.

**Total match corners:**

Arsenal 5.75 + Leverkusen 3.5 = **9.25** central estimate. Range: 6–14.

Cross-checks:
- Arsenal PL home total average: 8.50. With CL uplift: ~9.0.
- Leverkusen away total average: 9.18. Recent away: 8.17.
- Average of venue-filtered totals: (8.50 + 9.18)/2 = 8.84.
- First leg total: 5 (heavily discounted for different context but still informative).
- CL knockout uplift of +0.5: 8.84 + 0.5 ≈ 9.3.

All paths converge on **9.0–9.5**, central **9.25**. This is ~0.5 below the book's centre of ~9.75.

**Corner spread (Arsenal − Leverkusen):**

Central estimate: +2.25 (Arsenal favoured). Range: −2 to +8.

Arsenal PL home spreads: −5, +3, +7, +3, 0, +5 → mean +2.17, median +3. Excluding the Chelsea outlier (−5): mean +3.6. The book's −2.5 line aligns with a spread around +2.5 to +3.0.

### Phase 2 — Reconciliation

**Contradiction 1:** Leverkusen's away corners won (4.73) vs Arsenal's home conceded (2.67/3.17 PL). Resolution: Arsenal's home dominance has clear causal mechanism (territorial control). But Leverkusen are superior to most Arsenal opponents. I set Leverkusen at 3.5 — between the two signals, weighted 40/60 toward Arsenal's defence.

**Contradiction 2:** Arsenal's all-games Over 10.5 rate (38.9%) vs Leverkusen's all-games rate (35.0%) vs the venue-filtered averages (Arsenal home 33.3%, Leverkusen away 27.3%). The venue-filtered rates are notably lower, especially Leverkusen away. Resolution: venue-filtered data is more relevant. The combined Over 10.5 empirical rate of ~30% (average of 33.3% and 27.3%) aligns with my Poisson estimate of 32.4%. Consistent — no contradiction.

**Contradiction 3:** CL knockout "should be open" vs first leg "was cagey." The first leg was at a neutral-to-away venue for Arsenal with a typical first-leg conservative approach. The second leg should be different: Arsenal at home, aggregate level, stated aggressive intent. I apply a +0.5 total uplift for context, but cap it because the first leg showed that this specific tactical matchup (Leverkusen's compact 3-4-2-1 vs Arsenal's 4-2-3-1 without Ødegaard) naturally suppresses chances. Resolution: moderate uplift, not dramatic.

### Phase 3 — Value Identification

**Variance & distribution model:**

Arsenal home total variance: 11.95 (PL-only: 14.58). Leverkusen away total variance: 5.42. Average: (11.95 + 5.42)/2 = 8.69. Predicted mean: 9.25. Variance (8.69) < mean (9.25) → **Poisson** is appropriate. The slight overdispersion (ratio 0.94) is negligible; NegBin with these parameters converges to Poisson (r = 114).

**Totals markets:**

| Line | Book Best Over/Under | Implied O% | Overround | Fair O% | My Poisson O% | Empirical O% | Edge (Under) |
|------|---------------------|-----------|-----------|---------|---------------|-------------|-------------|
| 8.5 | Pin 1.51/2.48 | 66.2% | 106.6% | 62.1% | 57.7% | 58.6% | — (Over side, no edge) |
| 9.5 | Pin 1.94/1.88 | 51.5% | 104.7% | 49.2% | 44.5% | 43.9% | ~5% on Under |
| 10.5 | Pin 2.43/1.53 | 41.2% | 106.8% | 38.6% | 32.4% | 30.3% | **~6–8% on Under** |
| 11.5 | Fan 3.00/1.36 | 33.3% | 106.9% | 31.2% | 22.2% | 14.7% | **~7–10% on Under** |

Empirical Over rates computed as average of Arsenal home % and Leverkusen away % at each line.

**Under 10.5 (Pinnacle 1.53):**
- Implied Under: 65.4%. Overround-adjusted fair Under: 61.4%.
- Poisson P(Under): 67.6%. Empirical (venue-avg): 69.7%. Reconciled: **~67%**.
- Edge: 67% − 61.4% = **+5.6%**.
- Sensitivity: at μ=9.5, Under drops to 64.5% (edge 3.1%); at μ=10.0, 58.3% (no edge). Edge is robust for μ ≤ 9.5.

**Under 11.5 (FanDuel 1.36):**
- Overround: 106.9%. Fair Under: 68.8%.
- Poisson P(Under): 77.8%. Empirical: 85.3%. Reconciled: **~78%**.
- Edge: 78% − 68.8% = **+9.2%**.
- Sensitivity: at μ=10.0, Under drops to ~69.7% (edge ~1%). Requires μ ≤ 9.5 for strong edge.

**Arsenal Team Under 6.5 (DraftKings −140):**
- Overround: 108.3%. Fair Under: 53.8%.
- Poisson P(Under | μ=5.75): 64.6%.
- Empirical: Arsenal home 6/9 = 66.7%, all-games 12/18 = 66.7%. Reconciled: **~65%**.
- Edge: 65% − 53.8% = **+11.2%**.
- Sensitivity: at μ=6.0, Under = 60.6% (edge 6.8%); at μ=6.5, 52.7% (no edge). Edge survives unless Arsenal's true mean is ≥6.5, which contradicts all empirical evidence (33% of games have ≥7 corners won, both home and all-games).

**Spreads markets:**

| Line | Book | Implied Cover% | Fair Cover% | My Estimate | Edge |
|------|------|----------------|-------------|-------------|------|
| Lev +2.5 | Pin 2.17 | 46.1% | 43.4% | 53.3% (at mean +2.25) | +9.9% |
| Lev +3.5 | DK −140 | 58.3% | 53.8% | 65.9% (at mean +2.25) | +12.1% |
| Ars −2.5 | Pin 1.66 | 60.2% | 56.6% | 46.7% | Negative — avoid |

Leverkusen +3.5 at DraftKings −140 (1.714):
- Skellam estimate (μ_A=5.75, μ_L=3.5, mean spread +2.25, SD 3.04): P(spread ≤ 3.5) = 65.9%.
- Empirical: Arsenal PL home spread ≤ 3 in 4/6 = 66.7% of games. (All home: 5/9 = 55.6%.)
- Reconciled: **~63%**.
- Edge: 63% − 53.8% = **+9.2%**.
- Sensitivity: at mean spread +3.0, P drops to ~56.4% (edge 2.6%). The edge requires the true spread to be ≤ +2.5.
- **Note:** This pick is highly correlated with Arsenal Under 6.5 (if Arsenal win fewer corners, spread narrows). Recommend taking only one for portfolio diversification.

**Cross-checks:**

Book's implied team corners: From DraftKings total centre ~9.75 and spread centre ~−3.0: Arsenal implied = (9.75+3.0)/2 = 6.38, Leverkusen implied = (9.75−3.0)/2 = 3.38. DraftKings team total lines confirm: Arsenal centre ~6.3, Leverkusen centre ~3.3. My estimates: Arsenal 5.75 (−0.63 vs book), Leverkusen 3.5 (+0.12 vs book). The primary divergence is on Arsenal, which drives all my value picks.

No bookmaker differs by >10% on the same line. Pinnacle (sharpest) consistently offers tighter spreads than DraftKings/FanDuel/BetRivers.

---

## Value Picks

| # | Pick | Line | Odds | Est. Prob | Implied Prob | Edge | Confidence |
|---|------|------|------|-----------|--------------|------|------------|
| 1 | Arsenal Under team corners | 6.5 | −140 (DK) | 65% | 54% | +11% | 7/10 |
| 2 | Under total corners | 10.5 | 1.53 (Pin) | 67% | 61% | +6% | 6/10 |
| 3 | Leverkusen corners spread | +3.5 | −140 (DK) | 63% | 54% | +9% | 6/10 |

**Pick 1 — Arsenal Under 6.5 team corners (DraftKings −140).** Arsenal have won 6 or fewer corners in 67% of all games and 67% of home games this season — a remarkably stable rate across samples. Their PL home average is 5.33 with a median of 5. The market prices Over 6.5 at a coin-flip, but the data overwhelmingly shows Arsenal sitting in the 3–5 corner range at home, with only two outlier games (Man Utd 9 while losing 2-3, Brighton 7). Without Ødegaard — Arsenal's primary creative link — their chance generation from open play drops materially, as the first leg demonstrated (6 shots, 3 corners despite 55% possession). Leverkusen's 3-at-the-back formation provides wide defensive coverage that limits Arsenal's crossing opportunities. Primary risk: if Arsenal fall behind and chase aggressively, corners could spike as they did vs Man Utd. The CL context does create some upside tail risk, but 67% is a robust historical frequency.

**Pick 2 — Under 10.5 total corners (Pinnacle 1.53).** Both teams' venue-filtered data supports a lower total than the market implies. Arsenal's home total averages 8.50 (PL), and Leverkusen's recent 6 away games average 8.17. The first leg produced just 5 corners with near-identical personnel. Even applying a full-corner uplift for home advantage and CL urgency, the total centres around 9.0–9.5 — firmly under 10.5. The Poisson model and empirical rates both place Under 10.5 at ~67–70%. The book's fair implied ~61% underestimates this by 6 points. Primary risk: an early goal could produce a wide-open second half with high crossing volume (as in Arsenal-Chelsea's 15-corner game).

**Pick 3 — Leverkusen +3.5 corners (DraftKings −140).** The book implies Arsenal win the corner count by 3+ roughly 46% of the time. My model puts it at ~34%. Arsenal's PL home corner spread was +3 or less in 4 of 6 games (67%). The key insight: Leverkusen's 3-4-2-1 with Grimaldo delivers set-piece quality (scored from a corner in the first leg), and they generate meaningful crossing volume through the wing-backs — Grimaldo and Poku combined for 32 crosses in their last game together. Even if Arsenal dominate territory, Leverkusen should pick up 3+ corners through their own attacking play, keeping the spread under 4. Primary risk: if Arsenal score early and Leverkusen retreat into a deep defensive block (as they did in the 5-3-2 at Man City), their corner production could collapse to 1–2, stretching the spread. **Note: correlated with Pick 1 — consider taking only one to avoid concentration risk.**

---

## Bets to Avoid

**Over 9.5 total corners.** Tempting in a CL knockout, but the market is efficiently priced at roughly 50/50. My estimate of ~44.5% Over gives a slight lean to the Under, but not enough edge to recommend the Over. The CL label attracts casual money to Overs, which is likely already priced in. The first leg's 5-corner total and both teams' below-baseline venue averages counsel caution.

**Arsenal Race to 7 corners (DraftKings −105).** Arsenal reaching 7 corners sounds plausible for a dominant home team, but they've hit 7+ in only 3/9 home games (33%) and 6/18 all-games (33%). The −105 implies ~51% after vig. The "Neither" at −130 is closer to value (my estimate ~60%), but the edge is sensitive to Arsenal's mean — at μ=6.5, it disappears entirely. Not reliable enough to recommend.

---

## Caveats

1. **Missing first-leg corner data in the main dataset.** The first leg (5 total corners, Arsenal 3, Leverkusen 2) is the most relevant reference point but was obtained separately via web search. Its low total supports my estimates but introduces uncertainty about exact match conditions.

2. **Missing most recent games.** Neither Arsenal's March 14 game (Everton, PL) nor Leverkusen's March 14 game (Bayern Munich, BL) appear in the last-20 data. These are the freshest form indicators and are absent.

3. **No historical H2H.** These teams haven't faced each other in the dataset outside the first leg. The analysis relies entirely on each team's general home/away patterns rather than matchup-specific data.

4. **Small venue-filtered samples.** Arsenal PL home: n=6. Leverkusen away: n=11. The Arsenal home sample is particularly thin — one more high-corner game would shift the average materially. The 15-corner Chelsea game represents 17% of the sample.

5. **Arsenal's high home variance** (SD ~3.5 on total corners) means the Poisson model underestimates tail probabilities. Extreme outcomes (3 or 15 corners) are more likely than Poisson suggests. This means my Under 10.5 edge could be eroded if the match produces an outlier.

6. **Timber injury impact unknown.** Timber started 13/18 Arsenal games but only missed confounded games. His replacement (Mosquera/Calafiori) could alter Arsenal's overlapping patterns in ways the data can't predict.

7. **CL knockout dynamics.** The analysis applies regular-season patterns to a knockout game where tactical approaches may differ. Managers may adopt unusual formations, substitution timing, or set-piece strategies that fall outside the historical distribution.

8. **Cross-league comparison.** Arsenal's data is primarily from the PL, Leverkusen's from the Bundesliga. These leagues have similar corner averages but different pressing intensities and tactical styles. The Bundesliga's more open, transition-heavy style may not apply at the Emirates.