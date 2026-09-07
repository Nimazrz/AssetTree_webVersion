package com.example.data.local

import com.example.data.model.StoredNodeEntity
import com.example.data.model.SymbolEntryEntity

const val ROOT_NODE_ID = "root"
const val ROOT_NODE_NAME = "پرتفوی جامع دارایی‌ها"

object SeedData {
    fun getInitialNodes(): List<StoredNodeEntity> {
        val now = System.currentTimeMillis()
        return listOf(
            // Root Node
            StoredNodeEntity(
                id = ROOT_NODE_ID,
                parentId = null,
                name = ROOT_NODE_NAME,
                quantity = 1.0,
                unit = "سبد",
                unitPrice = 0.0,
                createdAt = now
            ),
            // 1. گروه طلا و مسکوکات
            StoredNodeEntity(
                id = "grp_gold",
                parentId = ROOT_NODE_ID,
                name = "طلا و مسکوکات",
                quantity = 1.0,
                unit = "گروه",
                unitPrice = 0.0,
                createdAt = now + 1
            ),
            StoredNodeEntity(
                id = "asset_coin",
                parentId = "grp_gold",
                name = "سکه تمام بهار آزادی طرح جدید",
                quantity = 3.0,
                unit = "عدد",
                unitPrice = 480_000_000.0, // ریال
                createdAt = now + 2
            ),
            StoredNodeEntity(
                id = "asset_melted_gold",
                parentId = "grp_gold",
                name = "طلای آب‌شده ۱۸ عیار",
                quantity = 120.0,
                unit = "گرم",
                unitPrice = 42_000_000.0,
                createdAt = now + 3
            ),
            StoredNodeEntity(
                id = "grp_ornamental_gold",
                parentId = "grp_gold",
                name = "طلای زینتی و جواهرات",
                quantity = 1.0,
                unit = "زیرگروه",
                unitPrice = 0.0,
                createdAt = now + 4
            ),
            StoredNodeEntity(
                id = "asset_ring",
                parentId = "grp_ornamental_gold",
                name = "انگشتر برلیان و یاقوت",
                quantity = 1.0,
                unit = "قطعه",
                unitPrice = 2_500_000_000.0,
                createdAt = now + 5
            ),
            StoredNodeEntity(
                id = "asset_necklace",
                parentId = "grp_ornamental_gold",
                name = "گردنبند زمرد سلطنتی",
                quantity = 1.0,
                unit = "قطعه",
                unitPrice = 2_500_000_000.0,
                createdAt = now + 6
            ),

            // 2. بازار سرمایه و بورس
            StoredNodeEntity(
                id = "grp_stocks",
                parentId = ROOT_NODE_ID,
                name = "سهام و بورس اوراق بهادار",
                quantity = 1.0,
                unit = "گروه",
                unitPrice = 0.0,
                createdAt = now + 10
            ),
            StoredNodeEntity(
                id = "grp_metal_industry",
                parentId = "grp_stocks",
                name = "فلزات اساسی",
                quantity = 1.0,
                unit = "صنعت",
                unitPrice = 0.0,
                createdAt = now + 11
            ),
            StoredNodeEntity(
                id = "asset_foolad",
                parentId = "grp_metal_industry",
                name = "فولاد مبارکه اصفهان (فولاد)",
                quantity = 40_000.0,
                unit = "سهم",
                unitPrice = 6_200.0,
                createdAt = now + 12
            ),
            StoredNodeEntity(
                id = "asset_femelli",
                parentId = "grp_metal_industry",
                name = "ملی صنایع مس ایران (فملی)",
                quantity = 25_000.0,
                unit = "سهم",
                unitPrice = 7_800.0,
                createdAt = now + 13
            ),
            StoredNodeEntity(
                id = "grp_oil_industry",
                parentId = "grp_stocks",
                name = "فرآورده‌های نفتی و پتروشیمی",
                quantity = 1.0,
                unit = "صنعت",
                unitPrice = 0.0,
                createdAt = now + 14
            ),
            StoredNodeEntity(
                id = "asset_shetran",
                parentId = "grp_oil_industry",
                name = "پالایش نفت تهران (شتران)",
                quantity = 50_000.0,
                unit = "سهم",
                unitPrice = 4_400.0,
                createdAt = now + 15
            ),

            // 3. صندوق‌های سرمایه‌گذاری (ETF)
            StoredNodeEntity(
                id = "grp_funds",
                parentId = ROOT_NODE_ID,
                name = "صندوق‌های سرمایه‌گذاری (ETF)",
                quantity = 1.0,
                unit = "گروه",
                unitPrice = 0.0,
                createdAt = now + 20
            ),
            StoredNodeEntity(
                id = "asset_gold_fund",
                parentId = "grp_funds",
                name = "صندوق طلای کهربا (کهربا)",
                quantity = 15_000.0,
                unit = "واحد",
                unitPrice = 185_000.0,
                createdAt = now + 21
            ),
            StoredNodeEntity(
                id = "asset_fixed_fund",
                parentId = "grp_funds",
                name = "صندوق درآمد ثابت افران",
                quantity = 20_000.0,
                unit = "واحد",
                unitPrice = 105_000.0,
                createdAt = now + 22
            ),

            // 4. کالاهای اساسی و فیزیکی
            StoredNodeEntity(
                id = "grp_commodities",
                parentId = ROOT_NODE_ID,
                name = "کالاهای فیزیکی و فلزات صنعتی",
                quantity = 1.0,
                unit = "گروه",
                unitPrice = 0.0,
                createdAt = now + 30
            ),
            StoredNodeEntity(
                id = "asset_silver",
                parentId = "grp_commodities",
                name = "شمش نقره ۹۹۹",
                quantity = 500.0,
                unit = "گرم",
                unitPrice = 650_000.0,
                createdAt = now + 31
            ),
            StoredNodeEntity(
                id = "asset_copper_cathode",
                parentId = "grp_commodities",
                name = "کاتد مس بورس کالا",
                quantity = 1_000.0,
                unit = "کیلوگرم",
                unitPrice = 5_400_000.0,
                createdAt = now + 32
            ),

            // 5. املاک و مستغلات
            StoredNodeEntity(
                id = "grp_real_estate",
                parentId = ROOT_NODE_ID,
                name = "املاک و دارایی‌های فیزیکی",
                quantity = 1.0,
                unit = "گروه",
                unitPrice = 0.0,
                createdAt = now + 40
            ),
            StoredNodeEntity(
                id = "asset_apartment",
                parentId = "grp_real_estate",
                name = "آپارتمان مسکونی سعادت‌آباد",
                quantity = 1.0,
                unit = "واحد",
                unitPrice = 75_000_000_000.0,
                createdAt = now + 41
            ),

            // 6. وجوه نقد، ارز و کریپتو
            StoredNodeEntity(
                id = "grp_cash_forex",
                parentId = ROOT_NODE_ID,
                name = "ارز، تتر و نقدینگی",
                quantity = 1.0,
                unit = "گروه",
                unitPrice = 0.0,
                createdAt = now + 50
            ),
            StoredNodeEntity(
                id = "asset_usd",
                parentId = "grp_cash_forex",
                name = "دلار آمریکا (اسکناس)",
                quantity = 3_500.0,
                unit = "دلار",
                unitPrice = 880_000.0,
                createdAt = now + 51
            ),
            StoredNodeEntity(
                id = "asset_tether",
                parentId = "grp_cash_forex",
                name = "تتر دیجیتال (USDT)",
                quantity = 2_000.0,
                unit = "USDT",
                unitPrice = 885_000.0,
                createdAt = now + 52
            )
        )
    }

