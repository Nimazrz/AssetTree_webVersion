package com.example.ui.dialogs

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.CalculatedNode
import com.example.data.model.CurrencyUnit
import com.example.data.model.DisplaySettings
import com.example.ui.theme.*
import com.example.utils.NumberFormatUtils

@Composable
fun EditNodeDialog(
    node: CalculatedNode,
    settings: DisplaySettings,
    onDismiss: () -> Unit,
    onConfirmSave: (nodeId: String, name: String, quantity: Double, unit: String, unitPrice: Double) -> Unit
) {
    val colors = AppTheme.colors

    var name by remember { mutableStateOf(node.name) }
    var quantityStr by remember { mutableStateOf(if (node.quantity % 1.0 == 0.0) node.quantity.toLong().toString() else node.quantity.toString()) }
    var unit by remember { mutableStateOf(node.unit) }
    var unitPriceStr by remember { mutableStateOf(if (node.unitPrice % 1.0 == 0.0) node.unitPrice.toLong().toString() else node.unitPrice.toString()) }
    var errorMsg by remember { mutableStateOf("") }

    val parsedUnitPrice = unitPriceStr.replace(",", "").replace("،", "").replace(" ", "").toDoubleOrNull() ?: 0.0
    val parsedQuantity = quantityStr.replace(",", "").replace("،", "").replace(" ", "").toDoubleOrNull() ?: 0.0

    fun submit() {
        if (name.isBlank()) {
            errorMsg = "نام دارایی نمی‌تواند خالی باشد"
            return
        }
        if (!node.isGroup && (parsedQuantity <= 0 || parsedUnitPrice < 0)) {
            errorMsg = "مقادیر وارد شده نامعتبر است"
            return
        }

        onConfirmSave(
            node.id,
            name.trim(),
            if (node.isGroup) 1.0 else parsedQuantity,
            unit.trim(),
            if (node.isGroup) node.unitPrice else parsedUnitPrice
        )
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
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = null, tint = colors.primary)
                        Text(
                            text = "ویرایش دارایی / هم‌گروه",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black,
                            color = colors.textPrimary
                        )
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

                val inputColors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = colors.inputText,
                    unfocusedTextColor = colors.inputText,
                    focusedLabelColor = colors.primary,
                    unfocusedLabelColor = colors.textSecondary,
                    focusedContainerColor = colors.inputBackground,
                    unfocusedContainerColor = colors.inputBackground,
                    focusedBorderColor = colors.primary,
                    unfocusedBorderColor = colors.border,
                    cursorColor = colors.inputText
                )

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it; errorMsg = "" },
                    label = { Text("نام دارایی یا گروه", fontSize = 11.sp) },
                    textStyle = LocalTextStyle.current.copy(color = colors.inputText),
                    colors = inputColors,
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                if (!node.isGroup) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = quantityStr,
                            onValueChange = { quantityStr = it; errorMsg = "" },
                            label = { Text("تعداد / مقدار", fontSize = 11.sp) },
                            textStyle = LocalTextStyle.current.copy(color = colors.inputText),
                            colors = inputColors,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        )

                        OutlinedTextField(
                            value = unit,
                            onValueChange = { unit = it; errorMsg = "" },
                            label = { Text("واحد شمارش", fontSize = 11.sp) },
                            textStyle = LocalTextStyle.current.copy(color = colors.inputText),
                            colors = inputColors,
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        )
                    }

                    OutlinedTextField(
                        value = unitPriceStr,
                        onValueChange = { unitPriceStr = it; errorMsg = "" },
                        label = { Text("قیمت واحد (ریال)", fontSize = 11.sp) },
                        textStyle = LocalTextStyle.current.copy(color = colors.inputText),
                        colors = inputColors,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = colors.surfaceVariant,
                        border = androidx.compose.foundation.BorderStroke(1.dp, colors.border)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("ارزش کل جدید:", fontSize = 11.sp, color = colors.textSecondary)
                            Text(
                                text = NumberFormatUtils.formatCurrency(
                                    parsedQuantity * parsedUnitPrice,
                                    settings.currencyUnit,
                                    false,
                                    settings.usePersianDigits
                                ),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = colors.textPrimary
                            )
                        }
                    }
                } else {
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = colors.primaryContainer
                    ) {
                        Text(
                            text = "این مورد یک هم‌گروه است. ارزش و تعداد آن به صورت خودکار از مجموع زیرشاخه‌ها محاسبه می‌شود.",
                            fontSize = 11.sp,
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
                        colors = ButtonDefaults.buttonColors(containerColor = colors.primary, contentColor = Color.White),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("ذخیره تغییرات", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
