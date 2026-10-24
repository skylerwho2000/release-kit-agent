import os
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
from pricing import calculate_cost

ROOT = Path(__file__).resolve().parent


def get_client() -> OpenAI:
    # Load project settings first; parent .env supplies class-level credentials.
    load_dotenv(ROOT / ".env", override=False)
    load_dotenv(ROOT.parent / ".env", override=False)
    key = os.getenv("PORTKEY_API_KEY")
    if not key:
        raise RuntimeError("PORTKEY_API_KEY is missing. Add it to Final Project/.env or the parent .env.")
    return OpenAI(api_key=key, base_url="https://api.portkey.ai/v1",
                  default_headers={"x-portkey-api-key": key})


def structured_call(client: OpenAI, name: str, schema: type, instructions: str,
                    context: dict, max_output_tokens: int = 1600) -> tuple[dict, dict]:
    """Call Portkey and validate the returned JSON using a Pydantic model."""
    response = client.responses.parse(
        model="gpt-6-luna",
        instructions=(instructions + " Return only the requested structured data. "
                      "Use only facts explicitly supplied in the context. Never invent achievements, "
                      "labels, audience sizes, streams, or other statistics."),
        input=str(context),
        text_format=schema,
        max_output_tokens=max_output_tokens,
    )
    usage = response.usage
    details = getattr(usage, "input_tokens_details", None)
    cached = getattr(details, "cached_tokens", 0) or 0
    cache_write = getattr(details, "cache_write_tokens", 0) or 0
    output = getattr(usage, "output_tokens", 0) or 0
    inputs = getattr(usage, "input_tokens", 0) or 0
    tokens = {"input_tokens": inputs, "cached_input_tokens": cached,
              "cache_write_tokens": cache_write,
              "output_tokens": output}
    tokens["cost_usd"] = calculate_cost(tokens)
    parsed = response.output_parsed
    return parsed.model_dump(mode="json"), tokens
