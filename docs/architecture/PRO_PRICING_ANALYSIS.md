---
name: Torrify Pro pricing analysis
overview: First-pass cost analysis and decision framework for OpenRouter model defaults and free usage limits.
---

# Torrify Pro pricing analysis

**Status**: ✅ Implemented via PRO Gateway (January 2026)

## Overview
This document outlines the cost analysis and decision framework used to implement the Torrify PRO tier. The PRO tier routes requests through a managed gateway to optimize costs via prompt caching and provide curated model access.

## Implemented Solution: PRO Gateway
- **Gateway URL**: `https://the-gatekeeper-production.up.railway.app`
- **Authentication**: License keys (managed via LemonSqueezy)
- **Features**:
  - Prompt caching for supported OpenRouter models
  - Streaming support (SSE passthrough)
  - Cost tracking and rate limiting (gateway-side)
  - Curated model list in UI

## Source of truth for pricing
OpenRouter prices vary by model and change over time. Use the Models API to pull **live** pricing and avoid hardcoding:
- Models API: `https://openrouter.ai/api/v1/models`
- Pricing fields (per-token, USD): `pricing.prompt`, `pricing.completion`, `pricing.request`
- OpenRouter pay-as-you-go platform fee: **5.5%** (per OpenRouter pricing page)

Reference:
- https://openrouter.ai/pricing
- https://openrouter.ai/docs/overview/models (Models API schema)

## Candidate model shortlist (current PRO UI)
From the current PRO model list in `src/components/SettingsModal.tsx`:
- `anthropic/claude-3.7-sonnet:thinking`
- `openai/gpt-5.2-codex`
- `anthropic/claude-sonnet-4.5`
- `google/gemini-2.5-pro`
- `openai/gpt-5.1-codex-max`
- `deepseek/deepseek-v3.2`
- `qwen/qwen3-coder`
- `x-ai/grok-code-fast-1`
- `openai/gpt-5-mini`
- `google/gemini-2.5-flash`

## Cost model

### Per-request cost formula
Let:
- `P` = prompt tokens
- `C` = completion tokens
- `Rp` = pricing.prompt (USD per token)
- `Rc` = pricing.completion (USD per token)
- `Rr` = pricing.request (USD per request)
- `F` = OpenRouter platform fee (0.055)

Then:
```
base_cost = (P * Rp) + (C * Rc) + Rr
total_cost = base_cost * (1 + F)
```

### Usage profiles (baseline scenarios)
Use these as standard scenarios for comparing models. Update with telemetry later.

| Profile | Input tokens (P) | Output tokens (C) | Description | Notes |
|---|---:|---:|---|---|
| Quick edit | 300 | 150 | Small changes, short replies | Good for simple refactors |
| Standard (current) | 500 | 250 | Typical chat/code assist | Used in pricing table |
| Deep assist | 1200 | 600 | Longer reasoning + code | For complex CAD tasks |
| Image-assisted | 700 | 300 | Uses 1–2 images | Add image pricing if model charges per image |

Scaling note: costs scale linearly with P/C for a fixed model. For example, “Deep assist” is 2.4× the tokens of “Standard.”

## Pricing comparison table (filled from Models API)

Assumptions:
- Avg request size: **500 input tokens + 250 output tokens**
- OpenRouter platform fee: **5.5%**
- Prices shown per 1M tokens are from `https://openrouter.ai/api/v1/models`

| Model | Prompt $/1M | Completion $/1M | Est $/req (500/250, w/ fee) | Est reqs per $20 |
|---|---:|---:|---:|---:|
| anthropic/claude-3.7-sonnet:thinking | 3.00 | 15.00 | 0.00554 | 3,600 |
| openai/gpt-5.2-codex | 1.75 | 14.00 | 0.00462 | 4,334 |
| anthropic/claude-sonnet-4.5 | 3.00 | 15.00 | 0.00554 | 3,600 |
| google/gemini-2.5-pro | 1.25 | 10.00 | 0.00330 | 6,061 |
| openai/gpt-5.1-codex-max | 1.25 | 10.00 | 0.00330 | 6,061 |
| deepseek/deepseek-v3.2 | 0.25 | 0.38 | 0.00023 | 86,000 |
| qwen/qwen3-coder | 0.22 | 0.95 | 0.00037 | 54,600 |
| x-ai/grok-code-fast-1 | 0.20 | 1.50 | 0.00050 | 39,900 |
| openai/gpt-5-mini | 0.25 | 2.00 | 0.00066 | 30,300 |
| google/gemini-2.5-flash | 0.30 | 2.50 | 0.00082 | 24,500 |

