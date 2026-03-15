## Statistical Summary

| Metric | Man United (Home) | Aston Villa (Away) |
|--------|-------------------|---------------------|
| Venue-filtered avg corners won | 5.33 (n=9) | 4.56 (n=9) |
| Venue-filtered avg corners conceded | 4.44 | 4.67 |
| All-games avg corners won | 4.68 (n=19) | 5.32 (n=19) |
| All-games avg corners conceded | 4.74 | 4.37 |
| H2H avg corners (matching venue) | 4.0 (n=1) | 3.0 (n=1) |
| H2H avg corners (all) | 4.00 | 4.67 |
| H2H avg total | 8.67 | — |
| League avg total | ~10.0–10.5 | — |

**Predicted total**: 8–12 (central 9.5)
**Predicted spread**: Man United −0.5 / +0.5

---

## Detailed Analysis

### Phase 1A — Data Cleaning

**Man United**: Game 9 (Brighton, FA Cup, Jan 11) has corners marked "-". Excluded. **19 valid games**, all Premier League. No cup games with usable corner data remain.

**Aston Villa**: Game 10 (Tottenham, FA Cup, Jan 10) has corners marked "-". Excluded. Game 4 (Newcastle, FA Cup, Feb 14) has valid data (6w-6c = 12) and Newcastle are a same-league opponent — retained but flagged as cup. **19 valid games** (18 PL + 1 FA Cup vs PL opposition).

---

### Phase 1B — Man United (Home) Corner Stats

**Venue-filtered (9 home games)**

| Game | Won | Conc | Total |
|------|-----|------|-------|
| Crystal Palace (Mar 1) | 7 | 1 | 8 |
| Tottenham (Feb 7) | 7 | 0 | 7 |
| Fulham (Feb 1) | 3 | 7 | 10 |
| Man City (Jan 17) | 1 | 6 | 7 |
| Wolves (Dec 30) | 8 | 4 | 12 |
| Newcastle (Dec 26) | 2 | 11 | 13 |
| Bournemouth (Dec 15) | 5 | 4 | 9 |
| West Ham (Dec 4) | 6 | 6 | 12 |
| Everton (Nov 24) | 9 | 1 | 10 |

**Corners won**: mean 5.33, median 6, range 1–9, variance 6.89
**Total corners**: mean 9.78, median 10, range 7–13, variance 4.40

**All-games (19 games)**

**Corners won**: mean 4.68, median 4, range 1–9, variance 6.00
**Total corners**: mean 9.37, median 10, range 6–13, variance 3.49

**Venue vs overall delta**: Home total +0.41 above all-games; home corners won +0.65 above; home corners conceded −0.30 (concede slightly fewer at home).

**Trend — recent 6 vs older 13**:
- Recent 6 (Newcastle A through Fulham H): avg won 4.17, avg total 8.33
- Older 13: avg won 4.92, avg total 9.85
- Drop of −1.52 on total is not outlier-driven: removing the lowest recent game (Newcastle A, 6 total) still gives 8.80; removing the highest (Everton A, 11) gives 7.80. The decline is real and consistent.

**Recent 4 home games only**: totals of 8, 7, 10, 7 → avg 8.0. This is 1.78 below the full home average of 9.78 and represents a marked tightening under Carrick's 4-2-3-1 at home.

**Threshold frequencies (venue-filtered / all-games)**:

| Line | Home Over% | All-games Over% |
|------|-----------|-----------------|
| 8.5 | 6/9 = 66.7% | 11/19 = 57.9% |
| 9.5 | 5/9 = 55.6% | 10/19 = 52.6% |
| 10.5 | 3/9 = 33.3% | 5/19 = 26.3% |
| 11.5 | 3/9 = 33.3% | 3/19 = 15.8% |

Man United home games exceed 9.5 in 55.6% of cases — near the 50% mark, consistent with their home mean of 9.78.

---

