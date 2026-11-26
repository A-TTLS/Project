"""
================================================================================
CalorieSnap - Food Nutrition Datasets ETL Pipeline
================================================================================
Processes 4 local food nutrition datasets and batch-imports them into Supabase 'food_items':
1. OpenNutrition (opennutrition-dataset-2025.1.zip)
2. Malaysian MyFCD & Indonesian TKPI (food-nutrition-main.zip)
3. Canadian Nutrient File 2026 (cnf_fcen_all-files-data_2026.zip)
4. Open Food Facts (en.openfoodfacts.org.products.csv.gz) - filtered to MY/SG

Target Table: public.food_items
Batch Size: 1,000 rows
================================================================================
"""

import os
import sys
import re
import json
import zipfile
import math
from pathlib import Path
from typing import List, Dict, Any, Optional

# Force immediate flush of print statements
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

import pandas as pd
import numpy as np
from supabase import create_client, Client

# ── Paths ──────────────────────────────────────────────────────────────────────
DOWNLOADS_DIR = Path(r"C:\Users\User\Downloads")
OPENNUTRITION_ZIP = DOWNLOADS_DIR / "opennutrition-dataset-2025.1.zip"
FOOD_NUTRITION_ZIP = DOWNLOADS_DIR / "food-nutrition-main.zip"
CNF_ZIP = DOWNLOADS_DIR / "cnf_fcen_all-files-data_2026.zip"
OFF_GZ = DOWNLOADS_DIR / "en.openfoodfacts.org.products.csv.gz"

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / ".env"

BATCH_SIZE = 1000

# ── Helpers ────────────────────────────────────────────────────────────────────
def load_env_file(filepath: Path) -> Dict[str, str]:
    env = {}
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip("'\"")
    return env

def normalize_name(name: str) -> str:
    if not name:
        return ""
    # lowercase, alphanumeric + spaces only, trimmed
    cleaned = re.sub(r"[^a-z0-9\s]+", " ", str(name).lower())
    return re.sub(r"\s+", " ", cleaned).strip()

def clean_float(val: Any) -> Optional[float]:
    if val is None or pd.isna(val):
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return round(f, 2)
    except (ValueError, TypeError):
        return None

def clean_record(rec: Dict[str, Any]) -> Dict[str, Any]:
    cleaned = {}
    for k, v in rec.items():
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            cleaned[k] = None
        elif pd.isna(v):
            cleaned[k] = None
        else:
            cleaned[k] = v
    return cleaned

# ── Supabase Batch Inserter ────────────────────────────────────────────────────
class SupabaseBatchImporter:
    def __init__(self, client: Client, table_name: str = "food_items", batch_size: int = BATCH_SIZE):
        self.client = client
        self.table_name = table_name
        self.batch_size = batch_size
        self.buffer: List[Dict[str, Any]] = []
        self.total_inserted = 0

    def add(self, record: Dict[str, Any]):
        cleaned = clean_record(record)
        # Drop row if missing name or calories_per_100g
        if not cleaned.get("name") or cleaned.get("calories_per_100g") is None:
            return
        
        self.buffer.append(cleaned)
        if len(self.buffer) >= self.batch_size:
            self.flush()

    def flush(self):
        if not self.buffer:
            return
        batch = self.buffer
        self.buffer = []
        try:
            res = self.client.table(self.table_name).insert(batch).execute()
            self.total_inserted += len(batch)
            print(f"      ✓ Inserted batch of {len(batch):,} rows (Total: {self.total_inserted:,})")
        except Exception as e:
            print(f"      ❌ Batch insert error: {e}")
            # Try inserting in smaller chunks of 100 on error
            for i in range(0, len(batch), 100):
                sub = batch[i:i + 100]
                try:
                    self.client.table(self.table_name).insert(sub).execute()
                    self.total_inserted += len(sub)
                except Exception as sub_e:
                    print(f"         Sub-batch failed ({len(sub)} rows): {sub_e}")

    def close(self) -> int:
        self.flush()
        return self.total_inserted

