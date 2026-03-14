# Torino vs Parma — Corner Kick Analysis

## Statistical Summary

| Metric | Torino (Home) | Parma (Away) |
|--------|---------------|--------------|
| Venue-filtered avg corners won | 4.36 (n=11) | 3.78 (n=9) |
| Venue-filtered avg corners conceded | 4.09 | 5.33 |
| All-games avg corners won | 4.05 (n=20) | 4.35 (n=20) |
| All-games avg corners conceded | 4.15 | 4.55 |
| H2H avg corners (matching venue) | 9.0 (n=1) | 7.0 (n=1) |
| H2H avg corners (all) | 5.33 (n=3) | 6.00 (n=3) |
| H2H avg total | 11.33 (n=3) | — |
| Venue-filtered avg total | 8.45 (7.80 ex-outlier) | 9.11 (8.38 ex-outlier) |

**Predicted total**: 7.0–10.5 (central **8.2**)
**Predicted spread**: Torino −0.4 / Parma +0.4

---

## Detailed Analysis

### Phase 1 — Statistical Analysis

#### 1A. Data Cleaning

Both teams: 20 valid games each, all Serie A, no missing corner data, no cup/European fixtures. 40 total games in the dataset.

#### 1B. Torino (Home) Corner Stats

**Home-filtered (11 games):**

| Game | Opp | Won | Conc | Total |
|------|-----|-----|------|-------|
| 1 | Lazio | 6 | 9 | **15** |
| 3 | Bologna | 4 | 2 | 6 |
| 5 | Lecce | 3 | 8 | 11 |
| 7 | Roma | 2 | 1 | 3 |
| 9 | Udinese | 3 | 6 | 9 |
| 11 | Cagliari | 6 | 2 | 8 |
| 13 | Cremonese | 6 | 6 | 12 |
| 14 | AC Milan | 2 | 4 | 6 |
| 16 | Como | 3 | 4 | 7 |
| 18 | Pisa | 4 | 2 | 6 |
| 20 | Genoa | 9 | 1 | 10 |

Total corners: mean **8.45**, median **8**, range 3–15, variance **10.43**, SD 3.23.
Corners won: mean **4.36**, median 4. Corners conceded: mean **4.09**.

**All-games (20 games):** Total mean **8.20**, median 8, range 3–15, variance 11.06, SD 3.33. Won mean **4.05**, conceded mean **4.15**.

**Venue delta:** Home +0.25 over all-games. Minimal difference; ex-outlier home (7.80) ≈ ex-outlier all-games (7.84). No meaningful home-specific inflation.

**Trend — Recent 6 games (all-venues):** Totals 15, 4, 6, 13, 11, 3 → mean 8.67. Older 14: mean 8.00. The +0.67 uptick is entirely driven by Lazio (15) and Fiorentina (13). Remove Lazio: recent 5 games mean 7.40, *below* the older baseline. **Trend is fragile — artefact of one outlier.**

Recent 6 home games (Lazio through Cagliari): won 6, 4, 3, 2, 3, 6 → mean 4.00.
Older 5 home: won 6, 2, 3, 4, 9 → mean 4.80 (inflated by 9-corner Genoa). Without Genoa: 3.75.
No clear trend in home corners won.

**Threshold frequencies:**

| Line | All-games Over% | Home Over% |
|------|----------------|------------|
| 7.5 | 60% (12/20) | 55% (6/11) |
| 8.5 | 45% (9/20) | 45% (5/11) |
| 9.5 | 35% (7/20) | 36% (4/11) |
| 10.5 | 30% (6/20) | 27% (3/11) |
| 11.5 | 20% (4/20) | 18% (2/11) |

No line exceeds 55% for over — Torino is not a high-corner-propensity team.

#### 1C. Parma (Away) Corner Stats

**Away-filtered (9 games):**

| Game | Opp | Won | Conc | Total |
|------|-----|-----|------|-------|
| 2 | AC Milan | 2 | 5 | 7 |
| 4 | Bologna | 5 | 4 | 9 |
| 6 | Atalanta | 9 | 6 | **15** |
| 8 | Napoli | 1 | 7 | 8 |
| 9 | Lecce | 4 | 3 | 7 |
| 11 | Sassuolo | 7 | 4 | 11 |
| 14 | Pisa | 0 | 6 | 6 |
| 16 | Verona | 4 | 4 | 8 |
| 19 | Roma | 2 | 9 | 11 |

