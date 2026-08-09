# Graph Report - Brain Tumor 2.0  (2026-05-07)

## Corpus Check
- 18 files · ~2,486 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 56 nodes · 56 edges · 6 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]

## God Nodes (most connected - your core abstractions)
1. `upload_and_analyze_scan()` - 6 edges
2. `PatientBase` - 4 edges
3. `BaseModel` - 4 edges
4. `process_mri_image()` - 3 edges
5. `generate_probability_chart()` - 3 edges
6. `Patient` - 3 edges
7. `Base` - 3 edges
8. `MRIScan` - 3 edges
9. `Analytics` - 3 edges
10. `generate_pdf_report()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `upload_and_analyze_scan()` --calls--> `analyze_mri_scan()`  [INFERRED]
  backend/app/services/scan_service.py → backend/app/ai/gemini_service.py
- `upload_and_analyze_scan()` --calls--> `compare_scans()`  [INFERRED]
  backend/app/services/scan_service.py → backend/app/ai/gemini_service.py
- `upload_and_analyze_scan()` --calls--> `MRIScan`  [INFERRED]
  backend/app/services/scan_service.py → backend/app/models/models.py
- `get_analytics()` --calls--> `Analytics`  [INFERRED]
  backend/app/routes/analytics.py → backend/app/models/models.py
- `upload_and_analyze_scan()` --calls--> `process_mri_image()`  [INFERRED]
  backend/app/services/scan_service.py → backend/app/ai/image_processing.py

## Communities (13 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.24
Nodes (6): analyze_mri_scan(), compare_scans(), process_mri_image(), Process the MRI image to generate a highlighted image and a heatmap.     Returns, save_uploaded_file(), upload_and_analyze_scan()

### Community 1 - "Community 1"
Cohesion: 0.36
Nodes (9): BaseModel, AIAnalysisResult, AnalyticsResponse, MRIScanBase, MRIScanResponse, PatientBase, PatientCreate, PatientResponse (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.28
Nodes (5): Base, Analytics, MRIScan, Patient, create_patient()

### Community 3 - "Community 3"
Cohesion: 0.4
Nodes (3): generate_probability_chart(), Generate a pie chart indicating the probability of a tumor., get_analytics()

### Community 4 - "Community 4"
Cohesion: 0.4
Nodes (3): generate_pdf_report(), Generate a PDF report for a given MRI scan., get_pdf_report()

### Community 5 - "Community 5"
Cohesion: 0.5
Nodes (3): BaseSettings, Config, Settings

## Knowledge Gaps
- **5 isolated node(s):** `Process the MRI image to generate a highlighted image and a heatmap.     Returns`, `Generate a pie chart indicating the probability of a tumor.`, `BaseSettings`, `Config`, `Generate a PDF report for a given MRI scan.`
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `upload_and_analyze_scan()` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `MRIScan` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `Analytics` connect `Community 2` to `Community 3`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `upload_and_analyze_scan()` (e.g. with `process_mri_image()` and `analyze_mri_scan()`) actually correct?**
  _`upload_and_analyze_scan()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Process the MRI image to generate a highlighted image and a heatmap.     Returns`, `Generate a pie chart indicating the probability of a tumor.`, `BaseSettings` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._