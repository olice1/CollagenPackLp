import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import arabic_reshaper
from bidi.algorithm import get_display

def ar(text):
    return get_display(arabic_reshaper.reshape(text))

OUTPUT_DIR = r"g:\PROJECTS\Aureva\pack\asset for ads"
IMAGES_DIR = r"g:\PROJECTS\Aureva\pack\images"
os.makedirs(OUTPUT_DIR, exist_ok=True)

FONT_ARIAL_BOLD = r"C:\Windows\Fonts\arialbd.ttf"
FONT_TAHOMA_BOLD = r"C:\Windows\Fonts\tahomabd.ttf"

def draw_rounded_rect(draw, bbox, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(bbox, radius=radius, fill=fill, outline=outline, width=width)

def create_ad_1_pain_relief():
    """Creative 1: The Pain & Relief Hook (حريق الركابي وطقطقة المفاصل)"""
    W, H = 1080, 1080
    im = Image.new("RGB", (W, H), "#F8FAFC")
    draw = ImageDraw.Draw(im)

    # 1. Top Announcement Header
    draw.rectangle([0, 0, W, 85], fill="#0F4C5C")
    f_badge = ImageFont.truetype(FONT_ARIAL_BOLD, 30)
    top_txt = ar("🌿 الروتين الطبيعي الثلاثي الأقوى لدعم المفاصل والغضاريف بالمغرب")
    bbox = draw.textbbox((0, 0), top_txt, font=f_badge)
    txt_w = bbox[2] - bbox[0]
    draw.text(((W - txt_w) // 2, 24), top_txt, font=f_badge, fill="#FFFFFF")

    # 2. Main Pain Hook
    f_hook = ImageFont.truetype(FONT_ARIAL_BOLD, 46)
    hook_txt = ar("كتعاني من حريق الركابي وصعوبة الصلاة والدروج؟")
    bbox = draw.textbbox((0, 0), hook_txt, font=f_hook)
    draw.text(((W - (bbox[2] - bbox[0])) // 2, 115), hook_txt, font=f_hook, fill="#0F172A")

    # Sub-hook
    f_sub = ImageFont.truetype(FONT_TAHOMA_BOLD, 26)
    sub_txt = ar("الحل الجذري لتزييت الركبة وإعادة بناء الغضروف المتآكل من الداخل")
    bbox = draw.textbbox((0, 0), sub_txt, font=f_sub)
    draw.text(((W - (bbox[2] - bbox[0])) // 2, 180), sub_txt, font=f_sub, fill="#059669")

    # 3. Product Center Image
    hero_p = os.path.join(IMAGES_DIR, "bundle-trio.jpg")
    if os.path.exists(hero_p):
        prod_img = Image.open(hero_p).convert("RGBA")
        prod_img = prod_img.resize((660, 520), Image.Resampling.LANCZOS)
        # Add slight shadow
        shadow = Image.new("RGBA", (680, 540), (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(shadow)
        s_draw.rectangle([10, 10, 670, 530], fill=(0, 0, 0, 45))
        shadow = shadow.filter(ImageFilter.GaussianBlur(12))
        im.paste(shadow, ((W - 680) // 2, 235), shadow)
        im.paste(prod_img, ((W - 660) // 2, 230))

    # 4. Feature Badges Overlay
    f_feat = ImageFont.truetype(FONT_TAHOMA_BOLD, 22)
    features = [
        ("✓ تزييت المفصل ومنع الاحتكاك (غضروف القرش)", 780),
        ("✓ مرونة الأربطة وتسهيل السجود (كولاجين بحري)", 825),
        ("✓ تقوية العظام ومقاومة الالتهاب (زيت كبد الحوت)", 870)
    ]
    for feat_text, y_pos in features:
        txt = ar(feat_text)
        bbox = draw.textbbox((0, 0), txt, font=f_feat)
        w_b = bbox[2] - bbox[0]
        # pill background
        draw_rounded_rect(draw, [(W - w_b - 50) // 2, y_pos - 6, (W + w_b + 50) // 2, y_pos + 32], 16, fill="#E6FFFA", outline="#99F6E4", width=2)
        draw.text(((W - w_b) // 2, y_pos), txt, font=f_feat, fill="#0F4C5C")

    # 5. Bottom Offer CTA Footer
    draw.rectangle([0, H - 150, W, H], fill="#0F4C5C")
    
    # Price
    f_price = ImageFont.truetype(FONT_ARIAL_BOLD, 48)
    p_txt = ar("330 درهم فقط للباك كامل (3 علب)")
    bbox = draw.textbbox((0, 0), p_txt, font=f_price)
    draw.text(((W - (bbox[2] - bbox[0])) // 2, H - 140), p_txt, font=f_price, fill="#FACC15")

    # Delivery & Trust
    f_del = ImageFont.truetype(FONT_ARIAL_BOLD, 26)
    del_txt = ar("🚚 التوصيل مجاني لجميع المدن المغربية • 💵 الدفع بعد فحص الطرد")
    bbox = draw.textbbox((0, 0), del_txt, font=f_del)
    draw.text(((W - (bbox[2] - bbox[0])) // 2, H - 75), del_txt, font=f_del, fill="#FFFFFF")

    out_path = os.path.join(OUTPUT_DIR, "AUREVA_Ad_1_Pain_Hook.png")
    im.save(out_path, quality=95)
    print("Saved:", out_path)

def create_ad_2_comparison():
    """Creative 2: Why creams fail vs Why this 3-in-1 pack works (علاش البوماضات مكينفعوش؟)"""
    W, H = 1080, 1080
    im = Image.new("RGB", (W, H), "#FFFFFF")
    draw = ImageDraw.Draw(im)

    # Top Header
    draw.rectangle([0, 0, W, 100], fill="#0F4C5C")
    f_head = ImageFont.truetype(FONT_ARIAL_BOLD, 42)
    h_txt = ar("علاش المسكنات والبوماضات ما كيعالجوش المشكل؟")
    bbox = draw.textbbox((0, 0), h_txt, font=f_head)
    draw.text(((W - (bbox[2] - bbox[0])) // 2, 25), h_txt, font=f_head, fill="#FFFFFF")

    # Subtitle
    f_sub = ImageFont.truetype(FONT_TAHOMA_BOLD, 26)
    s_txt = ar("حيت كيسكنو مؤقتاً لساعتين فقط... المفصل محتاج التزييت والتغذية من الداخل!")
    bbox = draw.textbbox((0, 0), s_txt, font=f_sub)
    draw.text(((W - (bbox[2] - bbox[0])) // 2, 120), s_txt, font=f_sub, fill="#DC2626")

    # Comparison Columns
    col_w = 480
    y_start = 180
    h_box = 320

    # Wrong (Left)
    draw_rounded_rect(draw, [40, y_start, 40 + col_w, y_start + h_box], 20, fill="#FEF2F2", outline="#FCA5A5", width=2)
    f_box_title = ImageFont.truetype(FONT_ARIAL_BOLD, 30)
    w_title = ar("❌ المسكنات والبوماضات")
    bbox = draw.textbbox((0, 0), w_title, font=f_box_title)
    draw.text((40 + (col_w - (bbox[2] - bbox[0])) // 2, y_start + 20), w_title, font=f_box_title, fill="#991B1B")

    f_items = ImageFont.truetype(FONT_TAHOMA_BOLD, 22)
    wrong_items = [
        "• تسكين سطحي مؤقت لساعتين",
        "• لا تعوض تآكل الغضروف والمادة اللزجة",
        "• كثرة الأدوية الكيماوية تهلك المعدة",
        "• يرجع الحريق أشد بمجرد انتهاء المفعول"
    ]
    for idx, it in enumerate(wrong_items):
        t = ar(it)
        draw.text((65, y_start + 85 + idx * 52), t, font=f_items, fill="#7F1D1D")

    # Right (Right)
    draw_rounded_rect(draw, [W - 40 - col_w, y_start, W - 40, y_start + h_box], 20, fill="#F0FDF4", outline="#86EFAC", width=2)
    r_title = ar("✔️ الروتين الثلاثي الطبيعي")
    bbox = draw.textbbox((0, 0), r_title, font=f_box_title)
    draw.text((W - 40 - col_w + (col_w - (bbox[2] - bbox[0])) // 2, y_start + 20), r_title, font=f_box_title, fill="#166534")

    right_items = [
        "• تزييت عميق للمفصل ومنع احتكاك العظام",
        "• ترميم الأوتار والأربطة بالكولاجين البحري",
        "• تثبيت الكالسيوم وتقوية العظام بفيتامين D",
        "• طبيعي 100% وآمن تماماً على المعدة"
    ]
    for idx, it in enumerate(right_items):
        t = ar(it)
        draw.text((W - 40 - col_w + 25, y_start + 85 + idx * 52), t, font=f_items, fill="#14532D")

    # Center Pack Image
    hero_p = os.path.join(IMAGES_DIR, "bundle-hero.jpg")
    if os.path.exists(hero_p):
        prod_img = Image.open(hero_p).convert("RGBA")
        prod_img = prod_img.resize((520, 370), Image.Resampling.LANCZOS)
        im.paste(prod_img, ((W - 520) // 2, 525))

    # Bottom Callout Bar
    draw.rectangle([0, H - 165, W, H], fill="#059669")
    f_bot = ImageFont.truetype(FONT_ARIAL_BOLD, 44)
    b_txt = ar("330 درهم للباك كامل (3 علب أصلية 210 كبسولة)")
    bbox = draw.textbbox((0, 0), b_txt, font=f_bot)
    draw.text(((W - (bbox[2] - bbox[0])) // 2, H - 150), b_txt, font=f_bot, fill="#FFFFFF")

    f_sub2 = ImageFont.truetype(FONT_ARIAL_BOLD, 28)
    s2_txt = ar("🇲🇦 التوصيل فابور لجميع المدن + الدفع عند الاستلام بعد المعاينة")
    bbox = draw.textbbox((0, 0), s2_txt, font=f_sub2)
    draw.text(((W - (bbox[2] - bbox[0])) // 2, H - 80), s2_txt, font=f_sub2, fill="#FEF08A")

    out_path = os.path.join(OUTPUT_DIR, "AUREVA_Ad_2_Comparison_Angle.png")
    im.save(out_path, quality=95)
    print("Saved:", out_path)

def create_ad_3_special_offer():
    """Creative 3: High Perceived Value & Anchoring (3 علب كاملة بسعر لا يقاوم)"""
    W, H = 1080, 1080
    im = Image.new("RGB", (W, H), "#F1F5F9")
    draw = ImageDraw.Draw(im)

    # Top Banner
    draw.rectangle([0, 0, W, 100], fill="#1E293B")
    f_top = ImageFont.truetype(FONT_ARIAL_BOLD, 36)
    t_txt = ar("🎁 عرض حصري وخاص: باك المفاصل والحركة (3 في 1)")
    bbox = draw.textbbox((0, 0), t_txt, font=f_top)
    draw.text(((W - (bbox[2] - bbox[0])) // 2, 30), t_txt, font=f_top, fill="#FACC15")

    # Big Price Headline
    f_old = ImageFont.truetype(FONT_ARIAL_BOLD, 40)
    old_txt = ar("عوض 490 درهم")
    bbox_old = draw.textbbox((0, 0), old_txt, font=f_old)

    f_new = ImageFont.truetype(FONT_ARIAL_BOLD, 64)
    new_txt = ar("اليوم فقط بـ 330 درهم!")
    bbox_new = draw.textbbox((0, 0), new_txt, font=f_new)

    # Draw both centered
    draw.text(((W - (bbox_old[2] - bbox_old[0])) // 2, 125), old_txt, font=f_old, fill="#94A3B8")
    # Draw strikethrough over old price
    w_strike = bbox_old[2] - bbox_old[0]
    draw.line([((W - w_strike) // 2) - 10, 150, ((W + w_strike) // 2) + 10, 150], fill="#EF4444", width=5)

    draw.text(((W - (bbox_new[2] - bbox_new[0])) // 2, 185), new_txt, font=f_new, fill="#0F766E")

    # Per bottle breakdown pill
    f_pill = ImageFont.truetype(FONT_TAHOMA_BOLD, 26)
    pill_txt = ar("📦 3 علب كاملة (210 كبسولات) = بمعدل 110 درهم فقط للعلبة!")
    bbox_pill = draw.textbbox((0, 0), pill_txt, font=f_pill)
    pw = bbox_pill[2] - bbox_pill[0]
    draw_rounded_rect(draw, [(W - pw - 60) // 2, 275, (W + pw + 60) // 2, 325], 25, fill="#FEF3C7", outline="#F59E0B", width=2)
    draw.text(((W - pw) // 2, 285), pill_txt, font=f_pill, fill="#B45309")

    # Center Pack Image
    hero_p = os.path.join(IMAGES_DIR, "bundle-trio.jpg")
    if os.path.exists(hero_p):
        prod_img = Image.open(hero_p).convert("RGBA")
        prod_img = prod_img.resize((660, 480), Image.Resampling.LANCZOS)
        im.paste(prod_img, ((W - 660) // 2, 350))

    # 3 Products Mention
    f_prods = ImageFont.truetype(FONT_TAHOMA_BOLD, 22)
    prod_mention = ar("غضروف القرش (60 كبسولة) + كولاجين بحري (90 كبسولة) + زيت كبد الحوت (60 كبسولة)")
    bbox_pr = draw.textbbox((0, 0), prod_mention, font=f_prods)
    draw.text(((W - (bbox_pr[2] - bbox_pr[0])) // 2, 855), prod_mention, font=f_prods, fill="#334155")

    # Bottom Order Banner
    draw.rectangle([0, H - 160, W, H], fill="#0F4C5C")
    f_btn = ImageFont.truetype(FONT_ARIAL_BOLD, 42)
    btn_txt = ar("اطلب الآن واستفد من التوصيل المجاني 100%")
    bbox = draw.textbbox((0, 0), btn_txt, font=f_btn)
    draw.text(((W - (bbox[2] - bbox[0])) // 2, H - 145), btn_txt, font=f_btn, fill="#FFFFFF")

    f_guar = ImageFont.truetype(FONT_ARIAL_BOLD, 26)
    guar_txt = ar("🔒 الدفع عند الاستلام • فحص الطرد قبل الأداء • كمية محدودة")
    bbox = draw.textbbox((0, 0), guar_txt, font=f_guar)
    draw.text(((W - (bbox[2] - bbox[0])) // 2, H - 75), guar_txt, font=f_guar, fill="#34D399")

    out_path = os.path.join(OUTPUT_DIR, "AUREVA_Ad_3_Special_Offer_330DH.png")
    im.save(out_path, quality=95)
    print("Saved:", out_path)

if __name__ == "__main__":
    create_ad_1_pain_relief()
    create_ad_2_comparison()
    create_ad_3_special_offer()
    print("All 3 ad creatives generated successfully!")
