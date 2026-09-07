package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.local.ROOT_NODE_ID
import com.example.data.model.CalculatedNode
import com.example.data.model.AppViewMode
import com.example.ui.AssetTreeViewModel
import com.example.ui.components.AppTopBar
import com.example.ui.components.PortfolioSummaryBar
import com.example.ui.dialogs.*
import com.example.ui.theme.*
import com.example.ui.views.*
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private val viewModel: AssetTreeViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val displaySettings by viewModel.displaySettings.collectAsStateWithLifecycle()
            val isSystemDark = isSystemInDarkTheme()
            val isDark = when (displaySettings.themeMode) {
                com.example.data.model.ThemeMode.SYSTEM -> isSystemDark
                com.example.data.model.ThemeMode.DARK -> true
                com.example.data.model.ThemeMode.LIGHT -> false
            }

            MyApplicationTheme(
                darkTheme = isDark, 
                primaryColorHex = displaySettings.customAppColor,
                fontScale = displaySettings.fontSize.scaleFactor
            ) {
                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                    AssetTreeMainScreen(viewModel = viewModel, isDark = isDark)
                }
            }
        }
    }
}

@Composable
fun AssetTreeMainScreen(viewModel: AssetTreeViewModel, isDark: Boolean) {
    val activeView by viewModel.activeView.collectAsStateWithLifecycle()
    val storedNodes by viewModel.storedNodes.collectAsStateWithLifecycle()
    val symbolBook by viewModel.symbolBook.collectAsStateWithLifecycle()
    val displaySettings by viewModel.displaySettings.collectAsStateWithLifecycle()
    val sortConfig by viewModel.sortConfig.collectAsStateWithLifecycle()

    val calculatedResult by viewModel.calculatedResult.collectAsStateWithLifecycle()
    val sortedRoot by viewModel.sortedRoot.collectAsStateWithLifecycle()

    // Dialog states
    val detailsNode by viewModel.detailsNode.collectAsStateWithLifecycle()
    val addChildParent by viewModel.addChildParent.collectAsStateWithLifecycle()
    val editNode by viewModel.editNode.collectAsStateWithLifecycle()
    val moveNodeTarget by viewModel.moveNodeTarget.collectAsStateWithLifecycle()
    val deleteNodeTarget by viewModel.deleteNodeTarget.collectAsStateWithLifecycle()
    val isExcelImportOpen by viewModel.isExcelImportOpen.collectAsStateWithLifecycle()
    val isSymbolBookOpen by viewModel.isSymbolBookOpen.collectAsStateWithLifecycle()
    val isSettingsOpen by viewModel.isSettingsOpen.collectAsStateWithLifecycle()
    val isUndoHistoryOpen by viewModel.isUndoHistoryOpen.collectAsStateWithLifecycle()
    val undoHistory by viewModel.undoHistory.collectAsStateWithLifecycle()
    val undoCount by viewModel.undoCount.collectAsStateWithLifecycle()

    val toast by viewModel.toast.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(toast) {
        toast?.let {
            snackbarHostState.showSnackbar(
                message = it.message,
                duration = SnackbarDuration.Short
            )
            viewModel.clearToast()
        }
    }

    val root = sortedRoot ?: calculatedResult?.rootCalculated
    val allCalculated = calculatedResult?.allCalculated ?: emptyList()

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .testTag("main_scaffold"),
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            AppTopBar(
                activeView = activeView,
                settings = displaySettings,
                totalPortfolioValue = root?.totalValue ?: 0.0,
                undoCount = undoCount,
                isDark = isDark,
                onSelectView = { viewModel.setActiveView(it) },
                onToggleTheme = {
                    val newMode = when (displaySettings.themeMode) {
                        com.example.data.model.ThemeMode.SYSTEM -> if (isDark) com.example.data.model.ThemeMode.LIGHT else com.example.data.model.ThemeMode.DARK
                        com.example.data.model.ThemeMode.DARK -> com.example.data.model.ThemeMode.LIGHT
                        com.example.data.model.ThemeMode.LIGHT -> com.example.data.model.ThemeMode.DARK
                    }
                    viewModel.onUpdateSettings(displaySettings.copy(themeMode = newMode))
                },
                onTogglePrivacy = { viewModel.onTogglePrivacyMode() },
                onUndo = { viewModel.setUndoHistoryOpen(true) },
                onOpenExcelImport = { viewModel.setExcelImportOpen(true) },
                onOpenSymbolBook = { viewModel.setSymbolBookOpen(true) },
                onOpenSettings = { viewModel.setSettingsOpen(true) },
            )
        },
        containerColor = AppTheme.colors.background
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentAlignment = Alignment.TopCenter
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .widthIn(max = 840.dp)
            ) {
                if (root == null) {
                    // Loading State
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = AppTheme.colors.primary)
                    }
                } else {
                    when (activeView) {
                        AppViewMode.TREE -> {
                            ModernTreeView(
                                activeView = activeView,
                                onSelectView = { viewModel.setActiveView(it) },
                                rootCalculated = root,
                                settings = displaySettings,
                                sortConfig = sortConfig,
                                onUpdateSort = { viewModel.onUpdateSort(it) },
                                onSelectNodeDetails = { viewModel.setDetailsNode(it) },
                                onAddChildNode = { viewModel.setAddChildParent(it) },
                                onEditNode = { viewModel.setEditNode(it) },
                                onMoveNode = { viewModel.setMoveNodeTarget(it) },
                                onDeleteNode = { viewModel.setDeleteNodeTarget(it) },
                                onOpenAddRootAsset = { viewModel.setAddChildParent(root) },
                                onOpenChart = { viewModel.setActiveView(AppViewMode.CHART) }
                            )
                        }

                        AppViewMode.CLASSIC_TREE -> {
                            ClassicTreeView(
                                activeView = activeView,
                                onSelectView = { viewModel.setActiveView(it) },
                                rootCalculated = root,
                                settings = displaySettings,
                                sortConfig = sortConfig,
                                onUpdateSort = { viewModel.onUpdateSort(it) },
                                onSelectNodeDetails = { viewModel.setDetailsNode(it) },
                                onAddChildNode = { viewModel.setAddChildParent(it) },
                                onEditNode = { viewModel.setEditNode(it) },
                                onMoveNode = { viewModel.setMoveNodeTarget(it) },
                                onDeleteNode = { viewModel.setDeleteNodeTarget(it) },
                                onOpenAddRootAsset = { viewModel.setAddChildParent(root) },
                                onOpenChart = { viewModel.setActiveView(AppViewMode.CHART) }
                            )
                        }

                        AppViewMode.CHART -> {
                            SunburstChartView(
                                activeView = activeView,
                                onSelectView = { viewModel.setActiveView(it) },
                                rootNode = root,
                                settings = displaySettings,
                                onSelectNodeDetails = { viewModel.setDetailsNode(it) }
                            )
                        }

                        AppViewMode.BAR_CHART -> {
                            BarChartView(
                                activeView = activeView,
                                onSelectView = { viewModel.setActiveView(it) },
                                rootCalculated = root,
                                settings = displaySettings,
                                onSelectNodeDetails = { viewModel.setDetailsNode(it) }
                            )
                        }
                        AppViewMode.PIE_CHART -> {
                            PieChartView(
                                activeView = activeView,
                                onSelectView = { viewModel.setActiveView(it) },
                                rootCalculated = root,
                                settings = displaySettings,
                                onSelectNodeDetails = { viewModel.setDetailsNode(it) }
                            )
                        }

                        AppViewMode.TREEMAP -> {
                            com.example.ui.views.TreemapChartView(
                                activeView = activeView,
                                onSelectView = { viewModel.setActiveView(it) },
                                rootCalculated = root,
                                settings = displaySettings,
                                onSelectNodeDetails = { viewModel.setDetailsNode(it) }
                            )
                        }

                        AppViewMode.ANALYTICS -> {
                            AnalyticsDashboardView(
                                activeView = activeView,
                                onSelectView = { viewModel.setActiveView(it) },
                                rootCalculated = root,
                                allCalculated = allCalculated,
                                settings = displaySettings,
                                onSelectNodeDetails = { viewModel.setDetailsNode(it) }
                            )
                        }
                    }
                }
            }
        }
    }

    // --- Dialogs ---

    // 1. Node Details
    detailsNode?.let { node ->
        NodeDetailsDialog(
            node = node,
            settings = displaySettings,
            onDismiss = { viewModel.setDetailsNode(null) },
            onOpenAddChild = { viewModel.setAddChildParent(it) },
            onOpenEdit = { viewModel.setEditNode(it) },
            onOpenMove = { viewModel.setMoveNodeTarget(it) },
            onOpenDelete = { viewModel.setDeleteNodeTarget(it) }
        )
    }

    // 2. Add Child (Strict Order: Name -> UnitPrice -> Quantity -> Unit)
    addChildParent?.let { parent ->
        AddChildDialog(
            parentNode = parent,
            settings = displaySettings,
            onDismiss = { viewModel.setAddChildParent(null) },
            onConfirmAddChild = { parentId, name, unitPrice, quantity, unit ->
                viewModel.onAddChild(parentId, name, unitPrice, quantity, unit)
            }
        )
    }

    // 3. Edit Node
    editNode?.let { node ->
        EditNodeDialog(
            node = node,
            settings = displaySettings,
            onDismiss = { viewModel.setEditNode(null) },
            onConfirmSave = { nodeId, name, qty, unit, unitPrice ->
                viewModel.onEditNode(nodeId, name, qty, unit, unitPrice)
            }
        )
    }

    // 4. Move Node Target
    moveNodeTarget?.let { node ->
        root?.let { tree ->
            MoveNodeDialog(
                node = node,
                allStoredNodes = storedNodes,
                calculatedTree = tree,
                onDismiss = { viewModel.setMoveNodeTarget(null) },
                onConfirmMove = { movingId, targetId ->
                    viewModel.onMoveNode(movingId, targetId)
                }
            )
        }
    }

    // 5. Delete Node Target
    deleteNodeTarget?.let { node ->
        DeleteNodeDialog(
            node = node,
            settings = displaySettings,
            onDismiss = { viewModel.setDeleteNodeTarget(null) },
            onConfirmDelete = { nodeId ->
                viewModel.onDeleteNode(nodeId)
            }
        )
    }

    // 6. Excel & Bourse Beneficiary Import Wizard
    if (isExcelImportOpen) {
        root?.let { tree ->
            ExcelImportDialog(
                currentStoredNodes = storedNodes,
                calculatedTree = tree,
                symbolBook = symbolBook,
                settings = displaySettings,
                onDismiss = { viewModel.setExcelImportOpen(false) },
                onApplyImport = { plan, skipDup, confirmDel ->
                    viewModel.onApplyExcelImport(plan, skipDup, confirmDel)
                }
            )
        }
    }

    // 7. Symbol Book Manager
    if (isSymbolBookOpen) {
        SymbolBookDialog(
            symbolBook = symbolBook,
            storedNodes = storedNodes,
            onDismiss = { viewModel.setSymbolBookOpen(false) },
            onSaveSymbol = { viewModel.onSaveSymbol(it) },
            onDeleteSymbol = { viewModel.onDeleteSymbol(it) },
            onResetDefaults = { viewModel.onResetSymbolBook() }
        )
    }

    // 8. Settings & Backup Dialog
    if (isSettingsOpen) {
        SettingsDialog(
            settings = displaySettings,
            rootCalculated = root,
            onDismiss = { viewModel.setSettingsOpen(false) },
            onUpdateSettings = { viewModel.onUpdateSettings(it) },
            onExportBackupJson = { viewModel.repository.exportBackupJson() },
            onImportBackupJson = { viewModel.onRestoreJsonBackup(it) },
            onResetAllData = { viewModel.onResetAllData() },
            onWipeFinancialData = { viewModel.onWipeDatabaseToZero() },
            onSaveCurrentSettingsAsDefault = { viewModel.saveCurrentSettingsAsDefault() },
            onRestoreSettingsToDefault = { viewModel.restoreSettingsToDefault() }
        )
    }

    // 9. Undo History Checkbox Dialog
    if (isUndoHistoryOpen) {
        UndoHistoryDialog(
            undoHistory = undoHistory,
            settings = displaySettings,
            onDismiss = { viewModel.setUndoHistoryOpen(false) },
            onConfirmRollback = { stepsCount ->
                viewModel.onUndoSteps(stepsCount)
            }
        )
    }
}
