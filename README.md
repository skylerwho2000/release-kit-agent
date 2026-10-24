# Release Kit Agent

Release Kit Agent helps independent electronic music producers prepare a release campaign. It matches a track to five local curator listings, writes artist bios and track copy, drafts personalized pitches, and plans 14 social captions.

## Run it

1. Install Python 3.10+ and Node.js 18+.
2. From this folder, copy `.env.example` to `.env` and add your `PORTKEY_API_KEY`. The app loads `Final Project/.env` first, then the course root's `.env` if the project file does not define the key.
3. Run this single command from `Final Project`:

   ```bash
   python start.py
   ```

   On first launch the script creates `.venv`, installs the Python and npm dependencies, builds the React UI, and starts the combined FastAPI server. Later launches reuse those dependencies and rebuild the UI.

4. Open [http://127.0.0.1:8000](http://127.0.0.1:8000), click **Fill example**, then **Build my release kit**. Stop the server with Ctrl+C.

## Cost configuration

All model usage cost calculation lives in `pricing.py` as USD per million tokens, using the Lecture 11 Tokenomics rates: input $0.10, cached input $0.01, cache write $0.125, and output $0.50. Cost separates uncached input, cached input, and cache-write tokens.

## Safety checks

Inputs have field-specific length caps. Prompt-injection phrases are blocked before any model call. Every Portkey call sets a maximum output-token count. A browser session can complete up to 10 successful runs. The writers are instructed to use supplied facts only and not invent achievements, labels, or statistics.

Run the mocked safety checks from this folder with:

```bash
python tests/test_safety.py
```

The three sample tests cover prompt-injection blocking, oversized input rejection, and refusal of run 11. Logs from successful live generations are saved as JSON under `output/`.

## Files

- `main.py`: API validation and ordered four-agent orchestrator
- `agent.py`, `models.py`: Portkey calls and Pydantic output schemas
- `tools.py`, `data/curators.csv`: curator ranking and release-date tools/data
- `pricing.py`: per-million-token pricing config and cost formula
- `frontend/`: React app
- `tests/test_safety.py`: mocked safety checks
