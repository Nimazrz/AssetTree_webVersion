package com.example.data.model

data class AssetTemplateItem(
    val id: String,
    val name: String,
    val unit: String,
    val isCustom: Boolean = false
)

object DefaultAssetTemplates {
    val items = listOf(
        AssetTemplateItem("1", "سکه امامی", "عدد"),
        AssetTemplateItem("2", "سکه بهار آزادی", "عدد"),
        AssetTemplateItem("3", "نیم سکه", "عدد"),
        AssetTemplateItem("4", "ربع سکه", "عدد"),
        AssetTemplateItem("5", "سکه گرمی", "عدد"),
        AssetTemplateItem("6", "سکه زیر ۸۶", "عدد"),
        AssetTemplateItem("7", "طلای آب‌شده", "گرم"),
        AssetTemplateItem("8", "انگشتر", "گرم"),
        AssetTemplateItem("9", "النگو", "گرم"),
        AssetTemplateItem("10", "دستبند", "گرم"),
        AssetTemplateItem("11", "گردنبند", "گرم"),
        AssetTemplateItem("12", "شمش طلا", "گرم"),
        AssetTemplateItem("13", "کاتد مس", "کیلوگرم"),
        AssetTemplateItem("14", "زمین مسکونی", "متر مربع"),
        AssetTemplateItem("15", "زمین تجاری", "متر مربع"),
        AssetTemplateItem("16", "زمین کشاورزی", "متر مربع"),
        AssetTemplateItem("17", "ملک مسکونی", "متر مربع"),
        AssetTemplateItem("18", "ملک تجاری", "متر مربع"),
        AssetTemplateItem("19", "ویلا", "متر مربع"),
        AssetTemplateItem("20", "خودرو", "دستگاه"),
        AssetTemplateItem("21", "دلار", "دلار"),
        AssetTemplateItem("22", "یورو", "یورو"),
        AssetTemplateItem("23", "ریال", "ریال"),
        AssetTemplateItem("24", "تومان", "تومان"),
        AssetTemplateItem("25", "سهام", "سهم"),
        AssetTemplateItem("26", "صندوق سرمایه‌گذاری", "واحد"),
        AssetTemplateItem("27", "فرش دستباف", "متر مربع"),
        AssetTemplateItem("28", "فرش ماشینی", "متر مربع"),
        AssetTemplateItem("29", "زعفران", "گرم"),
        AssetTemplateItem("30", "سیمان (فله)", "کیلوگرم"),
        AssetTemplateItem("31", "سیمان (پاکتی)", "عدد"),
        AssetTemplateItem("32", "میلگرد", "کیلوگرم"),
        AssetTemplateItem("33", "آهن‌آلات", "کیلوگرم"),
        AssetTemplateItem("34", "نفت خام", "بشکه"),
        AssetTemplateItem("35", "نفت خام (حجمی)", "کیلوگرم"),
        AssetTemplateItem("36", "دام (گوسفند/گاو)", "رأس"),
        AssetTemplateItem("37", "طیور", "قطعه")
    )
    
    val customItems = mutableListOf<AssetTemplateItem>()
}
