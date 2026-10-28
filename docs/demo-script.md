# Phase 2 Evaluator Demonstration Script

Follow this step-by-step walkthrough to present the project during the Phase 2 evaluation.

---

### Step 1: Health & Spatial Readiness Check
1. Start the system:
   ```bash
   # Terminal 1: Backend
   $env:PYTHONPATH="."; .\venv\Scripts\python.exe -m uvicorn backend.app.main:app --port 8000 --reload
   
   # Terminal 2: Frontend
   $env:PATH = "C:\Program Files\nodejs;" + $env:PATH; cd frontend; npm.cmd run dev
   ```
2. Open the browser to `http://127.0.0.1:5173`.
3. Notice the persistent **Pilot Evaluation Demo Data** banner, demonstrating academic integrity.
4. Open `http://127.0.0.1:8000/api/v1/health` in a browser tab to show the evaluators that the API is healthy and the pure Python TF-IDF text classifier is active.

---

### Step 2: Interactive City Map & Pilot Study Area
1. Click the **City Map** tab.
2. Point out the glowing pilot polygons for **Koramangala**, **Indiranagar**, and **HSR Layout**.
3. Click any circular priority pin (e.g. `85` in Koramangala).
4. Explain to evaluators:
   > *"Notice that each pin represents an underlying municipal issue, not just a raw ticket. This issue has 3 corroborating reports from citizens, which directly increases its priority."*

---

### Step 3: Citizen Reporting with AI Category Suggestion
1. Click **Report Issue**.
2. Type in the description:
   > *"Massive deep crater on asphalt near Sony World junction breaking scooter suspensions."*
3. Click outside or pause — observe the **AI Suggestion Chip** appear:
   > `✨ AI Suggestion: Pothole & Road Damage (88% match) [Apply]`
4. Click **Apply** to automatically select the category.
5. Click **Use Sample Photo** to simulate photo capture without needing a camera.
6. Drag the pin outside Bengaluru (or click a faraway point) — observe the system immediately flag:
   > `⚠ Location falls outside supported pilot zones.`
7. Click **Koramangala** — observe the green indicator:
   > `✓ Koramangala Pilot Zone (Ward 151).`
8. Click **Submit Observation**.
9. The report is submitted, EXIF stripped, validated against Point-in-Polygon, and linked to the existing Koramangala road defect!

---

### Step 4: Explainable Priority Score Breakdown
1. Click the **Operations Queue** tab.
2. Find the top-ranked issue and click **"Why this score?"**.
3. Show the formula modal:
   $$\text{priority} = 100 \times (0.30 \cdot S + 0.20 \cdot E + 0.20 \cdot C + 0.15 \cdot R + 0.15 \cdot A)$$
4. Point out how the breakdown is transparent, verifiable, and not a black-box model.

---

### Step 5: Auditable Lifecycle & Citizen Verification
1. As the officer, click **Start Work** $\rightarrow$ **Mark Resolved**.
2. Enter resolution note: *"Cold asphalt patching completed."*
3. Notice the status updates to `RESOLVED PENDING VERIFICATION`.
4. Switch to the **My Reports** tab.
5. Demonstrate the verification prompt:
   > *"Officer marked this repair complete. Has it been fixed?"*
6. Click **Not Fixed (Dispute)** and provide reason: *"Patch washed away after rain."*
7. The status immediately flips to `REOPENED` and the recurrence count increments in the audit log.

---

### Step 6: Intelligence Analytics
1. Click the **Intelligence Analytics** tab.
2. Point out:
   * **Citizen Observations vs Tracked Issues** (linking ratio).
   * **Reopen Dispute Rate**.
   * **Category Defect Volume** and **Pilot Zone Distribution**.
3. Clarify that the ESP32 hardware sensor node is scheduled for Phase 3 evaluation.
