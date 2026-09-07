package com.example.ui.views

import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.local.ROOT_NODE_ID
import com.example.data.model.CalculatedNode
import com.example.data.model.DisplaySettings
import com.example.ui.theme.AppTheme
import com.example.ui.components.SharedViewHeader
import com.example.utils.AssetColorUtils
import com.example.utils.NumberFormatUtils
import kotlin.math.*

// Rich vibrant hierarchical color palettes (matching reference image: vivid Green, Amber/Gold, Royal Blue, Rose, Purple, Teal)
private val SUNBURST_PALETTES = listOf(
    // 0: Vibrant Green / Emerald branch (like EMEA in reference)
    listOf(
        Color(0xFF22C55E), Color(0xFF16A34A), Color(0xFF15803D), Color(0xFF4ADE80),
        Color(0xFF86EFAC), Color(0xFF166534), Color(0xFF14532D)
    ),
    // 1: Vivid Amber / Yellow Gold branch (like N/A in reference)
    listOf(
        Color(0xFFEAB308), Color(0xFFF59E0B), Color(0xFFD97706), Color(0xFFFCD34D),
        Color(0xFFFDE68A), Color(0xFFB45309), Color(0xFF78350F)
    ),
    // 2: Royal Blue / Cobalt branch (like APAC in reference)
    listOf(
        Color(0xFF2563EB), Color(0xFF1D4ED8), Color(0xFF1E40AF), Color(0xFF60A5FA),
        Color(0xFF93C5FD), Color(0xFF1E3A8A), Color(0xFF172554)
    ),
    // 3: Vivid Rose / Ruby
    listOf(
        Color(0xFFE11D48), Color(0xFFBE123C), Color(0xFF9F1239), Color(0xFFFB7185),
        Color(0xFFFDA4AF), Color(0xFF881337), Color(0xFF4C0519)
    ),
    // 4: Deep Violet / Purple
    listOf(
        Color(0xFF9333EA), Color(0xFF7E22CE), Color(0xFF6B21A8), Color(0xFFC084FC),
        Color(0xFFE9D5FF), Color(0xFF581C87), Color(0xFF3B0764)
    ),
    // 5: Teal / Cyan
    listOf(
        Color(0xFF0D9488), Color(0xFF0F766E), Color(0xFF115E59), Color(0xFF2DD4BF),
        Color(0xFF99F6E4), Color(0xFF134E4A), Color(0xFF042F2E)
    ),
    // 6: Deep Orange
    listOf(
        Color(0xFFEA580C), Color(0xFFC2410C), Color(0xFF9A3412), Color(0xFFFB923C),
        Color(0xFFFED7AA), Color(0xFF7C2D12), Color(0xFF431407)
    )
)

data class SunburstChartSector(
    val node: CalculatedNode,
    val startAngleDeg: Float,
    val sweepAngleDeg: Float,
    val innerRadiusFraction: Float,
    val outerRadiusFraction: Float,
    val depth: Int,
    val color: Color
)

