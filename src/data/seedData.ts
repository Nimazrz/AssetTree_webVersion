import { StoredNodeEntity, SymbolEntryEntity, ROOT_NODE_ID, ROOT_NODE_NAME } from '../types';

export function getInitialNodes(): StoredNodeEntity[] {
  const now = Date.now();
  return [
    // Root Node
    {
      id: ROOT_NODE_ID,
      parentId: null,
      name: ROOT_NODE_NAME,
      quantity: 1.0,
      unit: "سبد",
      unitPrice: 0.0,
      createdAt: now,
    },
    // 1. گروه طلا و مسکوکات
    {
      id: "grp_gold",
      parentId: ROOT_NODE_ID,
      name: "طلا و مسکوکات",
      quantity: 1.0,
      unit: "گروه",
      unitPrice: 0.0,
      createdAt: now + 1,
    },
    {
      id: "asset_coin",
      parentId: "grp_gold",
      name: "سکه تمام بهار آزادی طرح جدید",
      quantity: 3.0,
      unit: "عدد",
      unitPrice: 480_000_000.0, // ریال
      createdAt: now + 2,
    },
    {
      id: "asset_melted_gold",
      parentId: "grp_gold",
      name: "طلای آب‌شده ۱۸ عیار",
      quantity: 120.0,
      unit: "گرم",
      unitPrice: 42_000_000.0,
      createdAt: now + 3,
    },
    {
      id: "grp_ornamental_gold",
      parentId: "grp_gold",
      name: "طلای زینتی و جواهرات",
      quantity: 1.0,
      unit: "زیرگروه",
      unitPrice: 0.0,
      createdAt: now + 4,
    },
    {
      id: "asset_ring",
      parentId: "grp_ornamental_gold",
      name: "انگشتر برلیان و یاقوت",
      quantity: 1.0,
      unit: "قطعه",
      unitPrice: 2_500_000_000.0,
      createdAt: now + 5,
    },
    {
      id: "asset_necklace",
      parentId: "grp_ornamental_gold",
      name: "گردنبند زمرد سلطنتی",
      quantity: 1.0,
      unit: "قطعه",
      unitPrice: 2_500_000_000.0,
      createdAt: now + 6,
    },

    // 2. بازار سرمایه و بورس
    {
      id: "grp_stocks",
      parentId: ROOT_NODE_ID,
      name: "سهام و بورس اوراق بهادار",
      quantity: 1.0,
      unit: "گروه",
      unitPrice: 0.0,
      createdAt: now + 10,
    },
    {
      id: "grp_metal_industry",
      parentId: "grp_stocks",
      name: "فلزات اساسی",
      quantity: 1.0,
      unit: "صنعت",
      unitPrice: 0.0,
      createdAt: now + 11,
    },
    {
      id: "asset_foolad",
      parentId: "grp_metal_industry",
      name: "فولاد مبارکه اصفهان (فولاد)",
      quantity: 40_000.0,
      unit: "سهم",
      unitPrice: 6_200.0,
      createdAt: now + 12,
    },
    {
      id: "asset_femelli",
      parentId: "grp_metal_industry",
      name: "ملی صنایع مس ایران (فملی)",
      quantity: 25_000.0,
      unit: "سهم",
      unitPrice: 7_800.0,
      createdAt: now + 13,
    },
    {
      id: "grp_oil_industry",
      parentId: "grp_stocks",
      name: "فرآورده‌های نفتی و پتروشیمی",
      quantity: 1.0,
      unit: "صنعت",
      unitPrice: 0.0,
      createdAt: now + 14,
    },
    {
      id: "asset_shetran",
      parentId: "grp_oil_industry",
      name: "پالایش نفت تهران (شتران)",
      quantity: 50_000.0,
      unit: "سهم",
      unitPrice: 4_400.0,
      createdAt: now + 15,
    },

    // 3. صندوق‌های سرمایه‌گذاری (ETF)
    {
      id: "grp_funds",
      parentId: ROOT_NODE_ID,
      name: "صندوق‌های سرمایه‌گذاری (ETF)",
      quantity: 1.0,
      unit: "گروه",
      unitPrice: 0.0,
      createdAt: now + 20,
    },
    {
      id: "asset_gold_fund",
      parentId: "grp_funds",
      name: "صندوق طلای کهربا (کهربا)",
      quantity: 15_000.0,
      unit: "واحد",
      unitPrice: 185_000.0,
      createdAt: now + 21,
    },
    {
      id: "asset_fixed_fund",
      parentId: "grp_funds",
      name: "صندوق درآمد ثابت افران",
      quantity: 20_000.0,
      unit: "واحد",
      unitPrice: 105_000.0,
      createdAt: now + 22,
    },

    // 4. کالاهای اساسی و فیزیکی
    {
      id: "grp_commodities",
      parentId: ROOT_NODE_ID,
      name: "کالاهای فیزیکی و فلزات صنعتی",
      quantity: 1.0,
      unit: "گروه",
      unitPrice: 0.0,
      createdAt: now + 30,
    },
    {
      id: "asset_silver",
      parentId: "grp_commodities",
      name: "شمش نقره ۹۹۹",
      quantity: 500.0,
      unit: "گرم",
      unitPrice: 650_000.0,
      createdAt: now + 31,
    },
    {
      id: "asset_copper_cathode",
      parentId: "grp_commodities",
      name: "کاتد مس بورس کالا",
      quantity: 1_000.0,
      unit: "کیلوگرم",
      unitPrice: 5_400_000.0,
      createdAt: now + 32,
    },

    // 5. املاک و مستغلات
    {
      id: "grp_real_estate",
      parentId: ROOT_NODE_ID,
      name: "املاک و دارایی‌های فیزیکی",
      quantity: 1.0,
      unit: "گروه",
      unitPrice: 0.0,
      createdAt: now + 40,
    },
    {
      id: "asset_apartment",
      parentId: "grp_real_estate",
      name: "آپارتمان مسکونی سعادت‌آباد",
      quantity: 1.0,
      unit: "واحد",
      unitPrice: 75_000_000_000.0,
      createdAt: now + 41,
    },

    // 6. وجوه نقد، ارز و کریپتو
    {
      id: "grp_cash_forex",
      parentId: ROOT_NODE_ID,
      name: "ارز، تتر و نقدینگی",
      quantity: 1.0,
      unit: "گروه",
      unitPrice: 0.0,
      createdAt: now + 50,
    },
    {
      id: "asset_usd",
      parentId: "grp_cash_forex",
      name: "دلار آمریکا (اسکناس)",
      quantity: 3_500.0,
      unit: "دلار",
      unitPrice: 880_000.0,
      createdAt: now + 51,
    },
    {
      id: "asset_tether",
      parentId: "grp_cash_forex",
      name: "تتر دیجیتال (USDT)",
      quantity: 2_000.0,
      unit: "USDT",
      unitPrice: 885_000.0,
      createdAt: now + 52,
    },
  ];
}

