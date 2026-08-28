# Phase 12 — Device Test Record & Hardware Compatibility Matrix

## 1. Executive Status & Verification Methodology

KarigarSaathi targets entry-level and mid-range Android mobile devices commonly used in rural craft clusters across India.

This test record maintains strict factual integrity by separating:
- **AUTOMATED & EMULATED VERIFICATION**: Executed and confirmed in the test suite and headless browser runtimes.
- **MANUAL PHYSICAL DEVICE VERIFICATION REQUIRED**: Specific hardware-dependent behaviors designated for physical device bench testing.

---

## 2. Emulated Viewport & Responsive Layout Verification

| Target Viewport | Typical Device Model | Layout Adaptation | Text Expansion (Indic) | Touch Targets $\ge 44\text{px}$ | Automated Status |
|:---|:---|:---|:---:|:---:|:---:|
| **320px width** | Ultra-budget Android (JioPhone / 3.5") | Single-column, stacked steppers, full-bleed images | **PASS** (Word wrapping verified) | **PASS** | **VERIFIED (Automated)** |
| **360px width** | Standard Entry Android (Samsung Galaxy A03, Redmi 9A) | Single-column, fluid grid | **PASS** | **PASS** | **VERIFIED (Automated)** |
| **375px width** | Compact Standard (iPhone SE, Pixel compact) | Fluid cards, top sticky nav | **PASS** | **PASS** | **VERIFIED (Automated)** |
| **412px width** | Modern Standard Android (Redmi Note, Realme, Vivo) | 2-column draft summary, tabbed navigation | **PASS** | **PASS** | **VERIFIED (Automated)** |
| **768px width** | Field Coordinator Tablet (Lenovo Tab M10) | Split-view workspace, sidebar | **PASS** | **PASS** | **VERIFIED (Automated)** |

---

## 3. Hardware & Network Resilience Benchmark Matrix

| Target Device Class | Specs | Test Scenario | Automated / Emulated Status | Physical Device Status |
|:---|:---|:---|:---:|:---:|
| **Low-End Android (2GB RAM)** | Quad-core 1.8GHz, 2GB RAM, Android 11 | Canvas display downscaling (1600px WebP) & blob memory release (`URL.revokeObjectURL`) | **VERIFIED (Automated)** | `MANUAL DEVICE VERIFICATION REQUIRED` |
| **Mid-Range Android (4GB RAM)** | Octa-core 2.0GHz, 4GB RAM, Android 13 | Multi-photo batch queueing (6 images) & IndexedDB storage queue | **VERIFIED (Automated)** | `MANUAL DEVICE VERIFICATION REQUIRED` |
| **Intermittent 2G/3G Cellular** | 64kbps–384kbps, 800ms latency, 5% packet loss | Exponential backoff upload resumption & non-blocking draft editing | **VERIFIED (Automated)** | `MANUAL DEVICE VERIFICATION REQUIRED` |
| **Airplane Mode / Offline Drop** | 0kbps (complete disconnect during upload) | Local IndexedDB persistence, restart recovery, sync on reconnect | **VERIFIED (Automated)** | `MANUAL DEVICE VERIFICATION REQUIRED` |
| **Camera Hardware Failure / Denial** | Restricted OS permissions | Pre-prompt rationale & instant file/gallery picker fallback | **VERIFIED (Automated)** | `MANUAL DEVICE VERIFICATION REQUIRED` |

---

## 4. Overall Physical Verification Status Signoff

- **Automated / Headless Suite Status**: **100% COMPLETE & VERIFIED** (Unit, Component, E2E, Emulated Network).
- **Physical Hardware Field Bench Status**: **AWAITING MANUAL DEVICE VERIFICATION**
  *(Field teams will execute physical field test checklists using `docs/phase12/MANUAL_TEST_GUIDE.md` across test handsets in Kamrup, Assam and Raghurajpur, Odisha clusters).*