### Phase 1C — Aston Villa (Away) Corner Stats

**Venue-filtered (9 away games)**

| Game | Won | Conc | Total |
|------|-----|------|-------|
| Wolves (Feb 27) | 5 | 0 | 5 |
| Bournemouth (Feb 7) | 4 | 11 | 15 |
| Newcastle (Jan 25) | 5 | 6 | 11 |
| Crystal Palace (Jan 7) | 5 | 3 | 8 |
| Arsenal (Dec 30) | 3 | 3 | 6 |
| Chelsea (Dec 27) | 7 | 6 | 13 |
| West Ham (Dec 14) | 3 | 5 | 8 |
| Brighton (Dec 3) | 6 | 5 | 11 |
| Leeds (Nov 23) | 3 | 3 | 6 |

**Corners won**: mean 4.56, median 5, range 3–7, **variance 1.80** (SD 1.34). Extremely consistent — every away game falls in a 3–7 band.
**Total corners**: mean 9.22, median 8, range 5–15, variance 10.62. The Bournemouth outlier (15) inflates variance dramatically. Without it: mean 8.50, variance 7.25.

**All-games (19 games)**

**Corners won**: mean 5.32, median 5, range 3–12, variance 4.64. The Brentford home game (12 won) is an outlier; without it: mean 4.94, variance 2.42.
**Total corners**: mean 9.68, median 10, range 5–15, variance 7.27.

**Venue vs overall delta**: Away total −0.46 below all-games; away won −0.76 below (fewer corners won away); away conceded +0.30 (concede more).

**Trend — recent 6 vs older 13**:
- Recent 6 (Chelsea H through Bournemouth A): avg won 5.33, avg total 10.67
- Older 13: avg won 5.31, avg total 9.23
- The recent total uptick is largely driven by the Bournemouth outlier (15). Without it: recent 5 avg total 9.80 — a modest increase, not dramatic.

**Threshold frequencies (away / all-games)**:

| Line | Away Over% | All-games Over% |
|------|-----------|-----------------|
| 8.5 | 4/9 = 44.4% | 12/19 = 63.2% |
| 9.5 | 4/9 = 44.4% | 11/19 = 57.9% |
| 10.5 | 4/9 = 44.4% | 8/19 = 42.1% |
| 11.5 | 2/9 = 22.2% | 5/19 = 26.3% |

The identical 44.4% across 8.5–10.5 on away games is notable: the same 4 games (Bournemouth 15, Newcastle 11, Chelsea 13, Brighton 11) account for all "overs" across those three lines. The remaining 5 away games all landed at ≤8. Villa's away corner totals cluster bimodally — either ≤8 or ≥11 — with nothing between 9 and 10 in the sample.

---

### Phase 1D — Outlier Check

Combined 38 valid games: mean total = 9.53, SD = 2.31. Outlier threshold: >14.15 or <4.91.

**Flagged**: Villa at Bournemouth (A) = 15 total (>2σ). In that game, Sancho exited at 22' and Buendía at 35', leaving Villa with reduced attacking options. They defended deep while Bournemouth racked up 11 corners (27 crosses, xGA 1.83). This is clearly anomalous and not representative of Villa's typical away profile.

**Venue-filtered averages with and without the outlier**:
- Villa away total: 9.22 (with) → 8.50 (without)
- Villa away won: 4.56 (with) → 4.63 (without) — barely changes
- Villa away conceded: 4.67 (with) → 3.88 (without) — the outlier inflates conceded corners significantly

