package com.example.ui.views

import androidx.compose.foundation.Canvas
import androidx.compose.ui.graphics.graphicsLayer

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.core.TreeEngine
import com.example.data.local.ROOT_NODE_ID
import com.example.data.model.*
import com.example.ui.theme.AppTheme
import com.example.utils.AssetColorUtils
import com.example.utils.NumberFormatUtils
import com.example.ui.components.SharedViewHeader

data class NodeWithCode(
    val node: CalculatedNode,
    val code: String,
    val persianCode: String,
    val isLastSibling: Boolean,
    val ancestorIsLast: List<Boolean>,
    val childrenWithCode: List<NodeWithCode>
)

fun buildTreeWithCodes(
    node: CalculatedNode,
    parentCode: String = "",
    indexInParent: Int = 0,
    depth: Int = 0,
    isLastSibling: Boolean = true,
    ancestorIsLast: List<Boolean> = emptyList()
): NodeWithCode {
    val code = when (depth) {
        0 -> ""
        1 -> {
            val num = indexInParent + 1
            if (num < 10) "0$num" else "$num"
        }
        2 -> "$parentCode/${indexInParent + 1}"
        3 -> "$parentCode/${indexInParent + 1}"
        else -> {
            val leafNum = 100 + indexInParent
            "$parentCode/$leafNum"
        }
    }
    val persianCode = if (code.isNotEmpty()) NumberFormatUtils.toPersianDigits(code) else ""
    val childCount = node.children.size
    val currentAncestors = if (depth > 0) ancestorIsLast + listOf(isLastSibling) else emptyList()

    val children = node.children.mapIndexed { idx, child ->
        buildTreeWithCodes(
            node = child,
            parentCode = code,
            indexInParent = idx,
            depth = depth + 1,
            isLastSibling = (idx == childCount - 1),
            ancestorIsLast = currentAncestors
        )
    }
    return NodeWithCode(node, code, persianCode, isLastSibling, currentAncestors, children)
}

