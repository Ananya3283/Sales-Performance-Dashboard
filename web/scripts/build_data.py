"""Builds web/src/data/sales.json from salesdataset.xlsx (the same file the Power BI report uses).

Run from the repo root:  python web/scripts/build_data.py
Rows are kept at order-line level so the dashboard computes every figure exactly, like the report's slicers.
"""
import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
df = pd.read_excel(ROOT / "salesdataset.xlsx")
df["Order Date"] = pd.to_datetime(df["Order Date"])

dims = {}
def code(col):
    values = sorted(df[col].astype(str).unique())
    dims[col] = values
    lookup = {v: i for i, v in enumerate(values)}
    return df[col].astype(str).map(lookup)

out = {
    "dims": {},
    "rows": [],
}
cols = {"Region": "r", "Segment": "s", "Category": "c", "Sub-Category": "sc", "Order ID": "o", "Customer ID": "cu", "Product Name": "p"}
coded = {short: code(col) for col, short in cols.items()}
out["dims"] = {cols[k]: v for k, v in dims.items() if k not in ("Order ID", "Customer ID")}
ym = df["Order Date"].dt.strftime("%Y-%m")
for i in range(len(df)):
    out["rows"].append([
        ym.iat[i], int(coded["r"].iat[i]), int(coded["s"].iat[i]), int(coded["c"].iat[i]), int(coded["sc"].iat[i]),
        int(coded["o"].iat[i]), int(coded["cu"].iat[i]), int(coded["p"].iat[i]),
        round(float(df["Sales"].iat[i]), 2), round(float(df["Profit"].iat[i]), 2), int(df["Quantity"].iat[i]),
    ])
out["fields"] = ["month", "region", "segment", "category", "subcategory", "order", "customer", "product", "sales", "profit", "quantity"]

dest = ROOT / "web" / "src" / "data" / "sales.json"
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
print(f"{len(df):,} rows -> {dest.relative_to(ROOT)} ({dest.stat().st_size/1024:.0f} KB)")
print(f"sales {df.Sales.sum():,.2f}  profit {df.Profit.sum():,.2f}  margin {df.Profit.sum()/df.Sales.sum():.2%}  orders {df['Order ID'].nunique():,}  customers {df['Customer ID'].nunique():,}")
print("dates", df["Order Date"].min().date(), "to", df["Order Date"].max().date())