# ── 1. OpenNutrition ETL ───────────────────────────────────────────────────────
def process_opennutrition(importer: SupabaseBatchImporter) -> int:
    print("\n[1/4] Processing OpenNutrition (opennutrition-dataset-2025.1.zip)...")
    if not OPENNUTRITION_ZIP.exists():
        print(f"  ❌ File not found: {OPENNUTRITION_ZIP}")
        return 0

    start_count = importer.total_inserted
    chunksize = 25000

    with zipfile.ZipFile(OPENNUTRITION_ZIP) as z:
        with z.open("opennutrition_foods.tsv") as f:
            chunk_num = 0
            for chunk in pd.read_csv(f, sep="\t", chunksize=chunksize, dtype=str):
                chunk_num += 1
                for _, r in chunk.iterrows():
                    name = str(r.get("name") or "").strip()
                    if not name:
                        continue

                    nutr = {}
                    if pd.notna(r.get("nutrition_100g")):
                        try:
                            nutr = json.loads(r["nutrition_100g"])
                        except Exception:
                            pass

                    cals = clean_float(nutr.get("calories"))
                    if cals is None:
                        continue

                    serving = {}
                    if pd.notna(r.get("serving")):
                        try:
                            serving = json.loads(r["serving"])
                        except Exception:
                            pass

                    srv_name = "100g"
                    srv_grams = 100.0
                    if "common" in serving and serving["common"]:
                        c = serving["common"]
                        srv_name = f"{c.get('quantity', '')} {c.get('unit', '')}".strip() or "100g"
                    if "metric" in serving and serving["metric"]:
                        m = serving["metric"]
                        mg = clean_float(m.get("quantity"))
                        if mg is not None:
                            srv_grams = mg

                    category = str(r.get("type") or r.get("description") or "").strip() or None

                    importer.add({
                        "name": name,
                        "name_normalized": normalize_name(name),
                        "category": category,
                        "calories_per_100g": cals,
                        "protein_per_100g": clean_float(nutr.get("protein")),
                        "carbs_per_100g": clean_float(nutr.get("carbohydrates")),
                        "fat_per_100g": clean_float(nutr.get("total_fat")),
                        "fiber_per_100g": clean_float(nutr.get("dietary_fiber")),
                        "sugar_per_100g": clean_float(nutr.get("total_sugars")),
                        "sodium_per_100g": clean_float(nutr.get("sodium")),
                        "standard_serving_name": srv_name,
                        "standard_serving_grams": srv_grams,
                        "source": "opennutrition",
                        "source_id": str(r.get("id") or ""),
                    })

                print(f"    Chunk {chunk_num} ({chunksize * chunk_num:,} rows scanned)...")
                # Safety cap for initial import if desired, or let it process all

    importer.flush()
    total = importer.total_inserted - start_count
    print(f"  ✅ OpenNutrition complete! Total rows inserted: {total:,}")
    return total

# ── 2. Malaysian MyFCD & Indonesian TKPI ETL ──────────────────────────────────
def process_myfcd_tkpi(importer: SupabaseBatchImporter) -> int:
    print("\n[2/4] Processing Malaysian MyFCD & Indonesian TKPI (food-nutrition-main.zip)...")
    if not FOOD_NUTRITION_ZIP.exists():
        print(f"  ❌ File not found: {FOOD_NUTRITION_ZIP}")
        return 0

    start_count = importer.total_inserted

    with zipfile.ZipFile(FOOD_NUTRITION_ZIP) as z:
        targets = [
            ("food-nutrition-main/data_clean/myfcd_clean.csv", "myfcd"),
            ("food-nutrition-main/data_clean/tkpi_clean.csv", "tkpi"),
        ]

        for filepath, sub_src in targets:
            try:
                with z.open(filepath) as f:
                    df = pd.read_csv(f)
                    print(f"    Parsing {sub_src.upper()} ({len(df):,} items)...")
                    for _, r in df.iterrows():
                        name = str(r.get("food_name_original") or "").strip()
                        cals = clean_float(r.get("energy_kcal"))
                        if not name or cals is None:
                            continue

                        importer.add({
                            "name": name,
                            "name_normalized": normalize_name(name),
                            "category": str(r.get("category_original") or "").strip() or None,
                            "calories_per_100g": cals,
                            "protein_per_100g": clean_float(r.get("protein_g")),
                            "carbs_per_100g": clean_float(r.get("carbohydrate_g")),
                            "fat_per_100g": clean_float(r.get("fat_g")),
                            "fiber_per_100g": clean_float(r.get("fiber_g")),
                            "sugar_per_100g": clean_float(r.get("sugars_total_g")),
                            "sodium_per_100g": clean_float(r.get("sodium_mg")),
                            "standard_serving_name": "100g",
                            "standard_serving_grams": 100.0,
                            "source": "myfcd_tkpi",
                            "source_id": str(r.get("food_id") or ""),
                        })
            except Exception as e:
                print(f"    ❌ Error reading {filepath}: {e}")

    importer.flush()
    total = importer.total_inserted - start_count
    print(f"  ✅ MyFCD & TKPI complete! Total rows inserted: {total:,}")
    return total

