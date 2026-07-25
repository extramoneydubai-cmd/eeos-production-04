#!/usr/bin/env python3
"""Clean up temporary schema modification scripts."""
import os

scripts_dir = "scripts"
for f in os.listdir(scripts_dir):
    if f.startswith("split_schema") and f.endswith(".py"):
        path = os.path.join(scripts_dir, f)
        os.remove(path)
        print(f"Removed {path}")