Tip: The Models API returns per-token prices. Convert to per-1M tokens for readability.

## Cost projections by usage profile

Assumptions for “not everyday” usage:
- Quick edit: 15 requests/user/month (3 sessions × 5 requests)
- Standard: 48 requests/user/month (6 sessions × 8 requests)
- Deep assist: 24 requests/user/month (4 sessions × 6 requests)
- Image-assisted: 10 requests/user/month (2 sessions × 5 requests)

Notes:
- Costs below use the token estimates in each profile and include the 5.5% platform fee.
- Image fees are **not** included (add model-specific image pricing where applicable).

### Quick edit (P=300, C=150, 15 req/user/mo)
| Model | Est $/req | $/user/mo | $/10 users | $/100 users | $/1000 users |
|---|---:|---:|---:|---:|---:|
| anthropic/claude-3.7-sonnet:thinking | 0.0033 | 0.050 | 0.498 | 4.98 | 49.85 |
| openai/gpt-5.2-codex | 0.0028 | 0.042 | 0.415 | 4.15 | 41.54 |
| anthropic/claude-sonnet-4.5 | 0.0033 | 0.050 | 0.498 | 4.98 | 49.85 |
| google/gemini-2.5-pro | 0.0020 | 0.030 | 0.297 | 2.97 | 29.67 |
| openai/gpt-5.1-codex-max | 0.0020 | 0.030 | 0.297 | 2.97 | 29.67 |
| deepseek/deepseek-v3.2 | 0.0001 | 0.0021 | 0.021 | 0.209 | 2.09 |
| qwen/qwen3-coder | 0.0002 | 0.0033 | 0.033 | 0.330 | 3.30 |
| x-ai/grok-code-fast-1 | 0.0003 | 0.0045 | 0.045 | 0.451 | 4.51 |
| openai/gpt-5-mini | 0.0004 | 0.0059 | 0.059 | 0.593 | 5.93 |
| google/gemini-2.5-flash | 0.0005 | 0.0074 | 0.074 | 0.736 | 7.36 |

### Standard (P=500, C=250, 48 req/user/mo)
| Model | Est $/req | $/user/mo | $/10 users | $/100 users | $/1000 users |
|---|---:|---:|---:|---:|---:|
| anthropic/claude-3.7-sonnet:thinking | 0.0055 | 0.266 | 2.66 | 26.59 | 265.86 |
| openai/gpt-5.2-codex | 0.0046 | 0.222 | 2.22 | 22.16 | 221.55 |
| anthropic/claude-sonnet-4.5 | 0.0055 | 0.266 | 2.66 | 26.59 | 265.86 |
| google/gemini-2.5-pro | 0.0033 | 0.158 | 1.58 | 15.82 | 158.25 |
| openai/gpt-5.1-codex-max | 0.0033 | 0.158 | 1.58 | 15.82 | 158.25 |
| deepseek/deepseek-v3.2 | 0.0002 | 0.011 | 0.111 | 1.11 | 11.14 |
| qwen/qwen3-coder | 0.0004 | 0.018 | 0.176 | 1.76 | 17.60 |
| x-ai/grok-code-fast-1 | 0.0005 | 0.024 | 0.241 | 2.41 | 24.05 |
| openai/gpt-5-mini | 0.0007 | 0.032 | 0.317 | 3.16 | 31.65 |
| google/gemini-2.5-flash | 0.0008 | 0.039 | 0.392 | 3.92 | 39.25 |

