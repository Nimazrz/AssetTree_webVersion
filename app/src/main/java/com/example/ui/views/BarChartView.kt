package com.example.ui.views

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.CalculatedNode
import com.example.data.model.DisplaySettings
import com.example.ui.theme.AppTheme
import com.example.ui.components.SharedViewHeader
import com.example.utils.AssetColorUtils
import com.example.utils.NumberFormatUtils

@Composable
fun BarChartView(
    activeView: com.example.data.model.AppViewMode,
    onSelectView: (com.example.data.model.AppViewMode) -> Unit,
    rootCalculated: CalculatedNode,
    settings: DisplaySettings,
    onSelectNodeDetails: (CalculatedNode) -> Unit
) {
    val colors = AppTheme.colors

    // Groups are the immediate children of the root
    val groups = rootCalculated.children.sortedByDescending { it.percentOfTotal }

    Column(modifier = Modifier.fillMaxSize()) {
        SharedViewHeader(activeView = activeView, onSelectView = onSelectView, settings = settings, showSearchAndSort = false)
        LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "نمودار میله ای",
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                color = colors.textPrimary,
                modifier = Modifier.padding(bottom = 4.dp)
            )
        }

        items(groups) { group ->
            StackedBarItem(group = group, settings = settings)
        }
        }
    }
}

@Composable
fun StackedBarItem(group: CalculatedNode, settings: DisplaySettings) {
    val colors = AppTheme.colors
    val groupPalette = AssetColorUtils.getPaletteForNode(group.name, group.categoryTag)
    
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = colors.surface),
        border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
        modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = group.name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = groupPalette.primary
                )
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = NumberFormatUtils.formatPercentage(group.percentOfTotal, 1, settings.usePersianDigits) + " از کل",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = colors.primary
                    )
                    Text(
                        text = NumberFormatUtils.formatCurrency(
                            group.totalValue,
                            settings.currencyUnit,
                            compact = true,
                            usePersianDigits = settings.usePersianDigits,
                            privacyMode = settings.privacyMode
                        ),
                        fontWeight = FontWeight.Medium,
                        fontSize = 10.5.sp,
                        color = colors.textSecondary
                    )
                }
            }
            
            val children = group.children.sortedByDescending { it.totalValue }
            
            val childColors = children.map { child ->
                AssetColorUtils.getNodeShadedColor(
                    name = child.name,
                    categoryTag = child.categoryTag,
                    depth = 2,
                    isGroup = child.isGroup,
                    isDark = colors.isDark
                )
            }
            
            val singleGroupColor = groupPalette.primary

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(24.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(colors.surfaceVariant)
            ) {
                if (children.isNotEmpty() && group.totalValue > 0) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val width = size.width
                        val height = size.height
                        var currentX = width
                        
                        // RTL drawing: start from right (width) and go left
                        children.forEachIndexed { index, child ->
                            val ratio = (child.totalValue / group.totalValue).toFloat()
                            val segmentWidth = width * ratio
                            
                            val color = childColors[index]
                            
                            drawRect(
                                color = color,
                                topLeft = Offset(currentX - segmentWidth, 0f),
                                size = Size(segmentWidth, height)
                            )
                            
                            currentX -= segmentWidth
                        }
                    }
                } else {
                    // Single item group
                    Box(modifier = Modifier.fillMaxSize().background(singleGroupColor))
                }
            }
            
            // Legend for top 3 children
            if (children.isNotEmpty()) {
                val topChildren = children.take(3)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    topChildren.forEachIndexed { index, child ->
                        val childColor = childColors[index]
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                            Box(modifier = Modifier.size(8.dp).clip(RoundedCornerShape(2.dp)).background(childColor))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = child.name,
                                fontSize = 10.sp,
                                maxLines = 1,
                                color = colors.textSecondary
                            )
                        }
                    }
                }
            }
        }
    }
}
