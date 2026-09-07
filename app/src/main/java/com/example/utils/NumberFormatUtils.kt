package com.example.utils

import com.example.data.model.CurrencyUnit
import com.example.data.model.DisplaySettings
import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.util.Locale
import kotlin.math.abs
import kotlin.math.roundToLong

object NumberFormatUtils {

    private val PERSIAN_DIGITS = charArrayOf('۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹')

    fun toPersianDigits(input: String): String {
        val builder = StringBuilder()
        for (ch in input) {
            if (ch in '0'..'9') {
                builder.append(PERSIAN_DIGITS[ch - '0'])
            } else {
                builder.append(ch)
            }
        }
        return builder.toString()
    }

    fun toPersianDigits(input: Number): String {
        return toPersianDigits(input.toString())
    }

    fun formatNumberWithCommas(
        value: Double?,
        usePersianDigits: Boolean = true,
        maxFractionDigits: Int = 2
    ): String {
        if (value == null || value.isNaN()) return if (usePersianDigits) "۰" else "0"

        val symbols = DecimalFormatSymbols(Locale.US).apply {
            groupingSeparator = ','
            decimalSeparator = '.'
        }
        val pattern = if (value % 1.0 == 0.0) "#,###" else "#,##0.##"
        val df = DecimalFormat(pattern, symbols).apply {
            maximumFractionDigits = maxFractionDigits
        }
        val formatted = df.format(value)
        return if (usePersianDigits) toPersianDigits(formatted).replace(',', '،') else formatted
    }

    fun formatCurrency(
        amountInRials: Double,
        unit: CurrencyUnit = CurrencyUnit.TOMAN,
        compact: Boolean = false,
        usePersianDigits: Boolean = true,
        privacyMode: Boolean = false
    ): String {
        val unitSuffix = if (unit == CurrencyUnit.TOMAN) "تومان" else "ریال"
        if (privacyMode) {
            return "•••••• $unitSuffix"
        }

        if (amountInRials.isNaN() || amountInRials == 0.0) {
            return if (usePersianDigits) "۰ $unitSuffix" else "0 $unitSuffix"
        }

        val isToman = unit == CurrencyUnit.TOMAN
        val displayAmount = if (isToman) amountInRials / 10.0 else amountInRials

        if (!compact) {
            val rounded = displayAmount.roundToLong().toDouble()
            val formattedNum = formatNumberWithCommas(rounded, usePersianDigits, 0)
            return "$formattedNum $unitSuffix"
        }

        // Compact notation: همت (هزار میلیارد), م.م.ت (میلیارد تومان), م.ت (میلیون تومان), ه.ت (هزار تومان)
        val absAmount = abs(displayAmount)
        return when {
            absAmount >= 1_000_000_000_000.0 -> {
                val valInHemmat = displayAmount / 1_000_000_000_000.0
                val formatted = String.format(Locale.US, "%.2f", valInHemmat).trimEnd('0').trimEnd('.')
                val finalNum = if (usePersianDigits) toPersianDigits(formatted) else formatted
                val label = if (isToman) "همت" else "هزار م.م.ر"
                "$finalNum $label"
            }
            absAmount >= 1_000_000_000.0 -> {
                val valInBillion = displayAmount / 1_000_000_000.0
                val formatted = String.format(Locale.US, "%.1f", valInBillion).trimEnd('0').trimEnd('.')
                val finalNum = if (usePersianDigits) toPersianDigits(formatted) else formatted
                val label = if (isToman) "م.م.ت" else "م.م.ر"
                "$finalNum $label"
            }
            absAmount >= 1_000_000.0 -> {
                val valInMillion = displayAmount / 1_000_000.0
                val formatted = String.format(Locale.US, "%.1f", valInMillion).trimEnd('0').trimEnd('.')
                val finalNum = if (usePersianDigits) toPersianDigits(formatted) else formatted
                val label = if (isToman) "م.ت" else "م.ر"
                "$finalNum $label"
            }
            absAmount >= 1_000.0 -> {
                val valInThousand = displayAmount / 1_000.0
                val formatted = String.format(Locale.US, "%.0f", valInThousand)
                val finalNum = if (usePersianDigits) toPersianDigits(formatted) else formatted
                val label = if (isToman) "ه.ت" else "ه.ر"
                "$finalNum $label"
            }
            else -> {
                val formatted = formatNumberWithCommas(displayAmount, usePersianDigits, 0)
                "$formatted $unitSuffix"
            }
        }
    }

