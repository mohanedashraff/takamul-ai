# yilow-client

Yilow.ai Python SDK. Run every Yilow tool — Cinema Studio, Soul, Marketing, Lipsync, Voice Clone, all viral effects — from your Python scripts.

## Install

```bash
pip install yilow-client
```

## Auth

Generate a key at `https://yilow.ai/settings/api-keys` and export it:

```bash
export YILOW_API_KEY=yk_...
```

## Usage

```python
from yilow import Yilow

yilow = Yilow()  # picks YILOW_API_KEY from env

# 1. List tools
for t in yilow.tools():
    print(t.id, t.credits, t.title)

# 2. Run a tool (submit + wait)
result = yilow.run(
    "cinema-studio",
    {
        "prompt":       "An epic desert chase at golden hour",
        "aspect_ratio": "16:9",
        "resolution":   "2k",
    },
)
print(result.outputs["url"])

# 3. Submit + poll yourself
job = yilow.generate("renaissance", {"image": "https://…"})
final = yilow.wait_for_result(
    job.generation_id,
    on_tick=lambda s: print("state:", s.status),
)
```

## Errors

```python
from yilow import Yilow, YilowError

try:
    yilow.run("…", {})
except YilowError as e:
    if e.status == 402:
        print("Out of credits — top up at https://yilow.ai/billing")
```

## Async?

Bring your own loop — the underlying transport is `httpx`. A full async client (`yilow.AsyncYilow`) is on the roadmap.