# ── 3. Canadian Nutrient File 2026 ETL ─────────────────────────────────────────
def process_cnf(importer: SupabaseBatchImporter) -> int:
    print("\n[3/4] Processing Canadian Nutrient File 2026 (cnf_fcen_all-files-data_2026.zip)...")
    if not CNF_ZIP.exists():
        print(f"  ❌ File not found: {CNF_ZIP}")
        return 0

    start_count = importer.total_inserted

    with zipfile.ZipFile(CNF_ZIP) as z:
        print("    Loading CNF tables (Food_Name, Measures, Nutrient_Amount)...")
        with z.open("Food_Name.csv") as f:
            df_food = pd.read_csv(f, encoding="utf-8-sig")
        with z.open("Measure_Weight_Conversion.csv") as f:
            df_mwc = pd.read_csv(f, encoding="utf-8-sig")
        with z.open("Measure_Name.csv") as f:
            df_mn = pd.read_csv(f, encoding="utf-8-sig")
        with z.open("Nutrient_Amount.csv") as f:
            df_na = pd.read_csv(f, encoding="utf-8-sig")

    # Join household measure
    df_meas = df_mwc.merge(df_mn, on="Measure_Code", how="left")
    df_meas_first = df_meas.drop_duplicates(subset=["Food_Code"]).set_index("Food_Code")

    # Filter Nutrient_Amount to the target 7 nutrients:
    # 208: Energy (kcal), 203: Protein, 204: Fat, 205: Carbohydrate, 291: Fibre, 269: Sugars, 307: Sodium
    target_nutrients = [208, 203, 204, 205, 291, 269, 307]
    df_na_filtered = df_na[df_na["Nutrient_Code"].isin(target_nutrients)]
    
    # Pivot nutrients per food_code
    print("    Pivoting nutrient amounts per food...")
    df_pivoted = df_na_filtered.pivot_table(
        index="Food_Code",
        columns="Nutrient_Code",
        values="Nutrient_Amount",
        aggfunc="first"
    )

    print(f"    Merging and building CNF food items ({len(df_food):,} foods)...")
    for _, r in df_food.iterrows():
        fc = r["Food_Code"]
        name = str(r.get("Food_Description_EN") or "").strip()
        if not name:
            continue

        cals = None
        if fc in df_pivoted.index:
            row_nutr = df_pivoted.loc[fc]
            cals = clean_float(row_nutr.get(208))

        if cals is None:
            continue

        srv_name = "100g"
        srv_grams = 100.0
        if fc in df_meas_first.index:
            m_row = df_meas_first.loc[fc]
            srv_name = str(m_row.get("Measure_Description_and_Unit_EN") or "100g")
            srv_grams = clean_float(m_row.get("Measure_Weight_Conversion")) or 100.0

        importer.add({
            "name": name,
            "name_normalized": normalize_name(name),
            "category": "Canadian Nutrient File",
            "calories_per_100g": cals,
            "protein_per_100g": clean_float(row_nutr.get(203)),
            "carbs_per_100g": clean_float(row_nutr.get(205)),
            "fat_per_100g": clean_float(row_nutr.get(204)),
            "fiber_per_100g": clean_float(row_nutr.get(291)),
            "sugar_per_100g": clean_float(row_nutr.get(269)),
            "sodium_per_100g": clean_float(row_nutr.get(307)),
            "standard_serving_name": srv_name,
            "standard_serving_grams": srv_grams,
            "source": "cnf",
            "source_id": str(fc),
        })

    importer.flush()
    total = importer.total_inserted - start_count
    print(f"  ✅ CNF 2026 complete! Total rows inserted: {total:,}")
    return total

