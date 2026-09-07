package com.example.ui.dialogs

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.core.TreeEngine
import com.example.data.local.ROOT_NODE_ID
import com.example.data.model.CalculatedNode
import com.example.data.model.CurrencyUnit
import com.example.data.model.DisplaySettings
import com.example.data.model.StoredNodeEntity
import com.example.ui.theme.*
import com.example.utils.NumberFormatUtils

data class TargetParentOption(
    val id: String,
    val name: String,
    val depth: Int,
    val isGroup: Boolean,
    val isCurrentParent: Boolean,
    val isSelf: Boolean,
    val isCyclic: Boolean
)

@Composable
fun MoveNodeDialog(
    node: CalculatedNode,
    allStoredNodes: List<StoredNodeEntity>,
    calculatedTree: CalculatedNode,
    onDismiss: () -> Unit,
    onConfirmMove: (movingNodeId: String, targetParentId: String) -> Unit
) {
    val colors = AppTheme.colors
    var selectedParentId by remember { mutableStateOf(node.parentId ?: ROOT_NODE_ID) }
    var errorMsg by remember { mutableStateOf("") }

    val options = remember(node, allStoredNodes, calculatedTree) {
        val list = mutableListOf<TargetParentOption>()
        fun traverse(n: CalculatedNode, d: Int) {
            val isSelf = n.id == node.id
            val isCurrent = n.id == node.parentId
            val isCyclic = isSelf || TreeEngine.checkCycle(allStoredNodes, node.id, n.id)

            list.add(
                TargetParentOption(
                    id = n.id,
                    name = n.name,
                    depth = d,
                    isGroup = n.isGroup,
                    isCurrentParent = isCurrent,
                    isSelf = isSelf,
                    isCyclic = isCyclic
                )
            )
            n.children.forEach { traverse(it, d + 1) }
        }
        traverse(calculatedTree, 0)
        list
    }

    val selectedTarget = options.find { it.id == selectedParentId }

    fun submit() {
        if (selectedParentId == node.id) {
            errorMsg = "یک گره نمی‌تواند زیرمجموعه خودش باشد."
            return
        }
        if (selectedParentId == node.parentId) {
            errorMsg = "هم‌گروه انتخابی همان هم‌گروه فعلی است."
            return
        }
        if (selectedTarget?.isCyclic == true) {
            errorMsg = "امکان انتقال به این شاخه به دلیل ایجاد حلقه دوری نامعتبر وجود ندارد."
            return
        }

        onConfirmMove(node.id, selectedParentId)
    }

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
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.SwapHoriz, contentDescription = null, tint = colors.primary)
                        Column {
                            Text(
                                text = "انتقال شاخه / دارایی",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black,
                                color = colors.textPrimary
                            )
                            Text(
                                text = "انتقال «${node.name}» به هم‌گروه دیگر",
                                fontSize = 11.sp,
                                color = colors.textSecondary
                            )
                        }
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "بستن", tint = colors.textSecondary)
                    }
                }

                if (errorMsg.isNotEmpty()) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = colors.lossContainer
                    ) {
                        Text(
                            text = errorMsg,
                            color = colors.loss,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        )
                    }
                }

                Text(
                    text = "هم‌گروه مقصد جدید را انتخاب فرمایید:",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.textPrimary
                )

                // List of Potential Parents
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(240.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(colors.surfaceVariant)
                        .border(1.dp, colors.border, RoundedCornerShape(12.dp))
                        .padding(6.dp),
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    items(options, key = { it.id }) { opt ->
                        val isSelected = selectedParentId == opt.id
                        val isDisabled = opt.isCyclic

                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = when {
                                isSelected -> colors.primary
                                isDisabled -> colors.surfaceVariant
                                else -> Color.Transparent
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable(enabled = !isDisabled) {
                                    selectedParentId = opt.id
                                    errorMsg = ""
                                }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(
                                        start = (opt.depth * 14 + 8).dp,
                                        end = 8.dp,
                                        top = 6.dp,
                                        bottom = 6.dp
                                    ),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Folder,
                                        contentDescription = null,
                                        tint = if (isSelected) Color.White else colors.primary,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text(
                                        text = opt.name,
                                        fontSize = 11.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                        color = when {
                                            isSelected -> Color.White
                                            isDisabled -> colors.textSecondary
                                            else -> colors.textPrimary
                                        }
                                    )
                                }

                                if (opt.isSelf) {
                                    Text("خود گره", fontSize = 9.sp, color = colors.loss)
                                } else if (opt.isCyclic) {
                                    Text("حلقه نامعتبر", fontSize = 9.sp, color = colors.loss)
                                } else if (opt.isCurrentParent) {
                                    Text(
                                        text = "هم‌گروه فعلی",
                                        fontSize = 9.sp,
                                        color = if (isSelected) Color.White.copy(alpha = 0.8f) else colors.textSecondary
                                    )
                                }
                            }
                        }
                    }
                }

                // Leaf conversion alert
                if (selectedTarget != null && !selectedTarget.isGroup && selectedTarget.id != ROOT_NODE_ID) {
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = colors.primaryContainer
                    ) {
                        Text(
                            text = "نکته: هم‌گروه مقصد انتخابی یک دارایی تک است؛ پس از انتقال، به یک هم‌گروه گروهی تبدیل شده و مقدار قبلی آن به عنوان یک زیرشاخه حفظ خواهد شد.",
                            fontSize = 10.sp,
                            color = colors.onPrimaryContainer,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("انصراف", fontSize = 11.sp, color = colors.textPrimary)
                    }
                    Button(
                        onClick = { submit() },
                        enabled = selectedParentId != node.parentId && selectedTarget?.isCyclic != true,
                        colors = ButtonDefaults.buttonColors(containerColor = colors.primary, contentColor = Color.White),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("تأیید و انتقال", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun DeleteNodeDialog(
    node: CalculatedNode,
    settings: DisplaySettings,
    onDismiss: () -> Unit,
    onConfirmDelete: (nodeId: String) -> Unit
) {
    val colors = AppTheme.colors

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
                .widthIn(max = 480.dp)
                .padding(vertical = 16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(colors.lossContainer),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = null, tint = colors.loss)
                    }
                    Column {
                        Text(
                            text = "حذف گره از سبد دارایی",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Black,
                            color = colors.loss
                        )
                        Text(
                            text = node.name,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.textPrimary
                        )
                    }
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = colors.lossContainer,
                    border = androidx.compose.foundation.BorderStroke(1.dp, colors.loss.copy(alpha = 0.3f))
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        if (node.isGroup) {
                            Text(
                                text = "هشدار: با حذف این گروه، تمام ${NumberFormatUtils.toPersianDigits(node.childCount)} زیرمجموعه و شاخه وابسته به آن نیز به صورت کامل حذف خواهند شد.",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = colors.loss
                            )
                        } else {
                            Text(
                                text = "آیا از حذف کامل این دارایی به ارزش ${NumberFormatUtils.formatCurrency(node.totalValue, settings.currencyUnit, false, settings.usePersianDigits)} اطمینان دارید؟",
                                fontSize = 11.sp,
                                color = colors.loss
                            )
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("انصراف", fontSize = 11.sp, color = colors.textPrimary)
                    }
                    Button(
                        onClick = { onConfirmDelete(node.id) },
                        colors = ButtonDefaults.buttonColors(containerColor = colors.loss, contentColor = Color.White),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("حذف قطعی", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