    fun formatCompactAbbreviation(
        amountInRials: Double,
        unit: CurrencyUnit = CurrencyUnit.TOMAN,
        usePersianDigits: Boolean = true,
        privacyMode: Boolean = false
    ): String {
        if (privacyMode) return "••••••"
        return formatCurrency(amountInRials, unit, compact = true, usePersianDigits = usePersianDigits, privacyMode = false)
    }

    fun formatPercentage(
        percent: Double,
        decimalPlaces: Int = 1,
        usePersianDigits: Boolean = true
    ): String {
        if (percent.isNaN() || percent == 0.0) {
            val zero = if (decimalPlaces == 0) "0" else String.format(Locale.US, "%.${decimalPlaces}f", 0.0)
            val res = if (usePersianDigits) toPersianDigits(zero) else zero
            return "$res٪"
        }
        val formatted = String.format(Locale.US, "%.${decimalPlaces}f", percent)
        val res = if (usePersianDigits) toPersianDigits(formatted).replace('.', '/') else formatted
        return "$res٪"
    }

    /**
     * Builds slash-separated inline stats based on user display settings:
     * e.g., "۲۵.۴٪ کل / ۴۰.۲٪ گروه / ۱۵.۲ م.ت"
     */
    fun formatNodeMetricsSlashSeparated(
        totalValue: Double,
        percentOfTotal: Double,
        percentOfGroup: Double,
        isRoot: Boolean,
        settings: DisplaySettings
    ): String {
        val parts = mutableListOf<String>()

        if (settings.showPercentOfTotal && !isRoot) {
            parts.add("${formatPercentage(percentOfTotal, settings.decimalPlaces, settings.usePersianDigits)} از کل")
        } else if (settings.showPercentOfTotal && isRoot) {
            parts.add("۱۰۰٪ کل")
        }

        if (settings.showPercentOfGroup && !isRoot) {
            parts.add("${formatPercentage(percentOfGroup, settings.decimalPlaces, settings.usePersianDigits)} از گروه")
        }

        if (settings.showTotalValue) {
            parts.add(formatCompactAbbreviation(totalValue, settings.currencyUnit, settings.usePersianDigits, privacyMode = settings.privacyMode))
        }

        return parts.joinToString(separator = " / ")
    }

    data class FormattedNodeLabel(
        val percentTotalText: String?,
        val percentGroupText: String?,
        val valueText: String?
    )

    fun formatNodeLabelParts(
        totalValue: Double,
        percentOfTotal: Double,
        percentOfGroup: Double,
        isRoot: Boolean,
        settings: DisplaySettings
    ): FormattedNodeLabel {
        val pTotalText = if (settings.showPercentOfTotal) {
            val pVal = if (isRoot) 100.0 else percentOfTotal
            "${formatPercentage(pVal, settings.decimalPlaces, settings.usePersianDigits)} از کل"
        } else null

        val pGroupText = if (settings.showPercentOfGroup && !isRoot) {
            "${formatPercentage(percentOfGroup, settings.decimalPlaces, settings.usePersianDigits)} از گروه"
        } else null

        val valText = if (settings.showTotalValue) {
            formatCurrency(
                totalValue,
                settings.currencyUnit,
                settings.compactCurrency,
                settings.usePersianDigits,
                privacyMode = settings.privacyMode
            )
        } else null

        return FormattedNodeLabel(pTotalText, pGroupText, valText)
    }
}