Total corners: mean **9.11**, median 8, range 6–15, variance 6.99, SD 2.64.
Corners won: mean **3.78**. Conceded: mean **5.33**.

**All-games (20 games):** Total mean **8.90**, median 8, variance 7.89, SD 2.81. Won mean **4.35**, conceded mean **4.55**.

**Venue delta:** Away +0.21 over all-games. Ex-outlier away (8.38) is *below* ex-outlier all-games (8.58) by 0.20. Parma's away games are essentially at baseline once the Atalanta outlier is removed.

**Trend — Recent 6 games:** 9, 7, 13, 9, 8, 15 → mean 10.17. Older 14: mean 8.36. The +1.81 uptick looks real, but remove the two highest (Atalanta 15, Verona 13): remaining 4 games average 8.25 — *below* the older baseline. **Trend is fragile — driven by two high-variance outlier games, not a systematic shift.**

Recent 6 away games: won 2, 5, 9, 1, 4, 7 → mean 4.67. Without Atalanta (9): 3.80.
Older 3 away: 0, 4, 2 → mean 2.00. Small sample drives the appearance of improvement.

**Threshold frequencies:**

| Line | All-games Over% | Away Over% |
|------|----------------|------------|
| 7.5 | 65% (13/20) | 67% (6/9) |
| 8.5 | 45% (9/20) | 44% (4/9) |
| 9.5 | 35% (7/20) | 33% (3/9) |
| 10.5 | 30% (6/20) | 33% (3/9) |
| 11.5 | 15% (3/20) | 11% (1/9) |

No line exceeds 55% beyond 7.5. Parma is also not a high-corner team at meaningful thresholds.

#### 1D. Outlier Check

**Torino:** Mean 8.20, SD 3.33. Threshold 2σ = 14.85. One game exceeds: **vs Lazio (15)** at 2.04σ. Explanation: Torino dominated possession (PPDA 15.7) after going 1-0 up at half-time, but Lazio hit back with 9 corners themselves despite trailing — an unusually open game. Without it: home mean drops from 8.45 → **7.80**.

**Parma:** Mean 8.90, SD 2.81. Threshold 2σ = 14.52. One game exceeds: **vs Atalanta away (15)** at 2.17σ. Explanation: Parma lost 0-4 but generated 9 corners (26 crosses) while being cut apart on the counter; Atalanta added 6 themselves in a one-sided but chaotically open game. Without it: away mean drops from 9.11 → **8.38**.

#### 1E. Head-to-Head

Three H2H games available — all at Parma's ground or with severely different lineups.

| Date | Venue | Tor Won | Par Won | Total | Age |
|------|-------|---------|---------|-------|-----|
| Sep 2025 | Parma | 3 | 4 | 7 | 5.5 mo |
| Mar 2025 | Parma | 4 | 7 | 11 | 12 mo |
| Jan 2025 | **Torino** | 9 | 7 | 16 | 14 mo |

**Same-venue H2H (Torino home):** 1 game — 16 total (Torino 9, Parma 7). But Torino's XI that day (Milinkovic-Savic, Vojvoda, Ricci, Sosa, Karamoh, Ilic) shares ≤3 players with the current expected XI. **Discounted to near-zero weight.**

**All H2H:** Avg total 11.33. Parma won the corner count 2 of 3 games.

**Personnel continuity:**
- Jan 2025 (14 months): ~3/11 overlap for Torino, ~4/11 for Parma → **discard**.
- Mar 2025 (12 months): ~3/11 overlap for Torino (completely different midfield/defence) → **discard**.
- Sep 2025 (5.5 months): ~5/11 overlap for both teams → moderate, but played at Parma's ground, not this venue → **heavily discount**.

**Conclusion:** H2H data carries negligible predictive weight for this fixture. The 11.33 average total is a mirage rooted in squad eras that no longer exist.

#### 1F. Formation Correlation

**Torino:**

