package com.example.ui.components

import android.app.Activity
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.DisplaySettings
import com.example.data.model.AppViewMode
import com.example.ui.theme.AppTheme
import com.example.ui.theme.bounceClick
import com.example.utils.NumberFormatUtils
import com.example.utils.PersianDateUtils

@Composable
fun AppTopBar(
    activeView: AppViewMode,
    settings: DisplaySettings,
    totalPortfolioValue: Double,
    undoCount: Int,
    isDark: Boolean,
    onSelectView: (AppViewMode) -> Unit,
    onToggleTheme: () -> Unit,
    onTogglePrivacy: () -> Unit,
    onUndo: () -> Unit,
    onOpenExcelImport: () -> Unit,
    onOpenSymbolBook: () -> Unit,
    onOpenSettings: () -> Unit,
) {
    val context = LocalContext.current
    val haptic = LocalHapticFeedback.current
    val colors = AppTheme.colors
    var showMenu by remember { mutableStateOf(false) }
    var showExitConfirmDialog by remember { mutableStateOf(false) }

    // Real-time Persian Date & Time connected to device clock (updates every second)
    var currentTimeMillis by remember { mutableStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) {
        while (true) {
            kotlinx.coroutines.delay(1000)
            currentTimeMillis = System.currentTimeMillis()
        }
    }
    val persianDateTimeStr = remember(currentTimeMillis) {
        PersianDateUtils.formatPersianDate(currentTimeMillis, includeTime = true)
    }

    Surface(
        color = colors.background,
        shadowElevation = 0.dp,
        modifier = Modifier
            .fillMaxWidth()
            .statusBarsPadding()
    ) {
        BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
            val isCompact = maxWidth < 380.dp

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = if (isCompact) 10.dp else 14.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isDark) colors.surface else Color.White
                    ),
                    border = androidx.compose.foundation.BorderStroke(1.dp, colors.border.copy(alpha = 0.7f)),
                    elevation = CardDefaults.cardElevation(defaultElevation = if (isDark) 0.dp else 3.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Row 1: app glyph (right) — date/time + undo + overflow menu (left)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(if (isCompact) 36.dp else 40.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(
                                        Brush.linearGradient(
                                            listOf(Color(0xFF0F172A), Color(0xFF1E293B), colors.primary.copy(alpha = 0.9f))
                                        )
                                    )
                                    .border(
                                        1.2.dp,
                                        Brush.linearGradient(listOf(Color(0xFFF59E0B), Color(0xFF10B981), Color(0xFF38BDF8))),
                                        RoundedCornerShape(14.dp)
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                androidx.compose.foundation.Canvas(modifier = Modifier.size(if (isCompact) 22.dp else 24.dp)) {
                                    val w = size.width
                                    val h = size.height
                                    val trunkColor = Color(0xFFF59E0B)
                                    val leaf1 = Color(0xFF10B981)
                                    val leaf2 = Color(0xFF38BDF8)
                                    val leaf3 = Color(0xFFA855F7)

                                    drawLine(trunkColor, Offset(w * 0.5f, h * 0.82f), Offset(w * 0.5f, h * 0.32f), strokeWidth = 3f)
                                    drawLine(trunkColor, Offset(w * 0.5f, h * 0.55f), Offset(w * 0.24f, h * 0.44f), strokeWidth = 2.5f)
                                    drawLine(trunkColor, Offset(w * 0.5f, h * 0.55f), Offset(w * 0.76f, h * 0.44f), strokeWidth = 2.5f)

                                    drawCircle(color = trunkColor, radius = w * 0.14f, center = Offset(w * 0.5f, h * 0.82f))
                                    drawCircle(color = leaf1, radius = w * 0.17f, center = Offset(w * 0.5f, h * 0.25f))
                                    drawCircle(color = leaf2, radius = w * 0.13f, center = Offset(w * 0.22f, h * 0.42f))
                                    drawCircle(color = leaf3, radius = w * 0.13f, center = Offset(w * 0.78f, h * 0.42f))
                                }
                            }

                            Spacer(modifier = Modifier.weight(1f))

                            Row(
                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = colors.surfaceVariant.copy(alpha = 0.6f)
                                ) {
                                    Text(
                                        text = persianDateTimeStr,
                                        fontSize = if (isCompact) 11.sp else 12.5.sp,
                                        color = colors.textSecondary,
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp)
                                    )
                                }

                                if (undoCount > 0) {
                                    IconButton(
                                        onClick = onUndo,
                                        modifier = Modifier.size(32.dp).bounceClick()
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Undo,
                                            contentDescription = "بازگشت",
                                            tint = colors.warning,
                                            modifier = Modifier.size(19.dp)
                                        )
                                    }
                                }

                                Box {
                                    IconButton(
                                        onClick = { showMenu = true },
                                        modifier = Modifier
                                            .size(32.dp)
                                            .bounceClick()
                                            .testTag("btn_three_dots_menu")
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.MoreVert,
                                            contentDescription = "منوی امکانات",
                                            tint = colors.textPrimary,
                                            modifier = Modifier.size(19.dp)
                                        )
                                    }

                                    DropdownMenu(
                                        expanded = showMenu,
                                        onDismissRequest = { showMenu = false },
                                        modifier = Modifier
                                            .background(colors.surface, RoundedCornerShape(18.dp))
                                            .border(1.dp, colors.border.copy(alpha = 0.5f), RoundedCornerShape(18.dp))
                                            .clip(RoundedCornerShape(18.dp))
                                    ) {
                                        DropdownMenuItem(
                                            text = {
                                                Text(
                                                    text = "ورود اطلاعات از فایل اکسل",
                                                    fontSize = 13.sp,
                                                    color = colors.textPrimary,
                                                    fontWeight = FontWeight.Medium
                                                )
                                            },
                                            leadingIcon = {
                                                Icon(imageVector = Icons.Default.TableChart, contentDescription = null, tint = colors.gain)
                                            },
                                            onClick = {
                                                showMenu = false
                                                onOpenExcelImport()
                                            }
                                        )

                                        DropdownMenuItem(
                                            text = {
                                                Text(
                                                    text = "کتابچه نمادها و ضرایب",
                                                    fontSize = 13.sp,
                                                    color = colors.textPrimary,
                                                    fontWeight = FontWeight.Medium
                                                )
                                            },
                                            leadingIcon = {
                                                Icon(imageVector = Icons.Default.MenuBook, contentDescription = null, tint = Color(0xFF8B5CF6))
                                            },
                                            onClick = {
                                                showMenu = false
                                                onOpenSymbolBook()
                                            }
                                        )

                                        HorizontalDivider(color = colors.border.copy(alpha = 0.4f), modifier = Modifier.padding(horizontal = 8.dp))

                                        DropdownMenuItem(
                                            text = {
                                                Text(
                                                    text = "تنظیمات و سفارشی‌سازی",
                                                    fontSize = 13.sp,
                                                    color = colors.textPrimary,
                                                    fontWeight = FontWeight.Medium
                                                )
                                            },
                                            leadingIcon = {
                                                Icon(imageVector = Icons.Default.Settings, contentDescription = null, tint = colors.textSecondary)
                                            },
                                            onClick = {
                                                showMenu = false
                                                onOpenSettings()
                                            }
                                        )
                                    }
                                }
                            }
                        }

                        // Row 2: total value (right) — eye toggle + exit (left)
                        val formattedVal = if (settings.privacyMode) {
                            "••••••••"
                        } else {
                            NumberFormatUtils.formatCurrency(
                                totalPortfolioValue,
                                settings.currencyUnit,
                                compact = false,
                                usePersianDigits = settings.usePersianDigits,
                                privacyMode = settings.privacyMode
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = "ارزش کل:",
                                    fontSize = if (isCompact) 12.5.sp else 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = colors.textSecondary
                                )
                                AnimatedAmountText(
                                    rawValue = totalPortfolioValue,
                                    displayText = formattedVal,
                                    formatter = { v ->
                                        NumberFormatUtils.formatCurrency(
                                            v,
                                            settings.currencyUnit,
                                            compact = false,
                                            usePersianDigits = settings.usePersianDigits,
                                            privacyMode = settings.privacyMode
                                        )
                                    },
                                    fontSize = if (isCompact) 18.sp else 22.sp,
                                    fontWeight = FontWeight.Black,
                                    color = colors.primary
                                )
                            }

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(2.dp)
                            ) {
                                IconButton(
                                    onClick = {
                                        haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                        onTogglePrivacy()
                                    },
                                    modifier = Modifier
                                        .size(32.dp)
                                        .bounceClick()
                                        .testTag("btn_toggle_privacy")
                                ) {
                                    Icon(
                                        imageVector = if (settings.privacyMode) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                        contentDescription = if (settings.privacyMode) "نمایش مبالغ" else "مخفی‌سازی مبالغ",
                                        tint = colors.primary,
                                        modifier = Modifier.size(19.dp)
                                    )
                                }

                                IconButton(
                                    onClick = { showExitConfirmDialog = true },
                                    modifier = Modifier
                                        .size(32.dp)
                                        .bounceClick()
                                        .testTag("btn_exit_app")
                                ) {
                                    Icon(
                                        imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                                        contentDescription = "خروج از برنامه",
                                        tint = colors.loss,
                                        modifier = Modifier.size(19.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showExitConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showExitConfirmDialog = false },
            shape = RoundedCornerShape(24.dp),
            icon = {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                    contentDescription = null,
                    tint = colors.loss,
                    modifier = Modifier.size(28.dp)
                )
            },
            title = {
                Text(
                    text = "اطمینان از خروج",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = colors.textPrimary
                )
            },
            text = {
                Text(
                    text = "آیا مطمئن هستید که می‌خواهید از برنامه خارج شوید؟",
                    fontSize = 13.5.sp,
                    color = colors.textSecondary
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showExitConfirmDialog = false
                        (context as? Activity)?.finish()
                    },
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = colors.loss)
                ) {
                    Text("خروج از برنامه", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { showExitConfirmDialog = false },
                    shape = RoundedCornerShape(14.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, colors.border)
                ) {
                    Text("انصراف", color = colors.textPrimary)
                }
            }
        )
    }
}
