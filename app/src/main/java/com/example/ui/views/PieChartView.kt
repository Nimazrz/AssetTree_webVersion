package com.example.ui.views

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
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
import com.example.data.model.AppViewMode
import com.example.data.model.CalculatedNode
import com.example.data.model.DisplaySettings
import com.example.ui.components.SharedViewHeader
import com.example.ui.theme.AppTheme
import com.example.utils.AssetColorUtils
import com.example.utils.NumberFormatUtils
import kotlin.math.cos
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextAlign
import kotlin.math.PI
import kotlin.math.sin

data class PieSlice(
    val node: CalculatedNode,
    val startAngle: Float,
    val sweepAngle: Float,
    val color: Color
)

@Composable
fun PieChartView(
    activeView: AppViewMode,
    settings: DisplaySettings,
    onSelectView: (AppViewMode) -> Unit,
    rootCalculated: CalculatedNode,
    onSelectNodeDetails: (CalculatedNode) -> Unit
) {
    val colors = AppTheme.colors
    val textMeasurer = rememberTextMeasurer()
    var selectedNode by remember { mutableStateOf<CalculatedNode?>(null) }
    
    val topLevelNodes = remember(rootCalculated) {
        rootCalculated.children.sortedByDescending { it.totalValue }
    }
    
    val pieSlices = remember(topLevelNodes, settings.customAssetColors) {
        val total = topLevelNodes.sumOf { it.totalValue }
        val slices = mutableListOf<PieSlice>()
        var currentAngle = -90f
        
        topLevelNodes.forEach { node ->
            val sweep = if (total > 0) (node.totalValue / total).toFloat() * 360f else 0f
            val color = AssetColorUtils.getNodeShadedColor(settings.customAssetColors, node.name, node.categoryTag, 1, node.isGroup, colors.isDark)
            slices.add(PieSlice(node, currentAngle, sweep, color))
            currentAngle += sweep
        }
        slices
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
    ) {
        SharedViewHeader(
            activeView = activeView,
            settings = settings,
            onSelectView = onSelectView,
            showSearchAndSort = false
        )

        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize().aspectRatio(1f)) {
                val radius = size.minDimension / 2.2f
                val center = Offset(size.width / 2, size.height / 2)
                
                pieSlices.forEach { slice ->
                    drawArc(
                        color = slice.color,
                        startAngle = slice.startAngle,
                        sweepAngle = slice.sweepAngle,
                        useCenter = true,
                        topLeft = Offset(center.x - radius, center.y - radius),
                        size = Size(radius * 2, radius * 2)
                    )
                    
                    if (slice.sweepAngle > 5f) {
                        val angleInRadians = (slice.startAngle + slice.sweepAngle / 2) * (PI / 180f)
                        val textRadius = radius * 0.65f
                        val textX = center.x + textRadius * cos(angleInRadians).toFloat()
                        val textY = center.y + textRadius * sin(angleInRadians).toFloat()
                        
                        val percent = slice.sweepAngle / 360f
                        // Scale font based on slice percentage
                        val fontSize = (percent * 60f).coerceIn(4f, 32f).sp
                        val percentFontSize = (percent * 70f).coerceIn(4.5f, 38f).sp
                        
                        val nameText = slice.node.name
                        val percentText = NumberFormatUtils.formatPercentage(slice.node.percentOfTotal, 1, settings.usePersianDigits)
                        
                        val nameLayout = textMeasurer.measure(
                            text = nameText,
                            style = TextStyle(fontSize = fontSize, fontWeight = FontWeight.Bold, color = Color.White, textAlign = TextAlign.Center)
                        )
                        val percentLayout = textMeasurer.measure(
                            text = percentText,
                            style = TextStyle(fontSize = percentFontSize, fontWeight = FontWeight.Bold, color = Color.White, textAlign = TextAlign.Center)
                        )
                        
                        drawText(
                            textLayoutResult = nameLayout,
                            topLeft = Offset(textX - nameLayout.size.width / 2f, textY - nameLayout.size.height)
                        )
                        drawText(
                            textLayoutResult = percentLayout,
                            topLeft = Offset(textX - percentLayout.size.width / 2f, textY + 2f)
                        )
                    }
                }
            }
        }

        // Legend (descending order)
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = colors.surface),
            border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp)
        ) {
            Column(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                pieSlices.forEach { slice ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedNode = slice.node }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = NumberFormatUtils.formatPercentage(slice.node.percentOfTotal, 1, settings.usePersianDigits),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = colors.textSecondary,
                                modifier = Modifier.width(48.dp)
                            )
                            Text(
                                text = slice.node.name,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = colors.textPrimary
                            )
                        }
                        Box(
                            modifier = Modifier
                                .size(14.dp)
                                .clip(CircleShape)
                                .background(slice.color)
                        )
                    }
                }
            }
        }
        
        AnimatedVisibility(
            visible = selectedNode != null,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            val node = selectedNode ?: return@AnimatedVisibility
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = colors.surfaceVariant),
                modifier = Modifier.fillMaxWidth().padding(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(node.name, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                        Text(
                            text = "ارزش: " + NumberFormatUtils.formatCurrency(node.totalValue, settings.currencyUnit, false, settings.usePersianDigits, settings.privacyMode),
                            fontSize = 12.sp,
                            color = colors.textSecondary
                        )
                    }
                    FilledTonalButton(onClick = { onSelectNodeDetails(node) }) {
                        Icon(Icons.Default.Info, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("مشخصات")
                    }
                }
            }
        }
    }
}