export function getDefaultSymbolBook(): SymbolEntryEntity[] {
  const now = Date.now();
  return [
    // فلزات اساسی
    { rawSymbol: "فولاد", canonicalName: "فولاد مبارکه اصفهان", industry: "فلزات اساسی", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "فملی", canonicalName: "ملی صنایع مس ایران", industry: "فلزات اساسی", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "ذوب", canonicalName: "سهامی ذوب آهن اصفهان", industry: "فلزات اساسی", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "کاوه", canonicalName: "فولاد کاوه جنوب کیش", industry: "فلزات اساسی", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "فخوز", canonicalName: "فولاد خوزستان", industry: "فلزات اساسی", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "فاسمین", canonicalName: "کالسیمین", industry: "فلزات اساسی", source: "TSETMC", lastUpdated: now, assetType: "" },

    // پتروشیمی و پالایش
    { rawSymbol: "شتران", canonicalName: "پالایش نفت تهران", industry: "فرآورده‌های نفتی", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "شپنا", canonicalName: "پالایش نفت اصفهان", industry: "فرآورده‌های نفتی", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "شبندر", canonicalName: "پالایش نفت بندرعباس", industry: "فرآورده‌های نفتی", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "شبریز", canonicalName: "پالایش نفت تبریز", industry: "فرآورده‌های نفتی", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "فارس", canonicalName: "صنایع پتروشیمی خلیج فارس", industry: "محصولات شیمیایی", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "نوری", canonicalName: "پتروشیمی نوری", industry: "محصولات شیمیایی", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "بوعلی", canonicalName: "پتروشیمی بوعلی سینا", industry: "محصولات شیمیایی", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "زاگرس", canonicalName: "پتروشیمی زاگرس", industry: "محصولات شیمیایی", source: "TSETMC", lastUpdated: now, assetType: "" },

    // خودرو و ساخت قطعات
    { rawSymbol: "خودرو", canonicalName: "ایران خودرو", industry: "خودرو و قطعات", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "خساپا", canonicalName: "سایپا", industry: "خودرو و قطعات", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "خگستر", canonicalName: "گسترش سرمایه‌گذاری ایران خودرو", industry: "خودرو و قطعات", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "خبهمن", canonicalName: "گروه بهمن", industry: "خودرو و قطعات", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "خپارس", canonicalName: "پارس خودرو", industry: "خودرو و قطعات", source: "TSETMC", lastUpdated: now, assetType: "" },

    // بانک‌ها و موسسات اعتباری
    { rawSymbol: "وبملت", canonicalName: "بانک ملت", industry: "بانک‌ها و موسسات اعتباری", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "وتجارت", canonicalName: "بانک تجارت", industry: "بانک‌ها و موسسات اعتباری", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "وبصادر", canonicalName: "بانک صادرات ایران", industry: "بانک‌ها و موسسات اعتباری", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "وپاسار", canonicalName: "بانک پاسارگاد", industry: "بانک‌ها و موسسات اعتباری", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "وسینا", canonicalName: "بانک سینا", industry: "بانک‌ها و موسسات اعتباری", source: "TSETMC", lastUpdated: now, assetType: "" },

    // صندوق‌های طلا و اهرمی
    { rawSymbol: "طلا", canonicalName: "صندوق طلای لوتوس", industry: "صندوق‌های سرمایه‌گذاری طلا", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "عیار", canonicalName: "صندوق طلای عیار مفید", industry: "صندوق‌های سرمایه‌گذاری طلا", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "کهربا", canonicalName: "صندوق طلای کهربا", industry: "صندوق‌های سرمایه‌گذاری طلا", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "زر", canonicalName: "صندوق طلای زرین آگاه", industry: "صندوق‌های سرمایه‌گذاری طلا", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "اهرم", canonicalName: "صندوق اهرمی کاریزما", industry: "صندوق‌های سرمایه‌گذاری اهرمی", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "شتاب", canonicalName: "صندوق اهرمی شتاب", industry: "صندوق‌های سرمایه‌گذاری اهرمی", source: "TSETMC", lastUpdated: now, assetType: "" },
    { rawSymbol: "موج", canonicalName: "صندوق اهرمی موج", industry: "صندوق‌های سرمایه‌گذاری اهرمی", source: "TSETMC", lastUpdated: now, assetType: "" },

    // ارز و دارایی دیجیتال
    { rawSymbol: "USDT", canonicalName: "تتر دیجیتال", industry: "ارز و دارایی‌های دیجیتال", source: "MANUAL", lastUpdated: now, assetType: "" },
    { rawSymbol: "BTC", canonicalName: "بیت‌کوین", industry: "ارز و دارایی‌های دیجیتال", source: "MANUAL", lastUpdated: now, assetType: "" },
    { rawSymbol: "USD", canonicalName: "دلار آمریکا", industry: "ارز و دارایی‌های دیجیتال", source: "MANUAL", lastUpdated: now, assetType: "" },
    { rawSymbol: "EUR", canonicalName: "یورو اروپا", industry: "ارز و دارایی‌های دیجیتال", source: "MANUAL", lastUpdated: now, assetType: "" },
  ];
}
