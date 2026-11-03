"""
Font Metric Derivation Tool using fontTools
Extracts OpenType table metrics (hhea, OS/2) from Arial, Inter, and Outfit binaries.
Computes size-adjust, ascent-override, descent-override, and line-gap-override
using the exact formula: metric / (unitsPerEm * size-adjust).
"""
import os
import sys
import tempfile
import urllib.request
from fontTools.ttLib import TTFont

SCRATCH_DIR = os.path.join(tempfile.gettempdir(), "portfolio_fonts").replace("\\", "/")
os.makedirs(SCRATCH_DIR, exist_ok=True)

ARIAL_PATH = os.path.join(os.environ.get("WINDIR", "").replace("\\", "/"), "Fonts/arial.ttf") if sys.platform == "win32" else "arial.ttf"
INTER_PATH = os.path.join(SCRATCH_DIR, "inter.woff")
OUTFIT_PATH = os.path.join(SCRATCH_DIR, "outfit.woff")

def ensure_font_downloaded(url_query, out_path, font_family):
    if not os.path.exists(out_path):
        print(f"Downloading {font_family} font binary...")
        req = urllib.request.Request(
            f"https://fonts.googleapis.com/css2?family={url_query}:wght@400;600;700&display=swap",
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko"}
        )
        css = urllib.request.urlopen(req).read().decode("utf-8")
        import re
        url = re.search(r'url\((https://[^)]+\.woff)\)', css).group(1)
        urllib.request.urlretrieve(url, out_path)

ensure_font_downloaded("Inter", INTER_PATH, "Inter")
ensure_font_downloaded("Outfit", OUTFIT_PATH, "Outfit")

def extract_font_tables(font_path, font_name):
    tt = TTFont(font_path)
    os2 = tt["OS/2"]
    hhea = tt["hhea"]
    head = tt["head"]
    upm = head.unitsPerEm
    fs_selection = os2.fsSelection
    use_typo_metrics = bool(fs_selection & (1 << 7))
    
    metrics = {
        "name": font_name,
        "upm": upm,
        "hhea_ascent": hhea.ascent,
        "hhea_descent": abs(hhea.descent),
        "hhea_lineGap": hhea.lineGap,
        "typo_ascender": os2.sTypoAscender,
        "typo_descender": abs(os2.sTypoDescender),
        "typo_lineGap": os2.sTypoLineGap,
        "win_ascent": os2.usWinAscent,
        "win_descent": os2.usWinDescent,
        "use_typo_metrics": use_typo_metrics,
        "x_avg_char_width": os2.xAvgCharWidth,
        "sx_height": getattr(os2, "sxHeight", None),
        "s_cap_height": getattr(os2, "sCapHeight", None)
    }
    
    print(f"\n==========================================")
    print(f"Font: {font_name} (UPM: {upm})")
    print(f"==========================================")
    print(f"  hhea.ascent:           {metrics['hhea_ascent']} ({metrics['hhea_ascent']/upm:.4%})")
    print(f"  hhea.descent:          {metrics['hhea_descent']} ({metrics['hhea_descent']/upm:.4%})")
    print(f"  hhea.lineGap:          {metrics['hhea_lineGap']} ({metrics['hhea_lineGap']/upm:.4%})")
    print(f"  OS/2.sTypoAscender:    {metrics['typo_ascender']} ({metrics['typo_ascender']/upm:.4%})")
    print(f"  OS/2.sTypoDescender:   {metrics['typo_descender']} ({metrics['typo_descender']/upm:.4%})")
    print(f"  OS/2.sTypoLineGap:     {metrics['typo_lineGap']} ({metrics['typo_lineGap']/upm:.4%})")
    print(f"  OS/2.fsSelection bit 7 (USE_TYPO_METRICS): {use_typo_metrics}")
    print(f"  OS/2.xAvgCharWidth:    {metrics['x_avg_char_width']}")
    print(f"  OS/2.sxHeight:         {metrics['sx_height']}")
    return metrics

def derive_overrides(target, fallback):
    """
    Computes CSS font-metric overrides:
    size-adjust = (target.sxHeight / target.upm) / (fallback.sxHeight / fallback.upm)
    ascent-override = target.hhea_ascent / (target.upm * size-adjust)
    descent-override = target.hhea_descent / (target.upm * size-adjust)
    line-gap-override = target.hhea_lineGap / (target.upm * size-adjust)
    """
    norm_target_x = target["sx_height"] / target["upm"]
    norm_fb_x = fallback["sx_height"] / fallback["upm"]
    size_adjust = norm_target_x / norm_fb_x
    
    ascent_override = target["hhea_ascent"] / (target["upm"] * size_adjust)
    descent_override = target["hhea_descent"] / (target["upm"] * size_adjust)
    line_gap_override = target["hhea_lineGap"] / (target["upm"] * size_adjust)
    
    print(f"\n--- Derived @font-face for '{target['name']} Fallback' (src: local('{fallback['name']}')) ---")
    print(f"  size-adjust:       {size_adjust * 100:.2f}%;")
    print(f"  ascent-override:   {ascent_override * 100:.2f}%;")
    print(f"  descent-override:  {descent_override * 100:.2f}%;")
    print(f"  line-gap-override: {line_gap_override * 100:.2f}%;")
    
    return {
        "size_adjust": size_adjust,
        "ascent_override": ascent_override,
        "descent_override": descent_override,
        "line_gap_override": line_gap_override
    }

if __name__ == "__main__":
    arial = extract_font_tables(ARIAL_PATH, "Arial")
    inter = extract_font_tables(INTER_PATH, "Inter")
    outfit = extract_font_tables(OUTFIT_PATH, "Outfit")
    
    print("\n" + "#" * 50)
    print("# FORMULA DERIVATION: metric / (unitsPerEm * size-adjust)")
    print("#" * 50)
    inter_derived = derive_overrides(inter, arial)
    outfit_derived = derive_overrides(outfit, arial)
