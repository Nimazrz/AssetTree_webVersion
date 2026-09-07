package com.example.ui.views

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.CalculatedNode
import com.example.data.model.DisplaySettings
import com.example.ui.theme.AppTheme
import com.example.ui.components.SharedViewHeader
import com.example.utils.AssetColorUtils
import com.example.utils.NumberFormatUtils
import kotlin.math.max
import kotlin.math.min

// Distinct rich palette for top-level main asset categories
private val MAIN_ASSET_BASE_COLORS = listOf(
    Color(0xFF059669), // Emerald / Real Estate (املاک)
    Color(0xFF1D4ED8), // Royal Blue / Stocks (سهام بورس)
    Color(0xFFD97706), // Amber Gold / Gold & Coins (طلا و سکه)
    Color(0xFFBE123C), // Ruby Rose / Currency & Cash (ارز و نقدی)
    Color(0xFF6D28D9), // Deep Purple / Vehicles & Machinery (خودرو)
    Color(0xFF0F766E), // Deep Teal / Fixed Deposits & Funds (سپرده و صندوق)
    Color(0xFFC2410C), // Dark Orange (سایر دارایی‌ها)
    Color(0xFF4338CA), // Indigo
    Color(0xFF0369A1), // Sky Dark
    Color(0xFF4D7C0F)  // Lime Dark
)

data class TreemapTile(
    val node: CalculatedNode,
    val rect: Rect,
    val baseColor: Color,
    val tileColor: Color,
    val parentName: String,
    val isLeaf: Boolean
)