# ── 4. Open Food Facts (Streaming Chunked GZIP) ETL ────────────────────────────
def process_openfoodfacts(importer: SupabaseBatchImporter) -> int:
    print("\n[4/4] Processing Open Food Facts (en.openfoodfacts.org.products.csv.gz)...")
    print("      Rule: Streaming chunksize=50,000, filtering to countries_tags containing 'malaysia' or 'singapore'...")
    if not OFF_GZ.exists():
        print(f"  ❌ File not found: {OFF_GZ}")
        return 0

    start_count = importer.total_inserted
    chunksize = 50000

    cols = [
        "code", "product_name", "countries_tags", "categories",
        "energy-kcal_100g", "proteins_100g", "carbohydrates_100g",
        "fat_100g", "fiber_100g", "sugars_100g", "sodium_100g",
        "serving_size", "serving_quantity"
    ]

    total_scanned = 0
    chunk_idx = 0

    for chunk in pd.read_csv(
        OFF_GZ,
        sep="\t",
        compression="gzip",
        usecols=cols,
        chunksize=chunksize,
        low_memory=False,
        dtype=str
    ):
        chunk_idx += 1
        total_scanned += len(chunk)

        # Filter: countries_tags contains malaysia or singapore
        cond_country = chunk["countries_tags"].astype(str).str.lower().str.contains("malaysia|singapore", regex=True)
        cond_name = chunk["product_name"].notna() & (chunk["product_name"].astype(str).str.strip() != "")
        cond_kcal = chunk["energy-kcal_100g"].notna()

        matched = chunk[cond_country & cond_name & cond_kcal]

        for _, r in matched.iterrows():
            name = str(r["product_name"]).strip()
            cals = clean_float(r.get("energy-kcal_100g"))
            if not name or cals is None:
                continue

            srv_name = str(r.get("serving_size") or "").strip() or "100g"
            srv_grams = clean_float(r.get("serving_quantity")) or 100.0

            # Sodium in OFF is stored in grams; convert to mg if small float
            raw_sod = clean_float(r.get("sodium_100g"))
            sod_mg = raw_sod * 1000 if (raw_sod is not None and raw_sod <= 15) else raw_sod

            importer.add({
                "name": name,
                "name_normalized": normalize_name(name),
                "category": str(r.get("categories") or "").strip() or None,
                "calories_per_100g": cals,
                "protein_per_100g": clean_float(r.get("proteins_100g")),
                "carbs_per_100g": clean_float(r.get("carbohydrates_100g")),
                "fat_per_100g": clean_float(r.get("fat_100g")),
                "fiber_per_100g": clean_float(r.get("fiber_100g")),
                "sugar_per_100g": clean_float(r.get("sugars_100g")),
                "sodium_per_100g": clean_float(sod_mg),
                "standard_serving_name": srv_name,
                "standard_serving_grams": srv_grams,
                "source": "openfoodfacts",
                "source_id": str(r.get("code") or ""),
            })

        if chunk_idx % 10 == 0:
            print(f"    Scanned {total_scanned:,} OFF rows... (Imported: {importer.total_inserted - start_count:,})")

    importer.flush()
    total = importer.total_inserted - start_count
    print(f"  ✅ Open Food Facts complete! Scanned {total_scanned:,} rows, inserted {total:,} MY/SG foods.")
    return total

