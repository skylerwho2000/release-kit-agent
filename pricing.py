"""gpt-6-luna USD prices per million tokens from the Lecture 11 Tokenomics slides."""
MODEL_PRICING_USD_PER_MILLION = {
    "input": 0.10,         # uncached input tokens
    "cached_input": 0.01,
    "cache_write": 0.125,
    "output": 0.50,
}


def calculate_cost(usage: dict) -> float:
    rates = MODEL_PRICING_USD_PER_MILLION
    input_tokens = usage.get("input_tokens", 0) or 0
    cached_tokens = usage.get("cached_input_tokens", 0) or 0
    cache_write_tokens = usage.get("cache_write_tokens", 0) or 0
    output_tokens = usage.get("output_tokens", 0) or 0
    uncached_tokens = max(0, input_tokens - cached_tokens - cache_write_tokens)
    cost = (uncached_tokens * rates["input"]
            + cached_tokens * rates["cached_input"]
            + cache_write_tokens * rates["cache_write"]
            + output_tokens * rates["output"]) / 1_000_000
    return round(cost, 12)
