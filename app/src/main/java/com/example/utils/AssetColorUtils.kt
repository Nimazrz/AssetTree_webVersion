package com.example.utils

import androidx.compose.ui.graphics.Color

data class AssetColorTheme(
    val primary: Color,
    val lightTint: Color,
    val darkShade: Color,
    val containerBgDark: Color,
    val containerBgLight: Color,
    val textOrIconColor: Color
)

object AssetColorUtils {

    // 1. Gold / طلا، مسکوکات طلا، صندوق‌های طلا (انواع زرد و طلایی)
    val GOLD_PALETTE = AssetColorTheme(
        primary = Color(0xFFF59E0B),       // Rich Amber Gold
        lightTint = Color(0xFFFDE68A),     // Light Gold
        darkShade = Color(0xFFB45309),     // Deep Amber Brown
        containerBgDark = Color(0x33F59E0B),
        containerBgLight = Color(0x22F59E0B),
        textOrIconColor = Color(0xFFFBBF24)
    )

    // 2. Copper / مس و کاتد مس (انواع قرمز)
    val COPPER_PALETTE = AssetColorTheme(
        primary = Color(0xFFEF4444),       // Vivid Copper Red
        lightTint = Color(0xFFFCA5A5),     // Light Copper Tint
        darkShade = Color(0xFF991B1B),     // Deep Red Oxide
        containerBgDark = Color(0x33EF4444),
        containerBgLight = Color(0x22EF4444),
        textOrIconColor = Color(0xFFF87171)
    )

    // 3. Silver / نقره، شمش نقره، صندوق نقره (انواع رنگ نقره‌ای و طوسی متالیک)
    val SILVER_PALETTE = AssetColorTheme(
        primary = Color(0xFF94A3B8),       // Silver Slate
        lightTint = Color(0xFFE2E8F0),     // Bright Silver
        darkShade = Color(0xFF475569),     // Dark Slate
        containerBgDark = Color(0x3394A3B8),
        containerBgLight = Color(0x2294A3B8),
        textOrIconColor = Color(0xFFCBD5E1)
    )

    // 4. Cash / دارایی نقدی ریالی و دلاری، ارز، صندوق‌های درآمد ثابت و سپرده (انواع سبز)
    val CASH_PALETTE = AssetColorTheme(
        primary = Color(0xFF10B981),       // Emerald Green
        lightTint = Color(0xFFA7F3D0),     // Mint Light
        darkShade = Color(0xFF047857),     // Deep Forest Green
        containerBgDark = Color(0x3310B981),
        containerBgLight = Color(0x2210B981),
        textOrIconColor = Color(0xFF34D399)
    )

    // 5. Real Estate / املاک و مستغلات (انواع قهوه‌ای و چوبی)
    val REAL_ESTATE_PALETTE = AssetColorTheme(
        primary = Color(0xFF8D6E63),       // Warm Earth Brown
        lightTint = Color(0xFFD7CCC8),     // Light Sand Brown
        darkShade = Color(0xFF4E342E),     // Rich Dark Espresso Brown
        containerBgDark = Color(0x338D6E63),
        containerBgLight = Color(0x228D6E63),
        textOrIconColor = Color(0xFFBCAAA4)
    )

    // 6. Vehicles / خودرو و وسایل نقلیه (بنفش)
    val VEHICLE_PALETTE = AssetColorTheme(
        primary = Color(0xFF8B5CF6),       // Modern Violet
        lightTint = Color(0xFFDDD6FE),     // Soft Purple
        darkShade = Color(0xFF5B21B6),     // Deep Indigo Violet
        containerBgDark = Color(0x338B5CF6),
        containerBgLight = Color(0x228B5CF6),
        textOrIconColor = Color(0xFFA78BFA)
    )

    // 7. Stocks / سهام و بورس (آبی رویال و سرمه‌ای)
    val STOCKS_PALETTE = AssetColorTheme(
        primary = Color(0xFF3B82F6),       // Royal Blue
        lightTint = Color(0xFFBFDBFE),     // Sky Blue Light
        darkShade = Color(0xFF1D4ED8),     // Cobalt Blue
        containerBgDark = Color(0x333B82F6),
        containerBgLight = Color(0x223B82F6),
        textOrIconColor = Color(0xFF60A5FA)
    )