### Deep assist (P=1200, C=600, 24 req/user/mo)
| Model | Est $/req | $/user/mo | $/10 users | $/100 users | $/1000 users |
|---|---:|---:|---:|---:|---:|
| anthropic/claude-3.7-sonnet:thinking | 0.013 | 0.319 | 3.19 | 31.90 | 319.03 |
| openai/gpt-5.2-codex | 0.011 | 0.266 | 2.66 | 26.59 | 265.86 |
| anthropic/claude-sonnet-4.5 | 0.013 | 0.319 | 3.19 | 31.90 | 319.03 |
| google/gemini-2.5-pro | 0.0079 | 0.190 | 1.90 | 18.99 | 189.90 |
| openai/gpt-5.1-codex-max | 0.0079 | 0.190 | 1.90 | 18.99 | 189.90 |
| deepseek/deepseek-v3.2 | 0.0006 | 0.013 | 0.134 | 1.34 | 13.37 |
| qwen/qwen3-coder | 0.0009 | 0.021 | 0.211 | 2.11 | 21.12 |
| x-ai/grok-code-fast-1 | 0.0012 | 0.029 | 0.289 | 2.89 | 28.86 |
| openai/gpt-5-mini | 0.0016 | 0.038 | 0.380 | 3.80 | 37.98 |
| google/gemini-2.5-flash | 0.0020 | 0.047 | 0.471 | 4.71 | 47.10 |

### Image-assisted (P=700, C=300, 10 req/user/mo)
| Model | Est $/req | $/user/mo | $/10 users | $/100 users | $/1000 users |
|---|---:|---:|---:|---:|---:|
| anthropic/claude-3.7-sonnet:thinking | 0.0070 | 0.070 | 0.696 | 6.96 | 69.63 |
| openai/gpt-5.2-codex | 0.0057 | 0.057 | 0.572 | 5.72 | 57.23 |
| anthropic/claude-sonnet-4.5 | 0.0070 | 0.070 | 0.696 | 6.96 | 69.63 |
| google/gemini-2.5-pro | 0.0041 | 0.041 | 0.409 | 4.09 | 40.88 |
| openai/gpt-5.1-codex-max | 0.0041 | 0.041 | 0.409 | 4.09 | 40.88 |
| deepseek/deepseek-v3.2 | 0.0003 | 0.0030 | 0.030 | 0.305 | 3.05 |
| qwen/qwen3-coder | 0.0005 | 0.0046 | 0.046 | 0.463 | 4.63 |
| x-ai/grok-code-fast-1 | 0.0006 | 0.0062 | 0.062 | 0.622 | 6.22 |
| openai/gpt-5-mini | 0.0008 | 0.0082 | 0.082 | 0.818 | 8.18 |
| google/gemini-2.5-flash | 0.0010 | 0.010 | 0.101 | 1.01 | 10.13 |

## Default model selection criteria
Choose the default based on:
- **Cost**: lowest total cost under typical `P/C`.
- **CAD/code quality**: correctness and minimal hallucinations for CAD DSL/Python.
- **Latency**: faster model for interactive feel.
- **Prompt caching support**: models with cache support reduce repeated context costs.

Recommendation approach:
1. Pick **2 finalists**: one premium-quality, one cost-efficient.
2. Run the same 10–20 internal CAD tasks and score quality.
3. Use **cost/quality ratio** to pick default.
4. Keep the higher-quality option as a selectable upgrade in PRO.

## Free usage policy (no user key)

### Inputs to decide
- `B` = monthly budget for free usage (USD)
- `U` = estimated free users/month
- `R` = average requests per free user (if unlimited)
- `P/C` per request from usage profile

### Budget-based limit
Compute **max free requests**:
```
cost_per_request = total_cost(P, C, model)
max_free_requests = floor(B / cost_per_request)
```

Convert to a **per-user free allowance**:
```
free_requests_per_user = floor(max_free_requests / U)
```

## $20/month PRO reference point
Using the estimates above, the “requests per $20” column provides a first-pass cap if you want $20/month to roughly cover a full PRO user at average usage (500/250 tokens). This is not a recommendation, just a sizing reference.

### First-pass protection (before per-user limits)
- **Global cap**: overall daily/weekly budget ceiling.
- **Anonymous cap**: per-device daily requests and token ceilings.
- **Model fallback**: if budget is exhausted, switch to a cheaper model or disable PRO.

## Suggested starting points (fill once prices are known)
- Default model: choose the **lowest-cost model that still passes quality checks** on CAD tasks.
- Free usage: start with a **small, fixed request count per device/day** and adjust once telemetry is available.

## Implementation considerations
- Proxy enforces **hard limits** and tracks **token usage** per request.
- Stores **per-request cost** and aggregate **daily/monthly spend**.
- UI status: “free requests remaining” and “budget exhausted” messages.

---

## Next steps
1. Pull current pricing from the Models API and fill the table.
2. Pick baseline `P/C` for each workflow.
3. Compute cost per request per model.
4. Select default model and free usage limits.
