package com.example.ui.dialogs

import androidx.compose.foundation.background
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
import androidx.compose.ui.window.DialogProperties
import com.example.data.model.SymbolEntryEntity
import com.example.ui.theme.*
import com.example.utils.NumberFormatUtils

import com.example.data.model.StoredNodeEntity

@Composable
fun SymbolBookDialog(
    symbolBook: List<SymbolEntryEntity>,
    storedNodes: List<StoredNodeEntity>,
    onDismiss: () -> Unit,
    onSaveSymbol: (SymbolEntryEntity) -> Unit,
    onDeleteSymbol: (String) -> Unit,
    onResetDefaults: () -> Unit
) {
    val colors = AppTheme.colors
    var searchQuery by remember { mutableStateOf("") }
    var editingSymbol by remember { mutableStateOf<SymbolEntryEntity?>(null) }
    var isAddingNew by remember { mutableStateOf(false) }

    var rawSymbolInput by remember { mutableStateOf("") }
    var canonicalNameInput by remember { mutableStateOf("") }
    var industryInput by remember { mutableStateOf("") }
    var assetTypeInput by remember { mutableStateOf("") }

    // Sort stored nodes from groups to leaves roughly (parents first)
    val assetTypeOptions = remember(storedNodes, symbolBook) {
        val nodeNames = storedNodes.sortedBy { it.parentId != null }.map { it.name }.distinct()
        val symbolAssetTypes = symbolBook.map { it.assetType }.filter { it.isNotBlank() }.distinct()
        (nodeNames + symbolAssetTypes).distinct()
    }

    val filteredList = remember(symbolBook, searchQuery) {
        if (searchQuery.isBlank()) symbolBook
        else symbolBook.filter {
            it.rawSymbol.contains(searchQuery, ignoreCase = true) ||
                    it.canonicalName.contains(searchQuery, ignoreCase = true) ||
                    it.industry.contains(searchQuery, ignoreCase = true) ||
                    it.assetType.contains(searchQuery, ignoreCase = true)
        }
    }

    fun openEdit(s: SymbolEntryEntity) {
        editingSymbol = s
        rawSymbolInput = s.rawSymbol
        canonicalNameInput = s.canonicalName
        industryInput = s.industry
        assetTypeInput = s.assetType
        isAddingNew = false
    }

    fun openNew() {
        editingSymbol = null
        rawSymbolInput = ""
        canonicalNameInput = ""
        industryInput = "سایر صنایع"
        assetTypeInput = "نامشخص"
        isAddingNew = true
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = colors.surface),
            border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .widthIn(max = 700.dp)
                .fillMaxHeight(0.85f)
                .padding(8.dp)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(colors.surfaceVariant)
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(colors.primaryContainer),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.MenuBook, contentDescription = null, tint = colors.primary)
                        }
                        Column {
                            Text(
                                text = "کتابچه هوشمند نمادها و نگاشت صنایع",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Black,
                                color = colors.textPrimary
                            )
                            Text(
                                text = "${NumberFormatUtils.toPersianDigits(symbolBook.size)} نماد ثبت شده در پایگاه",
                                fontSize = 10.sp,
                                color = colors.textSecondary
                            )
                        }
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "بستن", tint = colors.textSecondary)
                    }
                }

                // Search & Add Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("جستجوی نماد، نام شرکت یا صنعت...", fontSize = 11.sp, color = colors.textSecondary) },
                        textStyle = LocalTextStyle.current.copy(color = colors.inputText),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = colors.inputText,
                            unfocusedTextColor = colors.inputText,
                            focusedContainerColor = colors.inputBackground,
                            unfocusedContainerColor = colors.inputBackground,
                            focusedBorderColor = colors.primary,
                            unfocusedBorderColor = colors.border,
                            cursorColor = colors.inputText
                        ),
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = colors.textSecondary, modifier = Modifier.size(16.dp)) },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                    )

                    Button(
                        onClick = { openNew() },
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = colors.primary, contentColor = Color.White),
                        modifier = Modifier.height(48.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("نماد جدید", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }

                if (isAddingNew || editingSymbol != null) {
                    // Inline Edit / Create Form
                    val formColors = OutlinedTextFieldDefaults.colors(
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

                    Surface(
                        color = colors.surfaceVariant,
                        border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = if (isAddingNew) "افزودن نماد جدید" else "ویرایش نماد «${editingSymbol?.rawSymbol}»",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = colors.textPrimary
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedTextField(
                                    value = rawSymbolInput,
                                    onValueChange = { rawSymbolInput = it },
                                    label = { Text("نماد بورسی", fontSize = 10.sp) },
                                    textStyle = LocalTextStyle.current.copy(color = colors.inputText),
                                    colors = formColors,
                                    enabled = isAddingNew,
                                    singleLine = true,
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1f)
                                )
                                OutlinedTextField(
                                    value = canonicalNameInput,
                                    onValueChange = { canonicalNameInput = it },
                                    label = { Text("نام کامل شرکت", fontSize = 10.sp) },
                                    textStyle = LocalTextStyle.current.copy(color = colors.inputText),
                                    colors = formColors,
                                    singleLine = true,
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1.5f)
                                )
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedTextField(
                                    value = industryInput,
                                    onValueChange = { industryInput = it },
                                    label = { Text("صنعت اصلی", fontSize = 10.sp) },
                                    textStyle = LocalTextStyle.current.copy(color = colors.inputText),
                                    colors = formColors,
                                    singleLine = true,
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1f)
                                )
                                
                                var assetExpanded by remember { mutableStateOf(false) }
                                Box(modifier = Modifier.weight(1f)) {
                                    OutlinedTextField(
                                        value = assetTypeInput,
                                        onValueChange = { assetTypeInput = it },
                                        label = { Text("نوع دارایی", fontSize = 10.sp) },
                                        textStyle = LocalTextStyle.current.copy(color = colors.inputText),
                                        colors = formColors,
                                        singleLine = true,
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.fillMaxWidth(),
                                        trailingIcon = {
                                            IconButton(onClick = { assetExpanded = !assetExpanded }) {
                                                Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = colors.textSecondary)
                                            }
                                        }
                                    )
                                    DropdownMenu(
                                        expanded = assetExpanded,
                                        onDismissRequest = { assetExpanded = false },
                                        modifier = Modifier.background(colors.surface).heightIn(max = 200.dp)
                                    ) {
                                        assetTypeOptions.forEach { option ->
                                            DropdownMenuItem(
                                                text = { Text(option, fontSize = 11.sp, color = colors.textPrimary) },
                                                onClick = {
                                                    assetTypeInput = option
                                                    assetExpanded = false
                                                }
                                            )
                                        }
                                    }
                                }
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                TextButton(onClick = {
                                    isAddingNew = false
                                    editingSymbol = null
                                }) {
                                    Text("انصراف", fontSize = 11.sp, color = colors.textPrimary)
                                }
                                Spacer(modifier = Modifier.width(6.dp))
                                Button(
                                    onClick = {
                                        if (rawSymbolInput.isNotBlank() && canonicalNameInput.isNotBlank()) {
                                            onSaveSymbol(
                                                SymbolEntryEntity(
                                                    rawSymbol = rawSymbolInput.trim(),
                                                    canonicalName = canonicalNameInput.trim(),
                                                    industry = industryInput.trim().ifBlank { "سایر صنایع" },
                                                    assetType = assetTypeInput.trim().ifBlank { "نامشخص" }
                                                )
                                            )
                                            isAddingNew = false
                                            editingSymbol = null
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = colors.primary, contentColor = Color.White)
                                ) {
                                    Text("ذخیره نماد", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                HorizontalDivider(color = colors.border)

                // List of Symbols
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    items(filteredList, key = { it.rawSymbol }) { item ->
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = colors.surface,
                            border = androidx.compose.foundation.BorderStroke(1.dp, colors.border),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Text(item.rawSymbol, fontSize = 12.sp, fontWeight = FontWeight.Black, color = colors.textPrimary)
                                        Surface(
                                            shape = RoundedCornerShape(4.dp),
                                            color = colors.primaryContainer
                                        ) {
                                            Text(
                                                item.industry,
                                                fontSize = 9.sp,
                                                color = colors.onPrimaryContainer,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                                            )
                                        }
                                        if (item.assetType.isNotBlank() && item.assetType != "نامشخص") {
                                            Surface(
                                                shape = RoundedCornerShape(4.dp),
                                                color = colors.surfaceVariant
                                            ) {
                                                Text(
                                                    item.assetType,
                                                    fontSize = 9.sp,
                                                    color = colors.textSecondary,
                                                    fontWeight = FontWeight.Bold,
                                                    modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                                                )
                                            }
                                        }
                                    }
                                    Text(item.canonicalName, fontSize = 10.sp, color = colors.textSecondary)
                                }

                                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    IconButton(
                                        onClick = { openEdit(item) },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(Icons.Default.Edit, contentDescription = "ویرایش", modifier = Modifier.size(16.dp), tint = colors.textSecondary)
                                    }
                                    IconButton(
                                        onClick = { onDeleteSymbol(item.rawSymbol) },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(Icons.Default.Delete, contentDescription = "حذف", modifier = Modifier.size(16.dp), tint = colors.loss)
                                    }
                                }
                            }
                        }
                    }
                }

                HorizontalDivider(color = colors.border)

                // Footer
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(colors.surfaceVariant)
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onResetDefaults) {
                        Text("بازگردانی نمادهای پیش‌فرض", fontSize = 11.sp, color = colors.textSecondary)
                    }

                    Button(
                        onClick = onDismiss,
                        colors = ButtonDefaults.buttonColors(containerColor = colors.primary, contentColor = Color.White)
                    ) {
                        Text("بستن", fontSize = 11.sp)
                    }
                }
            }
        }
    }
}
