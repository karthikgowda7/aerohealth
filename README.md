# AeroHealth: Turbofan Engine Health Monitoring & Predictive Maintenance

![CI](https://github.com/karthikgowda7/aerohealth/actions/workflows/ci.yml/badge.svg)

**Live demo:** https://aerohealth-three.vercel.app/

A dashboard for a fleet of 100 simulated turbofan engines. It predicts each engine's
**Remaining Useful Life (RUL)**, flags **sensor anomalies**, classifies engines as
Healthy / Watch / Critical, and lets an engineer raise **MRO work orders**.

![Dashboard](docs/screenshots/dashboard.png)

## Problem
Unplanned engine removals are expensive and ground aircraft. Predicting how many cycles an
engine has left, and spotting sensor drift early, lets maintenance be planned instead of reactive.

## Features
- Fleet dashboard with KPIs and engines sorted by urgency
- Per-engine sensor trends with anomaly markers and predicted vs actual RUL
- Z-score anomaly detection against each engine's healthy baseline
- Work orders with an enforced status flow (OPEN → IN_PROGRESS → COMPLETED / CANCELLED)
- Model card with metrics, feature importances and limitations

## Architecture
```
OFFLINE (Python)                          ONLINE (Vercel + Neon)
NASA C-MAPSS txt                          Next.js 15 (App Router, TypeScript)
  -> train.py: RUL labels (cap 125),        Server Components -> Prisma -> PostgreSQL
     rolling features, LR vs RF             REST API (/api/*) with Zod validation
  -> fleet.csv + model.json  ----------->   seed.ts: loads data, runs anomaly detection
                                            Recharts for charts
GitHub Actions CI: lint, typecheck, Vitest, build | pytest
```
**Why offline batch scoring?** No Python server to host, no cold starts, and it mirrors how
many maintenance systems score overnight and serve results from a database.

## Tech stack
| Layer | Tools |
|---|---|
| ML | Python, pandas, NumPy, scikit-learn, pytest |
| Web | Next.js 15, React 19, TypeScript, Tailwind CSS, Recharts |
| Data | PostgreSQL (Neon), Prisma ORM, Zod |
| DevOps | GitHub Actions, Vercel |

## Dataset
NASA **C-MAPSS FD001**: 100 training engines run to failure, 100 test engines stopped early.
- Kept 14 sensors. Dropped 7 that are constant in FD001 (no information).
- Training target: RUL = last cycle − current cycle, **capped at 125** (early life looks healthy).
- Features: 14 sensors + 10-cycle rolling mean and std per sensor + cycle (43 features).

## Model results (test set, last cycle of each engine)
| Model | RMSE (cycles) | NASA score |
|---|---|---|
| Always predict the average | 41.94 | 33,354 |
| Linear Regression | 21.42 | 1,447 |
| **Random Forest** | **18.02** | **737** |

The NASA score penalises late predictions (over-estimating remaining life) more than early ones.

## API
| Method | Route | Purpose |
|---|---|---|
| GET | /api/health | Database health check |
| GET | /api/engines?status=&sort=&order= | Engine list (validated query) |
| GET | /api/engines/:serial | Engine with readings, alerts, work orders (404 if missing) |
| GET / POST | /api/work-orders | List / create work orders |
| PATCH | /api/work-orders/:id | Change status (409 on an invalid transition) |
| PATCH | /api/alerts/:id | Acknowledge an alert |

## Testing & CI
- **Vitest (18 tests):** health thresholds, anomaly streaks and std = 0, work-order transitions, Zod schemas
- **pytest (7 tests):** RUL labels and cap, rolling features, RMSE, NASA score
- GitHub Actions runs lint, type-check, tests and build on every push

## Run locally
```bash
# ML
cd ml && python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt && python download_data.py && python train.py
# Web
cd ../web && npm install && cp .env.example .env   # add Neon URLs
npm run db:push && npm run db:seed && npm run dev
```

## Limitations & next steps
- Simulated data, one operating condition and one fault mode (FD001)
- Next: live scoring with a FastAPI service, multi-condition data (FD002/FD004), auth and audit logs, model drift monitoring

## Acknowledgements
Dataset: NASA Prognostics Center of Excellence, C-MAPSS turbofan engine degradation simulation.