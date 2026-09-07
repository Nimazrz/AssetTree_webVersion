package com.example.ui.views

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.core.TreeEngine
import com.example.data.local.ROOT_NODE_ID
import com.example.data.model.CalculatedNode
import com.example.data.model.DisplaySettings
import com.example.ui.theme.*
import com.example.utils.NumberFormatUtils
import com.example.ui.components.SharedViewHeader

@Composable
fun AnalyticsDashboardView(
    activeView: com.example.data.model.AppViewMode,
    onSelectView: (com.example.data.model.AppViewMode) -> Unit,
    rootCalculated: CalculatedNode,
    allCalculated: List<CalculatedNode>,
    settings: DisplaySettings,
    onSelectNodeDetails: (CalculatedNode) -> Unit
) {
    val colors = AppTheme.colors
    val health = TreeEngine.performTreeHealthCheck(rootCalculated)

    // Filter individual assets (leaves)
    val individualAssets = allCalculated
        .filter { !it.isGroup && it.id != ROOT_NODE_ID }
        .sortedByDescending { it.totalValue }

    // Filter group categories
    val groupNodes = allCalculated
        .filter { it.isGroup && it.id != ROOT_NODE_ID }
        .sortedByDescending { it.totalValue }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        SharedViewHeader(activeView = activeView, onSelectView = onSelectView, settings = settings, showSearchAndSort = false)
        // Section 1: Top Assets Cards Grid
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
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
                        imageVector = Icons.Default.EmojiEvents,
                        contentDescription = null,
                        tint = colors.primary,
                        modifier = Modifier.size(16.dp)
                    )
                }
                Text(
                    text = "دارایی‌های برتر از نظر ارزش کل",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.textPrimary
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                individualAssets.take(2).forEachIndexed { idx, asset ->
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = colors.surface),
                        border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
                        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onSelectNodeDetails(asset) }
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "${NumberFormatUtils.toPersianDigits(idx + 1)}. ${asset.name}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Black,
                                    color = colors.textPrimary,
                                    maxLines = 1,
                                    modifier = Modifier.weight(1f)
                                )
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = colors.gainContainer
                                ) {
                                    Text(
                                        text = NumberFormatUtils.formatPercentage(
                                            asset.percentOfTotal,
                                            settings.decimalPlaces,
                                            settings.usePersianDigits
                                        ),
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = colors.gain,
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                    )
                                }
                            }

                            Text(
                                text = NumberFormatUtils.formatCurrency(
                                    asset.totalValue,
                                    settings.currencyUnit,
                                    compact = false,
                                    usePersianDigits = settings.usePersianDigits
                                ),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Black,
                                color = colors.textPrimary
                            )

                            HorizontalDivider(color = colors.border)

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "${NumberFormatUtils.formatNumberWithCommas(asset.quantity, settings.usePersianDigits)} ${asset.unit}",
                                    fontSize = 10.sp,
                                    color = colors.textSecondary
                                )
                                Text(
                                    text = NumberFormatUtils.formatCurrency(
                                        asset.totalValue,
                                        settings.currencyUnit,
                                        compact = true,
                                        usePersianDigits = settings.usePersianDigits
                                    ),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = colors.primary
                                )
                            }
                        }
                    }
                }
            }
        }

        // Section 2: Mathematical Integrity & Bottom-Up Calculation Report
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = colors.surface),
            border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(24.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(colors.gainContainer),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.VerifiedUser,
                            contentDescription = null,
                            tint = colors.gain,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Text(
                        text = "گزارش صحت ریاضی و محاسبات پایین به بالا (Bottom-Up)",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.textPrimary
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = colors.surfaceVariant,
                        border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Text("ارزش ریشه سبد:", fontSize = 10.sp, color = colors.textSecondary)
                            Text(
                                text = NumberFormatUtils.formatCurrency(
                                    health.rootTotal,
                                    settings.currencyUnit,
                                    compact = true,
                                    usePersianDigits = settings.usePersianDigits
                                ),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = colors.textPrimary
                            )
                        }
                    }

                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = colors.surfaceVariant,
                        border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Text("مجموع مستقیم شاخه‌ها:", fontSize = 10.sp, color = colors.textSecondary)
                            Text(
                                text = NumberFormatUtils.formatCurrency(
                                    health.directChildrenSum,
                                    settings.currencyUnit,
                                    compact = true,
                                    usePersianDigits = settings.usePersianDigits
                                ),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = colors.textPrimary
                            )
                        }
                    }

                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = if (health.isValid) colors.gainContainer else colors.lossContainer,
                        border = androidx.compose.foundation.BorderStroke(1.dp, if (health.isValid) colors.gain.copy(alpha = 0.3f) else colors.loss.copy(alpha = 0.3f)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Text("مغایرت حسابی:", fontSize = 10.sp, color = if (health.isValid) colors.gain else colors.loss)
                            Text(
                                text = if (health.isValid) "صفر ریال (تراز کامل)" else "${NumberFormatUtils.formatNumberWithCommas(health.discrepancy, settings.usePersianDigits)} ریال",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                color = if (health.isValid) colors.gain else colors.loss
                            )
                        }
                    }
                }
            }
        }

        // Section 3: All Individual Assets Ranking Table
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = colors.surface),
            border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Table Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(colors.surfaceVariant)
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "جدول رتبه‌بندی تمام دارایی‌های انفرادی (${NumberFormatUtils.toPersianDigits(individualAssets.size)} قلم)",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.textPrimary
                    )
                }

                HorizontalDivider(color = colors.border)

                // Table Rows
                Column(
                    modifier = Modifier.padding(6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    individualAssets.forEachIndexed { idx, asset ->
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = if (idx % 2 == 0) colors.surfaceVariant else colors.surface,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelectNodeDetails(asset) }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 8.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text(
                                        text = "${NumberFormatUtils.toPersianDigits(idx + 1)}.",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = colors.textSecondary
                                    )
                                    Column {
                                        Text(
                                            text = asset.name,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = colors.textPrimary,
                                            maxLines = 1
                                        )
                                        Text(
                                            text = "${NumberFormatUtils.formatNumberWithCommas(asset.quantity, settings.usePersianDigits)} ${asset.unit}",
                                            fontSize = 10.sp,
                                            color = colors.textSecondary
                                        )
                                    }
                                }

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text(
                                        text = NumberFormatUtils.formatCurrency(
                                            asset.totalValue,
                                            settings.currencyUnit,
                                            compact = true,
                                            usePersianDigits = settings.usePersianDigits
                                        ),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = colors.textPrimary
                                    )

                                    Surface(
                                        shape = RoundedCornerShape(4.dp),
                                        color = colors.gainContainer
                                    ) {
                                        Text(
                                            text = NumberFormatUtils.formatPercentage(
                                                asset.percentOfTotal,
                                                settings.decimalPlaces,
                                                settings.usePersianDigits
                                            ),
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = colors.gain,
                                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Section 4: Group Allocations Table
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = colors.surface),
            border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(colors.surfaceVariant)
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "تفکیک سهم گروه‌ها و صنایع (${NumberFormatUtils.toPersianDigits(groupNodes.size)} گروه)",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.textPrimary
                    )
                }

                HorizontalDivider(color = colors.border)

                Column(
                    modifier = Modifier.padding(6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    groupNodes.forEach { group ->
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = colors.surfaceVariant,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelectNodeDetails(group) }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 8.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = group.name,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = colors.textPrimary
                                    )
                                    Text(
                                        text = "${NumberFormatUtils.toPersianDigits(group.children.size)} زیرمجموعه",
                                        fontSize = 10.sp,
                                        color = colors.textSecondary
                                    )
                                }

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text(
                                        text = NumberFormatUtils.formatCurrency(
                                            group.totalValue,
                                            settings.currencyUnit,
                                            compact = true,
                                            usePersianDigits = settings.usePersianDigits
                                        ),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = colors.textPrimary
                                    )

                                    Surface(
                                        shape = RoundedCornerShape(4.dp),
                                        color = colors.primaryContainer
                                    ) {
                                        Text(
                                            text = NumberFormatUtils.formatPercentage(
                                                group.percentOfTotal,
                                                settings.decimalPlaces,
                                                settings.usePersianDigits
                                            ),
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = colors.primary,
                                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
