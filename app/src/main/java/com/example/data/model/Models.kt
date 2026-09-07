package com.example.data.model

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "stored_nodes",
    indices = [Index(value = ["parentId"])]
)
data class StoredNodeEntity(
    @PrimaryKey val id: String,
    val parentId: String?,
    val name: String,
    val quantity: Double,
    val unit: String,
    val unitPrice: Double,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long? = null,
    val categoryTag: String? = null
)

@Entity(tableName = "symbol_book")
data class SymbolEntryEntity(
    @PrimaryKey val rawSymbol: String,
    val canonicalName: String,
    val industry: String,
    val source: String = "MANUAL", // MANUAL, TSETMC, COMPANY_NAME
    val lastUpdated: Long = System.currentTimeMillis(),
    val assetType: String = ""
)

data class UndoSnapshot(
    val id: String = java.util.UUID.randomUUID().toString(),
    val title: String,
    val timestamp: Long = System.currentTimeMillis(),
    val nodeCount: Int,
    val nodes: List<StoredNodeEntity>
)

data class CalculatedNode(
    val id: String,
    val parentId: String?,
    val name: String,
    val quantity: Double,
    val unit: String,
    val unitPrice: Double,
    val totalValue: Double,
    val percentOfTotal: Double = 0.0,
    val percentOfGroup: Double = 0.0,
    val isGroup: Boolean = false,
    val children: List<CalculatedNode> = emptyList(),
    val depth: Int = 0,
    val childCount: Int = 0,
    val createdAt: Long = 0L,
    val updatedAt: Long? = null,
    val categoryTag: String? = null
)

enum class CurrencyUnit(val labelFa: String) {
    TOMAN("تومان"),
    RIAL("ریال")
}

enum class ThemeMode(val labelFa: String, val subtitleFa: String) {
    SYSTEM("پیروی از سیستم", "هماهنگ با تم تاریک/روشن گوشی"),
    DARK("حالت شب (دارک)", "پس‌زمینه مشکی AMOLED با مصرف باتری بهینه"),
    LIGHT("حالت روز (روشن)", "پس‌زمینه روشن با کنتراست بالا")
}

enum class AppFontSize(val labelFa: String, val scaleFactor: Float) {
    SMALL("کوچک", 0.88f),
    STANDARD("استاندارد", 1.0f),
    LARGE("بزرگ", 1.15f),
    EXTRA_LARGE("خیلی بزرگ", 1.30f)
}


enum class AppViewMode(val titleFa: String) {
    TREEMAP("نقشه دارایی"),
    CLASSIC_TREE("درختی کلاسیک"),
    TREE("درختی مدرن"),
    CHART("خورشیدی"),
    BAR_CHART("میله ای"),
    PIE_CHART("دایره ای"),
    ANALYTICS("داشبورد")
}

data class DisplaySettings(
    val showPercentOfTotal: Boolean = true,
    val showPercentOfGroup: Boolean = true,
    val showTotalValue: Boolean = true,
    val decimalPlaces: Int = 1,
    val compactCurrency: Boolean = true,
    val currencyUnit: CurrencyUnit = CurrencyUnit.TOMAN,
    val usePersianDigits: Boolean = true,
    val themeMode: ThemeMode = ThemeMode.SYSTEM,
    val privacyMode: Boolean = false,
    val fontSize: AppFontSize = AppFontSize.STANDARD,
    val customAppColor: Long = 0xFF005FB1,
    val customViewOrder: List<AppViewMode> = listOf(
        AppViewMode.TREEMAP,
        AppViewMode.CLASSIC_TREE,
        AppViewMode.TREE,
        AppViewMode.CHART,
        AppViewMode.BAR_CHART,
        AppViewMode.PIE_CHART,
        AppViewMode.ANALYTICS
    ),
    val customAssetColors: Map<String, Long> = emptyMap()
)

enum class SortField(val labelFa: String) {
    TOTAL_VALUE("ارزش کل"),
    NAME("نام دارایی"),
    QUANTITY("تعداد / مقدار"),
    UNIT_PRICE("قیمت واحد"),
    PERCENT_OF_TOTAL("درصد از کل"),
    PERCENT_OF_GROUP("درصد از هم‌گروه")
}

enum class SortDirection {
    ASC, DESC
}

data class SortConfig(
    val field: SortField = SortField.TOTAL_VALUE,
    val direction: SortDirection = SortDirection.DESC
)

enum class BourseAnomalyType(val labelFa: String, val descriptionFa: String) {
    STANDARD("سالم", "اطلاعات سهم بدون ناهنجاری است"),
    TABEI_OPTION("اختیار معامله / تبعی", "اوراق اختیار معامله یا ارزش اسمی ۱ ریالی"),
    ZERO_VALUE("ارزش صفر", "ارزش کل صفر ریال در سامانه ثبت شده است"),
    PENDING_CAPITAL_INCREASE("افزایش سرمایه در جریان", "تعداد کل با تعداد قابل معامله مغایرت دارد")
}

data class RawBourseRow(
    val symbolRaw: String,
    val quantity: Double,
    val totalRialValue: Double,
    val companyName: String? = null,
    val assetType: String? = null,
    val tradeableQuantity: Double? = null,
    val broker: String? = null,
    val status: String? = null,
    val rawRowNumber: Int = 0
)

data class ParsedImportRow(
    val id: String,
    val raw: RawBourseRow,
    val canonicalName: String,
    val industry: String,
    val unitPriceCalculated: Double,
    val anomalyType: BourseAnomalyType,
    val anomalyDescription: String,
    val isDuplicateInTree: Boolean,
    val matchedExistingNodeId: String? = null,
    val matchedExistingNodeName: String? = null,
    val existingQuantity: Double? = null,
    val existingUnitPrice: Double? = null,
    var selected: Boolean = true,
    var duplicateResolution: DuplicateResolution = DuplicateResolution.REPLACE,
    var customCategoryTag: String? = null
)

enum class DuplicateResolution(val labelFa: String) {
    REPLACE("جایگزینی و به‌روزرسانی دارایی موجود"),
    SUM("افزودن به موجودی فعلی (جمع)"),
    NEW_NODE_WITH_TAG("افزودن به عنوان سهم مجزا (با برچسب)"),
    SKIP("صرف‌نظر")
}

data class AbsentTreeNode(
    val id: String,
    val name: String,
    val totalValue: Double,
    val industryName: String? = null
)

data class ImportPlan(
    val standardRows: List<ParsedImportRow>,
    val needsReviewRows: List<ParsedImportRow>,
    val duplicateRows: List<ParsedImportRow>,
    val newSymbolsRows: List<ParsedImportRow>,
    val absentTreeNodes: List<AbsentTreeNode>
)

data class TreeHealth(
    val isValid: Boolean,
    val rootTotal: Double,
    val directChildrenSum: Double,
    val discrepancy: Double,
    val totalNodeCount: Int,
    val zeroValueCount: Int
)