| Formation | Games | Avg Won | Avg Conc | Avg Total |
|-----------|-------|---------|----------|-----------|
| 3-4-1-2 | 5 | 5.80 | 3.80 | 9.60 |
| 3-5-2 | 12 | 3.42 | 4.58 | 8.00 |
| 3-1-4-2 | 2 | 1.50 | 1.50 | 3.00 |
| 5-3-2 | 1 | 3.00 | 3.00 | 6.00 |

Most recent game used **3-4-1-2** (vs Lazio). This formation averages 9.60 total — but remove the Lazio outlier (15): remaining 4 games average **8.25**, close to the 3-5-2 baseline. The formation effect is overstated by one game.

**Parma:**

| Formation | Games | Avg Won | Avg Total |
|-----------|-------|---------|-----------|
| 3-5-2 | 8 | 4.50 | 9.00 |
| 4-3-3 | 6 | 4.00 | 8.17 |
| Other (4-back) | 6 | 2.67 | 7.50 |

Parma has recently settled on a **3-back system** (games 1–4 all 3-back). The 3-5-2 produces marginally more corners (9.00 total) than the 4-3-3 (8.17), likely because the wing-backs push higher.

**Key player note — Obrador (Torino):** Started 3 games — totals 15, 4, 13 (mean 10.67). Without the Lazio outlier: 4, 13 (mean 8.5). Sample too small and Fiorentina (13 total, a wild 2-2 away draw) may also be contextual rather than Obrador-driven. **Correlation noted but not actionable.**

#### 1G. Absence Impact

 **Bernabé** is flagged as doubtful for Parma. Bernabé started vs Cagliari (Feb 27) and has been a consistent starter — if absent, Parma's creative output through midfield suffers.

Bernabé in Parma's 20 games: started 18 of 20. The 2 games without him in the XI are not clearly identifiable from this data (he started all but may have been subbed in a couple). His presence is essentially constant, so no in/out comparison is possible. **His absence, if confirmed, would be a qualitative negative for Parma's corner generation** — he's their primary progressive passer.

#### 1H. Contextual Factors

**League baseline:** Serie A average total corners typically runs ~10.0–10.5. Both teams are well below this:
- Torino all-games: 8.20 (home: 8.45 / 7.80 ex-outlier)
- Parma all-games: 8.90 (away: 9.11 / 8.38 ex-outlier)

Both teams are corner-suppressing relative to the league.

**Score-state patterns:**
- Torino's highest-corner home games: Lazio (15, won 2-0 — open game), Cremonese (12, won 1-0 — Torino attacked relentlessly), Lecce (11, won 1-0 but Lecce had 8 corners pressing for equaliser). Low-corner games: Roma (3, lost 0-2 — completely shut down), Bologna (6, lost 1-2 — tight). Pattern: when Torino are chasing or dominant, corners rise; when they're stifled, corners collapse.
- Parma's high-corner away games are driven by the opposition: Atalanta (15, lost 0-4), Roma (11, lost 1-2). When Parma faces weaker pressing, their away totals cluster 6–9.

**Motivation/form:** Torino have won just 2 of their last 8 home games (vs Lazio 2-0 and Cremonese 1-0). They've been fragile — losing to Bologna, Roma, AC Milan, and Como at home. This isn't a team currently dominating at home. Parma have been more competitive recently (3W-2D-1L in last 6), but those wins were pragmatic (three 1-0 results and a scrappy 2-1 vs Verona). Both teams' profiles suggest a tight, low-corner affair rather than an expansive spectacle.

---

### Phase 2 — Predicted Distribution

#### Torino corners won

**Primary input — own data:** Home mean 4.36 (n=11). Recent 6 home games: 4.00. The range is 2–9, with the 9 (vs Genoa, Oct) looking like an outlier from a game where they had 33 crosses. Without that game, recent 5 home: mean 3.60. The Lazio game (6 won) involved a dominant display that may not repeat against Parma.

**Secondary context — Parma away conceded:** 5.33. But this is inflated by strong opponents forcing corners (Atalanta 6, Napoli 7, Roma 9). Against mid-table and lower teams (Bologna 4, Lecce 3, Sassuolo 4, Verona 4, Pisa 6), Parma concedes 4.20. Torino's attacking profile is closer to this mid-table group.

**What pulls estimate up:** Torino's home crossing volume is solid (mean ~20 crosses per home game); Obrador at LWB adds width; the 3-4-1-2 formation generates more corners than 3-5-2.

