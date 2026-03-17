Let me search for the latest team news and then work through the full analysis.

Now I have everything needed. Let me produce the full analysis.

---

## Statistical Summary

| Metric | Chelsea (Home) | PSG (Away) |
|--------|---------------|------------|
| Venue-filtered avg corners won | 7.17 (n=6 PL) | 6.20 (n=10) |
| Venue-filtered avg corners conceded | 4.67 (n=6 PL) | 3.50 (n=10) |
| All-games avg corners won | 6.75 (n=16) | 6.15 (n=20) |
| All-games avg corners conceded | 4.19 (n=16) | 3.10 (n=20) |
| H2H avg corners (matching venue) | N/A (no data) | N/A |
| H2H avg corners (all) | N/A | N/A |
| H2H avg total | N/A | - |
| League avg total | ~9.8 (PL) | ~9.5 (L1 est.) |

**Predicted total**: 9–14 (central 11.0)
**Predicted spread**: Chelsea −2.5 / −3.5 (central −3.0)

---

## Detailed Analysis

### Phase 1 — Statistical Analysis

#### 1A. Data Cleaning

**Chelsea**: 20 games listed, 4 with missing corner data (Hull City FA Cup, Arsenal League Cup home, Charlton FA Cup, Cardiff League Cup). **16 valid games remain.** All missing-data games are domestic cup ties. Among the valid 16: Napoli (A, CL) and Pafos (H, CL) are European games. Pafos (Cypriot league) is non-comparable to PL level; Napoli is comparable. The Pafos home game (15w-2c, 42 crosses) is contextually anomalous and will be excluded from venue-filtered stats but included in all-games.

**PSG**: 20 games listed, all 20 have corner data. **20 valid games.** Seven are CL (Monaco ×2, Newcastle, Sporting, Athletic, Tottenham, Bayern); rest are Ligue 1. All CL opponents are reasonably comparable.

Additionally, web search confirmed two games missing from the dataset: the **first leg PSG 5-2 Chelsea (Mar 11)** produced just **5 total corners (PSG 2, Chelsea 3)**, and **Chelsea 0-1 Newcastle (Mar 14, home)** produced **9 total corners (Chelsea 8, Newcastle 1)**. These are referenced as supplementary data where relevant but are not included in the primary statistical calculations.

#### 1B. Chelsea (Home) — Corner Stats

**Venue-filtered (Home PL, n=6)**:

| Opp | CW | CC | Total |
|-----|----|----|-------|
| Burnley | 9 | 5 | 14 |
| Leeds | 4 | 1 | 5 |
| West Ham | 9 | 3 | 12 |
| Brentford | 3 | 9 | 12 |
| Bournemouth | 12 | 3 | 15 |
| Aston Villa | 6 | 7 | 13 |

- **Corners won**: mean 7.17, median 7.5, range 3–12, SD 3.43
- **Total**: mean 11.83, median 12.5, range 5–15, variance 12.56, SD 3.54
- Including the supplementary Newcastle game (8w-1c=9) gives n=7: CW mean 7.29, total mean 11.43

**All-games baseline (n=16)**:
- **Corners won**: mean 6.75, median 5.5, range 1–15, SD 3.95
- **Total**: mean 10.94, median 11.5, range 5–17, variance 13.13, SD 3.62

**Venue vs overall delta**: Home CW is +0.42 above all-games (7.17 vs 6.75); home total is +0.89 above all-games (11.83 vs 10.94). Chelsea produce moderately more corners at home.

**Trend — recent 6 vs rest**: Recent 6 valid games (Aston Villa A through Arsenal LC): totals 11, 15, 14, 5, 7, 7 → mean 9.83. Older 10: mean 11.6. Recent CW: 8, 10, 9, 4, 4, 5 → mean 6.67. Older CW: mean 6.80. Totals trend slightly downward recently but this is driven by three away/cup games (Leeds H=5 and two away games at 7 each); the three most recent games (Villa A, Arsenal A, Burnley H) averaged 13.3 total. No clear systematic trend — more noise than signal.

The supplementary Newcastle home game (8w-1c=9, Mar 14) is another moderate-total home game, consistent with this range.