    fun getDefaultSymbolBook(): List<SymbolEntryEntity> {
        val now = System.currentTimeMillis()
        return listOf(
            // فلزات اساسی
            SymbolEntryEntity("فولاد", "فولاد مبارکه اصفهان", "فلزات اساسی", "TSETMC", now),
            SymbolEntryEntity("فملی", "ملی صنایع مس ایران", "فلزات اساسی", "TSETMC", now),
            SymbolEntryEntity("ذوب", "سهامی ذوب آهن اصفهان", "فلزات اساسی", "TSETMC", now),
            SymbolEntryEntity("کاوه", "فولاد کاوه جنوب کیش", "فلزات اساسی", "TSETMC", now),
            SymbolEntryEntity("فخوز", "فولاد خوزستان", "فلزات اساسی", "TSETMC", now),
            SymbolEntryEntity("فاسمین", "کالسیمین", "فلزات اساسی", "TSETMC", now),

            // پتروشیمی و پالایش
            SymbolEntryEntity("شتران", "پالایش نفت تهران", "فرآورده‌های نفتی", "TSETMC", now),
            SymbolEntryEntity("شپنا", "پالایش نفت اصفهان", "فرآورده‌های نفتی", "TSETMC", now),
            SymbolEntryEntity("شبندر", "پالایش نفت بندرعباس", "فرآورده‌های نفتی", "TSETMC", now),
            SymbolEntryEntity("شبریز", "پالایش نفت تبریز", "فرآورده‌های نفتی", "TSETMC", now),
            SymbolEntryEntity("فارس", "صنایع پتروشیمی خلیج فارس", "محصولات شیمیایی", "TSETMC", now),
            SymbolEntryEntity("نوری", "پتروشیمی نوری", "محصولات شیمیایی", "TSETMC", now),
            SymbolEntryEntity("بوعلی", "پتروشیمی بوعلی سینا", "محصولات شیمیایی", "TSETMC", now),
            SymbolEntryEntity("زاگرس", "پتروشیمی زاگرس", "محصولات شیمیایی", "TSETMC", now),

            // خودرو و ساخت قطعات
            SymbolEntryEntity("خودرو", "ایران خودرو", "خودرو و قطعات", "TSETMC", now),
            SymbolEntryEntity("خساپا", "سایپا", "خودرو و قطعات", "TSETMC", now),
            SymbolEntryEntity("خگستر", "گسترش سرمایه‌گذاری ایران خودرو", "خودرو و قطعات", "TSETMC", now),
            SymbolEntryEntity("خبهمن", "گروه بهمن", "خودرو و قطعات", "TSETMC", now),
            SymbolEntryEntity("خپارس", "پارس خودرو", "خودرو و قطعات", "TSETMC", now),

            // بانک‌ها و موسسات اعتباری
            SymbolEntryEntity("وبملت", "بانک ملت", "بانک‌ها و موسسات اعتباری", "TSETMC", now),
            SymbolEntryEntity("وتجارت", "بانک تجارت", "بانک‌ها و موسسات اعتباری", "TSETMC", now),
            SymbolEntryEntity("وبصادر", "بانک صادرات ایران", "بانک‌ها و موسسات اعتباری", "TSETMC", now),
            SymbolEntryEntity("وپاسار", "بانک پاسارگاد", "بانک‌ها و موسسات اعتباری", "TSETMC", now),
            SymbolEntryEntity("وسینا", "بانک سینا", "بانک‌ها و موسسات اعتباری", "TSETMC", now),

            // صندوق‌های طلا و اهرمی
            SymbolEntryEntity("طلا", "صندوق طلای لوتوس", "صندوق‌های سرمایه‌گذاری طلا", "TSETMC", now),
            SymbolEntryEntity("عیار", "صندوق طلای عیار مفید", "صندوق‌های سرمایه‌گذاری طلا", "TSETMC", now),
            SymbolEntryEntity("کهربا", "صندوق طلای کهربا", "صندوق‌های سرمایه‌گذاری طلا", "TSETMC", now),
            SymbolEntryEntity("زر", "صندوق طلای زرین آگاه", "صندوق‌های سرمایه‌گذاری طلا", "TSETMC", now),
            SymbolEntryEntity("اهرم", "صندوق اهرمی کاریزما", "صندوق‌های سرمایه‌گذاری اهرمی", "TSETMC", now),
            SymbolEntryEntity("شتاب", "صندوق اهرمی شتاب", "صندوق‌های سرمایه‌گذاری اهرمی", "TSETMC", now),
            SymbolEntryEntity("موج", "صندوق اهرمی موج", "صندوق‌های سرمایه‌گذاری اهرمی", "TSETMC", now),

            // ارز و دارایی دیجیتال
            SymbolEntryEntity("USDT", "تتر دیجیتال", "ارز و دارایی‌های دیجیتال", "MANUAL", now),
            SymbolEntryEntity("BTC", "بیت‌کوین", "ارز و دارایی‌های دیجیتال", "MANUAL", now),
            SymbolEntryEntity("USD", "دلار آمریکا", "ارز و دارایی‌های دیجیتال", "MANUAL", now),
            SymbolEntryEntity("EUR", "یورو اروپا", "ارز و دارایی‌های دیجیتال", "MANUAL", now)
        )
    }
}
