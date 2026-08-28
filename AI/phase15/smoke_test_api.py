"""Live API Smoke Test Client for Phase 15 Explainable Fair Price Assistant.

Executes real HTTP requests against the live running microservice on port 8002:
1. GET /health
2. POST /api/v1/pricing/validate
3. POST /api/v1/pricing/estimate (Synthetic calculation fixture)
4. POST /api/v1/pricing/estimate (Batch material conversion)
5. POST /api/v1/pricing/estimate (Below cost selection warning)
6. POST /api/v1/pricing/feedback (Isolated storage persistence)
"""
import json
import sys
import urllib.request
import urllib.error

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8002"


def make_request(method: str, endpoint: str, data: dict = None, headers: dict = None):
    url = f"{BASE_URL}{endpoint}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)

    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status_code = resp.getcode()
            response_body = json.loads(resp.read().decode("utf-8"))
            return status_code, response_body
    except urllib.error.HTTPError as e:
        status_code = e.code
        err_body = json.loads(e.read().decode("utf-8"))
        return status_code, err_body
    except Exception as e:
        print(f"❌ Connection failed to {url}: {e}")
        return None, None


def run_smoke_tests():
    print("========================================================================")
    print("🔍 PHASE 15 EXPLAINABLE FAIR-PRICE ASSISTANT — LIVE API SMOKE TEST")
    print("========================================================================")
    passed = 0
    total = 6

    # 1. Health Check
    print("\n[1/6] Testing GET /health...")
    status, data = make_request("GET", "/health")
    if status == 200 and data.get("status") == "ok" and data.get("port") == 8002:
        print(f"  ✅ Health OK: Service={data.get('service')}, Port={data.get('port')}, Formula={data.get('formula_version')}")
        passed += 1
    else:
        print(f"  ❌ Health Failed: status={status}, data={data}")

    # 2. Input Validation
    print("\n[2/6] Testing POST /api/v1/pricing/validate...")
    val_payload = {
        "materials": [{"name": "Mulberry Silk", "quantity": 1, "unit": "piece", "cost_per_unit": 200}],
        "labour": [{"task_name": "Weaving", "hours": 2, "hourly_rate": 100, "rate_source": "Guild 2026"}],
        "overhead": [{"name": "Workshop", "amount": 50}],
        "packaging": [{"name": "Box", "cost_per_unit": 0}],
        "margin_mode": "percentage_markup",
        "margin_value": 20,
    }
    status, data = make_request("POST", "/api/v1/pricing/validate", val_payload)
    if status == 200 and data.get("valid") is True:
        print("  ✅ Validation OK: Inputs verified valid, zero errors.")
        passed += 1
    else:
        print(f"  ❌ Validation Failed: status={status}, data={data}")

    # 3. Synthetic Fixture Estimate
    print("\n[3/6] Testing POST /api/v1/pricing/estimate (Synthetic Arithmetic Fixture)...")
    synthetic_payload = {
        "materials": [{"name": "Material", "quantity": 1, "unit": "pc", "cost_per_unit": 200}],
        "labour": [{"task_name": "Labour", "hours": 2, "hourly_rate": 100, "rate_source": "Guild"}],
        "overhead": [{"name": "Overhead", "amount": 50}],
        "packaging": [{"name": "Packaging", "cost_per_unit": 0}],
        "margin_mode": "percentage_markup",
        "margin_value": 20,
        "scenarios": [
            {"name": "low", "markup_percentage": 10, "label": "Low (10%)"},
            {"name": "base", "markup_percentage": 20, "label": "Base (20%)"},
            {"name": "high", "markup_percentage": 30, "label": "High (30%)"},
        ],
    }
    status, data = make_request("POST", "/api/v1/pricing/estimate", synthetic_payload)
    if status == 200:
        cost_floor = data.get("cost_floor")
        sc_map = {s["name"]: s["resulting_price_rounded"] for s in data.get("scenarios", [])}
        if cost_floor == 450.0 and sc_map.get("low") == 495.0 and sc_map.get("base") == 540.0 and sc_map.get("high") == 585.0:
            print(f"  ✅ Synthetic Fixture OK: Cost Floor=₹{cost_floor}, Low=₹{sc_map.get('low')}, Base=₹{sc_map.get('base')}, High=₹{sc_map.get('high')}")
            passed += 1
        else:
            print(f"  ❌ Arithmetic Mismatch: floor={cost_floor}, scenarios={sc_map}")
    else:
        print(f"  ❌ Estimate Request Failed: status={status}, data={data}")

    # 4. Batch Material Conversion Estimate
    print("\n[4/6] Testing POST /api/v1/pricing/estimate (Batch Material Conversion)...")
    batch_payload = {
        "materials": [{
            "name": "Indigo Dye Vat",
            "quantity": 1000,
            "unit": "grams",
            "cost_per_unit": 1,
            "is_batch": True,
            "batch_quantity": 20
        }],
        "labour": [{"task_name": "Dyeing", "hours": 1, "hourly_rate": 150, "rate_source": "Wage Card"}],
        "overhead": [],
        "packaging": [],
        "margin_mode": "percentage_markup",
        "margin_value": 20,
    }
    status, data = make_request("POST", "/api/v1/pricing/estimate", batch_payload)
    if status == 200:
        mat_cost = data.get("total_material_cost")  # 1000 / 20 * 1 = ₹50
        floor = data.get("cost_floor")              # 50 + 150 = ₹200
        if mat_cost == 50.0 and floor == 200.0:
            print(f"  ✅ Batch Conversion OK: 1000g batch / 20 units = ₹{mat_cost} material cost per unit, Floor=₹{floor}")
            passed += 1
        else:
            print(f"  ❌ Batch Conversion Mismatch: mat_cost={mat_cost}, floor={floor}")
    else:
        print(f"  ❌ Batch Estimate Failed: status={status}, data={data}")

    # 5. Below Cost Warning
    print("\n[5/6] Testing Below Cost Shortfall Detection...")
    below_cost_payload = {
        "materials": [{"name": "Silver Ingot", "quantity": 1, "unit": "item", "cost_per_unit": 800}],
        "labour": [{"task_name": "Filigree", "hours": 3, "hourly_rate": 200, "rate_source": "Guild"}],
        "overhead": [],
        "packaging": [],
        "margin_mode": "percentage_markup",
        "margin_value": 20,
        "artisan_final_price": 1000,  # Floor is 800 + 600 = 1400; 1000 is 400 below floor
    }
    status, data = make_request("POST", "/api/v1/pricing/estimate", below_cost_payload)
    if status == 200 and data.get("is_below_cost") is True and data.get("shortfall_amount") == 400.0:
        print(f"  ✅ Below Cost Warning OK: Floor=₹{data.get('cost_floor')}, Price=₹{data.get('artisan_final_price')}, Shortfall=₹{data.get('shortfall_amount')}")
        passed += 1
    else:
        print(f"  ❌ Below Cost Detection Failed: data={data}")

    # 6. Feedback Capture
    print("\n[6/6] Testing POST /api/v1/pricing/feedback...")
    fb_payload = {
        "suggested_price": 540.0,
        "artisan_selected_price": 550.0,
        "decision": "edited",
        "cost_floor": 450.0,
        "reason": "Exhibition standard price",
    }
    status, data = make_request("POST", "/api/v1/pricing/feedback", fb_payload, headers={"X-Artisan-Uid": "artisan_live_smoke"})
    if status == 200 and data.get("status") == "recorded":
        print(f"  ✅ Feedback Recorded OK: ID={data.get('feedback_id')}, Owner={data.get('owner_uid')}")
        passed += 1
    else:
        print(f"  ❌ Feedback Capture Failed: status={status}, data={data}")

    print("\n========================================================================")
    print(f"🏁 SMOKE TEST SUMMARY: {passed}/{total} Tests Passed")
    print("========================================================================")
    return passed == total


if __name__ == "__main__":
    success = run_smoke_tests()
    sys.exit(0 if success else 1)
