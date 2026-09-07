package com.example.ui.dialogs

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.core.TreeEngine
import com.example.data.model.AssetTemplateItem
import com.example.data.model.CalculatedNode
import com.example.data.model.CurrencyUnit
import com.example.data.model.DefaultAssetTemplates
import com.example.data.model.DisplaySettings
import com.example.ui.theme.*
import com.example.utils.NumberFormatUtils
import kotlin.math.abs

@Composable
fun AddChildDialog(
    parentNode: CalculatedNode,
    settings: DisplaySettings,
    onDismiss: () -> Unit,
    onConfirmAddChild: (parentId: String, name: String, unitPrice: Double, quantity: Double, unit: String) -> Unit
) {
    val colors = AppTheme.colors

    // Available asset template items (36 default + custom additions in memory/session)
    var assetTemplates by remember { mutableStateOf(DefaultAssetTemplates.items + DefaultAssetTemplates.customItems) }

    // 1) Name
    var name by remember { mutableStateOf("") }
    // 2) Unit Price (Rial)
    var unitPriceStr by remember { mutableStateOf("") }
    // 3) Quantity
    var quantityStr by remember { mutableStateOf("1") }
    // 4) Unit
    var unit by remember { mutableStateOf("عدد") }

    var hasManuallyEditedQty by remember { mutableStateOf(false) }
    var showWarningConfirmation by remember { mutableStateOf(false) }
    var errorMsg by remember { mutableStateOf("") }

    // Modals
    var showAssetPickerModal by remember { mutableStateOf(false) }
    var showNewTemplateModal by remember { mutableStateOf(false) }
    var assetSearchQuery by remember { mutableStateOf("") }

    var newCustomAssetName by remember { mutableStateOf("") }
    var newCustomAssetUnit by remember { mutableStateOf("") }

    val commonUnits = remember {
        mutableStateListOf(
            "عدد", "گرم", "کیلوگرم", "متر مربع", "دستگاه", "سهم", "واحد",
            "دلار", "یورو", "ریال", "تومان", "بشکه", "رأس", "قطعه", "USDT"
        )
    }

    val parsedUnitPrice = unitPriceStr.replace(",", "").replace("،", "").replace(" ", "").toDoubleOrNull() ?: 0.0
    val parsedQuantity = quantityStr.replace(",", "").replace("،", "").replace(" ", "").toDoubleOrNull() ?: 0.0

    // Smart default quantity calculation when unitPrice is entered
    LaunchedEffect(parsedUnitPrice) {
        if (parsedUnitPrice > 0 && !hasManuallyEditedQty) {
            val smartQ = TreeEngine.calculateSmartDefaultQuantity(parentNode, parsedUnitPrice)
            if (smartQ > 0) {
                quantityStr = if (smartQ % 1.0 == 0.0) smartQ.toLong().toString() else String.format("%.2f", smartQ)
            }
        }
    }

    val currentChildTotal = parsedQuantity * parsedUnitPrice

    fun willChangeParentTotal(): Boolean {
        if (parentNode.totalValue <= 0.0) return false
        val existingSum = parentNode.children.sumOf { it.totalValue }
        val newSum = existingSum + currentChildTotal
        return abs(newSum - parentNode.totalValue) > 100.0
    }

    fun submit() {
        if (name.isBlank()) {
            errorMsg = "لطفاً نام دارایی را وارد یا از لیست انتخاب کنید"
            return
        }
        if (parsedUnitPrice < 0.0 || parsedQuantity <= 0.0) {
            errorMsg = "تعداد و قیمت واحد باید بزرگتر از صفر باشند"
            return
        }

        if (hasManuallyEditedQty && willChangeParentTotal() && !showWarningConfirmation) {
            showWarningConfirmation = true
            return
        }

        onConfirmAddChild(parentNode.id, name.trim(), parsedUnitPrice, parsedQuantity, unit.trim())
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
                .widthIn(max = 540.dp)
                .padding(vertical = 16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
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
                        Icon(
                            imageVector = Icons.Default.AddCircle,
                            contentDescription = null,
                            tint = colors.primary,
                            modifier = Modifier.size(24.dp)
                        )
                        Column {
                            Text(
                                text = "افزودن زیرمجموعه",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Black,
                                color = colors.textPrimary
                            )
                            Text(
                                text = "به هم‌گروه: ${parentNode.name}",
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

                if (showWarningConfirmation) {
                    // Warning View
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = colors.lossContainer)
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(Icons.Default.Warning, contentDescription = null, tint = colors.loss)
                                Text("هشدار تغییر ارزش هم‌گروه", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = colors.loss)
                            }
                            Text(
                                text = "با این تعداد، ارزش کل هم‌گروه «${parentNode.name}» از مبلغ قبلی (${NumberFormatUtils.formatCurrency(parentNode.totalValue, settings.currencyUnit, false, settings.usePersianDigits)}) به مبلغ جدید تغییر خواهد کرد. آیا مایل به تأیید هستید؟",
                                fontSize = 11.sp,
                                color = colors.loss
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = { showWarningConfirmation = false },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("بازگشت و اصلاح", fontSize = 11.sp, color = colors.textPrimary)
                        }
                        Button(
                            onClick = {
                                onConfirmAddChild(parentNode.id, name.trim(), parsedUnitPrice, parsedQuantity, unit.trim())
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = colors.primary, contentColor = Color.White),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("تأیید و ذخیره", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                } else {
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

                    // 1) Name + Predefined List Dropdown Button
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it; errorMsg = "" },
                            label = { Text("۱. نام دارایی / کالا / سهم *", fontSize = 11.sp) },
                            placeholder = { Text("تایپ نام یا انتخاب از لیست پیش‌فرض...", fontSize = 11.sp, color = colors.textSecondary) },
                            textStyle = LocalTextStyle.current.copy(color = colors.inputText, fontSize = 12.sp),
                            colors = inputColors,
                            singleLine = true,
                            trailingIcon = {
                                IconButton(onClick = { showAssetPickerModal = true }) {
                                    Icon(
                                        imageVector = Icons.Default.ListAlt,
                                        contentDescription = "انتخاب از ۳۶ دارایی پیش‌فرض",
                                        tint = colors.primary
                                    )
                                }
                            },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        )

                        // Quick action link to pick from 36 items or add custom
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            TextButton(
                                onClick = { showAssetPickerModal = true },
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 0.dp)
                            ) {
                                Icon(Icons.Default.FormatListBulleted, contentDescription = null, modifier = Modifier.size(14.dp), tint = colors.primary)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("انتخاب از لیست اقلام پیش‌فرض (سکه، طلا، مس، ملک...)", fontSize = 10.sp, color = colors.primary)
                            }

                            TextButton(
                                onClick = { showNewTemplateModal = true },
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 0.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp), tint = colors.primary)
                                Spacer(modifier = Modifier.width(2.dp))
                                Text("تعریف دارایی جدید", fontSize = 10.sp, color = colors.primary)
                            }
                        }
                    }

                    // 2) Unit Price (in Rials)
                    OutlinedTextField(
                        value = unitPriceStr,
                        onValueChange = { unitPriceStr = it; errorMsg = "" },
                        label = { Text("۲. قیمت واحد (به ریال) *", fontSize = 11.sp) },
                        placeholder = { Text("مثال: 54000000", fontSize = 11.sp, color = colors.textSecondary) },
                        textStyle = LocalTextStyle.current.copy(color = colors.inputText, fontSize = 12.sp),
                        colors = inputColors,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (parsedUnitPrice > 0) {
                        Text(
                            text = "معادل: " + NumberFormatUtils.formatCurrency(parsedUnitPrice, CurrencyUnit.TOMAN, false, settings.usePersianDigits),
                            fontSize = 10.sp,
                            color = colors.primary,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    // 3) Quantity
                    OutlinedTextField(
                        value = quantityStr,
                        onValueChange = {
                            quantityStr = it
                            hasManuallyEditedQty = true
                            errorMsg = ""
                        },
                        label = { Text("۳. تعداد / مقدار *", fontSize = 11.sp) },
                        placeholder = { Text("مثال: 10", fontSize = 11.sp, color = colors.textSecondary) },
                        textStyle = LocalTextStyle.current.copy(color = colors.inputText, fontSize = 12.sp),
                        colors = inputColors,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    // 4) Unit & Quick Selectable Pills
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        OutlinedTextField(
                            value = unit,
                            onValueChange = { unit = it; errorMsg = "" },
                            label = { Text("۴. واحد شمارش *", fontSize = 11.sp) },
                            textStyle = LocalTextStyle.current.copy(color = colors.inputText, fontSize = 12.sp),
                            colors = inputColors,
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        )

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            commonUnits.forEach { u ->
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = if (unit == u) colors.primary else colors.surfaceVariant,
                                    modifier = Modifier.clickable { unit = u }
                                ) {
                                    Text(
                                        text = u,
                                        fontSize = 10.sp,
                                        fontWeight = if (unit == u) FontWeight.Bold else FontWeight.Normal,
                                        color = if (unit == u) Color.White else colors.textPrimary,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }
                    }

                    // Live Total Preview
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = colors.surfaceVariant,
                        border = androidx.compose.foundation.BorderStroke(1.dp, colors.border)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("ارزش این قلم:", fontSize = 11.sp, color = colors.textSecondary)
                            Text(
                                text = NumberFormatUtils.formatCurrency(
                                    currentChildTotal,
                                    settings.currencyUnit,
                                    false,
                                    settings.usePersianDigits
                                ),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Black,
                                color = colors.textPrimary
                            )
                        }
                    }

                    // Action Buttons
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
                            modifier = Modifier.weight(1.3f)
                        ) {
                            Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("افزودن به شاخه", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }

    // Modal: 36 Predefined Assets Selector
    if (showAssetPickerModal) {
        val filteredTemplates = remember(assetTemplates, assetSearchQuery) {
            if (assetSearchQuery.isBlank()) assetTemplates
            else assetTemplates.filter { it.name.contains(assetSearchQuery, ignoreCase = true) || it.unit.contains(assetSearchQuery) }
        }

        Dialog(
            onDismissRequest = { showAssetPickerModal = false },
            properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = colors.surface),
                border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
                modifier = Modifier
                    .fillMaxWidth(0.92f)
                    .widthIn(max = 480.dp)
                    .fillMaxHeight(0.75f)
                    .padding(8.dp)
            ) {
                Column(modifier = Modifier.fillMaxSize().padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.ListAlt, contentDescription = null, tint = colors.primary)
                            Text("لیست دارایی‌ها و واحدهای پیش‌فرض", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                        }
                        IconButton(onClick = { showAssetPickerModal = false }) {
                            Icon(Icons.Default.Close, contentDescription = "بستن", tint = colors.textSecondary)
                        }
                    }

                    OutlinedTextField(
                        value = assetSearchQuery,
                        onValueChange = { assetSearchQuery = it },
                        placeholder = { Text("جستجوی نام دارایی یا واحد...", fontSize = 11.sp, color = colors.textSecondary) },
                        singleLine = true,
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = colors.primary, modifier = Modifier.size(16.dp)) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = colors.inputText,
                            unfocusedTextColor = colors.inputText,
                            focusedContainerColor = colors.inputBackground,
                            unfocusedContainerColor = colors.inputBackground,
                            focusedBorderColor = colors.primary,
                            unfocusedBorderColor = colors.border
                        ),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    LazyColumn(
                        modifier = Modifier.fillMaxWidth().weight(1f),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        items(filteredTemplates, key = { it.id }) { item ->
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = colors.surfaceVariant,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        name = item.name
                                        unit = item.unit
                                        showAssetPickerModal = false
                                        errorMsg = ""
                                    }
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Surface(
                                            shape = RoundedCornerShape(4.dp),
                                            color = colors.primaryContainer
                                        ) {
                                            Text(
                                                text = NumberFormatUtils.toPersianDigits(item.id),
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = colors.primary,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                        Text(
                                            text = item.name,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = colors.textPrimary
                                        )
                                    }

                                    Surface(
                                        shape = RoundedCornerShape(6.dp),
                                        color = colors.background,
                                        border = androidx.compose.foundation.BorderStroke(1.dp, colors.border)
                                    ) {
                                        Text(
                                            text = "واحد: ${item.unit}",
                                            fontSize = 10.sp,
                                            color = colors.textSecondary,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Button(
                        onClick = {
                            showAssetPickerModal = false
                            showNewTemplateModal = true
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = colors.primary),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("افزودن دارایی و واحد سفارشی جدید به لیست", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // Modal: Add Custom Asset & Unit to Templates
    if (showNewTemplateModal) {
        Dialog(
            onDismissRequest = { showNewTemplateModal = false },
            properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = colors.surface),
                border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
                modifier = Modifier
                    .fillMaxWidth(0.90f)
                    .widthIn(max = 440.dp)
                    .padding(12.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "تعریف دارایی و واحد جدید",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.textPrimary
                    )

                    OutlinedTextField(
                        value = newCustomAssetName,
                        onValueChange = { newCustomAssetName = it },
                        label = { Text("نام دارایی جدید", fontSize = 11.sp) },
                        placeholder = { Text("مثال: پالادیوم، برنج طارم...", fontSize = 11.sp, color = colors.textSecondary) },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = colors.inputText,
                            unfocusedTextColor = colors.inputText,
                            focusedContainerColor = colors.inputBackground,
                            unfocusedContainerColor = colors.inputBackground,
                            focusedBorderColor = colors.primary,
                            unfocusedBorderColor = colors.border
                        ),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = newCustomAssetUnit,
                        onValueChange = { newCustomAssetUnit = it },
                        label = { Text("واحد شمارش پیش‌فرض", fontSize = 11.sp) },
                        placeholder = { Text("مثال: کیلوگرم، تن، مثقال...", fontSize = 11.sp, color = colors.textSecondary) },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = colors.inputText,
                            unfocusedTextColor = colors.inputText,
                            focusedContainerColor = colors.inputBackground,
                            unfocusedContainerColor = colors.inputBackground,
                            focusedBorderColor = colors.primary,
                            unfocusedBorderColor = colors.border
                        ),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = { showNewTemplateModal = false },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("انصراف", fontSize = 11.sp, color = colors.textPrimary)
                        }

                        Button(
                            onClick = {
                                if (newCustomAssetName.isNotBlank() && newCustomAssetUnit.isNotBlank()) {
                                    val newId = (assetTemplates.size + 1).toString()
                                    val newItem = AssetTemplateItem(newId, newCustomAssetName.trim(), newCustomAssetUnit.trim(), isCustom = true)
                                    com.example.data.model.DefaultAssetTemplates.customItems.add(newItem)
                                    assetTemplates = assetTemplates + newItem
                                    if (!commonUnits.contains(newCustomAssetUnit.trim())) {
                                        commonUnits.add(newCustomAssetUnit.trim())
                                    }
                                    name = newCustomAssetName.trim()
                                    unit = newCustomAssetUnit.trim()
                                    newCustomAssetName = ""
                                    newCustomAssetUnit = ""
                                    showNewTemplateModal = false
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = colors.primary),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("افزودن و انتخاب", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