@Composable
fun ClassicTreeView(
    activeView: com.example.data.model.AppViewMode,
    onSelectView: (com.example.data.model.AppViewMode) -> Unit,
    rootCalculated: CalculatedNode,
    settings: DisplaySettings,
    sortConfig: SortConfig,
    onUpdateSort: (SortConfig) -> Unit,
    onSelectNodeDetails: (CalculatedNode) -> Unit,
    onAddChildNode: (CalculatedNode) -> Unit,
    onEditNode: (CalculatedNode) -> Unit,
    onMoveNode: (CalculatedNode) -> Unit,
    onDeleteNode: (CalculatedNode) -> Unit,
    onOpenAddRootAsset: () -> Unit,
    onOpenChart: () -> Unit
) {
    val haptic = LocalHapticFeedback.current
    val colors = AppTheme.colors
    var searchQuery by remember { mutableStateOf("") }
    var selectedNodeId by remember { mutableStateOf(rootCalculated.id) }
    var usePersianCodeNumbers by remember { mutableStateOf(true) }
    var showSortMenu by remember { mutableStateOf(false) }

    val expandedNodeIds = remember { mutableStateMapOf<String, Boolean>() }

    LaunchedEffect(rootCalculated.id) {
        expandedNodeIds[rootCalculated.id] = true
        rootCalculated.children.forEach {
            expandedNodeIds[it.id] = true
            it.children.forEach { grand -> expandedNodeIds[grand.id] = true }
        }
    }

    val treeWithCodes = remember(rootCalculated) {
        buildTreeWithCodes(rootCalculated)
    }

    fun toggleExpand(nodeId: String) {
        haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
        val cur = expandedNodeIds[nodeId] ?: false
        expandedNodeIds[nodeId] = !cur
    }

    fun expandAll(item: NodeWithCode) {
        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
        if (item.childrenWithCode.isNotEmpty()) {
            expandedNodeIds[item.node.id] = true
        }
        item.childrenWithCode.forEach { expandAll(it) }
    }

    fun collapseAll() {
        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
        expandedNodeIds.clear()
        expandedNodeIds[rootCalculated.id] = true
    }

    fun expandToDepth(item: NodeWithCode, targetDepth: Int) {
        if (item.node.depth < targetDepth) {
            expandedNodeIds[item.node.id] = true
        } else {
            expandedNodeIds.remove(item.node.id)
        }
        item.childrenWithCode.forEach { expandToDepth(it, targetDepth) }
    }

    // Flatten matching nodes for display
    fun flattenList(item: NodeWithCode, out: MutableList<NodeWithCode>) {
        val matchesSelf = searchQuery.isBlank() ||
                item.node.name.contains(searchQuery, ignoreCase = true) ||
                item.code.contains(searchQuery, ignoreCase = true) ||
                item.persianCode.contains(searchQuery)

        fun hasMatchingDescendant(n: NodeWithCode): Boolean {
            if (n.node.name.contains(searchQuery, ignoreCase = true)) return true
            if (n.code.contains(searchQuery, ignoreCase = true)) return true
            return n.childrenWithCode.any { hasMatchingDescendant(it) }
        }

        val show = matchesSelf || (searchQuery.isNotBlank() && hasMatchingDescendant(item))
        if (show) {
            out.add(item)
            val isExpanded = expandedNodeIds[item.node.id] ?: false || searchQuery.isNotBlank()
            if (isExpanded && item.childrenWithCode.isNotEmpty()) {
                item.childrenWithCode.forEach { flattenList(it, out) }
            }
        }
    }

    val visibleItems = remember(treeWithCodes, expandedNodeIds.toMap(), searchQuery) {
        val list = mutableListOf<NodeWithCode>()
        flattenList(treeWithCodes, list)
        list
    }

    val horizontalScrollState = rememberScrollState()

    Column(modifier = Modifier.fillMaxSize()) {
    Box(
        modifier = Modifier
            .weight(1f)
            .horizontalScroll(horizontalScrollState)
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxHeight()
                .widthIn(min = 480.dp)
                .testTag("classic_tree_list"),
            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
            verticalArrangement = Arrangement.spacedBy(0.dp)
        ) {
        // 1. Search Bar & Compact Toolbar (without blue rectangle or redundant titles)
        item(key = "classic_search_toolbar") {
            SharedViewHeader(
                activeView = activeView,
                settings = settings,
                onSelectView = onSelectView,
                searchQuery = searchQuery,
                onSearchChange = { searchQuery = it },
                sortConfig = sortConfig,
                onUpdateSort = onUpdateSort,
                onExpandAll = { 
                    fun expandAll(node: CalculatedNode) {
                        expandedNodeIds[node.id] = true
                        node.children.forEach { expandAll(it) }
                    }
                    expandAll(rootCalculated)
                },
                onCollapseAll = { expandedNodeIds.clear() },
                showSearchAndSort = true
            )
        }

        // 2. Hierarchical Tree Items with Connected Branch Lines
        items(visibleItems, key = { it.node.id }) { item ->
            val isSelected = item.node.id == selectedNodeId
            val isExpanded = expandedNodeIds[item.node.id] ?: false

            ClassicTreeNodeRow(
                item = item,
                settings = settings,
                isSelected = isSelected,
                isExpanded = isExpanded,
                usePersianDigits = usePersianCodeNumbers,
                onSelect = { selectedNodeId = item.node.id },
                onToggleExpand = { toggleExpand(item.node.id) },
                onDoubleClick = { onSelectNodeDetails(item.node) }
            )
        }

        if (visibleItems.isEmpty()) {
            item(key = "classic_empty") {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "موردی با این عبارت جستجو یافت نشد",
                        fontSize = 12.sp,
                        color = colors.textSecondary
                    )
                }
            }
        }
    }
}
    com.example.ui.components.SharedAssetLegend(settings)
}
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ClassicTreeNodeRow(
    item: NodeWithCode,
    settings: DisplaySettings,
    isSelected: Boolean,
    isExpanded: Boolean,
    usePersianDigits: Boolean,
    onSelect: () -> Unit,
    onToggleExpand: () -> Unit,
    onDoubleClick: () -> Unit
) {
    val colors = AppTheme.colors
    val node = item.node
    val isRoot = TreeEngine.isRootNode(node.id, node.parentId)
    val hasChildren = item.childrenWithCode.isNotEmpty() || node.isGroup

    val displayCode = if (usePersianDigits) item.persianCode else item.code

    val palette = remember(node.name, node.categoryTag) {
        AssetColorUtils.getPaletteForNode(node.name, node.categoryTag)
    }
    val nodeShadedColor = remember(node.name, node.categoryTag, node.depth, node.isGroup, colors.isDark) {
        AssetColorUtils.getNodeShadedColor(settings.customAssetColors, node.name, node.categoryTag, node.depth, node.isGroup, colors.isDark)
    }

    // Slash-separated metrics text: e.g. "۲۵.۴٪ کل / ۴۰.۲٪ گروه / ۱۵.۲ م.ت"
    val inlineMetrics = remember(node.totalValue, node.percentOfTotal, node.percentOfGroup, settings) {
        NumberFormatUtils.formatNodeMetricsSlashSeparated(
            totalValue = node.totalValue,
            percentOfTotal = node.percentOfTotal,
            percentOfGroup = node.percentOfGroup,
            isRoot = isRoot,
            settings = settings
        )
    }

    Surface(
        shape = RoundedCornerShape(6.dp),
        color = if (isSelected) palette.primary.copy(alpha = 0.15f) else Color.Transparent,
        border = if (isSelected) androidx.compose.foundation.BorderStroke(1.dp, palette.primary.copy(alpha = 0.5f)) else null,
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 34.dp)
            .combinedClickable(
                onClick = { onSelect() },
                onDoubleClick = { onDoubleClick() }
            )
            .padding(vertical = 0.dp)
            .testTag("classic_node_${node.id}")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(IntrinsicSize.Min)
                .padding(horizontal = 4.dp, vertical = 0.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 1. Tree Branch Connector Lines (Continuous, solid white lines)
            if (node.depth > 0) {
                TreeBranchLines(
                    depth = node.depth,
                    isLastSibling = item.isLastSibling,
                    ancestorsLast = item.ancestorIsLast,
                    lineColor = if (colors.isDark) Color.White else Color(0xFFCBD5E1)
                )
            }

            // 2. Node Expander Caret / Icon
            if (hasChildren || isRoot) {
                IconButton(
                    onClick = onToggleExpand,
                    modifier = Modifier.size(22.dp)
                ) {
                    Icon(
                        imageVector = if (isExpanded) Icons.Default.KeyboardArrowDown else Icons.Default.KeyboardArrowLeft,
                        contentDescription = if (isExpanded) "بستن شاخه" else "باز کردن شاخه",
                        tint = if (isRoot) colors.primary else palette.primary,
                        modifier = Modifier.size(16.dp)
                    )
                }
            } else {
                Spacer(modifier = Modifier.width(22.dp))
            }

            // 3. Node Icon with Semantic Category Color
            if (isRoot) {
                Icon(
                    imageVector = Icons.Default.AccountBalance,
                    contentDescription = null,
                    tint = colors.primary,
                    modifier = Modifier.size(16.dp)
                )
            } else if (hasChildren || node.isGroup) {
                Icon(
                    imageVector = if (isExpanded) Icons.Default.FolderOpen else Icons.Default.Folder,
                    contentDescription = null,
                    tint = palette.primary,
                    modifier = Modifier.size(16.dp)
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(9.dp)
                        .clip(RoundedCornerShape(3.dp))
                        .background(palette.primary)
                )
            }

            Spacer(modifier = Modifier.width(6.dp))

            // 5. Node Name (with semantic category & shaded depth color)
            Text(
                text = node.name,
                fontSize = 12.sp,
                fontWeight = if (isRoot || node.isGroup) FontWeight.Bold else FontWeight.Medium,
                color = if (isRoot) colors.textPrimary else nodeShadedColor,
                modifier = Modifier.padding(end = 4.dp)
            )

            // 6. Slash-separated Metrics inline (e.g. "۲۵.۴٪ کل / ۴۰.۲٪ گروه / ۱۵.۲ م.ت")
            if (inlineMetrics.isNotEmpty()) {
                Text(
                    text = "($inlineMetrics)",
                    fontSize = 10.5.sp,
                    color = if (isSelected) palette.primary else colors.textSecondary,
                    fontWeight = FontWeight.Normal,
                    maxLines = 1
                )
            }
        }
    }
}

