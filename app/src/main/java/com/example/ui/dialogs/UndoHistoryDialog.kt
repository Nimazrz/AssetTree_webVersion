package com.example.ui.dialogs

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.DisplaySettings
import com.example.data.model.UndoSnapshot
import com.example.ui.theme.AppTheme
import com.example.utils.NumberFormatUtils
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun UndoHistoryDialog(
    undoHistory: List<UndoSnapshot>,
    settings: DisplaySettings,
    onDismiss: () -> Unit,
    onConfirmRollback: (stepsCount: Int) -> Unit
) {
    val colors = AppTheme.colors

    // Checked indices (0 = newest snapshot / 1st step to undo)
    // By default, preselect the first step (the latest action)
    var selectedIndices by remember(undoHistory) {
        mutableStateOf<Set<Int>>(if (undoHistory.isNotEmpty()) setOf(0) else emptySet())
    }

    val timeFormatter = remember {
        SimpleDateFormat("HH:mm:ss", Locale.getDefault())
    }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = colors.surface,
            border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
            shadowElevation = 10.dp,
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp)
                .testTag("undo_history_dialog")
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp)
            ) {
                // Dialog Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(colors.warning.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Undo,
                                contentDescription = null,
                                tint = colors.warning,
                                modifier = Modifier.size(20.dp)
                            )
                        }

                        Column {
                            Text(
                                text = "بازگشت به قبل (تاریخچه مراحل)",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = colors.textPrimary
                            )
                            Text(
                                text = "مراحل مورد نظر برای لغو را انتخاب کنید",
                                fontSize = 11.5.sp,
                                color = colors.textSecondary
                            )
                        }
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "بستن",
                            tint = colors.textSecondary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                if (undoHistory.isEmpty()) {
                    // Empty State
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.History,
                                contentDescription = null,
                                tint = colors.textSecondary.copy(alpha = 0.6f),
                                modifier = Modifier.size(40.dp)
                            )
                            Text(
                                text = "هیچ مرحله‌ای برای بازگشت در حافظه موجود نیست.",
                                fontSize = 13.sp,
                                color = colors.textSecondary
                            )
                        }
                    }
                } else {
                    // Selection Quick Actions Bar
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(colors.surfaceVariant, RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        val countText = if (settings.usePersianDigits) {
                            NumberFormatUtils.toPersianDigits(undoHistory.size.toString())
                        } else {
                            undoHistory.size.toString()
                        }
                        Text(
                            text = "تعداد کل مراحل: $countText",
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Medium,
                            color = colors.textSecondary
                        )

                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            // Select All
                            TextButton(
                                onClick = {
                                    selectedIndices = undoHistory.indices.toSet()
                                },
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = "انتخاب همه",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = colors.primary
                                )
                            }

                            // Deselect All
                            TextButton(
                                onClick = {
                                    selectedIndices = emptySet<Int>()
                                },
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = "لغو انتخاب",
                                    fontSize = 11.sp,
                                    color = colors.textSecondary
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Steps List with Checkboxes
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 280.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        itemsIndexed(undoHistory) { index, snapshot ->
                            val isChecked = selectedIndices.contains(index)
                            val stepNumber = index + 1
                            val formattedTime = try {
                                timeFormatter.format(Date(snapshot.timestamp))
                            } catch (e: Exception) {
                                ""
                            }

                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = if (isChecked) colors.primary.copy(alpha = 0.08f) else colors.surfaceVariant,
                                border = androidx.compose.foundation.BorderStroke(
                                    1.dp,
                                    if (isChecked) colors.primary.copy(alpha = 0.5f) else colors.border
                                ),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        selectedIndices = if (isChecked) {
                                            selectedIndices.filter { it < index }.toSet()
                                        } else {
                                            (0..index).toSet()
                                        }
                                    }
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 10.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Checkbox(
                                        checked = isChecked,
                                        onCheckedChange = { checked ->
                                            selectedIndices = if (checked) {
                                                (0..index).toSet()
                                            } else {
                                                selectedIndices.filter { it < index }.toSet()
                                            }
                                        },
                                        colors = CheckboxDefaults.colors(
                                            checkedColor = colors.primary,
                                            checkmarkColor = Color.White
                                        ),
                                        modifier = Modifier.size(24.dp)
                                    )

                                    Column(modifier = Modifier.weight(1f)) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            val stepLabel = if (index == 0) {
                                                "مرحله ۱ (آخرین تغییر)"
                                            } else {
                                                val numStr = if (settings.usePersianDigits) {
                                                    NumberFormatUtils.toPersianDigits(stepNumber.toString())
                                                } else {
                                                    stepNumber.toString()
                                                }
                                                "مرحله $numStr"
                                            }

                                            Surface(
                                                shape = RoundedCornerShape(4.dp),
                                                color = if (index == 0) colors.warning.copy(alpha = 0.2f) else colors.surface
                                            ) {
                                                Text(
                                                    text = stepLabel,
                                                    fontSize = 10.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = if (index == 0) colors.warning else colors.textSecondary,
                                                    modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                                                )
                                            }

                                            if (formattedTime.isNotEmpty()) {
                                                val timeStr = if (settings.usePersianDigits) {
                                                    NumberFormatUtils.toPersianDigits(formattedTime)
                                                } else {
                                                    formattedTime
                                                }
                                                Text(
                                                    text = timeStr,
                                                    fontSize = 10.sp,
                                                    color = colors.textSecondary
                                                )
                                            }
                                        }

                                        Spacer(modifier = Modifier.height(2.dp))

                                        Text(
                                            text = snapshot.title,
                                            fontSize = 12.5.sp,
                                            fontWeight = if (isChecked) FontWeight.Bold else FontWeight.Normal,
                                            color = colors.textPrimary,
                                            maxLines = 1
                                        )

                                        val nodesCountStr = if (settings.usePersianDigits) {
                                            NumberFormatUtils.toPersianDigits(snapshot.nodeCount.toString())
                                        } else {
                                            snapshot.nodeCount.toString()
                                        }
                                        Text(
                                            text = "وضعیت: $nodesCountStr قلم دارایی در درخت",
                                            fontSize = 10.5.sp,
                                            color = colors.textSecondary
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Selected Steps Count & Action Buttons
                    val maxSelectedStep = if (selectedIndices.isNotEmpty()) {
                        selectedIndices.maxOrNull()?.plus(1) ?: 0
                    } else {
                        0
                    }

                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = colors.surfaceVariant,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 10.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "مراحل انتخابی برای بازگشت:",
                                fontSize = 12.sp,
                                color = colors.textSecondary
                            )
                            val stepCountDisplay = if (settings.usePersianDigits) {
                                NumberFormatUtils.toPersianDigits(maxSelectedStep.toString())
                            } else {
                                maxSelectedStep.toString()
                            }
                            Text(
                                text = "$stepCountDisplay مرحله",
                                fontSize = 12.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (maxSelectedStep > 0) colors.warning else colors.textSecondary
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Bottom Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(
                            text = "انصراف",
                            fontSize = 13.sp,
                            color = colors.textSecondary
                        )
                    }

                    val maxSelectedStep = if (selectedIndices.isNotEmpty()) {
                        selectedIndices.maxOrNull()?.plus(1) ?: 0
                    } else {
                        0
                    }

                    Button(
                        onClick = {
                            if (maxSelectedStep > 0) {
                                onConfirmRollback(maxSelectedStep)
                            }
                        },
                        enabled = maxSelectedStep > 0,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colors.warning,
                            contentColor = Color.White,
                            disabledContainerColor = colors.border,
                            disabledContentColor = colors.textSecondary
                        ),
                        modifier = Modifier
                            .weight(1.3f)
                            .testTag("confirm_undo_btn"),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Undo,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = if (maxSelectedStep > 0) "بازگشت ($maxSelectedStep مرحله)" else "انتخاب مرحله",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}
