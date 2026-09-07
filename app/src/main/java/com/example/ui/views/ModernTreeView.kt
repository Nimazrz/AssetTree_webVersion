package com.example.ui.views

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.core.TreeEngine
import com.example.data.local.ROOT_NODE_ID
import com.example.data.model.*
import com.example.ui.components.PortfolioSummaryBar
import com.example.ui.theme.*
import com.example.utils.AssetColorUtils
import com.example.utils.NumberFormatUtils
import com.example.ui.components.SharedViewHeader

@Composable
fun ModernTreeView(
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
    val expandedNodeIds = remember { mutableStateMapOf<String, Boolean>() }

    // Expand root and direct children by default
    LaunchedEffect(rootCalculated.id) {
        expandedNodeIds[rootCalculated.id] = true
        rootCalculated.children.forEach {
            expandedNodeIds[it.id] = true
        }
    }

    fun toggleExpand(nodeId: String) {
        haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
        val current = expandedNodeIds[nodeId] ?: false
        expandedNodeIds[nodeId] = !current
    }

    fun expandAll(node: CalculatedNode) {
        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
        if (node.isGroup || node.id == ROOT_NODE_ID) {
            expandedNodeIds[node.id] = true
        }
        node.children.forEach { expandAll(it) }
    }

    fun collapseAll() {
        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
        expandedNodeIds.clear()
        expandedNodeIds[rootCalculated.id] = true
    }

    // Flatten matching nodes for high-performance lazy rendering
    fun flattenTree(node: CalculatedNode, result: MutableList<CalculatedNode>) {
        val matchesSelf = searchQuery.isBlank() ||
                node.name.contains(searchQuery, ignoreCase = true) ||
                node.unit.contains(searchQuery, ignoreCase = true) ||
                (node.categoryTag != null && node.categoryTag.contains(searchQuery, ignoreCase = true))

        fun hasMatchingDescendant(n: CalculatedNode): Boolean {
            if (n.name.contains(searchQuery, ignoreCase = true)) return true
            return n.children.any { hasMatchingDescendant(it) }
        }

        val shouldShow = matchesSelf || (searchQuery.isNotBlank() && hasMatchingDescendant(node))

        if (shouldShow) {
            result.add(node)
            val isExpanded = expandedNodeIds[node.id] ?: false || searchQuery.isNotBlank()
            if (isExpanded && node.children.isNotEmpty()) {
                for (child in node.children) {
                    flattenTree(child, result)
                }
            }
        }
    }

    val visibleNodes = remember(rootCalculated, expandedNodeIds.toMap(), searchQuery) {
        val list = mutableListOf<CalculatedNode>()
        flattenTree(rootCalculated, list)
        list
    }

    Column(modifier = Modifier.fillMaxSize()) {
    LazyColumn(
        modifier = Modifier
            .fillMaxWidth()
            .weight(1f)
            .testTag("modern_tree_list"),
        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        // 1. Search & Toolbar Card
        item(key = "search_and_toolbar") {
            SharedViewHeader(
                activeView = activeView,
                settings = settings,
                onSelectView = onSelectView,
                searchQuery = searchQuery,
                onSearchChange = { searchQuery = it },
                sortConfig = sortConfig,
                onUpdateSort = onUpdateSort,
                onExpandAll = { expandAll(rootCalculated) },
                onCollapseAll = { collapseAll() },
                showSearchAndSort = true
            )
        }
        
        // 3. Tree Items List
        items(visibleNodes, key = { it.id }) { node ->
            val isExpanded = expandedNodeIds[node.id] ?: false
            Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                ModernTreeNodeRow(
                    node = node,
                    settings = settings,
                    isExpanded = isExpanded,
                    onToggleExpand = { toggleExpand(node.id) },
                    onDoubleTap = { onSelectNodeDetails(node) },
                    onAddChild = { onAddChildNode(node) },
                    onEdit = { onEditNode(node) },
                    onMove = { onMoveNode(node) },
                    onDelete = { onDeleteNode(node) }
                )
            }
        }

        // 4. Empty State if nothing matches
        if (visibleNodes.isEmpty()) {
            item(key = "empty_state") {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.SearchOff,
                            contentDescription = null,
                            tint = colors.textSecondary,
                            modifier = Modifier.size(40.dp)
                        )
                        Text(
                            text = "موردی با این مشخصات یافت نشد",
                            fontSize = 13.sp,
                            color = colors.textSecondary,
                            fontWeight = FontWeight.Medium
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
fun ModernTreeNodeRow(
    node: CalculatedNode,
    settings: DisplaySettings,
    isExpanded: Boolean,
    onToggleExpand: () -> Unit,
    onDoubleTap: () -> Unit,
    onAddChild: () -> Unit,
    onEdit: () -> Unit,
    onMove: () -> Unit,
    onDelete: () -> Unit
) {
    val colors = AppTheme.colors
    val isRoot = TreeEngine.isRootNode(node.id, node.parentId)
    val isZero = node.totalValue == 0.0

    val labelParts = NumberFormatUtils.formatNodeLabelParts(
        totalValue = node.totalValue,
        percentOfTotal = node.percentOfTotal,
        percentOfGroup = node.percentOfGroup,
        isRoot = isRoot,
        settings = settings
    )

    val palette = remember(node.name, node.categoryTag) {
        AssetColorUtils.getPaletteForNode(node.name, node.categoryTag)
    }
    val nodeShadedColor = remember(node.name, node.categoryTag, node.depth, node.isGroup, colors.isDark) {
        AssetColorUtils.getNodeShadedColor(settings.customAssetColors, node.name, node.categoryTag, node.depth, node.isGroup, colors.isDark)
    }

    val indent = (node.depth * 14).dp

    var showMenu by remember { mutableStateOf(false) }

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = when {
            isRoot -> colors.primaryContainer
            isZero -> colors.background
            node.isGroup -> colors.surfaceVariant
            else -> colors.surface
        },
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            when {
                isRoot -> colors.primary
                node.isGroup -> palette.primary.copy(alpha = 0.25f)
                else -> colors.border
            }
        ),
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 0.dp, end = 0.dp)
            .combinedClickable(
                onClick = {
                    if (node.isGroup) onToggleExpand() else onDoubleTap()
                },
                onDoubleClick = onDoubleTap
            )
            .testTag("node_row_${node.id}")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Right Side (in RTL): Indent + Caret + Icon + Name & Badges
            Row(
                modifier = Modifier
                    .weight(1f)
                    .padding(start = indent),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                // Expand Caret (for groups)
                if (node.isGroup || isRoot) {
                    IconButton(
                        onClick = onToggleExpand,
                        modifier = Modifier.size(24.dp)
                    ) {
                        Icon(
                            imageVector = if (isExpanded) Icons.Default.KeyboardArrowDown else Icons.Default.KeyboardArrowLeft,
                            contentDescription = null,
                            tint = if (isRoot) colors.onPrimaryContainer else palette.primary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                } else {
                    Spacer(modifier = Modifier.size(24.dp))
                }

                // Node Type Icon with Semantic Category Color
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(
                            when {
                                isRoot -> colors.primary
                                node.isGroup -> if (isExpanded) palette.primary.copy(alpha = 0.2f) else palette.primary.copy(alpha = 0.12f)
                                else -> palette.primary.copy(alpha = 0.15f)
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = when {
                            isRoot -> Icons.Default.Layers
                            node.isGroup -> if (isExpanded) Icons.Default.FolderOpen else Icons.Default.Folder
                            else -> Icons.Default.MonetizationOn
                        },
                        contentDescription = null,
                        tint = when {
                            isRoot -> Color.White
                            node.isGroup -> palette.primary
                            else -> palette.textOrIconColor
                        },
                        modifier = Modifier.size(16.dp)
                    )
                }

                // Name & Metadata
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = node.name,
                            fontSize = if (isRoot) 14.sp else 12.5.sp,
                            fontWeight = if (isRoot || node.isGroup) FontWeight.Bold else FontWeight.Medium,
                            color = if (isZero) colors.textSecondary else if (isRoot) colors.textPrimary else nodeShadedColor,
                            maxLines = 1
                        )

                        if (isZero) {
                            Surface(
                                shape = RoundedCornerShape(4.dp),
                                color = colors.lossContainer
                            ) {
                                Text(
                                    text = "ارزش صفر",
                                    fontSize = 9.sp,
                                    color = colors.loss,
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                )
                            }
                        }

                        if (node.categoryTag != null) {
                            Surface(
                                shape = RoundedCornerShape(4.dp),
                                color = palette.primary.copy(alpha = 0.15f)
                            ) {
                                Text(
                                    text = node.categoryTag,
                                    fontSize = 9.sp,
                                    color = palette.primary,
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                )
                            }
                        }
                    }
                }
            }

            // Left Side: Values & Action Menu
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                // Value Text
                if (labelParts.valueText != null) {
                    Text(
                        text = labelParts.valueText,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isRoot) colors.onPrimaryContainer else colors.textPrimary
                    )
                }

                // Context Action Menu Trigger
                Box {
                    IconButton(
                        onClick = { showMenu = true },
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.MoreVert,
                            contentDescription = "عملیات",
                            tint = if (isRoot) colors.onPrimaryContainer else colors.textSecondary,
                            modifier = Modifier.size(16.dp)
                        )
                    }

                    DropdownMenu(
                        expanded = showMenu,
                        onDismissRequest = { showMenu = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("مشاهده جزئیات کامل", fontSize = 12.sp, color = colors.textPrimary) },
                            leadingIcon = { Icon(Icons.Default.Info, contentDescription = null, tint = colors.primary, modifier = Modifier.size(16.dp)) },
                            onClick = {
                                showMenu = false
                                onDoubleTap()
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("افزودن زیرمجموعه", fontSize = 12.sp, color = colors.textPrimary) },
                            leadingIcon = { Icon(Icons.Default.AddCircle, tint = colors.primary, contentDescription = null, modifier = Modifier.size(16.dp)) },
                            onClick = {
                                showMenu = false
                                onAddChild()
                            }
                        )
                        if (!isRoot) {
                            DropdownMenuItem(
                                text = { Text("ویرایش دارایی", fontSize = 12.sp, color = colors.textPrimary) },
                                leadingIcon = { Icon(Icons.Default.Edit, tint = colors.primary, contentDescription = null, modifier = Modifier.size(16.dp)) },
                                onClick = {
                                    showMenu = false
                                    onEdit()
                                }
                            )
                            DropdownMenuItem(
                                text = { Text("انتقال به هم‌گروه دیگر", fontSize = 12.sp, color = colors.textPrimary) },
                                leadingIcon = { Icon(Icons.Default.SwapHoriz, tint = Color(0xFFA78BFA), contentDescription = null, modifier = Modifier.size(16.dp)) },
                                onClick = {
                                    showMenu = false
                                    onMove()
                                }
                            )
                            DropdownMenuItem(
                                text = { Text("حذف گره و زیرشاخه‌ها", fontSize = 12.sp, color = colors.loss) },
                                leadingIcon = { Icon(Icons.Default.Delete, tint = colors.loss, contentDescription = null, modifier = Modifier.size(16.dp)) },
                                onClick = {
                                    showMenu = false
                                    onDelete()
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
