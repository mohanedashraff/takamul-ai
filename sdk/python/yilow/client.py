"""Yilow.ai client — submit jobs, list tools, poll for results."""
from __future__ import annotations

import os
import time
from typing import Any, Callable, Dict, List, Optional

import httpx
from pydantic import BaseModel


class YilowError(Exception):
    """Raised on non-2xx API responses."""

    def __init__(self, status: int, body: Any) -> None:
        self.status = status
        self.body = body
        msg = body.get("error") if isinstance(body, dict) else None
        super().__init__(msg or f"Yilow API error ({status})")


class ToolInputDescriptor(BaseModel):
    id: str
    type: str
    label: Optional[str] = None
    required: Optional[bool] = None
    options: Optional[List[Dict[str, Any]]] = None
    defaultValue: Any = None
    min: Optional[float] = None
    max: Optional[float] = None


class ToolDescriptor(BaseModel):
    id: str
    title: str
    desc: str
    credits: int
    category: str
    inputs: List[ToolInputDescriptor]
    customRoute: Optional[str] = None


class GenerationState(BaseModel):
    generation_id: str
    status: str
    outputs: Optional[Dict[str, Any]] = None


class Yilow:
    """Yilow.ai client.

    Example::

        from yilow import Yilow

        yilow = Yilow(api_key="yk_...")
        result = yilow.run(
            "cinema-studio",
            {"prompt": "An epic chase at golden hour", "aspect_ratio": "16:9"},
        )
        print(result.outputs["url"])
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://yilow.ai",
        timeout: float = 60.0,
    ) -> None:
        self.api_key = api_key or os.environ.get("YILOW_API_KEY")
        if not self.api_key:
            raise ValueError("Yilow: api_key is required (or set YILOW_API_KEY)")
        self.base_url = base_url.rstrip("/")
        self._client = httpx.Client(
            timeout=timeout,
            headers={"Authorization": f"Bearer {self.api_key}"},
        )

    # ── Tool catalog ────────────────────────────────────────────
    def tools(self) -> List[ToolDescriptor]:
        r = self._client.get(f"{self.base_url}/api/mcp/catalog")
        data = self._unwrap(r)
        return [ToolDescriptor(**t) for t in data.get("tools", [])]

    # ── Job submission ──────────────────────────────────────────
    def generate(self, tool_id: str, inputs: Dict[str, Any]) -> GenerationState:
        r = self._client.post(
            f"{self.base_url}/api/generations",
            json={"toolId": tool_id, "inputs": inputs, "source": "sdk-python"},
        )
        data = self._unwrap(r)
        gen = data["generation"]
        return GenerationState(
            generation_id=gen["id"],
            status=gen["status"],
            outputs=gen.get("outputs"),
        )

    def generation(self, generation_id: str) -> GenerationState:
        r = self._client.get(f"{self.base_url}/api/generations/{generation_id}")
        data = self._unwrap(r)
        gen = data["generation"]
        return GenerationState(
            generation_id=gen["id"],
            status=gen["status"],
            outputs=gen.get("outputs"),
        )

    def wait_for_result(
        self,
        generation_id: str,
        timeout: float = 300.0,
        poll_interval: float = 3.0,
        on_tick: Optional[Callable[[GenerationState], None]] = None,
    ) -> GenerationState:
        deadline = time.time() + timeout
        while time.time() < deadline:
            state = self.generation(generation_id)
            if on_tick is not None:
                on_tick(state)
            if state.status in ("COMPLETED", "FAILED"):
                return state
            time.sleep(poll_interval)
        raise YilowError(408, {"error": f"Timed out after {int(timeout)}s"})

    def run(self, tool_id: str, inputs: Dict[str, Any]) -> GenerationState:
        """Convenience: submit + wait for result."""
        job = self.generate(tool_id, inputs)
        return self.wait_for_result(job.generation_id)

    # ── Account ─────────────────────────────────────────────────
    def me(self) -> Dict[str, Any]:
        r = self._client.get(f"{self.base_url}/api/me")
        return self._unwrap(r)

    # ── Internal ────────────────────────────────────────────────
    @staticmethod
    def _unwrap(r: httpx.Response) -> Any:
        try:
            body = r.json()
        except Exception:
            body = r.text
        if r.is_error:
            raise YilowError(r.status_code, body)
        return body

    def __enter__(self) -> "Yilow":
        return self

    def __exit__(self, *_exc: Any) -> None:
        self._client.close()