/**
 * Custom Tree Guide Lines Drawer:
 * Draws continuous, solid hierarchical guide lines connecting parents to children in a classic tree structure!
 */
@Composable
fun TreeBranchLines(
    depth: Int,
    isLastSibling: Boolean,
    ancestorsLast: List<Boolean>,
    lineColor: Color
) {
    val columnWidth = 18.dp
    val totalWidth = (depth * 18).dp

    val isRtl = androidx.compose.ui.platform.LocalLayoutDirection.current == androidx.compose.ui.unit.LayoutDirection.Rtl

    Canvas(
        modifier = Modifier
            .width(totalWidth)
            .fillMaxHeight()
    ) {
        val colPx = columnWidth.toPx()
        val halfHeight = size.height / 2f
        val strokeW = 3.5f

        fun getColCenterX(level: Int): Float {
            return if (isRtl) {
                size.width - (level * colPx + colPx / 2f)
            } else {
                level * colPx + colPx / 2f
            }
        }

        // 1. Draw continuous vertical guide lines for all active parent/ancestor columns
        for (i in 0 until depth - 1) {
            val isAncestorLast = if (i < ancestorsLast.size) ancestorsLast[i] else false
            if (!isAncestorLast) {
                val x = getColCenterX(i)
                drawLine(
                    color = lineColor,
                    start = Offset(x, -1f),
                    end = Offset(x, size.height + 1f),
                    strokeWidth = strokeW,
                    cap = StrokeCap.Square
                )
            }
        }

        // 2. Draw vertical branch line for the current node level
        val currentX = getColCenterX(depth - 1)
        val bottomY = if (isLastSibling) halfHeight else size.height + 1f

        drawLine(
            color = lineColor,
            start = Offset(currentX, -1f),
            end = Offset(currentX, bottomY),
            strokeWidth = strokeW,
            cap = StrokeCap.Square
        )

        // 3. Draw horizontal branch elbow line connecting directly to node icon
        val targetX = if (isRtl) 0f else size.width

        drawLine(
            color = lineColor,
            start = Offset(currentX, halfHeight),
            end = Offset(targetX, halfHeight),
            strokeWidth = strokeW,
            cap = StrokeCap.Square
        )
    }
}