No Man United home games exceed the outlier threshold. The Newcastle home game (13 total, driven by Newcastle's 11 corners and 46 crosses) is the highest but at 1.5σ, below the 2σ cutoff.

---

### Phase 1E — Head-to-Head

**All H2H (3 games)**: MU avg 4.0 won, Villa avg 4.67 won, total avg 8.67.

**Same venue — Old Trafford (1 game only)**:
- May 2025: MU 4, Villa 3 (7 total). Man United dominated (xG 2.96, xPts 2.87, 24 deep completions). Total of 7 is the lowest H2H.

**Personnel continuity**:

| H2H Game | MU Overlap w/ Expected XI | Villa Overlap | Age | Signal Weight |
|----------|--------------------------|---------------|-----|---------------|
| Dec 2025 (Villa Park) | ~5/11 (no Mazraoui, Maguire, Casemiro, Mainoo, Mbeumo) | ~7/11 (if McGinn starts) | 3 months | Low (poor MU overlap, different venue) |
| May 2025 (Old Trafford) | ~4/11 (different GK, forwards, no Shaw/Yoro) | ~6/11 | 10 months | Very low (old, poor overlap both sides) |
| Oct 2024 (Villa Park) | ~4/11 (completely different era) | ~4/11 | 17 months | Negligible |

**H2H conclusion**: The signal is too weak to meaningfully influence predictions. The only Old Trafford game produced 7 total corners with a squad bearing <40% resemblance to the expected Man United XI. The Dec 2025 reverse fixture (10 total, 5-5 split) has better Villa overlap but was at Villa Park with a very different Man United shape (3-4-2-1 with Ugarte, Dorgu, Mount — none expected to start). I am heavily discounting all three games.

---

### Phase 1F — Lineup, Substitution & Formation

**Formation correlation (Man United)**:

| Formation | Games | Avg Won | Avg Conceded | Avg Total |
|-----------|-------|---------|-------------|-----------|
| 4-2-3-1 | 11 | 4.00 | 5.18 | 9.18 |
| 3-4-2-1 | 8 | 5.63 | 4.00 | 9.63 |

The expected 4-2-3-1 produces 0.45 fewer total corners than the 3-4-2-1 and notably fewer corners won (4.00 vs 5.63). The 3-4-2-1 provided extra width through wing-backs (Dorgu, Dalot) which generated more crosses and corners. However, this split is confounded with time — the 3-4-2-1 was used primarily Nov-Dec before Carrick switched to 4-2-3-1 from January onward.

**Formation correlation (Villa)**:

| Formation | Games | Avg Won | Avg Conceded | Avg Total |
|-----------|-------|---------|-------------|-----------|
| 4-2-3-1 | 17 | 5.35 | 4.35 | 9.71 |
| 4-4-2 | 2 | 5.00 | 4.50 | 9.50 |

Villa's expected 4-2-3-1 is used in 17/19 games. The 4-4-2 sample is too small to draw conclusions.

**Key player–corner correlations (Man United, ≥3 games)**:

**Bryan Mbeumo** (expected starter): IN 14 games, OUT 5 (Burnley A, Leeds A, Wolves H, Newcastle H, Villa A).
- Avg total IN: 8.93 | Avg total OUT: 10.60
- Higher totals without Mbeumo, but the 5 "OUT" games include Newcastle H (13) which inflates the average. Removing that outlier: OUT avg = 10.00. The split is confounded with formation (OUT games were primarily 3-4-2-1 in Dec). Not a causal relationship.

**Benjamin Sesko** (expected starter): Started 7 of 19 games.
- Avg total when starting: 9.57 | Not starting: 9.25. Negligible difference.
- Avg corners won when starting: 5.14 | Not starting: 4.42. Sesko's physical presence may generate slightly more corners through shots blocked, but 7-game sample is noisy.

**Early attacking subs before 70'**: Man United made early attacking changes in several games (Casemiro off 19' vs Fulham, Shaw off 17' vs Man City, Mbeumo off 37'/38' in multiple games). These early changes generally did not produce distinctly different corner patterns — the game-state and formation effects are dominant.

**Villa formation note**: With the expected 4-2-3-1 and both Kamara and Tielemans absent, Villa's midfield pivot will be Douglas Luiz and Amadou Onana. Douglas Luiz has been less reliable in controlling tempo — his early substitutions (off at 2' vs Chelsea, off at 4' in the FA Cup) signal fitness concerns. If he can't complete the match, Villa's midfield shape could disintegrate, potentially creating a chaotic game.

---

### Phase 1G — Absence Impact

**Man United absences**:
- **Lisandro Martínez** (calf): CB. Started 7/19 games. Avg total when starting: 9.43 vs 9.33 without. Minimal corner impact — he's a centre-back, not a corner-generating player.
- **Patrick Dorgu** (hamstring): Wing-back/winger. Started 7 games. Avg total: 9.43 vs 9.33 without. Despite being an attacking presence, the data shows no measurable corner differential.
- **De Ligt** (back): CB. Only started 3 of the 19 valid games (all in Nov). No meaningful impact assessment possible.

None of these absences materially affect corner predictions.

**Villa absences**:
- **Boubacar Kamara** (knee, season-ending): DM/anchor. Started 9 games. Avg total WITH Kamara: 8.89 vs WITHOUT: 10.40. This 1.51-corner difference is notable — Kamara stabilises the midfield and reduces game chaos. However, the split is confounded with time (Kamara played earlier when Villa also had Tielemans). The effect may be partially real: without their defensive anchor, games are more open.
- **Youri Tielemans** (ankle, out ~mid-April): CM. Started 12 games. Avg total WITH: 8.92 vs WITHOUT (last 7 games): 11.00. A striking 2.08-corner difference. Removing the Bournemouth outlier (15) from the WITHOUT set: avg becomes 10.33. Still meaningfully higher. Tielemans is a tempo controller; without him, Villa lose midfield discipline and games open up. But again, confounded with Kamara's absence in the same period.
- **Jadon Sancho** (ineligible, on loan from Man United): Started 7 Villa games. Avg total when starting: 10.0 vs 9.50 without. Modest impact. His absence removes a winger who gets wide and delivers crosses.
- **John McGinn** (returning from knee injury): Missed last 10 matches. Was a late sub at Lille (Mar 12). If he starts, he adds set-piece quality and aggressive forward runs. But match fitness is a concern — limited training, just 15-20 minutes of game action since January. His impact may be muted.

**Net assessment**: Villa are without their two key midfield controllers (Kamara, Tielemans) and one attacking winger (Sancho). The data shows total corners trend higher without Kamara/Tielemans, suggesting more open games. However, "more open" could go either way for total corners. Crucially, Villa's away corners-won consistency (SD 1.34) has been maintained even without these players in recent away games, suggesting the defensive midfield absences affect game structure more than Villa's own corner output.

---

### Phase 1H — Contextual Factors

**League baseline**: Premier League averages ~10.0–10.5 total corners. Man United home (9.78) sits slightly below; Villa away (9.22 / 8.50 ex-outlier) sits further below.

**Score-state patterns**: Man United's highest home corner totals (Newcastle 13, Wolves 12, West Ham 12) were games where Man United led early and opponents chased the game, racking up corners through desperate attacks. When Man United dominated without needing to chase (Tottenham 7, Man City 7), totals were very low. If Man United score first in this match — which their home record suggests is likely — they may control the game and suppress total corners. Conversely, if Villa score first, Man United's chasing could inflate corners for both sides.

**Motivation**: Direct top-4 clash, both on 51 points. Both teams need a result. Man United bouncing back from a Newcastle defeat; Villa in freefall (1 point from 3 PL games, 4-1 loss to Chelsea). The desperation cuts both ways: it could produce an open, attacking match (higher corners) or a tense, error-averse contest (lower corners). In Premier League top-4 clashes, tension usually dominates early before one team is forced to chase. This historically produces moderate corner counts.

**Fatigue**: Villa played Europa League at Lille on Thursday (Mar 12), 3 days before this match. Man United have no European football. This asymmetry is significant — Villa's pressing intensity and attacking runs into corner-generating positions may be reduced. Fatigue tends to suppress the fatigued team's corner output while potentially increasing the fresh team's attacks (though Man United's counter-attacking style under Carrick may not translate to more corners if they're content to defend a lead).

**Possession-corners decoupling note**: Man United under Carrick have often won without high possession. Their low PPDA at home (ranging 5.4–19.4) reflects varying pressing approaches. In domination games (Tottenham, Man City), Man United had many shots but relatively few corners — consistent with the possession-corners decoupling principle. Corners require final-third chaos, not midfield control.

---

### Phase 2 — Predicted Distribution

**Man United corners won — central estimate: 5.0 (range 3–7)**

Primary input is Man United's own corners-won patterns. The home average of 5.33 is the strongest anchor, supported by 9 games at Old Trafford. The all-games rate (4.68) is lower but includes away games where United are less assertive. The recent trend (4.17 over last 6 games) pulls downward, as does the 4-2-3-1 formation average (4.00). However, the last 2 home games saw 7 corners won each (vs Crystal Palace and Tottenham), so the downward trend may have stabilised.

Villa's away corners conceded (4.67) aligns closely with Man United's home won (5.33), confirming the estimate rather than creating tension. Villa have been reasonably porous to opposition corners on the road.

The motivation factor (bounce-back game, top-4 clash) and Villa's fatigue provide a slight upward nudge — Man United should have more attacking energy. However, the 4-2-3-1 formation caps the upside relative to the old wing-back system. I settle on 5.0, splitting between the home anchor (5.33) and the formation/trend drag (4.0–4.2).

**Aston Villa corners won — central estimate: 4.5 (range 3–6)**

Villa's away corners won is remarkably consistent: mean 4.56, median 5, SD 1.34, range 3–7. This is the tightest distribution in the data set and provides high confidence in a narrow prediction range. They reliably produce 4–5 corners away from home regardless of opponent quality (3 at Arsenal, 5 at Newcastle, 5 at Crystal Palace, 7 at Chelsea).

Man United's home conceded rate (4.44) aligns almost perfectly with Villa's away won (4.56). No tension between these inputs.

Sancho's ineligibility removes one crossing threat. McGinn's return adds energy but his match fitness is questionable. Villa's Europa League fatigue is the main downward factor — fewer high-intensity attacking runs means fewer shots blocked and crosses into the area. However, Villa's consistency suggests these factors affect the margin rather than the core output. I estimate 4.5, marginally below their 4.56 away average, reflecting fatigue and the loss of Sancho.

**Total match corners — central estimate: 9.5 (range 7–12)**

The per-team sum (5.0 + 4.5 = 9.5) is consistent with the match-level data:
- Man United home avg total: 9.78
- Villa away avg total: 9.22 (8.50 ex-outlier)
- Average: 9.50 (9.14 ex-outlier)
- Man United recent 4 home games: avg 8.0
- Man United 4-2-3-1 formation avg total: 9.18

The league baseline (~10.0–10.5) is above my estimate, but both teams' venue-filtered data supports a total at or below the league average. The recent 4-home-game average (8.0) is the strongest recency signal, but it was against opponents of varying quality — Villa are a more attacking proposition than most, which should push the total slightly higher. I weight the broader home sample (9.78) and the recent trend equally, landing at 9.5.

**Corner spread (MU − Villa) — central estimate: +0.5 (range −2 to +3)**

Man United's home corner-win advantage (5.33 won vs 4.44 conceded = net +0.89) is modest. Villa's away record shows they frequently match or beat home teams on corners (won corner count in 4/9 away games, drew 2/9). The predicted 5.0 vs 4.5 gives a spread of +0.5 — Man United slight corner favourites at home but far from dominant.

**Reconciliation of contradictions**:

1. **Man United recent home total (8.0) vs full home average (9.78)**: The recent 4 games include opponents who struggled to generate corners (Tottenham 0, Crystal Palace 1). Villa are a stronger attacking team and should generate more opposition corners. However, Man United also won 7 corners in 2 of those 4 games, suggesting they generate their own corners at home regardless. I give more weight to recent data but adjust upward for opponent quality, arriving at 9.5 rather than 8.0 or 9.78.

2. **Villa's all-games won (5.32) vs Man United's home conceded (4.44)**: Villa's overall rate includes home games where they're more assertive. Their away rate (4.56) aligns with Man United's conceded rate (4.44). No real contradiction once venue-filtered properly.

3. **Kamara/Tielemans absence suggesting higher totals vs Villa fatigue suggesting lower totals**: These partially cancel. Without their midfield controllers, Villa games have trended higher (10.40 avg). But fatigue suppresses their attacking output. I treat these as roughly offsetting, leaving the total at 9.5 rather than adjusting for either.

---

### Phase 3 — Value Identification

**Variance & distribution model**

Per-team total-corner variance (venue-filtered):
- Man United home: variance 4.40 (mean 9.78)
- Villa away: variance 10.62 (mean 9.22); without Bournemouth outlier: 7.25

Average variance: (4.40 + 10.62) / 2 = 7.51
Predicted mean: 9.5

Variance (7.51) < mean (9.5) → borderline Poisson territory. The underdispersion from Man United's home data (variance 4.40 vs mean 9.78, ratio 0.45) pulls the average down, while Villa's overdispersion (ratio 1.15, or 0.85 ex-outlier) pulls it up. **I use Poisson(μ=9.5)** as the simplest reasonable model, noting it slightly overestimates variance relative to the blended data.

**Poisson P(Over) at μ = 9.5**:

| Line | P(Over) Model | P(Under) Model |
|------|---------------|----------------|
| 8.5 | 60.8% | 39.2% |
| 9.5 | 47.8% | 52.2% |
| 10.5 | 35.5% | 64.5% |
| 11.5 | 24.8% | 75.2% |
| 12.5 | 16.3% | 83.7% |

**Empirical P(Over) — averaging MU home and Villa away rates**:

| Line | MU Home | Villa Away | Avg Empirical |
|------|---------|-----------|---------------|
| 8.5 | 66.7% | 44.4% | 55.6% |
| 9.5 | 55.6% | 44.4% | 50.0% |
| 10.5 | 33.3% | 44.4% | 38.9% |
| 11.5 | 33.3% | 22.2% | 27.8% |
| 12.5 | 11.1% | 22.2% | 16.7% |

**Model vs empirical divergence > 10pp**: At line 8.5, the model gives Over 60.8% but empirical gives 55.6% (5.2pp gap — within tolerance). At line 10.5, model gives Over 35.5% vs empirical 38.9% (3.4pp — close). All lines agree within ~5pp. I blend 50/50 for final estimates.

**Blended P(Under) estimates**:

| Line | Blended Under% |
|------|----------------|
| 8.5 | (39.2 + 44.4) / 2 = 41.8% |
| 9.5 | (52.2 + 50.0) / 2 = 51.1% |
| 10.5 | (64.5 + 61.1) / 2 = 62.8% |
| 11.5 | (75.2 + 72.2) / 2 = 73.7% |

**Totals market edge calculation**:

| Line | Side | Book | Odds | Raw Impl | Overround | Vig-adj Impl | My Prob | Edge |
|------|------|------|------|----------|-----------|-------------|---------|------|
| 8.5 | U | DK | 2.75 | 36.4% | 107.8% | 33.7% | 41.8% | **+8.1%** |
| 8.5 | U | FD | 2.60 | 38.5% | 107.4% | 35.8% | 41.8% | **+6.0%** |
| 9.5 | U | DK | 2.05 | 48.8% | 108.0% | 45.2% | 51.1% | **+5.9%** |
| 9.5 | U | FD | 1.94 | 51.5% | 107.4% | 48.0% | 51.1% | +3.1% |
| 10.5 | U | DK | 1.65 | 60.6% | 108.2% | 56.0% | 62.8% | **+6.8%** |
| 10.5 | U | FD | 1.60 | 62.5% | 107.1% | 58.3% | 62.8% | +4.5% |
| 11.5 | U | DK | 1.40 | 71.4% | 107.8% | 66.3% | 73.7% | **+7.4%** |
| 11.5 | U | FD | 1.34 | 74.6% | 107.4% | 69.5% | 73.7% | +4.2% |

DraftKings consistently offers better Under value due to their higher implied centre (~10.0 vs FanDuel's ~9.7).

**Sensitivity analysis**:

| Line (Under) | Edge at μ=9.0 | Edge at μ=9.5 | Edge at μ=9.75 | Edge at μ=10.0 |
|--------------|--------------|---------------|----------------|----------------|
| 8.5 DK 2.75 | +11.9% | +8.1% | +5.1% | +1.3% |
| 9.5 DK 2.05 | +13.6% | +5.9% | +3.5% | +0.6% |
| 10.5 DK 1.65 | +14.6% | +6.8% | +5.0% | +2.3% |
| 11.5 DK 1.40 | +14.4% | +7.4% | +5.7% | +3.4% |

Under 10.5 and Under 11.5 retain ≥5% edge up to μ≈9.75. Under 8.5 and Under 9.5 lose edge if the true mean exceeds ~9.75. The Under 10.5 pick is the most robust across scenarios.

**Spreads market**:

DraftKings: Man United −0.5 at 1.71 (vig-adj 53.9%), Villa +0.5 at 2.00 (vig-adj 46.1%).

Using Skellam approximation (μ_MU=5.0, μ_Villa=4.5): P(MU wins corner count) ≈ 50% via normal approximation with continuity correction. Empirical check: Man United won corner count at home in 5/9 games (55.6%); home teams won corner count in Villa's away games only 3/9 (33.3%). Averaging: ~44.5% for MU −0.5 — but this crude average is confounded by opponent quality. I trust the model-based ~50% as the best estimate.

Villa +0.5 at 2.00: my prob ≈ 50%, vig-adj implied 46.1%. Edge ≈ 3.9%. Below the 5% threshold — monitoring only.

**Cross-checks**:

Book's implied team corners from totals centre + spread:
- FanDuel centre ≈ 9.7, DraftKings centre ≈ 10.0 (averaged: 9.85)
- Spread: MU −0.5
- Implied MU corners: (9.85 + 0.5)/2 = 5.18 | Mine: 5.0 | Divergence: −0.18
- Implied Villa corners: (9.85 − 0.5)/2 = 4.68 | Mine: 4.5 | Divergence: −0.18
- Both divergences well within 1.0 corner.

Inter-book comparison: FanDuel and DraftKings differ by 2–6% on raw implied probabilities across all lines. No line exceeds 10% divergence. DraftKings systematically offers better Under prices; FanDuel better Over prices. This is consistent with DraftKings pricing a ~0.3-corner higher total.

---

## Value Picks

| # | Pick | Line | Odds | Est. Prob | Implied Prob | Edge | Confidence |
|---|------|------|------|-----------|--------------|------|------------|
| 1 | Under Total Corners | 10.5 | 1.65 (DK) | 63% | 56.0% | +7.0% | 6.5/10 |
| 2 | Under Total Corners | 8.5 | 2.75 (DK) | 42% | 33.7% | +8.3% | 5.5/10 |

**Pick 1 — Under 10.5 Total Corners at DraftKings 1.65**

Man United's last four home matches have produced 8, 7, 10, and 7 total corners — none exceeding 10.5. Villa's away games produce ≤10 corners in 5 of 9 matches (55.6%), including at Arsenal (6), Crystal Palace (8), and West Ham (8). The blended empirical-model estimate of 63% for Under 10.5 significantly exceeds DraftKings' vig-adjusted implied probability of 56%. This pick retains ≥5% edge even if the true mean is as high as 9.75, making it the most robust of the available plays. The primary risk is an early goal triggering a desperate chase that inflates second-half corner volume — but even in Man United's most open home game (Newcastle 13), the total only reached 13.

**Pick 2 — Under 8.5 Total Corners at DraftKings 2.75**

Villa's away total has been ≤8 in 5 of 9 games — a 55.6% rate that far exceeds the book's implied 33.7%. Man United at home have hit ≤8 three times in four recent games (Tottenham 7, Crystal Palace 8, Man City 7). The 4-2-3-1 system under Carrick produces tighter, more controlled matches at Old Trafford than the previous wing-back shape. DraftKings prices this as a ~34% event; the data suggests ~42%. The book is anchoring to the league-average total (~10) and underweighting the venue-specific trend. This is a higher-variance play: if the game produces exactly 9 or 10 corners, this bet loses while Pick 1 survives. If both teams start cautiously in this high-stakes clash, ≤8 is very much in range.

**Monitoring (3–5% edge, not recommended at current prices)**:
- Under 9.5 at DraftKings 2.05 — edge ~5.9% but loses edge rapidly if μ exceeds 9.75
- Villa +0.5 Corner Spread at DraftKings 2.00 — edge ~3.9%, driven by Villa's consistent away corner production

---

## Bets to Avoid

**Over 9.5 Total Corners at FanDuel 1.79**: The book prices this as a 52% event (vig-adjusted), which may tempt bettors who assume a top-4 clash will be open and attacking. However, Man United's recent home total trend (8.0 avg over last 4), their 4-2-3-1 formation average of 9.18, and Villa's away average of 9.22 all point to a centre near 9.5, not above it. High-motivation matches between quality teams often produce tactical caution rather than end-to-end action. There is no edge on the Over here.

**Man United −0.5 Corner Spread at DraftKings 1.71**: Man United's home advantage might suggest they'll comfortably outnumber Villa on corners, but Villa's away corners-won consistency (SD 1.34, range 3–7 in all 9 games) makes them exceptionally reliable at generating 4–5 corners regardless of venue or opponent. Man United have failed to win the corner count in 4 of 9 home games. The vig-adjusted implied probability of 53.9% exceeds the model estimate of ~50%. This is a bet where the market overweights home advantage.

---

## Caveats

1. **Small venue-filtered samples**: Both teams have only 9 venue-specific games. Variance estimates from n=9 carry substantial sampling error. The true variance could be materially higher or lower than observed.

2. **Mean sensitivity**: Both value picks depend on the true match total centring near 9.5. If the true mean is 10.0 (the DraftKings implied centre), edges on both picks shrink below the 5% threshold. The disagreement with the market is modest (0.5 corners) and could reflect information the model doesn't capture.

3. **Villa midfield instability**: Douglas Luiz has been substituted in the opening minutes in 2 of his last 4 starts (2' vs Chelsea, 4' in the FA Cup). If he exits early again, Villa's shape collapses and the game could become chaotic — increasing total corner risk.

4. **Score-state dependence**: If either team concedes early, the chasing dynamic typically inflates second-half corners. Man United's Newcastle home game (13 total, conceded 11 corners) demonstrates how a leading team can park and allow the opponent to generate corners. An early Man United lead followed by Villa chasing is the highest-corner scenario and would threaten both Under picks.

5. **H2H data is essentially unusable**: Only 1 Old Trafford game with <40% squad overlap and dated 10 months. The H2H baseline of 8.67 total happens to support the Under thesis, but I assign it negligible weight.

6. **Model assumption**: Poisson slightly overestimates variance relative to the blended venue-filtered data (estimated variance 7.51 vs Poisson variance = mean = 9.5). This means the model may marginally overstate the probability of extreme outcomes (both very high and very low totals). The net effect on the picks is small.