# ── Main Entrypoint ────────────────────────────────────────────────────────────
def main():
    print("=" * 70)
    print("🥑 CalorieSnap Multi-Dataset Nutrition ETL Pipeline")
    print("=" * 70)

    # 1. Load credentials
    env = load_env_file(ENV_FILE)
    supabase_url = os.getenv("SUPABASE_URL") or env.get("SUPABASE_URL")
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or env.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
        or env.get("SUPABASE_KEY")
    )

    if not supabase_url:
        print("\n❌ Error: SUPABASE_URL not found in .env or environment.")
        sys.exit(1)

    has_service_key = bool(
        os.getenv("SUPABASE_SERVICE_ROLE_KEY") or env.get("SUPABASE_SERVICE_ROLE_KEY")
    )

    if not has_service_key:
        print("\n⚠️ NOTICE: SUPABASE_SERVICE_ROLE_KEY is not set in .env.")
        print(f"   Using default key: {supabase_key[:12]}...")
        print("   If Row-Level Security (RLS) is active on 'food_items',")
        print("   please provide the SUPABASE_SERVICE_ROLE_KEY in your .env file.\n")

    print(f"Connecting to Supabase at: {supabase_url}")
    supabase: Client = create_client(supabase_url, supabase_key)

    # Pre-flight check: verify table exists
    try:
        supabase.table("food_items").select("name").limit(1).execute()
        print("  ✓ Connected to Supabase and verified 'food_items' table exists!\n")
    except Exception as e:
        print(f"\n❌ Pre-flight check failed for 'food_items' table: {e}")
        print("\n👉 To create the 'food_items' table, run this SQL in your Supabase SQL Editor:")
        print("-" * 70)
        print("""CREATE TABLE IF NOT EXISTS public.food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_normalized TEXT NOT NULL,
    category TEXT,
    calories_per_100g NUMERIC(10, 2) NOT NULL,
    protein_per_100g NUMERIC(10, 2),
    carbs_per_100g NUMERIC(10, 2),
    fat_per_100g NUMERIC(10, 2),
    fiber_per_100g NUMERIC(10, 2),
    sugar_per_100g NUMERIC(10, 2),
    sodium_per_100g NUMERIC(10, 2),
    standard_serving_name TEXT,
    standard_serving_grams NUMERIC(10, 2),
    source TEXT NOT NULL,
    source_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and allow public/service access
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on food_items" ON public.food_items FOR SELECT USING (true);
CREATE POLICY "Allow service role full access on food_items" ON public.food_items FOR ALL USING (true);
""")
        print("-" * 70)
        print("After creating the table and adding SUPABASE_SERVICE_ROLE_KEY to your .env, re-run this script.\n")
        return

    importer = SupabaseBatchImporter(supabase, table_name="food_items", batch_size=BATCH_SIZE)

    # 2. Run ETL for each dataset
    stats = {}
    try:
        stats["myfcd_tkpi"] = process_myfcd_tkpi(importer)
        stats["cnf"] = process_cnf(importer)
        stats["openfoodfacts"] = process_openfoodfacts(importer)
        stats["opennutrition"] = process_opennutrition(importer)
    except Exception as e:
        print(f"\n❌ Unexpected pipeline error: {e}")

    final_total = importer.close()

    # 3. Print Final Summary
    print("\n" + "=" * 70)
    print("🎉 ETL PIPELINE SUMMARY: BATCH IMPORT COMPLETE")
    print("=" * 70)
    print(f"  • Malaysian MyFCD / Indonesian TKPI : {stats.get('myfcd_tkpi', 0):,} rows")
    print(f"  • Canadian Nutrient File 2026 (CNF) : {stats.get('cnf', 0):,} rows")
    print(f"  • Open Food Facts (MY / SG filtered): {stats.get('openfoodfacts', 0):,} rows")
    print(f"  • OpenNutrition                      : {stats.get('opennutrition', 0):,} rows")
    print("-" * 70)
    print(f"  🌟 TOTAL FOOD ITEMS INSERTED        : {final_total:,} rows")
    print("=" * 70)

if __name__ == "__main__":
    main()