@Composable
fun SunburstChartView(
    activeView: com.example.data.model.AppViewMode,
    onSelectView: (com.example.data.model.AppViewMode) -> Unit,
    rootNode: CalculatedNode,
    settings: DisplaySettings,
    onSelectNodeDetails: (CalculatedNode) -> Unit
) {
    val colors = AppTheme.colors
    var focusedRootId by remember { mutableStateOf<String?>(null) }
    var selectedSectorNode by remember { mutableStateOf<CalculatedNode?>(null) }

    // Smooth Pan and Zoom State (allows sliding horizontally & vertically across screen)
    var zoomScale by remember { mutableStateOf(1.0f) }
    var panOffsetX by remember { mutableStateOf(0f) }
    var panOffsetY by remember { mutableStateOf(0f) }

    fun findNode(n: CalculatedNode, targetId: String): CalculatedNode? {
        if (n.id == targetId) return n
        for (c in n.children) {
            val f = findNode(c, targetId)
            if (f != null) return f
        }
        return null
    }

    val currentFocusedRoot = remember(rootNode, focusedRootId) {
        if (focusedRootId != null) findNode(rootNode, focusedRootId!!) ?: rootNode else rootNode
    }

    fun getMaxDepth(n: CalculatedNode): Int {
        if (n.children.isEmpty()) return n.depth
        return n.children.maxOf { getMaxDepth(it) }
    }
    val maxTreeDepth = remember(currentFocusedRoot) {
        max(getMaxDepth(currentFocusedRoot) - currentFocusedRoot.depth + 1, 2)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        SharedViewHeader(activeView = activeView, onSelectView = onSelectView, settings = settings, showSearchAndSort = false)

        // Header & Toolbar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(26.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(colors.primaryContainer),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.PieChart,
                        contentDescription = null,
                        tint = colors.primary,
                        modifier = Modifier.size(15.dp)
                    )
                }
                Text(
                    text = "نمودار خورشیدی",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = colors.textPrimary
                )
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                // Zoom Out
                IconButton(
                    onClick = { zoomScale = (zoomScale - 0.25f).coerceIn(0.6f, 3.5f) },
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(Icons.Default.ZoomOut, contentDescription = "کوچک‌نمایی", modifier = Modifier.size(16.dp), tint = colors.textSecondary)
                }

                // Reset zoom & pan
                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = colors.surfaceVariant,
                    modifier = Modifier.clickable {
                        zoomScale = 1.0f
                        panOffsetX = 0f
                        panOffsetY = 0f
                    }
                ) {
                    Text(
                        text = "${NumberFormatUtils.toPersianDigits((zoomScale * 100).toInt())}٪",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.textPrimary,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }

                // Zoom In
                IconButton(
                    onClick = { zoomScale = (zoomScale + 0.25f).coerceIn(0.6f, 3.5f) },
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(Icons.Default.ZoomIn, contentDescription = "بزرگ‌نمایی", modifier = Modifier.size(16.dp), tint = colors.textSecondary)
                }

                if (focusedRootId != null) {
                    FilledTonalButton(
                        onClick = {
                            focusedRootId = null
                            selectedSectorNode = null
                        },
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                        modifier = Modifier.height(28.dp)
                    ) {
                        Text("کل سبد", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Main Sunburst Chart Interactive Card
        var sectorsList by remember { mutableStateOf<List<SunburstChartSector>>(emptyList()) }

        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = colors.surface),
            border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .testTag("card_sunburst_container")
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(16.dp))
                    .pointerInput(currentFocusedRoot, zoomScale, panOffsetX, panOffsetY) {
                        detectTransformGestures { _, pan, zoom, _ ->
                            zoomScale = (zoomScale * zoom).coerceIn(0.6f, 4.0f)
                            panOffsetX += pan.x
                            panOffsetY += pan.y
                        }
                    }
                    .pointerInput(currentFocusedRoot, zoomScale, panOffsetX, panOffsetY, sectorsList) {
                        detectTapGestures(
                            onTap = { tapOffset ->
                                val w = size.width.toFloat()
                                val h = size.height.toFloat()
                                val center = Offset(w / 2f + panOffsetX, h / 2f + panOffsetY)
                                val baseMaxRadius = min(w, h) / 2f * 0.92f * zoomScale
                                val centerHoleRadius = baseMaxRadius * 0.18f

                                val dx = tapOffset.x - center.x
                                val dy = tapOffset.y - center.y
                                val distance = sqrt(dx * dx + dy * dy)

                                // Center hole tapped -> go up one level
                                if (distance <= centerHoleRadius) {
                                    if (focusedRootId != null) {
                                        val parentId = currentFocusedRoot.parentId
                                        focusedRootId = if (parentId != null && parentId != ROOT_NODE_ID) parentId else null
                                        selectedSectorNode = null
                                    } else {
                                        selectedSectorNode = currentFocusedRoot
                                    }
                                    return@detectTapGestures
                                }

                                // Calculate angle (0 to 360 starting from 12 o'clock)
                                var angleRad = atan2(dy, dx)
                                var angleDeg = Math.toDegrees(angleRad.toDouble()).toFloat() + 90f
                                if (angleDeg < 0f) angleDeg += 360f

                                val hit = sectorsList.find { sector ->
                                    val innerR = sector.innerRadiusFraction * baseMaxRadius
                                    val outerR = sector.outerRadiusFraction * baseMaxRadius
                                    val inRadius = distance in innerR..outerR
                                    val inAngle = angleDeg in sector.startAngleDeg..(sector.startAngleDeg + sector.sweepAngleDeg)
                                    inRadius && inAngle
                                }

                                if (hit != null) {
                                    selectedSectorNode = hit.node
                                }
                            },
                            onDoubleTap = { tapOffset ->
                                val w = size.width.toFloat()
                                val h = size.height.toFloat()
                                val center = Offset(w / 2f + panOffsetX, h / 2f + panOffsetY)
                                val baseMaxRadius = min(w, h) / 2f * 0.92f * zoomScale

                                val dx = tapOffset.x - center.x
                                val dy = tapOffset.y - center.y
                                val distance = sqrt(dx * dx + dy * dy)

                                var angleRad = atan2(dy, dx)
                                var angleDeg = Math.toDegrees(angleRad.toDouble()).toFloat() + 90f
                                if (angleDeg < 0f) angleDeg += 360f

                                val hit = sectorsList.find { sector ->
                                    val innerR = sector.innerRadiusFraction * baseMaxRadius
                                    val outerR = sector.outerRadiusFraction * baseMaxRadius
                                    val inRadius = distance in innerR..outerR
                                    val inAngle = angleDeg in sector.startAngleDeg..(sector.startAngleDeg + sector.sweepAngleDeg)
                                    inRadius && inAngle
                                }

                                if (hit != null) {
                                    if (hit.node.children.isNotEmpty()) {
                                        focusedRootId = hit.node.id
                                        selectedSectorNode = null
                                    } else {
                                        onSelectNodeDetails(hit.node)
                                    }
                                }
                            }
                        )
                    }
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val center = Offset(size.width / 2f + panOffsetX, size.height / 2f + panOffsetY)
                    val baseMaxRadius = min(size.width, size.height) / 2f * 0.92f * zoomScale
                    val totalLevels = max(maxTreeDepth, 1)

                    // Reference layout proportions (clean inner donut hole like the reference image)
                    val centerHoleFraction = 0.18f
                    val ringWidthFraction = (1.0f - centerHoleFraction) / totalLevels

                    val newSectors = mutableListOf<SunburstChartSector>()

                    if (currentFocusedRoot.children.isNotEmpty()) {
                        fun buildSectors(
                            nodes: List<CalculatedNode>,
                            startAngle: Float,
                            spanAngle: Float,
                            level: Int,
                            paletteIndex: Int?
                        ) {
                            val totalVal = nodes.sumOf { it.totalValue }
                            if (totalVal <= 0.0) return

                            var curAngle = startAngle
                            nodes.forEachIndexed { idx, child ->
                                if (child.totalValue <= 0.0) return@forEachIndexed
                                val fraction = (child.totalValue / totalVal).toFloat()
                                val sweep = fraction * spanAngle

                                val branchPaletteIdx = paletteIndex ?: (idx % SUNBURST_PALETTES.size)
                                val palette = SUNBURST_PALETTES[branchPaletteIdx]

                                val sectorColor = AssetColorUtils.getNodeShadedColor(
                                    name = child.name,
                                    categoryTag = child.categoryTag,
                                    depth = level,
                                    isGroup = child.isGroup,
                                    isDark = colors.isDark
                                )

                                val innerFraction = centerHoleFraction + (level - 1) * ringWidthFraction
                                val outerFraction = innerFraction + ringWidthFraction

                                val innerR = innerFraction * baseMaxRadius
                                val outerR = outerFraction * baseMaxRadius
                                val midR = (innerR + outerR) / 2f
                                val ringThickness = outerR - innerR

                                val isSelected = selectedSectorNode?.id == child.id

                                newSectors.add(
                                    SunburstChartSector(
                                        node = child,
                                        startAngleDeg = curAngle,
                                        sweepAngleDeg = sweep,
                                        innerRadiusFraction = innerFraction,
                                        outerRadiusFraction = outerFraction,
                                        depth = level,
                                        color = sectorColor
                                    )
                                )

                                // Draw sector arc band
                                val arcTopLeft = Offset(center.x - midR, center.y - midR)
                                val arcSize = Size(midR * 2, midR * 2)

                                // Main sector fill
                                drawArc(
                                    color = if (isSelected) sectorColor else sectorColor.copy(alpha = if (selectedSectorNode == null) 1.0f else 0.85f),
                                    startAngle = curAngle - 90f,
                                    sweepAngle = max(sweep - 0.5f, 0.3f),
                                    useCenter = false,
                                    topLeft = arcTopLeft,
                                    size = arcSize,
                                    style = Stroke(width = ringThickness, cap = androidx.compose.ui.graphics.StrokeCap.Butt)
                                )

                                // Crisp white dividing border between sectors (like in the reference photo)
                                drawArc(
                                    color = Color.White,
                                    startAngle = curAngle - 90f,
                                    sweepAngle = max(sweep - 0.5f, 0.3f),
                                    useCenter = false,
                                    topLeft = arcTopLeft,
                                    size = arcSize,
                                    style = Stroke(width = if (isSelected) ringThickness + 4f else 1.2f, cap = androidx.compose.ui.graphics.StrokeCap.Butt)
                                )

                                // Text Label Rendering (Scaled proportionally to colored sector area percentage)
                                val arcLength = (sweep * Math.PI.toFloat() / 180f) * midR
                                val sectorAreaDimension = sqrt(arcLength * ringThickness)

                                if (sweep >= 6f && ringThickness >= 12f * zoomScale) {
                                    val midAngleDeg = curAngle + sweep / 2f
                                    val midAngleRad = Math.toRadians((midAngleDeg - 90f).toDouble())
                                    val textX = center.x + cos(midAngleRad).toFloat() * midR
                                    val textY = center.y + sin(midAngleRad).toFloat() * midR

                                    val isLuminanceDark = (sectorColor.red * 0.299 + sectorColor.green * 0.587 + sectorColor.blue * 0.114) < 0.6
                                    val textColor = if (isLuminanceDark) android.graphics.Color.WHITE else android.graphics.Color.rgb(15, 23, 42)

                                    // Dynamic text size scaled directly from the sector area dimension (وظیفه ۲)
                                    val dynamicFontSize = (sectorAreaDimension * 0.26f * zoomScale).coerceIn(8.5f, 24f)
                                    val percentFontSize = (dynamicFontSize * 0.85f).coerceIn(8f, 19f)

                                    val labelPaint = Paint().apply {
                                        color = textColor
                                        textSize = dynamicFontSize
                                        isAntiAlias = true
                                        typeface = if (isSelected) Typeface.DEFAULT_BOLD else Typeface.DEFAULT_BOLD
                                        textAlign = Paint.Align.CENTER
                                        if (isLuminanceDark) {
                                            setShadowLayer(4f, 0f, 1f, android.graphics.Color.argb(180, 0, 0, 0))
                                        }
                                    }

                                    val percentPaint = Paint().apply {
                                        color = if (isLuminanceDark) android.graphics.Color.rgb(253, 230, 138) else android.graphics.Color.rgb(30, 41, 59)
                                        textSize = percentFontSize
                                        isAntiAlias = true
                                        typeface = Typeface.DEFAULT_BOLD
                                        textAlign = Paint.Align.CENTER
                                        if (isLuminanceDark) {
                                            setShadowLayer(3f, 0f, 1f, android.graphics.Color.argb(180, 0, 0, 0))
                                        }
                                    }

                                    drawContext.canvas.nativeCanvas.save()
                                    drawContext.canvas.nativeCanvas.translate(textX, textY)

                                    // Rotate text radially if narrow slice, or keep horizontal/tangent if wide slice
                                    val rotationDeg = if (sweep < 45f) {
                                        var rot = midAngleDeg - 90f
                                        if (rot > 90f && rot < 270f) rot += 180f // Keep readable
                                        rot
                                    } else {
                                        0f
                                    }
                                    drawContext.canvas.nativeCanvas.rotate(rotationDeg)

                                    val label = child.name.take(if (sweep > 35f) 12 else 7)
                                    val hasSpaceForPercent = ringThickness > 28f * zoomScale && sweep > 12f

                                    if (hasSpaceForPercent) {
                                        val percentStr = NumberFormatUtils.formatPercentage(
                                            child.percentOfTotal,
                                            if (child.percentOfTotal < 1.0) 1 else 0,
                                            settings.usePersianDigits
                                        )
                                        drawContext.canvas.nativeCanvas.drawText(label, 0f, -dynamicFontSize * 0.25f, labelPaint)
                                        drawContext.canvas.nativeCanvas.drawText(percentStr, 0f, dynamicFontSize * 0.95f, percentPaint)
                                    } else {
                                        drawContext.canvas.nativeCanvas.drawText(label, 0f, dynamicFontSize * 0.35f, labelPaint)
                                    }

                                    drawContext.canvas.nativeCanvas.restore()
                                }

                                if (child.children.isNotEmpty()) {
                                    buildSectors(child.children, curAngle, sweep, level + 1, branchPaletteIdx)
                                }
                                curAngle += sweep
                            }
                        }

                        buildSectors(currentFocusedRoot.children, 0f, 360f, 1, null)
                    }
                    sectorsList = newSectors

                    // Draw Central White Donut Hole (like in the reference photo)
                    val holeR = centerHoleFraction * baseMaxRadius
                    drawCircle(
                        color = Color.White,
                        radius = holeR,
                        center = center,
                        style = Fill
                    )
                    drawCircle(
                        color = Color(0xFFCBD5E1), // Light border
                        radius = holeR,
                        center = center,
                        style = Stroke(width = 1.5f)
                    )

                    // Draw Center Hub Text / Title
                    val hubTitlePaint = Paint().apply {
                        color = android.graphics.Color.rgb(15, 23, 42)
                        textSize = (11f * zoomScale).coerceIn(8.5f, 16f)
                        isAntiAlias = true
                        typeface = Typeface.DEFAULT_BOLD
                        textAlign = Paint.Align.CENTER
                    }
                    drawContext.canvas.nativeCanvas.drawText(
                        currentFocusedRoot.name.take(7),
                        center.x,
                        center.y - 4f * zoomScale,
                        hubTitlePaint
                    )

                    val hubPercentPaint = Paint().apply {
                        color = android.graphics.Color.rgb(16, 185, 129) // Emerald
                        textSize = (9.5f * zoomScale).coerceIn(7.5f, 14f)
                        isAntiAlias = true
                        typeface = Typeface.DEFAULT_BOLD
                        textAlign = Paint.Align.CENTER
                    }
                    val hubPercentStr = if (focusedRootId != null) {
                        NumberFormatUtils.formatPercentage(currentFocusedRoot.percentOfTotal, 0, settings.usePersianDigits)
                    } else {
                        "۱۰۰٪"
                    }
                    drawContext.canvas.nativeCanvas.drawText(
                        hubPercentStr,
                        center.x,
                        center.y + 9f * zoomScale,
                        hubPercentPaint
                    )
                }

                
        }

        com.example.ui.components.SharedAssetLegend(settings)

        // Bottom Selected Sector Details Card
        AnimatedVisibility(
            visible = selectedSectorNode != null,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            val node = selectedSectorNode ?: return@AnimatedVisibility
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = colors.surface),
                border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = node.name,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = colors.textPrimary
                            )
                            Text(
                                text = "(${NumberFormatUtils.formatPercentage(node.percentOfTotal, 1, settings.usePersianDigits)} از کل)",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = colors.gain
                            )
                        }

                        Text(
                            text = "ارزش: " + NumberFormatUtils.formatCurrency(
                                node.totalValue,
                                settings.currencyUnit,
                                compact = false,
                                usePersianDigits = settings.usePersianDigits,
                                privacyMode = settings.privacyMode
                            ),
                            fontSize = 11.sp,
                            color = colors.textSecondary
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        if (node.children.isNotEmpty()) {
                            FilledTonalButton(
                                onClick = {
                                    focusedRootId = node.id
                                    selectedSectorNode = null
                                },
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                modifier = Modifier.height(32.dp)
                            ) {
                                Text("تمرکز بر گروه", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        FilledTonalButton(
                            onClick = { onSelectNodeDetails(node) },
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                            modifier = Modifier.height(32.dp)
                        ) {
                            Icon(Icons.Default.Info, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("مشخصات", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }

                        IconButton(
                            onClick = { selectedSectorNode = null },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "بستن", tint = colors.textSecondary, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }
    }
}
}