    // 8. Distinct Palettes for other assets (رنگ‌های دیگر به غیر از رنگ‌های بالا)
    val TEAL_PALETTE = AssetColorTheme(
        primary = Color(0xFF0D9488),       // Deep Teal
        lightTint = Color(0xFF99F6E4),
        darkShade = Color(0xFF115E59),
        containerBgDark = Color(0x330D9488),
        containerBgLight = Color(0x220D9488),
        textOrIconColor = Color(0xFF2DD4BF)
    )

    val ORANGE_PALETTE = AssetColorTheme(
        primary = Color(0xFFEA580C),       // Coral Orange
        lightTint = Color(0xFFFED7AA),
        darkShade = Color(0xFF9A3412),
        containerBgDark = Color(0x33EA580C),
        containerBgLight = Color(0x22EA580C),
        textOrIconColor = Color(0xFFFB923C)
    )

    val PINK_PALETTE = AssetColorTheme(
        primary = Color(0xFFDB2777),       // Rose Pink
        lightTint = Color(0xFFFBCFE8),
        darkShade = Color(0xFF9D174D),
        containerBgDark = Color(0x33DB2777),
        containerBgLight = Color(0x22DB2777),
        textOrIconColor = Color(0xFFF472B6)
    )

    val INDIGO_PALETTE = AssetColorTheme(
        primary = Color(0xFF4F46E5),       // Indigo
        lightTint = Color(0xFFC7D2FE),
        darkShade = Color(0xFF312E81),
        containerBgDark = Color(0x334F46E5),
        containerBgLight = Color(0x224F46E5),
        textOrIconColor = Color(0xFF818CF8)
    )

    val DEFAULT_PALETTE = AssetColorTheme(
        primary = Color(0xFF0891B2),       // Cyan Ocean
        lightTint = Color(0xFFA5F3FC),
        darkShade = Color(0xFF164E63),
        containerBgDark = Color(0x330891B2),
        containerBgLight = Color(0x220891B2),
        textOrIconColor = Color(0xFF22D3EE)
    )

    val OTHER_PALETTES = listOf(
        TEAL_PALETTE,
        ORANGE_PALETTE,
        PINK_PALETTE,
        INDIGO_PALETTE,
        DEFAULT_PALETTE
    )

