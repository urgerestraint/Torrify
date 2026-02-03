models = {
  "anthropic/claude-3.7-sonnet:thinking": (0.000003, 0.000015),
  "openai/gpt-5.2-codex": (0.00000175, 0.000014),
  "anthropic/claude-sonnet-4.5": (0.000003, 0.000015),
  "google/gemini-2.5-pro": (0.00000125, 0.00001),
  "openai/gpt-5.1-codex-max": (0.00000125, 0.00001),
  "deepseek/deepseek-v3.2": (0.00000025, 0.00000038),
  "qwen/qwen3-coder": (0.00000022, 0.00000095),
  "x-ai/grok-code-fast-1": (0.0000002, 0.0000015),
  "openai/gpt-5-mini": (0.00000025, 0.000002),
  "google/gemini-2.5-flash": (0.0000003, 0.0000025),
}

profiles = {
  "Quick edit": (300, 150, 15),
  "Standard": (500, 250, 48),
  "Deep assist": (1200, 600, 24),
  "Image-assisted": (700, 300, 10),
}

fee = 1.055
users = [10, 100, 1000]

results = {p: {} for p in profiles}
for pname, (p_tokens, c_tokens, reqs) in profiles.items():
  for model, (rp, rc) in models.items():
    base = (p_tokens * rp) + (c_tokens * rc)
    cost_per_req = base * fee
    monthly_per_user = cost_per_req * reqs
    totals = [monthly_per_user * u for u in users]
    results[pname][model] = (cost_per_req, monthly_per_user, totals)

def fmt(value: float) -> str:
  if value < 0.01:
    return f"{value:.4f}"
  if value < 1:
    return f"{value:.3f}"
  return f"{value:.2f}"

for pname, (p_tokens, c_tokens, reqs) in profiles.items():
  print(f"\n## {pname} (P={p_tokens}, C={c_tokens}, {reqs} req/user/mo)")
  print("| Model | Est $/req | $/user/mo | $/10 users | $/100 users | $/1000 users |")
  print("|---|---:|---:|---:|---:|---:|")
  for model in models:
    cost_per_req, per_user, totals = results[pname][model]
    print(
      f"| {model} | {fmt(cost_per_req)} | {fmt(per_user)} | {fmt(totals[0])} | {fmt(totals[1])} | {fmt(totals[2])} |"
    )