**What pulls estimate down:** Torino's recent home form is poor (2W in 8); their corners-won trend at home is flat-to-declining; they lack a consistent aerial threat to force repeated corner situations.

**Central estimate: 4.2** (range 2–7).

#### Parma corners won

**Primary input — own data:** Away mean 3.78 (n=9). Without Atalanta outlier (9 won): 3.13 (n=8). All-games mean 4.35, but home games inflate this (e.g., 12 vs Verona, 7 vs Genoa). The away rate is the better guide.

**Secondary context — Torino home conceded:** 4.09. Recent 6 home: 4.67 (Lazio 9 and Lecce 8 inflate this; without them: 2.75). Against mid-table opposition at home, Torino concedes ~3-4 corners.

**What pulls estimate up:** Parma are capable of generating crossing volume on the road (19-26 crosses in recent away games); Britschgi and Valeri from wing-back positions create width.

**What pulls estimate down:** Parma's away corners won is highly variable (0 to 9); against organised defences (Napoli 1, AC Milan 2, Pisa 0), they generate almost nothing. Torino's 3-back system with Coco and Ismajli is compact enough to suppress crosses from wide.

**Central estimate: 3.8** (range 1–7). The 3.78 away mean is the anchor. I give slight upward nudge (Torino aren't a dominant defensive side at home) but keep it conservative.

#### Total corners

Per-team sum: 4.2 + 3.8 = **8.0**.

Cross-check with venue-filtered match totals:
- Torino home ex-outlier: 7.80
- Parma away ex-outlier: 8.38
- Midpoint: 8.09

These converge at ~8.0–8.2. I'll set central estimate at **8.2**, giving marginal allowance for the possibility of a slightly more open game if Torino's home form makes them chase the game.

**Central estimate: 8.2** (range 4–13).

#### Corner spread

4.2 − 3.8 = **+0.4 Torino** (range −3 to +5).

The spread is essentially a coin flip with slight Torino home advantage. The variance of the spread (sum of both means = 8.0, SD = 2.83) makes any spread prediction inherently imprecise.

#### Reconciliation

**Contradiction 1: H2H total (11.33) vs predicted total (8.2).** The H2H average is 3+ corners above my prediction. Resolution: all three H2H games have poor personnel continuity (≤5/11 overlap) and are 5.5–14 months old. The Jan 2025 same-venue game (16 total) featured a completely different Torino squad. I trust the venue-filtered data over stale H2H. **Resolved — H2H discarded.**

**Contradiction 2: Parma recent away trend (10.17 avg) vs prediction (8.2).** Parma's last 6 games average 10.17 total. Resolution: removing two outlier-class games (Atalanta 15, Verona 13) brings the remaining 4 to 8.25. The trend is a statistical artefact, not a tactical shift — Parma haven't changed formation or personnel in a way that explains a sustained increase. **Resolved — trend discounted.**

**Contradiction 3: Formation effect — 3-4-1-2 (9.60 avg) vs baseline (8.2).** If Torino deploys 3-4-1-2 (most recent game), the formation average is higher. Resolution: remove the Lazio outlier, and the remaining 4 games of 3-4-1-2 average 8.25. The formation effect disappears. **Resolved — formation effect negligible.**

No unresolved contradictions.

---

### Phase 3 — Value Identification

#### Variance & Distribution Model

Computing variance per team from venue-filtered data, excluding outliers:

**Torino home (10 games, ex-Lazio):** Values 6, 11, 3, 9, 8, 12, 6, 7, 6, 10. Mean 7.80.
Variance: [(−1.8)² + (3.2)² + (−4.8)² + (1.2)² + (0.2)² + (4.2)² + (−1.8)² + (−0.8)² + (−1.8)² + (2.2)²] / 10
= [3.24 + 10.24 + 23.04 + 1.44 + 0.04 + 17.64 + 3.24 + 0.64 + 3.24 + 4.84] / 10 = 67.60 / 10 = **6.76**

**Parma away (8 games, ex-Atalanta):** Values 7, 9, 8, 7, 11, 6, 8, 11. Mean 8.38.
Variance: [(−1.38)² + (0.62)² + (−0.38)² + (−1.38)² + (2.62)² + (−2.38)² + (−0.38)² + (2.62)²] / 8
= [1.90 + 0.38 + 0.14 + 1.90 + 6.86 + 5.66 + 0.14 + 6.86] / 8 = 23.84 / 8 = **2.98**

Average variance: (6.76 + 2.98) / 2 = **4.87**
Predicted mean: **8.2**

Variance (4.87) < mean (8.2) → **Poisson** is appropriate. The data is actually slightly underdispersed relative to Poisson, which means the Poisson will slightly overestimate tail probabilities — a conservative bias for Under bets.

#### Poisson Probabilities (λ = 8.2)

| k | P(X=k) | P(X≤k) |
|---|--------|--------|
| 0 | 0.0003 | 0.0003 |
| 1 | 0.0023 | 0.0025 |
| 2 | 0.0092 | 0.0118 |
| 3 | 0.0252 | 0.0370 |
| 4 | 0.0518 | 0.0888 |
| 5 | 0.0849 | 0.1736 |
| 6 | 0.1160 | 0.2896 |
| 7 | 0.1359 | 0.4255 |
| 8 | 0.1393 | 0.5648 |
| 9 | 0.1269 | 0.6917 |
| 10 | 0.1041 | 0.7958 |
| 11 | 0.0776 | 0.8734 |
| 12 | 0.0530 | 0.9264 |

#### Totals Markets

| Line | Side | Book Odds | Implied% | Fair Implied% | Model P | Empirical P | Est. P | Edge |
|------|------|-----------|----------|---------------|---------|-------------|--------|------|
| 7.5 | Under | FD 2.98 | 33.6% | 31.4%* | 42.6% | 41.0%† | **41%** | +9.6% |
| 8.5 | Under | **FD 2.12** | 47.2% | 44.2% | 56.5% | 55.5%† | **56%** | **+11.8%** |
| 8.5 | Under | DK 2.05 | 48.8% | 45.2% | 56.5% | 55.5% | 56% | +10.8% |
| 9.5 | Under | **FD 1.70** | 58.8% | 55.0% | 69.2% | 65.5%† | **67%** | **+12.0%** |
| 9.5 | Under | DK 1.62 | 61.7% | 57.0% | 69.2% | 65.5% | 67% | +10.0% |
| 10.5 | Under | FD 1.40 | 71.4% | 66.7% | 79.6% | 70.0%† | 75% | +8.3% |
| 11.5 | Under | FD 1.22 | 82.0% | 76.6% | 87.3% | 85.5% | 86% | +9.4% |

*Overround ranges 106.7%–108.2% across lines.
†Empirical: average of Torino home Under% and Parma away Under%.

Model and empirical agree within ~4pp across all lines. Disagreements are small and consistent — the model runs slightly more extreme because Poisson assumes exact λ while empirical rates incorporate natural variance. I trust the blended estimate.

**Significant edges on Under side at every line from 7.5 through 11.5.** The strongest value sits at 8.5 and 9.5 where edge exceeds 10% at playable odds.

#### Spreads Market

DraftKings: Torino −0.5 @ 1.67 / Parma +0.5 @ 2.10
Combined implied: 107.5%. Fair: Torino 55.7%, Parma 44.3%.

Using normal approximation to Skellam (μ = 0.4, σ = √8.0 = 2.83):
P(Torino wins corner count) = P(D ≥ 1) ≈ P(Z ≥ (0.5−0.4)/2.83) = P(Z ≥ 0.035) = **48.6%**
P(Parma +0.5) = **51.4%**

Edge on Parma +0.5: 51.4% − 44.3% = +7.1%. However, **this is fragile**: shifting Torino's estimate to 4.5 and Parma's to 3.5 (spread +1.0) drops Parma +0.5 to 49.3% and the edge to 5.0%. Shifting to +0.6 spread gives 4.3% edge (below threshold). **Sensitivity-dependent — monitoring only.**

#### Cross-checks

**Book's implied center:** At 8.5, fair Over = 55.8%; at 9.5, fair Over = 45.0%. Interpolating: 50% crossover ≈ **9.0 total corners**. My prediction of 8.2 is 0.8 corners below the book. This is the source of all Under-side edge.

**Book's implied team corners:** With total center ~9.0 and spread ~0.5 favouring Torino: book implies Torino ~4.75, Parma ~4.25. My estimates (4.2, 3.8) are lower by 0.55 and 0.45 respectively. The divergence is distributed across both teams rather than concentrated in one.

**Inter-book comparison:** FanDuel and DraftKings agree closely on the 8.5 and 9.5 lines (within 3–4% implied probability). No inter-book arbitrage.

---

## Value Picks

| # | Pick | Line | Odds | Est. Prob | Implied Prob | Edge | Confidence |
|---|------|------|------|-----------|--------------|------|------------|
| 1 | Under 9.5 Total Corners | FanDuel | 1.70 | 67% | 55.0% | +12.0% | Medium-High |
| 2 | Under 8.5 Total Corners | FanDuel | 2.12 | 56% | 44.2% | +11.8% | Medium |

**Pick 1 — Under 9.5 Total Corners @ 1.70 (FanDuel)**
Torino's outlier-excluded home total is 7.80; Parma's outlier-excluded away total is 8.38; the midpoint is 8.09. Only 36% of Torino home games and 33% of Parma away games clear 9.5 total corners. The Poisson model (λ=8.2) gives 69% Under probability, and the empirical rate gives 65.5% — both comfortably above the book's 55% fair implied. The primary risk is an early Torino deficit creating a chasing dynamic (cf. Lecce home, 11 total when Torino scored early then sat off), but Torino's typical home pattern against mid-table sides is compressed, low-corner football.

**Pick 2 — Under 8.5 Total Corners @ 2.12 (FanDuel)**
At better odds but tighter probability. 55% of Torino home games and 56% of Parma away games finish under 8.5. The model gives 56.5%. Against a fair implied of 44.2%, this is +11.8% edge. The risk profile is steeper — a single additional corner flips the outcome — but the odds compensate. This is the higher-variance, higher-reward sibling of Pick 1.

### Monitoring (3–5% edge, insufficient for recommendation)

- **Parma +0.5 Corners @ 2.10 (DraftKings):** Estimated 51.4% vs 44.3% fair implied = 7.1% edge, but highly sensitive to per-team estimates. A 0.2-corner shift in the spread collapses the edge below 5%. Not robust enough for a pick.
- **Under 7.5 Total Corners @ 2.98 (FanDuel):** 41% vs 31.4% fair implied = 9.6% edge on paper, but the odds carry significant juice (7.1% overround on this line) and the absolute probability (41%) means losing 3 of 5 bets. Edge is real but risk-reward is marginal at these odds.

### Bets to Avoid

1. **Over 10.5 @ 2.80 (FanDuel):** Only 27% of Torino home games and 33% of Parma away games clear this. Model gives 20.4%. Fair implied is 33.3%. This is a 7–13% *negative* edge — the book underprices the Under, not the Over.

2. **Torino −0.5 Corners @ 1.67 (DraftKings):** The book implies Torino wins the corner count 55.7% of the time. My model gives 48.6%. There is no structural reason to expect Torino corner dominance — their home corners-won average (4.36) only marginally exceeds Parma's away average (3.78), and the spread variance (SD 2.83) makes any thin edge unplayable.

### Caveats

1. **No web search access:** Could not verify current injuries, expected lineups, or tactical changes. The Bernabé availability question (flagged as doubtful in previous analysis) remains unresolved — his absence would reinforce the Under case.
2. **Formation uncertainty:** If Torino switches from 3-4-1-2 to 3-5-2, the already-suppressed corner baseline drops further. If they go more attacking (unlikely given recent home form), it could push totals toward 9.
3. **High Torino home variance** (SD 3.23): The range of 3–15 total corners in 11 home games is wide. While the central estimate favours Unders, a single game-state shock (early red card, early deficit) could produce a 12+ corner game.
4. **H2H essentially discarded:** With negligible personnel overlap across all three H2H games, I'm treating this fixture as a fresh matchup. If there's a tactical rivalry dynamic not captured in the data, this is a blind spot.
5. **Poisson assumption slightly generous to Unders:** The data is marginally underdispersed relative to Poisson (variance 4.87 < mean 8.2), meaning the model may slightly overestimate tail probabilities. The empirical rates provide a useful floor, and all edges hold using empirical rates alone.