    fun getPaletteForNode(name: String, categoryTag: String? = null, customColors: Map<String, Long> = emptyMap()): AssetColorTheme {
        val combined = "${name.lowercase()} ${categoryTag?.lowercase() ?: ""}"
        
        // 1. Check custom colors first
        val matchingCustomColor = customColors.entries.firstOrNull { combined.contains(it.key.lowercase()) }
        if (matchingCustomColor != null) {
            val p = Color(matchingCustomColor.value)
            return AssetColorTheme(
                primary = p,
                lightTint = p.copy(alpha=0.6f),
                darkShade = p.copy(alpha=0.9f),
                containerBgDark = p.copy(alpha=0.2f),
                containerBgLight = p.copy(alpha=0.15f),
                textOrIconColor = p
            )
        }
        


        return when {
            // Gold & Gold Funds / طلا و مسکوکات طلا و صندوق‌های طلا (انواع زرد و طلایی)
            listOf("طلا", "سکه", "مسکوک", "شمش طلا", "آبشده", "عیار", "کهربا", "زرفام", "گوهر", "لوتوس", "ناب", "زر", "طلای", "gold").any { combined.contains(it) } -> GOLD_PALETTE

            // Copper / مس و کاتد مس (انواع قرمز اکسیدی و شاداب)
            listOf("مس", "کاتد", "فملی", "فباهنر", "باهنر", "مفتول مس", "copper").any { combined.contains(it) } -> COPPER_PALETTE

            // Silver / نقره و شمش نقره و صندوق‌های نقره (رنگ نقره‌ای و طوسی متالیک)
            listOf("نقره", "شمش نقره", "ساینا", "سیمین", "صندوق نقره", "silver").any { combined.contains(it) } -> SILVER_PALETTE

            // Cash & Fixed Income / نقدینگی، ریال، دلار، سپرده بانکی و صندوق‌های درآمد ثابت (انواع سبز زمردی و نعنایی)
            listOf("نقد", "ریال", "دلار", "اسکناس", "ارز", "یورو", "تتر", "درهم", "سپرده", "درآمد ثابت", "صندوق درآمد ثابت", "کارا", "اعتماد", "افرا", "حامی", "صایند", "ثبات", "بانک", "بانکی", "سود", "اوراق", "cash").any { combined.contains(it) } -> CASH_PALETTE

            // Real Estate / املاک، مستغلات و ساختمان (انواع قهوه‌ای و خاکی)
            listOf("املاک", "مستغلات", "زمین", "ساختمان", "آپارتمان", "ملک", "ویلا", "مغازه", "دفتر", "تجاری", "مسکونی", "سوله", "real estate").any { combined.contains(it) } -> REAL_ESTATE_PALETTE

            // Vehicles / خودرو و وسایل نقلیه (رنگ بنفش)
            listOf("خودرو", "ماشین", "اتومبیل", "وانت", "کامیون", "وسایل نقلیه", "vehicle", "car").any { combined.contains(it) } -> VEHICLE_PALETTE

            // Stocks & Equities / سهام و بورس (رنگ آبی سلطنتی)
            listOf("سهام", "بورس", "فرابورس", "فولاد", "پتروشیمی", "پالایش", "شپنا", "شتران", "فخوز", "کگل", "کچاد", "stock").any { combined.contains(it) } -> STOCKS_PALETTE

            else -> {
                // Other assets -> distinct non-overlapping palettes (رنگ‌های دیگر به غیر از رنگ‌های بالا)
                val hash = kotlin.math.abs(combined.hashCode()) % OTHER_PALETTES.size
                OTHER_PALETTES[hash]
            }
        }
    }

    data class LegendItem(val title: String, val color: Color, val description: String)

    val MAIN_LEGEND_ITEMS = listOf(
        LegendItem("طلا و مسکوکات", GOLD_PALETTE.primary, "طلا، سکه و صندوق‌های طلا"),
        LegendItem("مس و کاتد", COPPER_PALETTE.primary, "مس و کاتد مس"),
        LegendItem("نقره و مشتقات", SILVER_PALETTE.primary, "نقره و شمش نقره"),
        LegendItem("نقد و درآمد ثابت", CASH_PALETTE.primary, "ریال، دلار، سپرده و درآمد ثابت"),
        LegendItem("املاک و مستغلات", REAL_ESTATE_PALETTE.primary, "ساختمان، زمین و املاک"),
        LegendItem("خودرو و نقلیه", VEHICLE_PALETTE.primary, "خودرو و وسایل نقلیه"),
        LegendItem("سهام و بورس", STOCKS_PALETTE.primary, "سهام بازار سرمایه"),
        LegendItem("سایر دارایی‌ها", TEAL_PALETTE.primary, "سایر دارایی‌ها و کالاها")
    )

    /**
     * Compute shaded color for nodes in trees or charts (پر رنگ / کمرنگ بر اساس عمق و سطح)
     */
    fun getNodeShadedColor(
        customColors: Map<String, Long> = emptyMap(),
        name: String,
        categoryTag: String? = null,
        depth: Int = 0,
        isGroup: Boolean = false,
        isDark: Boolean = true
    ): Color {
        val palette = getPaletteForNode(name, categoryTag, customColors)
        return when (depth) {
            0 -> palette.primary
            1 -> if (isGroup) palette.primary else palette.textOrIconColor
            2 -> if (isDark) palette.textOrIconColor.copy(alpha = 0.9f) else palette.primary.copy(alpha = 0.85f)
            3 -> if (isDark) palette.lightTint.copy(alpha = 0.8f) else palette.darkShade.copy(alpha = 0.8f)
            else -> if (isDark) palette.lightTint.copy(alpha = 0.65f) else palette.primary.copy(alpha = 0.65f)
        }
    }
}