**Threshold frequencies — all games (n=16)**:

| Line | All-games | Home PL (n=6) |
|------|-----------|---------------|
| Over 8.5 | 12/16 = 75.0% | 5/6 = 83.3% |
| Over 9.5 | 11/16 = 68.8% | 5/6 = 83.3% |
| Over 10.5 | 9/16 = 56.3% | 5/6 = 83.3% |
| Over 11.5 | 8/16 = 50.0% | 5/6 = 83.3% |
| Over 12.5 | 6/16 = 37.5% | 3/6 = 50.0% |

Chelsea are a high-corner-propensity team. At home, 83.3% of PL games exceeded 10.5 total corners — well above the book's median line (~10.0). The sole exception is Leeds (5 total), a game dominated by Chelsea (3.21 xG) with two penalties, meaning sustained open-play pressure never developed.

#### 1C. PSG (Away) — Corner Stats

**Venue-filtered (Away, n=10)**:

| Opp | CW | CC | Total | Comp |
|-----|----|----|-------|------|
| Le Havre | 3 | 3 | 6 | L1 |
| Monaco | 8 | 1 | 9 | CL |
| Rennes | 8 | 5 | 13 | L1 |
| Strasbourg | 7 | 5 | 12 | L1 |
| Auxerre | 7 | 2 | 9 | L1 |
| Sporting | 10 | 2 | 12 | CL |
| Metz | 4 | 4 | 8 | L1 |
| Athletic | 6 | 4 | 10 | CL |
| Monaco | 4 | 4 | 8 | L1 |
| Lyon | 5 | 5 | 10 | L1 |

- **Corners won**: mean 6.20, median 6.50, range 3–10, SD 2.20
- **Corners conceded**: mean 3.50, median 3.50, range 1–5, SD 1.51
- **Total**: mean 9.70, median 9.50, range 6–13, variance 4.68, SD 2.16

**All-games baseline (n=20)**:
- **Corners won**: mean 6.15, median 5.50, range 3–10, SD 1.95
- **Total**: mean 9.25, median 9.50, range 5–14, variance 6.42, SD 2.53

**Venue vs overall delta**: Away CW is +0.05 above all-games (essentially flat). Away total is +0.45 above all-games (9.70 vs 9.25). PSG's away games produce marginally more corners than the overall profile.

**CL away subset (n=3)**: Monaco (9), Sporting (12), Athletic (10) → mean total 10.33, PSG CW mean 8.0. These are PSG's highest-corner away games, suggesting quality opposition pushes totals up. This is directly relevant for facing Chelsea.

**Trend — recent 6 vs rest**: Recent 6: 6, 12, 5, 9, 13, 7 → mean 8.67. Older 14: mean 9.50. Recent PSG CW: 3, 8, 4, 8, 8, 5 → mean 6.0 vs older 6.21. Slight downward trend in totals but driven by the Le Havre (6) and Metz (5) games against weak opposition. Against quality (Monaco CL 12, Rennes 13), totals remain elevated.

**Threshold frequencies**:

| Line | All-games (n=20) | Away (n=10) |
|------|------------------|-------------|
| Over 8.5 | 12/20 = 60.0% | 7/10 = 70.0% |
| Over 9.5 | 10/20 = 50.0% | 5/10 = 50.0% |
| Over 10.5 | 5/20 = 25.0% | 3/10 = 30.0% |
| Over 11.5 | 5/20 = 25.0% | 3/10 = 30.0% |
| Over 12.5 | 2/20 = 10.0% | 1/10 = 10.0% |

PSG are decidedly **not** a high-corner-propensity team. Only 25–30% of their games exceed 10.5 — well below the book's median. This is primarily because PSG's territorial dominance in Ligue 1 limits opponents' attacks, suppressing total corners. Their CL games against quality opponents show a different profile (3/7 = 43% over 10.5).

#### 1D. Outlier Check

