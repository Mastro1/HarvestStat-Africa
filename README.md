# HarvestStat Africa Explorer

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://harvest-stat-africa-ui.vercel.app/)
![GitHub](https://img.shields.io/github/license/HarvestStat/HarvestStat-Africa)
![Dataset](https://img.shields.io/badge/dataset-v1.2-blue)

**Live app:** [https://harvest-stat-africa-ui.vercel.app/](https://harvest-stat-africa-ui.vercel.app/)

Interactive web UI for exploring [HarvestStat-Africa](https://github.com/HarvestStat/HarvestStat-Africa) — harmonized subnational crop production statistics across Sub-Saharan Africa. Data is sourced from FEWS NET, FAO, and national agencies.

## Features

- Browse crop statistics at **national**, **Admin-1**, and **Admin-2** levels
- Interactive charts for yield, production, and area harvested
- Per-crop time series and seasonal breakdowns
- **Download CSV** for a full country or individual crops
- Country availability map and status tables on the landing page

## Architecture

| Layer | Stack | Role |
|---|---|---|
| **Frontend** | React (CRA) | Data visualization and user controls |
| **Backend** | Flask + pandas | API for filtering, aggregation, and CSV export |

**Data source:** The app fetches the official dataset (**v1.2**) directly from the HarvestStat-Africa GitHub repository at build/deploy time — no local CSV copy is stored in this repo.

```
https://raw.githubusercontent.com/HarvestStat/HarvestStat-Africa/refs/heads/main/public/hvstat_africa_data_v1.2.csv
```

## Repository structure

```
├── frontend/          React UI (Create React App)
├── backend/           Flask API
│   ├── app.py         API routes and data processing
│   ├── index.py       Vercel Services entrypoint
│   ├── data_loader.py Dataset fetch, cache, and loading
│   └── .cache/        Build-time CSV cache (gitignored)
├── scripts/           Build helpers (data download)
├── vercel.json        Vercel Services deployment config
└── docs/              Additional documentation
```

## Local development

### Prerequisites

- **Node.js** 14+ and **npm**
- **Python** 3.12+ and **pip**

### Setup

1. **Clone this repository:**
   ```bash
   git clone https://github.com/Mastro1/HarvestStat-Africa-UI.git
   cd HarvestStat-Africa-UI
   ```

2. **Create and activate a virtual environment (recommended):**
   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # macOS / Linux
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   cd frontend && npm install && cd ..
   ```

4. **Run the backend** (terminal 1):
   ```bash
   python -m backend.app
   ```
   API available at `http://127.0.0.1:5000`

5. **Run the frontend** (terminal 2):
   ```bash
   cd frontend
   npm start
   ```
   UI available at `http://localhost:3000` (proxies `/api` to the Flask server)

On first run, the backend downloads the dataset from GitHub and caches it in `backend/.cache/`.

## Deployment (Vercel)

The app is deployed on [Vercel](https://vercel.com) using the **Services** framework preset. Frontend and backend run as separate services in one project:

| Service | Route | Description |
|---|---|---|
| Frontend | `/` | React static build |
| Backend | `/_/backend` | Flask API |

1. Import [this repository](https://github.com/Mastro1/HarvestStat-Africa-UI) into Vercel
2. Set **Framework Preset** to **Services**
3. Deploy — `vercel.json` configures the rest

The dataset is downloaded during the build step and bundled with the backend function. To refresh data, redeploy the project.

### Optional environment variables

| Variable | Default | Description |
|---|---|---|
| `DATA_CSV_URL` | Official v1.2 GitHub URL | Override the dataset source |
| `DATA_CACHE_ONLY` | `true` on Vercel | Skip runtime downloads (required on free tier) |
| `BACKEND_ROUTE_PREFIX` | `/_/backend` | Backend mount path |

## Current data status

HarvestStat **v1.2** includes subnational crop statistics for **33 countries**:

- **Admin-1 level:** Angola, Burundi, Central African Republic, Chad, Congo (Democratic Republic of the), Ghana, Kenya, Lesotho, Liberia, Mali, Mauritania, Mozambique, Nigeria, South Africa, South Sudan, Sudan, Tanzania (United Republic of), Zimbabwe
- **Admin-2 level:** Benin, Burkina Faso, Cameroon, Ethiopia, Guinea, Madagascar, Malawi, Niger, Rwanda, Senegal, Sierra Leone, Somalia, Togo, Uganda, Zambia

The availability map is loaded from the [official HarvestStat-Africa repository](https://github.com/HarvestStat/HarvestStat-Africa).

## Data sources

- [FEWS NET Data Explorer](https://fdw.fews.net/data-explorer/) (primary source)
- [FAOSTAT](https://www.fao.org/faostat/en/#home)
- National agricultural agencies

Official dataset and documentation: [HarvestStat/HarvestStat-Africa](https://github.com/HarvestStat/HarvestStat-Africa)

## Credits

UI developed by **Massimo Poretti**, Data Engineer @ [Africa Specialty Risks](https://www.asr-re.com/).

## Citation

If you use HarvestStat data, please cite:

> Lee, D., Anderson, W., Chen, X. et al. HarvestStat Africa – Harmonized Subnational Crop Statistics for Sub-Saharan Africa. *Sci Data* **12**, 690 (2025). [https://doi.org/10.1038/s41597-025-05001-z](https://doi.org/10.1038/s41597-025-05001-z)

<details>
<summary>BibTeX</summary>

```bibtex
@article{lee2025harveststat,
  author  = {Lee, Donghoon and Anderson, Weston and Chen, Xuan and
             Davenport, Frank and Shukla, Shraddhanand and Sahajpal, Ritvik and
             Budde, Michael and Rowland, James and Verdin, Jim and You, Liangzhi and
             Ahouangbenon, Matthieu and Davis, Kyle Frankel and Kebede, Endalkachew and
             Ehrmann, Steffen and Justice, Christina and Meyer, Carsten},
  title   = {HarvestStat Africa – Harmonized Subnational Crop Statistics for Sub-Saharan Africa},
  journal = {Scientific Data},
  year    = {2025},
  volume  = {12},
  pages   = {690},
  doi     = {10.1038/s41597-025-05001-z}
}
```

</details>

## Related links

- **Live UI:** [harvest-stat-africa-ui.vercel.app](https://harvest-stat-africa-ui.vercel.app/)
- **Official dataset:** [github.com/HarvestStat/HarvestStat-Africa](https://github.com/HarvestStat/HarvestStat-Africa)
- **This UI (source code):** [github.com/Mastro1/HarvestStat-Africa-UI](https://github.com/Mastro1/HarvestStat-Africa-UI)
- **Dryad archive:** [doi:10.5061/dryad.vq83bk42w](https://datadryad.org/dataset/doi:10.5061/dryad.vq83bk42w)

## License

MIT License — see [LICENSE](LICENSE).
