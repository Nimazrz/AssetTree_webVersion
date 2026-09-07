package com.example.utils

import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color as AndroidColor
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.widget.Toast
import androidx.compose.ui.graphics.toArgb
import androidx.core.content.FileProvider
import com.example.data.model.CalculatedNode
import com.example.data.model.DisplaySettings
import java.io.File
import java.io.FileOutputStream
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin




enum class PdfChartType(val title: String) {
    TREEMAP("نقشه دارایی (Treemap)"),
    DONUT_SUNBURST("خورشیدی (Sunburst)"),
    STACKED_BAR("میله‌ای انباشته (Stacked Bar)")
}

object PdfReportGenerator {


    /**
     * Generate an infographic PDF report and open the Android Share / View Chooser.
     */
    fun generateAndSharePdf(
        context: Context,
        rootCalculated: CalculatedNode,
        settings: DisplaySettings,
        chartType: PdfChartType = PdfChartType.TREEMAP
    ) {
        try {
            val pdfDocument = PdfDocument()
            
            // Standard A4 dimensions in PostScript points: 595 x 842
            val pageWidth = 595
            val pageHeight = 842
            val pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, 1).create()
            val page = pdfDocument.startPage(pageInfo)
            val canvas = page.canvas

            // 1. Draw Clean Background & Header Card
            drawBackgroundAndHeader(canvas, pageWidth, pageHeight, rootCalculated, settings)

            // 2. Draw Infographic Chart Visual
            val chartTop = 130f
            val chartBottom = 400f
            when (chartType) {
                PdfChartType.TREEMAP -> drawTreemapInfographic(canvas, rootCalculated, settings, chartTop, chartBottom, pageWidth)
                PdfChartType.DONUT_SUNBURST -> drawDonutInfographic(canvas, rootCalculated, settings, chartTop, chartBottom, pageWidth)
                PdfChartType.STACKED_BAR -> drawStackedBarInfographic(canvas, rootCalculated, settings, chartTop, chartBottom, pageWidth)
            }

            // 3. Draw Semantic Color Legend (راهنمای رنگی)
            val legendTop = 410f
            drawColorLegend(canvas, legendTop, pageWidth)

            // 4. Draw Detailed Text & Percentage Metrics Table (گزارش متنی تفصیلی)
            val tableTop = 475f
            drawMetricsTable(canvas, rootCalculated, settings, tableTop, pageWidth, pageHeight)

            pdfDocument.finishPage(page)

            // Write to app cache directory
            val cacheDir = File(context.cacheDir, "reports")
            if (!cacheDir.exists()) {
                cacheDir.mkdirs()
            }
            val pdfFile = File(cacheDir, "portfolio_infographic_report.pdf")
            val outputStream = FileOutputStream(pdfFile)
            pdfDocument.writeTo(outputStream)
            outputStream.flush()
            outputStream.close()
            pdfDocument.close()

            // Share / Open PDF Intent
            val contentUri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                pdfFile
            )

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "application/pdf"
                putExtra(Intent.EXTRA_STREAM, contentUri)
                putExtra(Intent.EXTRA_SUBJECT, "گزارش سبد دارایی و سرمایه‌گذاری")
                putExtra(Intent.EXTRA_TEXT, "گزارش اینفوگرافیک تحلیل سبد دارایی‌ها - ${PersianDateUtils.formatPersianDate(System.currentTimeMillis())}")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            val chooser = Intent.createChooser(shareIntent, "ارسال یا ذخیره گزارش PDF")
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(chooser)

        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(context, "خطا در تولید گزارش PDF: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
        }
    }

    private fun drawBackgroundAndHeader(
        canvas: Canvas,
        pageWidth: Int,
        pageHeight: Int,
        root: CalculatedNode,
        settings: DisplaySettings
    ) {
        // Soft white canvas
        val bgPaint = Paint().apply {
            color = AndroidColor.rgb(248, 250, 252)
            style = Paint.Style.FILL
        }
        canvas.drawRect(0f, 0f, pageWidth.toFloat(), pageHeight.toFloat(), bgPaint)

        // Header Background Banner
        val headerPaint = Paint().apply {
            color = AndroidColor.rgb(15, 23, 42) // Dark Slate Navy
            style = Paint.Style.FILL
        }
        canvas.drawRoundRect(RectF(20f, 20f, pageWidth - 20f, 115f), 12f, 12f, headerPaint)

        // Title
        val titlePaint = Paint().apply {
            color = AndroidColor.WHITE
            textSize = 18f
            typeface = Typeface.DEFAULT_BOLD
            isAntiAlias = true
            textAlign = Paint.Align.RIGHT
        }
        canvas.drawText("گزارش تحلیلی و اینفوگرافیک سبد دارایی‌ها", pageWidth - 40f, 52f, titlePaint)

        // Date & Time subtitle
        val datePaint = Paint().apply {
            color = AndroidColor.rgb(148, 163, 184)
            textSize = 10f
            typeface = Typeface.DEFAULT
            isAntiAlias = true
            textAlign = Paint.Align.RIGHT
        }
        val dateStr = "تاریخ و زمان گزارش: ${PersianDateUtils.formatPersianDate(System.currentTimeMillis())}"
        canvas.drawText(dateStr, pageWidth - 40f, 75f, datePaint)

        // Total Portfolio Value Banner (Left side in header)
        val valueTitlePaint = Paint().apply {
            color = AndroidColor.rgb(148, 163, 184)
            textSize = 9.5f
            typeface = Typeface.DEFAULT
            isAntiAlias = true
            textAlign = Paint.Align.LEFT
        }
        canvas.drawText("مجموع ارزش دارایی‌ها", 40f, 50f, valueTitlePaint)

        val totalValueStr = NumberFormatUtils.formatCurrency(
            root.totalValue,
            settings.currencyUnit,
            compact = false,
            usePersianDigits = settings.usePersianDigits,
            privacyMode = settings.privacyMode
        )
        val valuePaint = Paint().apply {
            color = AndroidColor.rgb(52, 211, 153) // Mint Green
            textSize = 15f
            typeface = Typeface.DEFAULT_BOLD
            isAntiAlias = true
            textAlign = Paint.Align.LEFT
        }
        canvas.drawText(totalValueStr, 40f, 75f, valuePaint)
    }

    private fun drawTreemapInfographic(
        canvas: Canvas,
        root: CalculatedNode,
        settings: DisplaySettings,
        top: Float,
        bottom: Float,
        pageWidth: Int
    ) {
        val left = 20f
        val right = pageWidth - 20f
        val width = right - left
        val height = bottom - top

        val groups = root.children.filter { it.totalValue > 0 }.sortedByDescending { it.totalValue }
        val totalVal = root.totalValue
        if (totalVal <= 0.0 || groups.isEmpty()) return

        val containerRect = RectF(left, top, right, bottom)

        // Draw Container frame
        val framePaint = Paint().apply {
            color = AndroidColor.rgb(226, 232, 240)
            style = Paint.Style.STROKE
            strokeWidth = 2f
        }
        canvas.drawRoundRect(containerRect, 8f, 8f, framePaint)

        // Proportional Slice-and-dice layout for PDF
        var curX = left
        var curY = top
        var remainingW = width
        var remainingH = height
        var remainingVal = totalVal

        groups.forEachIndexed { index, group ->
            if (remainingVal <= 0.0) return@forEachIndexed
            val ratio = (group.totalValue / remainingVal).toFloat().coerceIn(0.01f, 1.0f)
            val isHorizontal = remainingW >= remainingH

            val itemRect: RectF
            if (isHorizontal) {
                val itemW = remainingW * ratio
                itemRect = RectF(curX, curY, curX + itemW, curY + remainingH)
                curX += itemW
                remainingW -= itemW
            } else {
                val itemH = remainingH * ratio
                itemRect = RectF(curX, curY, curX + remainingW, curY + itemH)
                curY += itemH
                remainingH -= itemH
            }
            remainingVal -= group.totalValue

            val palette = AssetColorUtils.getPaletteForNode(group.name, group.categoryTag)
            val fillPaint = Paint().apply {
                color = palette.primary.toArgb()
                style = Paint.Style.FILL
                isAntiAlias = true
            }
            canvas.drawRoundRect(itemRect, 4f, 4f, fillPaint)

            // Border
            val borderPaint = Paint().apply {
                color = AndroidColor.WHITE
                style = Paint.Style.STROKE
                strokeWidth = 2f
                isAntiAlias = true
            }
            canvas.drawRoundRect(itemRect, 4f, 4f, borderPaint)

            // Text inside box if big enough
            if (itemRect.width() > 40 && itemRect.height() > 25) {
                val textPaint = Paint().apply {
                    color = AndroidColor.WHITE
                    textSize = if (itemRect.width() > 70 && itemRect.height() > 45) 11f else 8.5f
                    typeface = Typeface.DEFAULT_BOLD
                    isAntiAlias = true
                    textAlign = Paint.Align.CENTER
                    setShadowLayer(2f, 0f, 1f, AndroidColor.BLACK)
                }
                val pctStr = NumberFormatUtils.formatPercentage(group.percentOfTotal, 1, settings.usePersianDigits)
                canvas.drawText(group.name.take(8), itemRect.centerX(), itemRect.centerY() - 2f, textPaint)
                canvas.drawText(pctStr, itemRect.centerX(), itemRect.centerY() + 11f, textPaint)
            }
        }
    }

    private fun drawDonutInfographic(
        canvas: Canvas,
        root: CalculatedNode,
        settings: DisplaySettings,
        top: Float,
        bottom: Float,
        pageWidth: Int
    ) {
        val centerX = pageWidth / 2f
        val centerY = (top + bottom) / 2f
        val outerRadius = (bottom - top) / 2f * 0.92f
        val innerRadius = outerRadius * 0.48f

        val groups = root.children.filter { it.totalValue > 0 }.sortedByDescending { it.totalValue }
        val totalVal = root.totalValue
        if (totalVal <= 0.0 || groups.isEmpty()) return

        var startAngle = -90f
        val oval = RectF(centerX - outerRadius, centerY - outerRadius, centerX + outerRadius, centerY + outerRadius)

        groups.forEach { group ->
            val sweep = ((group.totalValue / totalVal) * 360f).toFloat()
            val palette = AssetColorUtils.getPaletteForNode(group.name, group.categoryTag)

            val slicePaint = Paint().apply {
                color = palette.primary.toArgb()
                style = Paint.Style.FILL
                isAntiAlias = true
            }
            canvas.drawArc(oval, startAngle, sweep, true, slicePaint)

            // White dividing line
            val strokePaint = Paint().apply {
                color = AndroidColor.WHITE
                style = Paint.Style.STROKE
                strokeWidth = 2.5f
                isAntiAlias = true
            }
            canvas.drawArc(oval, startAngle, sweep, true, strokePaint)

            startAngle += sweep
        }

        // Inner White Donut Hole
        val holePaint = Paint().apply {
            color = AndroidColor.WHITE
            style = Paint.Style.FILL
            isAntiAlias = true
        }
        canvas.drawCircle(centerX, centerY, innerRadius, holePaint)

        val holeBorderPaint = Paint().apply {
            color = AndroidColor.rgb(203, 213, 225)
            style = Paint.Style.STROKE
            strokeWidth = 1.5f
            isAntiAlias = true
        }
        canvas.drawCircle(centerX, centerY, innerRadius, holeBorderPaint)

        // Center Text
        val centerTextPaint = Paint().apply {
            color = AndroidColor.rgb(15, 23, 42)
            textSize = 10f
            typeface = Typeface.DEFAULT_BOLD
            isAntiAlias = true
            textAlign = Paint.Align.CENTER
        }
        canvas.drawText("مجموع کل", centerX, centerY - 2f, centerTextPaint)

        val centerSubTextPaint = Paint().apply {
            color = AndroidColor.rgb(16, 185, 129)
            textSize = 9.5f
            typeface = Typeface.DEFAULT_BOLD
            isAntiAlias = true
            textAlign = Paint.Align.CENTER
        }
        canvas.drawText("۱۰۰٪", centerX, centerY + 12f, centerSubTextPaint)
    }

    private fun drawStackedBarInfographic(
        canvas: Canvas,
        root: CalculatedNode,
        settings: DisplaySettings,
        top: Float,
        bottom: Float,
        pageWidth: Int
    ) {
        val left = 30f
        val right = pageWidth - 30f
        val width = right - left

        val groups = root.children.filter { it.totalValue > 0 }.sortedByDescending { it.totalValue }.take(6)
        if (groups.isEmpty()) return

        val barHeight = 22f
        val spacing = 20f
        var curY = top + 10f

        groups.forEach { group ->
            val palette = AssetColorUtils.getPaletteForNode(group.name, group.categoryTag)

            // Label & Percent
            val labelPaint = Paint().apply {
                color = AndroidColor.rgb(15, 23, 42)
                textSize = 9.5f
                typeface = Typeface.DEFAULT_BOLD
                isAntiAlias = true
                textAlign = Paint.Align.RIGHT
            }
            canvas.drawText(group.name, right, curY + 12f, labelPaint)

            val pctStr = NumberFormatUtils.formatPercentage(group.percentOfTotal, 1, settings.usePersianDigits)
            val pctPaint = Paint().apply {
                color = palette.primary.toArgb()
                textSize = 9.5f
                typeface = Typeface.DEFAULT_BOLD
                isAntiAlias = true
                textAlign = Paint.Align.LEFT
            }
            canvas.drawText(pctStr, left, curY + 12f, pctPaint)

            curY += 16f

            // Full width background bar
            val bgBarRect = RectF(left, curY, right, curY + barHeight)
            val bgBarPaint = Paint().apply {
                color = AndroidColor.rgb(226, 232, 240)
                style = Paint.Style.FILL
                isAntiAlias = true
            }
            canvas.drawRoundRect(bgBarRect, 4f, 4f, bgBarPaint)

            // Foreground Fill Bar
            val fillW = width * (group.percentOfTotal / 100f).toFloat().coerceIn(0.02f, 1f)
            val fillBarRect = RectF(right - fillW, curY, right, curY + barHeight)
            val fillBarPaint = Paint().apply {
                color = palette.primary.toArgb()
                style = Paint.Style.FILL
                isAntiAlias = true
            }
            canvas.drawRoundRect(fillBarRect, 4f, 4f, fillBarPaint)

            curY += barHeight + spacing
        }
    }

    private fun drawColorLegend(canvas: Canvas, top: Float, pageWidth: Int) {
        val left = 20f
        val right = pageWidth - 20f

        // Legend Container
        val legendCard = RectF(left, top, right, top + 55f)
        val cardPaint = Paint().apply {
            color = AndroidColor.WHITE
            style = Paint.Style.FILL
            isAntiAlias = true
        }
        canvas.drawRoundRect(legendCard, 8f, 8f, cardPaint)

        val borderPaint = Paint().apply {
            color = AndroidColor.rgb(226, 232, 240)
            style = Paint.Style.STROKE
            strokeWidth = 1f
            isAntiAlias = true
        }
        canvas.drawRoundRect(legendCard, 8f, 8f, borderPaint)

        val titlePaint = Paint().apply {
            color = AndroidColor.rgb(71, 85, 105)
            textSize = 9.5f
            typeface = Typeface.DEFAULT_BOLD
            isAntiAlias = true
            textAlign = Paint.Align.RIGHT
        }
        canvas.drawText("راهنمای رنگ‌بندی موضوعی دارایی‌ها:", right - 12f, top + 16f, titlePaint)

        val items = AssetColorUtils.MAIN_LEGEND_ITEMS
        val cols = 4
        val colWidth = (right - left - 24f) / cols

        items.forEachIndexed { index, item ->
            val row = index / cols
            val col = index % cols
            val itemX = right - 12f - (col * colWidth)
            val itemY = top + 32f + (row * 16f)

            // Circle indicator
            val dotPaint = Paint().apply {
                color = item.color.toArgb()
                style = Paint.Style.FILL
                isAntiAlias = true
            }
            canvas.drawCircle(itemX - 5f, itemY - 3.5f, 4f, dotPaint)

            // Item Name
            val namePaint = Paint().apply {
                color = AndroidColor.rgb(51, 65, 85)
                textSize = 8f
                typeface = Typeface.DEFAULT
                isAntiAlias = true
                textAlign = Paint.Align.RIGHT
            }
            canvas.drawText(item.title, itemX - 12f, itemY, namePaint)
        }
    }

    private fun drawMetricsTable(
        canvas: Canvas,
        root: CalculatedNode,
        settings: DisplaySettings,
        top: Float,
        pageWidth: Int,
        pageHeight: Int
    ) {
        val left = 20f
        val right = pageWidth - 20f

        // Table Container Header
        val headerRect = RectF(left, top, right, top + 26f)
        val headerPaint = Paint().apply {
            color = AndroidColor.rgb(30, 41, 59) // Slate 800
            style = Paint.Style.FILL
            isAntiAlias = true
        }
        canvas.drawRoundRect(headerRect, 6f, 6f, headerPaint)

        val thPaint = Paint().apply {
            color = AndroidColor.WHITE
            textSize = 9.5f
            typeface = Typeface.DEFAULT_BOLD
            isAntiAlias = true
        }

        thPaint.textAlign = Paint.Align.RIGHT
        canvas.drawText("نام دارایی / دسته", right - 15f, top + 17f, thPaint)

        thPaint.textAlign = Paint.Align.CENTER
        canvas.drawText("درصد از کل", right - 180f, top + 17f, thPaint)

        thPaint.textAlign = Paint.Align.LEFT
        canvas.drawText("ارزش (${settings.currencyUnit.labelFa})", left + 15f, top + 17f, thPaint)

        // Flatten top nodes for the report table
        val flatList = mutableListOf<CalculatedNode>()
        fun collectNodes(node: CalculatedNode) {
            node.children.forEach { child ->
                flatList.add(child)
                if (child.children.isNotEmpty()) {
                    collectNodes(child)
                }
            }
        }
        collectNodes(root)

        var curY = top + 42f
        val rowHeight = 20f
        val maxRows = 16

        val rowsToDraw = flatList.sortedByDescending { it.totalValue }.take(maxRows)

        rowsToDraw.forEachIndexed { index, node ->
            if (curY + rowHeight > pageHeight - 20f) return@forEachIndexed

            // Alternating Row Background
            if (index % 2 == 1) {
                val rowBgPaint = Paint().apply {
                    color = AndroidColor.rgb(241, 245, 249)
                    style = Paint.Style.FILL
                }
                canvas.drawRect(left, curY - 12f, right, curY + 6f, rowBgPaint)
            }

            val palette = AssetColorUtils.getPaletteForNode(node.name, node.categoryTag)

            // Category colored dot
            val dotPaint = Paint().apply {
                color = palette.primary.toArgb()
                style = Paint.Style.FILL
                isAntiAlias = true
            }
            val indent = (node.depth - 1) * 8f
            canvas.drawCircle(right - 12f - indent, curY - 3.5f, 3.5f, dotPaint)

            // Asset Name
            val namePaint = Paint().apply {
                color = AndroidColor.rgb(15, 23, 42)
                textSize = 9f
                typeface = if (node.isGroup) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
                isAntiAlias = true
                textAlign = Paint.Align.RIGHT
            }
            canvas.drawText(node.name.take(24), right - 22f - indent, curY, namePaint)

            // Percent of total
            val pctPaint = Paint().apply {
                color = AndroidColor.rgb(16, 185, 129)
                textSize = 9f
                typeface = Typeface.DEFAULT_BOLD
                isAntiAlias = true
                textAlign = Paint.Align.CENTER
            }
            val pctStr = NumberFormatUtils.formatPercentage(node.percentOfTotal, 1, settings.usePersianDigits)
            canvas.drawText(pctStr, right - 180f, curY, pctPaint)

            // Value
            val valPaint = Paint().apply {
                color = AndroidColor.rgb(30, 41, 59)
                textSize = 9f
                typeface = Typeface.DEFAULT_BOLD
                isAntiAlias = true
                textAlign = Paint.Align.LEFT
            }
            val valStr = NumberFormatUtils.formatCurrency(
                node.totalValue,
                settings.currencyUnit,
                compact = false,
                usePersianDigits = settings.usePersianDigits,
                privacyMode = settings.privacyMode
            )
            canvas.drawText(valStr, left + 15f, curY, valPaint)

            curY += rowHeight
        }
    }
}