**Chelsea all-games (n=16)**: mean 10.94, SD 3.62. 2σ threshold: 4.08–17.80. No game exceeds 2σ statistically. However, **Pafos (H, 17 total)** is a contextual outlier — Cypriot opposition, 42 crosses attempted, 15 corners won. Already excluded from venue-filtered stats. **Leeds (H, 5 total)** is the low extreme — Chelsea scored twice from penalties in a dominant display (3.21 xG, 24.8 oppPPDA), limiting organic attacking sequences.

**PSG all-games (n=20)**: mean 9.25, SD 2.53. 2σ threshold: 4.19–14.31. No game exceeds 2σ. **Rennes (H, 14 total)** is the high-end extreme — Rennes conceded 6 corners in a 5-0 demolition as they pushed forward chasing the game.

Venue-filtered averages with vs without extreme games:
- Chelsea Home total (n=6): 11.83 full → 13.20 without Leeds (n=5). The 5-corner Leeds game has material impact.
- PSG Away total (n=10): 9.70 full → no outlier to remove.

#### 1E. Head-to-Head

No H2H data exists in the dataset (confirmed "No H2H matches found between Chelsea and Paris Saint-Germain in the last 2 seasons").

From web search, the **first leg (Mar 11, Parc des Princes)** produced **5 total corners (PSG 2, Chelsea 3)** in a 5-2 PSG win. This is remarkably low for a 7-goal game. Key observations:
- PSG's goals came from clinical open-play transitions — direct attacks that didn't involve corner-producing sequences (blocked shots, deflected crosses)
- Chelsea were tactically passive (pragmatic away approach), limiting their own corner-winning opportunities
- The 5-2 scoreline killed the game early, reducing second-half urgency

**Personnel continuity with predicted XI**: Chelsea's predicted XI for the second leg shares ~8-9/11 starters with the first leg (Sánchez, Fofana, Chalobah, Cucurella, Caicedo, Palmer, Enzo, Neto, João Pedro all likely started both). PSG's predicted XI also shares ~8-9/11. High overlap, but the tactical context is completely reversed (Chelsea now all-out attack at home vs pragmatic away).

**Assessment**: The first leg is the only H2H point, played 6 days ago with high personnel overlap. However, I **heavily discount** this signal because: (a) different venue, (b) fundamentally different tactical setup — Chelsea now need 4 goals and will attack relentlessly from minute 1, whereas they were conservative in the first leg, (c) n=1 is inherently unreliable. The low corners reflect PSG's clinical finishing style, not a corner-suppressive dynamic between these squads.

#### 1F. Lineup, Substitution & Formation

**Chelsea predicted XI (4-2-3-1)**: Sánchez; Gusto, Fofana, Chalobah, Cucurella; Santos, Caicedo; Palmer, Enzo, Neto; João Pedro

**Key player–corner correlations** (≥3 valid games):

