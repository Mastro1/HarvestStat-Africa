# HarvestStat-Africa: Harmonized Subnational Crop Statistics for Africa

The HarvestStat-Africa is a repository that contains cleaned and harmonized subnational global crop production data for Africa from various sources, including the Famine [Early Warning Systems Network (FEWS NET)](https://fews.net/) of the United States Agency for International Development (USAID) and the Food and Agriculture Organization (FAO).</br>

This repository provides access to a comprehensive crop dataset that allows researchers, policymakers, and stakeholders to explore trends and patterns from  the subnational to the global level, enabling better-informed decisions related to food security, trade, and development.</br>

## Data sources
The data in this repository is compiled from various sources, including:
- Famine Early Warning Systems Network (FEWS NET) of the United States Agency for International Development (USAID). This is the primary source of information
    - [FEWS NET Data Warehouse (FDW)](https://fews.net/data) (login required)
- Food and Agriculture Organization (FAO)
    - [FAO-STAT](https://www.fao.org/faostat/en/#home)
- National agricultural agencies

## Data processing and sharing
We are currently sharing the Jupyter notebooks that we used to calibrate and harmonize the crop data for each country, which can be found in the `notebook/` directory. However, in order to keep the process streamlined, we do not share underlying data sources externally at this time. 

## Repository structure
This repository is organized as follows:

- `docs/`: contains documentation related to the data.
- `notebook/`: contains the Jupyter notebook used for processing the data per each country.
- `public/`: contains the processed data in CSV and JSON formats. 
    - Note: the data is currently experimental and only available to internal research team.

## Current data status
HarvetStat currently contains subnational crop statistics for **`35`** countries.
<!-- (see [current data status per country](/docs/data_status_per_country.md)):</br> -->
- Admin-1 level: Afghanistan, Angola, Burundi, Central African Republic, Chad, DRC, Ghana, Kenya, Lesotho, Liberia, Mali, Mauritania, Mozambique, Nigeria, South Africa, South Sudan, Sudan, Tanzania, Yemen, Zimbabwe
- Admin-2 level: Benin, Burkina Faso, Cameroon, Ethiopia, Guinea, Madagascar, Malawi, Niger, Rwanda, Senegal, Sierra Leone, Somalia, Togo, Uganda, Zambia

<img src="./docs/current_status_map.png" alt="drawing" width="900"/>

## Citation
D. Lee, W. Anderson, X. Chen, F. Davenport, S. Shukla, R. Sahajpale, M. Budde, J. Rowland, J. Verdin, L. You, M. Ahouangbenoni, K. Davis, E. Kebede, S. Ehrmannk, C. Justice, and C. Meyer. (in revision), HarvestStat Africa – Harmonized Subnational Crop Statistics for Sub-Saharan Africa. EarthArXiv, [https://doi.org/10.31223/X5M123](https://doi.org/10.31223/X5M123).

<details>
<summary>BibTeX</summary>
<pre>
@article{lee_eaxv2024,
  author       = {Lee, Donghoon and
                  Anderson, Weston and
                  Chen, Xuan and
                  Davenport, Frank and
                  Shukla, Shraddhanand and
                  Sahajpal, Ritvik and
                  Budde, Michael and
                  Rowland, James and
                  Verdin, Jim and
                  You, Liangzhi and
                  Ahouangbenon, Matthieu and
                  Davis, Kyle Frankel and
                  Kebede, Endalkachew and
                  Ehrmann, Steffen and
                  Justice, Christina and
                  Meyer, Carsten},
  title        = {{HarvestStat Africa – Harmonized Subnational Crop Statistics for Sub-Saharan Africa}},
  year         = {2024},
  journal      = {EarthArXiv},
  note         = {Preprint},
  doi          = {10.31223/X5M123},
  url          = {https://doi.org/10.31223/X5M123}
}
</pre>
</details>

## How to contribute
Contribution document will be updated.

## Contact 
- Please contact Donghoon Lee ([Donghoon.Lee@umanitoba.ca](Donghoon.Lee@umanitoba.ca) and Weston Anderson [Weston@umd.edu](Weston@umd.edu)) for any questions or collaborations.</br>
- Users are welcome to open an [issue](https://github.com/HarvestStat/HarvestStat/issues).

<!-- ## Usage
The data in this repository is available for free and unrestricted use. Users are encouraged to cite the sources of the data appropriately. The repository can be cloned or downloaded using the git command or the Github interface.

## Contributing
Contributions to this repository are welcome, including new data sources or improvements to the existing data. To contribute, please create a pull request with a clear description of the changes proposed.

## License
The data in this repository is licensed under the Creative Commons Attribution 4.0 International license (CC BY 4.0). -->
