package com.example.ui.dialogs

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.window.Dialog
import com.example.core.TreeEngine
import com.example.data.model.CalculatedNode
import com.example.data.model.CurrencyUnit
import com.example.data.model.DisplaySettings
import com.example.ui.theme.*
import com.example.utils.NumberFormatUtils

@Composable
fun NodeDetailsDialog(
    node: CalculatedNode,
    settings: DisplaySettings,
    onDismiss: () -> Unit,
    onOpenAddChild: (CalculatedNode) -> Unit,
    onOpenEdit: (CalculatedNode) -> Unit,
    onOpenMove: (CalculatedNode) -> Unit,
    onOpenDelete: (CalculatedNode) -> Unit
) {
    val colors = AppTheme.colors
    val isRoot = TreeEngine.isRootNode(node.id, node.parentId)

    Dialog(
        onDismissRequest = onDismiss,
        properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = colors.surface),
            border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .widthIn(max = 520.dp)
                .padding(vertical = 16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Dialog Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(colors.primaryContainer),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (node.isGroup) Icons.Default.Folder else Icons.Default.MonetizationOn,
                                contentDescription = null,
                                tint = colors.primary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Column {
                            Text(
                                text = node.name,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black,
                                color = colors.textPrimary
                            )
                            Text(
                                text = if (isRoot) "ریشه اصلی سبد" else if (node.isGroup) "هم‌گروه / گروه دارایی" else "دارایی مستقل (${node.unit})",
                                fontSize = 11.sp,
                                color = colors.textSecondary
                            )
                        }
                    }

                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "بستن", tint = colors.textSecondary)
                    }
                }

                // Main Value Card
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = colors.surfaceVariant),
                    border = androidx.compose.foundation.BorderStroke(1.dp, colors.border)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = "ارزش کل برآورد شده:",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.textSecondary
                        )
                        Text(
                            text = NumberFormatUtils.formatCurrency(
                                node.totalValue,
                                settings.currencyUnit,
                                false,
                                settings.usePersianDigits,
                                privacyMode = settings.privacyMode
                            ),
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Black,
                            color = colors.textPrimary
                        )
                    }
                }

                // Metrics Breakdown Grid
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = colors.gainContainer,
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text("درصد از کل سبد:", fontSize = 10.sp, color = colors.textSecondary)
                            Text(
                                text = NumberFormatUtils.formatPercentage(
                                    if (isRoot) 100.0 else node.percentOfTotal,
                                    settings.decimalPlaces,
                                    settings.usePersianDigits
                                ),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Black,
                                color = colors.gain
                            )
                        }
                    }

                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = colors.primaryContainer,
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text("درصد از هم‌گروه:", fontSize = 10.sp, color = colors.textSecondary)
                            Text(
                                text = NumberFormatUtils.formatPercentage(
                                    if (isRoot) 100.0 else node.percentOfGroup,
                                    settings.decimalPlaces,
                                    settings.usePersianDigits
                                ),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Black,
                                color = colors.primary
                            )
                        }
                    }
                }

                // Item Specifications Table
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = colors.surfaceVariant,
                    border = androidx.compose.foundation.BorderStroke(1.dp, colors.border)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(10.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        if (!node.isGroup && !isRoot) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("تعداد / مقدار:", fontSize = 11.sp, color = colors.textSecondary)
                                Text(
                                    text = "${NumberFormatUtils.formatNumberWithCommas(node.quantity, settings.usePersianDigits)} ${node.unit}",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = colors.textPrimary
                                )
                            }
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("قیمت واحد:", fontSize = 11.sp, color = colors.textSecondary)
                                Text(
                                    text = NumberFormatUtils.formatCurrency(
                                        node.unitPrice,
                                        settings.currencyUnit,
                                        false,
                                        settings.usePersianDigits,
                                        privacyMode = settings.privacyMode
                                    ),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = colors.textPrimary
                                )
                            }
                        } else {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("تعداد زیرمجموعه‌های مستقیم:", fontSize = 11.sp, color = colors.textSecondary)
                                Text(
                                    text = "${NumberFormatUtils.toPersianDigits(node.children.size)} شاخه",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = colors.textPrimary
                                )
                            }
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("تعداد کل گره‌های زیرشاخه:", fontSize = 11.sp, color = colors.textSecondary)
                                Text(
                                    text = "${NumberFormatUtils.toPersianDigits(node.childCount)} گره",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = colors.textPrimary
                                )
                            }
                        }
                    }
                }

                // Action Buttons
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = {
                            onDismiss()
                            onOpenAddChild(node)
                        },
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = colors.primary, contentColor = Color.White),
                        modifier = Modifier.fillMaxWidth().height(42.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("افزودن زیرمجموعه به این شاخه", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    if (!isRoot) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            OutlinedButton(
                                onClick = {
                                    onDismiss()
                                    onOpenEdit(node)
                                },
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f).height(38.dp)
                            ) {
                                Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("ویرایش", fontSize = 11.sp, color = colors.textPrimary)
                            }

                            OutlinedButton(
                                onClick = {
                                    onDismiss()
                                    onOpenMove(node)
                                },
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f).height(38.dp)
                            ) {
                                Icon(Icons.Default.SwapHoriz, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("انتقال", fontSize = 11.sp, color = colors.textPrimary)
                            }

                            OutlinedButton(
                                onClick = {
                                    onDismiss()
                                    onOpenDelete(node)
                                },
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = colors.loss),
                                modifier = Modifier.weight(1f).height(38.dp)
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("حذف", fontSize = 11.sp, color = colors.loss)
                            }
                        }
                    }
                }
            }
        }
    }
}