| Player | Games In XI | Avg CW (In) | Avg CW (Out) | Avg Total (In) | Avg Total (Out) |
|--------|-------------|-------------|--------------|-----------------|-----------------|
| Cole Palmer | 12 | 6.58 | 7.50 | 10.58 | 12.25 |
| Pedro Neto | 8 (>45') | 6.75 | 6.75 | 11.38 | 10.25 |
| Enzo Fernández | 14 | 6.43 | 9.00 | 10.57 | 13.00 |
| Moisés Caicedo | 15 | 6.73 | 7.00 | 10.87 | 12.00 |
| João Pedro | 13 | 7.15 | 5.67 | 11.08 | 10.67 |

No dramatic individual correlations emerge. Palmer's absence correlates with slightly *higher* totals (12.25 vs 10.58) in a small out-sample (4 games), likely noise from the Pafos 17-corner game. João Pedro shows a mild positive signal for corners won (7.15 in vs 5.67 out), consistent with his role as a target for crosses.

**Early attacking substitutions (before 70')**: Chelsea make frequent early changes — 10 of 16 valid games had an attacker leave before 60'. This appears to be a structural pattern under multiple managers rather than injury-driven. Games with 2+ early exits: mean total 11.4. Without: mean 10.7. No significant impact.

**PSG predicted XI (4-3-3)**: Safonov; Hakimi, Marquinhos, Pacho, Nuno Mendes; Zaïre-Emery, Vitinha, Neves; Dembélé, Barcola, Kvaratskhelia

| Player | Games In XI | Avg CW (In) | Avg Total (In) | Notes |
|--------|-------------|-------------|-----------------|-------|
| Achraf Hakimi | 9 | 6.33 | 9.22 | Key RB threat |
| Ousmane Dembélé | 4 (>45') | 7.50 | 9.75 | Early exits in 4/8 starts |
| Bradley Barcola | 14 | 6.07 | 9.36 | Consistent starter |
| Kvaratskhelia | 12 | 6.17 | 9.17 | Key wide attacker |

Hakimi's presence shows no corner uplift (9.22 total vs 9.27 without). Dembélé's small sample (4 games with meaningful minutes) is inconclusive. Luis Enrique rotates aggressively — no single player drives corner patterns.

#### 1G. Absence Impact

**Chelsea confirmed absences**:
- **Reece James** (hamstring): Right-back/wingback who started 10/16 valid games. When James started: CW mean 6.3, total mean 11.6. When absent: CW mean 7.5, total mean 9.8. Counterintuitively, Chelsea won *more* corners without James (possibly because replacements like Gusto/Acheampong overlap more aggressively). **Not a concern for corners.**
- **Filip Jørgensen** (groin): Backup GK, irrelevant for corners.
- **Levi Colwill** (ACL): Not appeared in the 20-game sample. No impact.
- **Estêvão** (returning from injury, unlikely to feature): Started 6 valid games. CW when starting: 5.67. When absent: 7.20. Estêvão's presence correlated with *lower* Chelsea corners, possibly because he's more of a dribbler than a crosser. **Absence may slightly benefit Chelsea's corner output.**

**PSG confirmed absences**:
- **Fabián Ruiz** (knee): Started 9 valid games. Total when in: 9.44. When out: 9.09. Minimal impact — a central midfielder who doesn't directly influence corner generation.
- **Quentin Ndjantou** (hamstring): Rotation player, appeared in limited minutes. No impact.

**Pedro Neto's status is uncertain** (reported as "under investigation"). If unavailable, Neto started 8 games with meaningful minutes: CW 6.75, total 11.38. Without him (8 games): CW 6.75, total 10.25. Neto's absence would slightly lower the total expectation by ~1 corner, as he's Chelsea's highest-volume crossing threat on the left flank.

#### 1H. Contextual Factors

**League baseline**: PL season average is ~9.84 total corners per game. Chelsea's all-games average (10.94) is **1.10 above league baseline** — a high-corner team. PSG's all-games average (9.25) is approximately at or slightly below estimated L1 baseline (~9.5).

**Score-state analysis**: Chelsea's highest-corner home games correlate with trailing or drawing positions:
- West Ham (H): Trailing 0-2 at HT → 9 corners won (12 total, won 3-2)
- Bournemouth (H): Level 2-2 at HT → 12 corners won (15 total)
- Burnley (H): Leading 1-0 at HT → 9 corners won (14 total, drew 1-1)

When Chelsea trail, they press harder and generate more corners. In this match, Chelsea effectively "trail" from kickoff (5-2 aggregate down). This should sustain maximum attacking intensity throughout.

**Motivation & form**: Chelsea are 6th in the PL (48 pts), fighting for top-4 and facing Champions League elimination. This is a season-defining match. Rosenior explicitly stated they "must be perfect" — expect ultra-aggressive tactics from minute 1 with fullbacks pushed high, early crosses, and sustained pressure. Conversely, PSG (1st in Ligue 1, 57 pts, reigning European champions) hold a 3-goal cushion and can absorb. Luis Enrique warned of "moments of suffering," suggesting PSG expect sustained Chelsea pressure but plan to ride it out.

**Rest differential**: Chelsea played Newcastle (Mar 14) — just 3 days' rest. PSG's Nantes match (Mar 15) was **postponed by the LFP** specifically to aid their CL preparation, giving PSG ~6 days since the first leg. This is a material advantage for PSG's freshness, particularly in the final 20 minutes when fatigue could reduce Chelsea's attacking intensity and corner production.

**Possession-corners consideration**: Chelsea will likely dominate territorial possession in this match, but desperation-driven attacking is different from passive possession recycling. Chelsea's attacking intent (high crosses, shots from distance, bodies committed forward) directly generates corner opportunities. PSG's likely approach (deep defensive block, counter-attack) means Chelsea's possession will be converted into corner-producing situations (crosses deflected out, shots blocked behind the goal line) rather than sterile midfield control.

### Phase 2 — Predicted Distribution

**Chelsea corners won — central estimate: 7.5 (range 4–12)**

Primary input: Chelsea's home CW average of 7.17 (n=6 PL) and the season-wide home average reported at 7.91. Recent home games show strong corner-winning ability: Burnley 9, West Ham 9, Bournemouth 12. The supplementary Newcastle game (8 CW on Mar 14) reinforces this.

Upward adjustment (+0.5 to +1.0): Chelsea will be maximally aggressive from kickoff, needing 4 goals. This means fullbacks pushed extremely high (Gusto and Cucurella both commit forward), maximum crossing volume, and sustained final-third pressure. When Chelsea trailed at half-time in the West Ham game, they produced 9 corners in a comeback — this is the game template for Tuesday.

Secondary context — PSG's away corners conceded (3.50): This is low, but primarily reflects PSG's territorial dominance in Ligue 1. Home teams in Ligue 1 rarely get sustained attacking opportunities against PSG. Chelsea at Stamford Bridge in desperation mode bear no resemblance to Auxerre or Le Havre at home. In PSG's CL away games against quality (Monaco, Sporting, Athletic), opponents won a combined average of 2.33 corners — still low, but PSG also conceded fewer in games they controlled. Here PSG will absorb, not dominate. I weight this secondary signal at roughly 20% versus Chelsea's own data at 80%, settling on **7.5**.

**PSG corners won — central estimate: 4.0 (range 1–7)**

Primary input: PSG's away CW average of 6.20 (n=10). However, this requires significant downward context adjustment.

Downward adjustment (−1.5 to −2.0): PSG hold a 5-2 aggregate lead and can afford to lose by 2 goals. Luis Enrique's game plan will prioritize defensive solidity over attacking volume. When PSG managed games from winning positions, their CW dropped: in comfortable away wins (Le Havre 3w, Metz 4w, Monaco L1 4w), mean CW was just 3.67. The 6.20 away average is inflated by CL games where PSG were attacking with urgency (Monaco CL 8w, Sporting 10w, Athletic 6w — all games where PSG needed results). That urgency is absent here.

Secondary context — Chelsea's home corners conceded (4.67): This is relatively high, influenced by the Brentford game (9 conceded). Excluding that outlier: mean 3.80 (n=5). Chelsea will be attacking, not defending, which means fewer opportunities for PSG to win corners through sustained pressure. PSG's corners will come primarily from counter-attacks (shots saved behind, deflected crosses on the break) — typically producing 2-4 corners per game from this style.

Central estimate: **4.0**, weighting PSG's "managed game" profile (~3.5) and acknowledging some counter-attacking corner opportunities against a stretched Chelsea defence.

**Total match corners — central estimate: 11.0 (range 8–15)**

Per-team sum: 7.5 + 4.0 = 11.5. However, I moderate to 11.0 to account for:
- The first leg produced just 5 total corners, suggesting these teams can produce low-corner matches even with many goals — PSG's clinical finishing bypasses corner-producing sequences
- PSG's game management (time-wasting, tactical fouls, slowing play after winning positions) will reduce the number of active-play minutes and thus corner opportunities
- Chelsea's 3-day rest creates fatigue risk that may reduce attacking intensity in the final 20–30 minutes

Central estimate: **11.0**. This is ~1.0 corner above the book's centre (~10.0), driven by Chelsea's home corner propensity and the extreme attacking context.

**Corner spread (Chelsea − PSG) — central estimate: Chelsea −3.0 (range 0 to −8)**

Derived from 7.5 − 4.0 = 3.5, moderated to 3.0 given uncertainty in PSG's counter-attacking corner output. The book's centre sits at approximately −2.75 (midpoint of Pinnacle's −2.5 and −3.0 lines).

### Reconciliation

**Contradiction 1**: Chelsea's home data says 83.3% of games exceed 10.5 total corners. PSG's away and all-games data says only 25–30% exceed 10.5. Resolution: Chelsea's home data directly applies (they are the home team). PSG's low rate is artificially depressed by Ligue 1 domination dynamics that won't apply here. PSG's CL-away subset (43% over 10.5) is more relevant. I trust Chelsea's home data more heavily and blend with PSG's CL-away profile.

**Contradiction 2**: The first leg produced just 5 total corners, contradicting my predicted total of 11.0. Resolution: The first leg was a fundamentally different tactical situation — Chelsea played conservatively away while PSG attacked with intent. In the second leg, these roles are reversed and amplified. The 5-corner first leg reflects PSG's clinical open-play finishing, not a corner-suppressive dynamic. I discount this H2H data point heavily but note it as a downside risk.

**Contradiction 3**: PSG's away CW of 6.20 implies they should win about 6 corners, but my estimate is 4.0. Resolution: PSG's 6.20 includes games where they attacked with urgency (CL knockouts, trailing in league games). Here, PSG will defend a 3-goal cushion — their "managed game" profile (CW ~3.5) is more appropriate. I trust the context-adjusted figure.

### Phase 3 — Value Identification

#### Variance & Distribution Model

Per-team venue-filtered match-total variance:
- Chelsea Home PL (n=6): variance = 12.56
- PSG Away (n=10): variance = 4.68
- Average: (12.56 + 4.68) / 2 = **8.62**

Predicted mean μ = 11.0. Variance (8.62) < Mean (11.0) → the data is slightly underdispersed relative to Poisson. **Poisson is the closest standard model.** Using Poisson(λ=11) is conservative: it slightly overestimates tail probabilities above the mean and slightly underestimates those below, meaning Over estimates for lines below the mean (9.5, 10.5) are marginally conservative — favourable for identifying value.

#### Totals Markets

Poisson(λ=11.0) probabilities:

| Line | Model P(Over) | Empirical (all-games avg) | Empirical (venue-filtered avg) | Reconciled Est. |
|------|:---:|:---:|:---:|:---:|
| 8.5 | 76.8% | 67.5% | 76.7% | ~75% |
| 9.5 | 66.0% | 59.4% | 66.7% | ~66% |
| 10.5 | 54.0% | 40.6% | 56.7% | ~54% |
| 11.5 | 42.1% | 37.5% | 56.7% | ~42% |
| 12.5 | 31.1% | 23.8% | 30.0% | ~30% |

The venue-filtered empirical rates run higher than the model at every line, but Chelsea's n=6 home sample inflates these. I reconcile by trusting the Poisson model (μ=11.0) as the primary estimate, with the venue-filtered empirical as a supportive check. At 10.5 and below, model and venue-filtered empirical are in strong agreement (54% vs 56.7%). At 11.5+, the venue-filtered rate (56.7%) is driven almost entirely by Chelsea's small home sample — I lean on the model's 42.1% instead.

**Value identification for each line**:

**Over 9.5**:
- Pinnacle: 1.72 Over / 2.11 Under → raw implied 58.1% / 47.4% → sum 105.5% → fair Over = 55.1%
- My estimate: 66.0%
- **Edge: 66.0% − 55.1% = 10.9%** ✓

**Over 10.5**:
- Pinnacle: 2.14 Over / 1.70 Under → raw implied 46.7% / 58.8% → sum 105.6% → fair Over = 44.3%
- My estimate: 54.0%
- **Edge: 54.0% − 44.3% = 9.7%** ✓

**Over 11.5**:
- FanDuel: 2.78 Over / 1.42 Under → raw implied 36.0% / 70.4% → sum 106.4% → fair Over = 33.8%
- My estimate: 42.1%
- **Edge: 42.1% − 33.8% = 8.3%** ✓
- Note: this line sits above the predicted mean, where the Poisson model slightly overestimates tail probability given underdispersed data. True edge may be closer to 6–7%.

**Over 12.5**:
- FanDuel: 3.90 Over / 1.23 Under → raw implied 25.6% / 81.3% → sum 106.9% → fair Over = 24.0%
- My estimate: 31.1%
- **Edge: 31.1% − 24.0% = 7.1%** ✓ but sits well above the mean → model overestimation risk. Downgrade to monitoring.

**Over 8.5**:
- FanDuel: 1.38 → fair Over ~69%. My estimate: 76.8%. Edge ~8%. However, the odds are too short (1.38) to justify staking given the variance involved. Not recommended despite edge.

#### Spreads Markets

Using Skellam distribution (normal approximation): Chelsea ~ Pois(7.0), PSG ~ Pois(4.0). Mean difference = 3.0, variance = 11.0, SD = 3.32.

**Chelsea −2.5**:
- Pinnacle: 1.73 / 2.06 → sum 106.3% → fair Chelsea = 54.4%
- My estimate: P(diff > 2.5) = Φ((3.0−2.5)/3.32) = Φ(0.15) = **56.0%**
- Edge: 56.0% − 54.4% = **1.6%**. Below threshold.

**Chelsea −3.0**:
- Pinnacle: 1.93 / 1.87 → sum 105.3% → fair Chelsea = 49.2%
- My estimate: P(diff > 3.0) = Φ(0) = **50.0%**
- Edge: 50.0% − 49.2% = **0.8%**. Below threshold.

No spreads meet the 5% edge threshold. If my Chelsea CW estimate is pushed to 7.5 (the higher end of my range), Chelsea −2.5 reaches ~61.6% → edge ~7.2%, but this depends on aggressive assumptions I cannot confidently defend.

#### Cross-checks

Book's implied team corners (from total centre ~10.0, spread centre ~−2.75):
- Implied Chelsea CW: (10.0 + 2.75)/2 = **6.38**
- Implied PSG CW: (10.0 − 2.75)/2 = **3.63**

My estimates: Chelsea 7.5, PSG 4.0.

Divergences:
- Chelsea CW: +1.12 above book. This is the primary driver of my Over thesis — I believe Chelsea's home corner-winning ability and desperation context are underpriced.
- PSG CW: +0.37 above book. Modest disagreement; the book and I roughly agree on PSG's limited corner output.
- Total: +1.0 above book. Material disagreement driven by Chelsea CW.

No notable bookmaker disagreements on the same line (FanDuel, Pinnacle, DraftKings, BetRivers cluster within expected vig ranges on all lines).

---

## Value Picks

| # | Pick | Line | Odds | Est. Prob | Implied Prob | Edge | Confidence |
|---|------|------|------|-----------|--------------|------|------------|
| 1 | Total Corners Over | 10.5 | 2.14 (Pinnacle) | 54% | 44.3% | 9.7% | Medium-High |
| 2 | Total Corners Over | 9.5 | 1.72 (Pinnacle) | 66% | 55.1% | 10.9% | Medium-High |
| 3 | Total Corners Over | 11.5 | 2.78 (FanDuel) | 42% | 33.8% | 8.3% | Medium |

**Pick 1 — Over 10.5 Total Corners @ 2.14 (Pinnacle)**

Chelsea's home PL games have exceeded 10.5 total corners in 5 of 6 matches (83.3%), with the sole exception being a penalty-dominated Leeds game. At Stamford Bridge needing 4 goals to overturn a 5-2 deficit, Chelsea will sustain maximum crossing volume and final-third pressure throughout — replicating the attacking templates from the West Ham (12 total), Bournemouth (15 total), and Burnley (14 total) home games. PSG's low-corner tendency is driven by Ligue 1 domination dynamics that won't apply against a desperate Premier League opponent on their own turf. The primary risk is PSG's ability to manage tempo and reduce active-play minutes.

**Pick 2 — Over 9.5 Total Corners @ 1.72 (Pinnacle)**

The highest estimated edge at 10.9%. Chelsea's home games average 11.83 total corners, and PSG's CL-away average is 10.33 — both comfortably above this line. Even factoring in PSG's game management, 10+ corners is the most likely outcome. The supplementary Newcastle game (9 total on Mar 14) was the lowest Chelsea home total in this dataset outside of Leeds, and it still only fell 0.5 short of this line. Odds of 1.72 offer meaningful return despite the lower risk. Primary risk is the first-leg pattern repeating (5 total corners), though I've argued the tactical context makes this improbable.

**Pick 3 — Over 11.5 Total Corners @ 2.78 (FanDuel)**

This line sits above my predicted mean of 11.0, so the edge depends on accurate calibration of the tail probability. The empirical evidence is supportive: Chelsea's home games hit Over 11.5 in 5/6 PL matches (83.3%), and 50% of all Chelsea games exceed this line. However, PSG's away games only clear 11.5 in 30% of cases. The 2.78 odds offer substantial value if Chelsea's home attacking context dominates — but this is less certain than the lower lines. The Poisson model may slightly overestimate the probability given underdispersed data, reducing true edge to approximately 6–7%.

*Monitoring (3–5% edge)*: Over 12.5 @ 3.90 (FanDuel) — model shows 7.1% edge but sits deep in the tail with high variance. Chelsea −2.5 spread — potential edge of 1.6–7.2% depending on Chelsea CW assumption, insufficient confidence.

---

## Bets to Avoid

**1. Under 9.5 Total Corners**: PSG's low-corner profile makes this superficially attractive — 50% of their games and away games fall under 9.5. But Chelsea's home data overwhelmingly opposes it (only 1/6 PL home games under 9.5), and the extreme attacking context makes a sub-10 total require a game-script collapse (early PSG goal killing Chelsea's intensity, red card for Chelsea). At Pinnacle's 2.11, the implied 44.9% is already generous given the stacked evidence against it.

**2. Chelsea −3.5 Corner Spread**: My predicted spread of −3.0 sits right at the boundary. At Pinnacle's 2.12, the fair probability (44.9%) essentially matches my model estimate (44.0%). There is **no edge**, and the variance of the Skellam distribution (SD 3.3) means this is essentially a coin flip with negative EV after vig. The temptation comes from Chelsea's obvious corner dominance, but the spread already prices this in.

---

## Caveats

1. **Chelsea's home sample is n=6 PL games** (7 including supplementary Newcastle data). The 83.3% Over 10.5 rate is striking but statistically fragile. Adding just one more low-corner home game would drop it to 71.4%, reducing edges by ~3–5pp. The entire value case rests on a ~1-corner gap between my predicted mean (11.0) and the book's centre (~10.0).

2. **First-leg suppression risk**: The first leg produced just 5 total corners in a 7-goal game. While the tactical context is reversed, PSG have demonstrated the ability to score efficiently without generating corners — if they score an early counter-attacking goal, Chelsea's tactical urgency increases but the game structure might not produce corners (PSG score from open play, not from sequences that generate corners). A 1-0 PSG lead at half-time from a clinical counter could replicate the low-corner first-leg dynamic.

3. **No historical H2H calibration**: These teams haven't met in the dataset's 2-season window (first leg excluded from the raw data). We have zero multi-game H2H evidence on how these specific squads interact for corner production.

4. **Pedro Neto's availability is uncertain** (reported as "under investigation"). If Neto is absent, Chelsea lose their highest-volume crossing winger, which could reduce their CW by ~0.5–1.0 corners and erode the Over 10.5 edge to near the 5% threshold.

5. **Context adjustment is subjective**: My entire edge derives from a +1.0 corner context adjustment based on Chelsea's desperation. If the true adjustment is +0.5 (plausible — PSG's game management is elite), the Poisson model shifts to μ=10.5, and edges on Over 10.5 shrink to ~3%, below inclusion threshold. The Over 9.5 pick remains viable even at μ=10.5 (P(Over) ≈ 60% vs fair 55.1% → edge ~5%).

6. **Fatigue factor**: Chelsea's 3-day rest vs PSG's ~6 days. If Chelsea's pressing intensity drops after 60-65 minutes, the final third of the match could produce fewer corners than the first two-thirds, pulling the total down by 1-2 corners.