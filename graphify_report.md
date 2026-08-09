# Graph Report - .  (2026-05-07)

## Corpus Check
- 34 files · ~52,047 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 85 nodes · 84 edges · 9 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_AI Analysis & Orchestration|AI Analysis & Orchestration]]
- [[_COMMUNITY_Data Models & Persistence|Data Models & Persistence]]
- [[_COMMUNITY_API Schemas & Testing|API Schemas & Testing]]
- [[_COMMUNITY_OpenAI Image Analysis|OpenAI Image Analysis]]
- [[_COMMUNITY_Analytics & Visualization|Analytics & Visualization]]
- [[_COMMUNITY_PDF Report Generation|PDF Report Generation]]
- [[_COMMUNITY_System Configuration|System Configuration]]
- [[_COMMUNITY_API Core & Entry Point|API Core & Entry Point]]
- [[_COMMUNITY_Image Preprocessing|Image Preprocessing]]

## God Nodes (most connected - your core abstractions)
1. `upload_and_analyze_scan()` - 7 edges
2. `MRIScan` - 5 edges
3. `classify_mri()` - 4 edges
4. `PatientBase` - 4 edges
5. `BaseModel` - 4 edges
6. `analyze_and_summarize()` - 3 edges
7. `compare_scans()` - 3 edges
8. `generate_highlighted_image()` - 3 edges
9. `_extract_json()` - 3 edges
10. `generate_probability_chart()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `PatientCreate`  [INFERRED]
  test_real_mri.py → backend/app/schemas/schemas.py
- `upload_and_analyze_scan()` --calls--> `classify_mri()`  [INFERRED]
  backend/app/services/scan_service.py → backend/app/ai/openai_service.py
- `upload_and_analyze_scan()` --calls--> `generate_highlighted_image()`  [INFERRED]
  backend/app/services/scan_service.py → backend/app/ai/openai_service.py
- `upload_and_analyze_scan()` --calls--> `MRIScan`  [INFERRED]
  backend/app/services/scan_service.py → backend/app/models/models.py
- `test_upload_scan_success()` --calls--> `MRIScan`  [INFERRED]
  backend/tests/test_scans.py → backend/app/models/models.py

## Communities (18 total, 2 thin omitted)

### Community 0 - "AI Analysis & Orchestration"
Cohesion: 0.18
Nodes (10): analyze_and_summarize(), compare_scans(), Send the original MRI image to Gemini 2.5 Flash Lite for full analysis.     Hand, Compare two brain MRI scan AI summaries for progression tracking., AI Model Orchestration, MRI Analysis Pipeline, Tumor Progression Monitoring, Gemini API Integration (+2 more)

### Community 1 - "Data Models & Persistence"
Cohesion: 0.19
Nodes (7): Base, Analytics, MRIScan, Patient, create_patient(), test_get_scan_history(), test_upload_scan_success()

### Community 2 - "API Schemas & Testing"
Cohesion: 0.27
Nodes (10): BaseModel, main(), AIAnalysisResult, AnalyticsResponse, MRIScanBase, MRIScanResponse, PatientBase, PatientCreate (+2 more)

### Community 3 - "OpenAI Image Analysis"
Cohesion: 0.29
Nodes (7): classify_mri(), _extract_json(), generate_highlighted_image(), Extract JSON object from GPT response text., Quick classification via GPT-4o (text model, minimal cost).     Sends the MRI im, Generate a highlighted tumor image via GPT-image-2.     Only called when tumor r, OpenAI API Integration

### Community 4 - "Analytics & Visualization"
Cohesion: 0.4
Nodes (3): generate_probability_chart(), Generate a pie chart indicating the probability of a tumor., get_analytics()

### Community 5 - "PDF Report Generation"
Cohesion: 0.4
Nodes (3): generate_pdf_report(), Generate a PDF report for a given MRI scan.     Single highlighted image, paragr, get_pdf_report()

### Community 6 - "System Configuration"
Cohesion: 0.5
Nodes (3): BaseSettings, Config, Settings

## Knowledge Gaps
- **15 isolated node(s):** `Send the original MRI image to Gemini 2.5 Flash Lite for full analysis.     Hand`, `Compare two brain MRI scan AI summaries for progression tracking.`, `Process the MRI image to generate a highlighted image and a heatmap.     Returns`, `Quick classification via GPT-4o (text model, minimal cost).     Sends the MRI im`, `Generate a highlighted tumor image via GPT-image-2.     Only called when tumor r` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `upload_and_analyze_scan()` connect `AI Analysis & Orchestration` to `Data Models & Persistence`, `OpenAI Image Analysis`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `MRIScan` connect `Data Models & Persistence` to `AI Analysis & Orchestration`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `Analytics` connect `Data Models & Persistence` to `Analytics & Visualization`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `upload_and_analyze_scan()` (e.g. with `classify_mri()` and `generate_highlighted_image()`) actually correct?**
  _`upload_and_analyze_scan()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `MRIScan` (e.g. with `upload_and_analyze_scan()` and `test_upload_scan_success()`) actually correct?**
  _`MRIScan` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Send the original MRI image to Gemini 2.5 Flash Lite for full analysis.     Hand`, `Compare two brain MRI scan AI summaries for progression tracking.`, `Process the MRI image to generate a highlighted image and a heatmap.     Returns` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._