@Composable
fun TreemapChartView(
    activeView: com.example.data.model.AppViewMode,
    onSelectView: (com.example.data.model.AppViewMode) -> Unit,
    rootCalculated: CalculatedNode,
    settings: DisplaySettings,
    onSelectNodeDetails: (CalculatedNode) -> Unit
) {
    val colors = AppTheme.colors
    var selectedNode by remember { mutableStateOf<CalculatedNode?>(null) }
    var focusedParentId by remember { mutableStateOf<String?>(null) }

    val mainCategories = rootCalculated.children.filter { it.totalValue > 0 }
    val totalValue = rootCalculated.totalValue

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        SharedViewHeader(activeView = activeView, onSelectView = onSelectView, settings = settings, showSearchAndSort = false)

        // Category Filter Pills (Horizontal Scroll)
        if (mainCategories.isNotEmpty()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                FilterChip(
                    selected = focusedParentId == null,
                    onClick = { focusedParentId = null },
                    label = { Text("همه دسته‌ها (${mainCategories.size})", fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = colors.primary,
                        selectedLabelColor = Color.White
                    )
                )

                mainCategories.forEachIndexed { index, cat ->
                    val catColor = MAIN_ASSET_BASE_COLORS[index % MAIN_ASSET_BASE_COLORS.size]
                    val isSelected = focusedParentId == cat.id
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (isSelected) catColor else colors.surfaceVariant,
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (isSelected) catColor else colors.border
                        ),
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable {
                                focusedParentId = if (focusedParentId == cat.id) null else cat.id
                                selectedNode = cat
                            }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(RoundedCornerShape(2.dp))
                                    .background(catColor)
                            )
                            Text(
                                text = cat.name,
                                fontSize = 11.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) Color.White else colors.textPrimary
                            )
                            Text(
                                text = NumberFormatUtils.formatPercentage(
                                    cat.percentOfTotal,
                                    0,
                                    settings.usePersianDigits
                                ),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black,
                                color = if (isSelected) Color(0xFFFDE68A) else colors.textSecondary
                            )
                        }
                    }
                }
            }
        }

        // Main Treemap Visual Container
        var scale by remember { mutableStateOf(1f) }
        var offset by remember { mutableStateOf(Offset.Zero) }

        BoxWithConstraints(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .clip(RoundedCornerShape(12.dp))
                .background(colors.surfaceVariant)
                .border(1.dp, colors.border, RoundedCornerShape(12.dp))
                .testTag("container_treemap")
        ) {
            val widthPx = constraints.maxWidth.toFloat()
            val heightPx = constraints.maxHeight.toFloat()

            val displayedRoots = if (focusedParentId != null) {
                mainCategories.filter { it.id == focusedParentId }
            } else {
                mainCategories
            }

            val displayedTotal = if (focusedParentId != null) {
                displayedRoots.sumOf { it.totalValue }
            } else {
                totalValue
            }

            if (widthPx > 10f && heightPx > 10f && displayedTotal > 0) {
                val tiles = remember(displayedRoots, widthPx, heightPx, focusedParentId) {
                    computeTreemapLayout(
            customAssetColors = settings.customAssetColors,
                        nodes = displayedRoots,
                        containerRect = Rect(0f, 0f, widthPx, heightPx),
                        totalValue = displayedTotal,
                        allRoots = mainCategories
                    )
                }

                Box(modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(Unit) {
                        detectTransformGestures { _, pan, zoom, _ ->
                            scale = (scale * zoom).coerceIn(1f, 5f)
                            if (scale > 1f) {
                                val maxX = (size.width * (scale - 1)) / 2
                                val maxY = (size.height * (scale - 1)) / 2
                                offset = Offset(
                                    x = (offset.x + pan.x).coerceIn(-maxX, maxX),
                                    y = (offset.y + pan.y).coerceIn(-maxY, maxY)
                                )
                            } else {
                                offset = Offset.Zero
                            }
                        }
                    }
                    .graphicsLayer {
                        scaleX = scale
                        scaleY = scale
                        translationX = offset.x
                        translationY = offset.y
                    }
                ) {
                    tiles.forEach { tile ->
                        TreemapTileComposable(
                            tile = tile,
                            isSelected = selectedNode?.id == tile.node.id,
                            settings = settings,
                            scale = scale,
                            onClick = { selectedNode = tile.node },
                            onDoubleClick = { onSelectNodeDetails(tile.node) }
                        )
                    }
                }
            } else {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = "اطلاعاتی برای نمایش نقشه درختی موجود نیست",
                        color = colors.textSecondary,
                        fontSize = 12.sp
                    )
                }
            }
        }

        com.example.ui.components.SharedAssetLegend(settings)

        // Selected Tile Inspector Bottom Card
        AnimatedVisibility(
            visible = selectedNode != null,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            val node = selectedNode ?: return@AnimatedVisibility
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
                        FilledTonalButton(
                            onClick = { onSelectNodeDetails(node) },
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            modifier = Modifier.height(32.dp)
                        ) {
                            Icon(Icons.Default.Info, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("مشخصات", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        IconButton(
                            onClick = { selectedNode = null },
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

@Composable
fun TreemapTileComposable(
    tile: TreemapTile,
    isSelected: Boolean,
    settings: DisplaySettings,
    scale: Float,
    onClick: () -> Unit,
    onDoubleClick: () -> Unit
) {
    val density = LocalDensity.current
    val leftDp = with(density) { tile.rect.left.toDp() }
    val topDp = with(density) { tile.rect.top.toDp() }
    val widthDp = with(density) { tile.rect.width.toDp() }
    val heightDp = with(density) { tile.rect.height.toDp() }

    val widthPx = tile.rect.width
    val heightPx = tile.rect.height
    val tileArea = widthPx * heightPx
    val dimensionScale = kotlin.math.sqrt(tileArea.toDouble()).toFloat()

    // Text scaling proportional to area and dynamically responding to zoom (وظیفه: تناسب با مساحت و زوم)
    val nameFontSize = (dimensionScale * 0.055f).coerceIn(4f, 36f).sp
    val percentFontSize = (dimensionScale * 0.07f).coerceIn(4.5f, 42f).sp
    val valueFontSize = (dimensionScale * 0.04f).coerceIn(3.5f, 24f).sp
    val compactFontSize = (dimensionScale * 0.05f).coerceIn(4f, 28f).sp

    val effectiveWidth = widthPx * scale
    val effectiveHeight = heightPx * scale

    val showDetails = effectiveWidth > 50f && effectiveHeight > 34f
    val showCompactText = effectiveWidth > 26f && effectiveHeight > 16f
    val showValue = effectiveHeight > 58f && effectiveWidth > 65f

    Box(
        modifier = Modifier
            .offset(x = leftDp, y = topDp)
            .size(width = widthDp, height = heightDp)
            .padding(1.dp)
            .clip(RoundedCornerShape(6.dp))
            .background(tile.tileColor)
            .border(
                width = if (isSelected) 2.5.dp else 0.75.dp,
                color = if (isSelected) Color.White else Color(0x33000000),
                shape = RoundedCornerShape(6.dp)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = (widthPx * 0.03f).coerceIn(3f, 8f).dp, vertical = (heightPx * 0.03f).coerceIn(2f, 6f).dp)
    ) {
        if (showDetails) {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = if (showValue) Arrangement.SpaceBetween else Arrangement.Center,
                horizontalAlignment = Alignment.Start
            ) {
                // Asset Name & Prominent Percentage
                Column(verticalArrangement = Arrangement.spacedBy(1.dp)) {
                    Text(
                        text = tile.node.name,
                        color = Color.White,
                        fontSize = nameFontSize,
                        fontWeight = FontWeight.Black,
                        maxLines = if (heightPx > 80f) 2 else 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = NumberFormatUtils.formatPercentage(
                            tile.node.percentOfTotal,
                            if (tile.node.percentOfTotal < 1.0) 1 else 0,
                            settings.usePersianDigits
                        ),
                        color = Color.White.copy(alpha = 0.95f),
                        fontSize = percentFontSize,
                        fontWeight = FontWeight.ExtraBold
                    )
                }

                // Asset Value (if space permits)
                if (showValue) {
                    Text(
                        text = if (settings.privacyMode) "••••••" else NumberFormatUtils.formatCompactAbbreviation(
                            tile.node.totalValue,
                            settings.currencyUnit,
                            settings.usePersianDigits,
                            privacyMode = false
                        ),
                        color = Color(0xFFFDE68A), // Light Amber
                        fontSize = valueFontSize,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1
                    )
                }
            }
        } else if (showCompactText) {
            Column(
                modifier = Modifier.align(Alignment.Center),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = tile.node.name,
                    color = Color.White,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                if (heightPx > 26f) {
                    Text(
                        text = NumberFormatUtils.formatPercentage(
                            tile.node.percentOfTotal,
                            0,
                            settings.usePersianDigits
                        ),
                        color = Color.White.copy(alpha = 0.9f),
                        fontSize = 8.5.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

/**
 * Computes hierarchical treemap tiles:
 * 1) Top-level categories are partitioned with distinct base colors.
 * 2) Children of each category are partitioned within that parent's rectangle
 *    using progressively darker shades of that same category's base color.
 */
private fun computeTreemapLayout(
    customAssetColors: Map<String, Long>,
    nodes: List<CalculatedNode>,
    containerRect: Rect,
    totalValue: Double,
    allRoots: List<CalculatedNode>
): List<TreemapTile> {
    if (nodes.isEmpty() || totalValue <= 0.0) return emptyList()

    val tiles = mutableListOf<TreemapTile>()

    // Partition top level
    val categoryRects = sliceAndDice(nodes, containerRect, totalValue)

    categoryRects.forEach { (categoryNode, catRect) ->
        val baseColor = AssetColorUtils.getPaletteForNode(categoryNode.name, categoryNode.categoryTag, customAssetColors).primary

        if (categoryNode.children.isNotEmpty()) {
            // Subdivide parent rectangle among children with darker shades of parent's base color
            val childTotal = categoryNode.children.sumOf { it.totalValue }
            val childRects = sliceAndDice(categoryNode.children, catRect, childTotal)

            childRects.forEachIndexed { childIdx, (childNode, childRect) ->
                // Progressively darker shade of the parent's base color
                // Darken by reducing RGB values
                val darkFactor = max(0.40f, 0.90f - (childIdx * 0.12f) - (childNode.depth * 0.05f))
                val childShade = Color(
                    red = (baseColor.red * darkFactor).coerceIn(0f, 1f),
                    green = (baseColor.green * darkFactor).coerceIn(0f, 1f),
                    blue = (baseColor.blue * darkFactor).coerceIn(0f, 1f),
                    alpha = 1.0f
                )

                if (childNode.children.isNotEmpty() && childRect.width > 80f && childRect.height > 80f) {
                    // Level 3 deeper subdivisions
                    val subTotal = childNode.children.sumOf { it.totalValue }
                    val subRects = sliceAndDice(childNode.children, childRect, subTotal)
                    subRects.forEachIndexed { subIdx, (subNode, subRect) ->
                        val subDarkFactor = max(0.30f, darkFactor - (subIdx * 0.10f))
                        val subShade = Color(
                            red = (baseColor.red * subDarkFactor).coerceIn(0f, 1f),
                            green = (baseColor.green * subDarkFactor).coerceIn(0f, 1f),
                            blue = (baseColor.blue * subDarkFactor).coerceIn(0f, 1f),
                            alpha = 1.0f
                        )
                        tiles.add(
                            TreemapTile(
                                node = subNode,
                                rect = subRect,
                                baseColor = baseColor,
                                tileColor = subShade,
                                parentName = childNode.name,
                                isLeaf = subNode.children.isEmpty()
                            )
                        )
                    }
                } else {
                    tiles.add(
                        TreemapTile(
                            node = childNode,
                            rect = childRect,
                            baseColor = baseColor,
                            tileColor = childShade,
                            parentName = categoryNode.name,
                            isLeaf = childNode.children.isEmpty()
                        )
                    )
                }
            }
        } else {
            // Leaf top category
            tiles.add(
                TreemapTile(
                    node = categoryNode,
                    rect = catRect,
                    baseColor = baseColor,
                    tileColor = baseColor,
                    parentName = "",
                    isLeaf = true
                )
            )
        }
    }

    return tiles
}

/**
 * 2D Slice and Dice partition algorithm
 */
private fun sliceAndDice(
    nodes: List<CalculatedNode>,
    rect: Rect,
    totalVal: Double
): List<Pair<CalculatedNode, Rect>> {
    if (nodes.isEmpty() || totalVal <= 0.0) return emptyList()

    val sorted = nodes.filter { it.totalValue > 0 }.sortedByDescending { it.totalValue }
    val result = mutableListOf<Pair<CalculatedNode, Rect>>()

    var remainingRect = rect
    var remainingTotal = sorted.sumOf { it.totalValue }

    sorted.forEachIndexed { index, node ->
        if (remainingTotal <= 0.0) return@forEachIndexed
        val fraction = (node.totalValue / remainingTotal).toFloat().coerceIn(0f, 1f)
        val isHorizontal = remainingRect.width > remainingRect.height

        val (allocatedRect, nextRect) = if (index == sorted.lastIndex) {
            remainingRect to Rect(0f, 0f, 0f, 0f)
        } else if (isHorizontal) {
            val allocatedW = remainingRect.width * fraction
            Rect(remainingRect.left, remainingRect.top, remainingRect.left + allocatedW, remainingRect.bottom) to
                    Rect(remainingRect.left + allocatedW, remainingRect.top, remainingRect.right, remainingRect.bottom)
        } else {
            val allocatedH = remainingRect.height * fraction
            Rect(remainingRect.left, remainingRect.top, remainingRect.right, remainingRect.top + allocatedH) to
                    Rect(remainingRect.left, remainingRect.top + allocatedH, remainingRect.right, remainingRect.bottom)
        }

        result.add(node to allocatedRect)
        remainingRect = nextRect
        remainingTotal -= node.totalValue
    }

    return result
}
