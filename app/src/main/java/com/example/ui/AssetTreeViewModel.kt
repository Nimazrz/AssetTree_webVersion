package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.core.TreeEngine
import com.example.data.local.AppDatabase
import com.example.data.model.*
import com.example.data.repository.AssetRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class UiToast(
    val message: String,
    val isError: Boolean = false
)

class AssetTreeViewModel(application: Application) : AndroidViewModel(application) {

    private val db = AppDatabase.getDatabase(application)

    val repository = AssetRepository(db, application, viewModelScope)

    // Current Active Tab (Default: first chart in settings, or Treemap)
    private val _activeView = MutableStateFlow(
        repository.displaySettings.value.customViewOrder.firstOrNull() ?: AppViewMode.TREEMAP
    )
    val activeView: StateFlow<AppViewMode> = _activeView.asStateFlow()

    // Undo Count and History from Repository
    val undoCount: StateFlow<Int> = repository.undoCount
    val undoHistory: StateFlow<List<UndoSnapshot>> = repository.undoHistory

    // Stored Nodes from Room
    val storedNodes: StateFlow<List<StoredNodeEntity>> = repository.storedNodesFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Symbol Book from Room
    val symbolBook: StateFlow<List<SymbolEntryEntity>> = repository.symbolBookFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Display Settings
    val displaySettings: StateFlow<DisplaySettings> = repository.displaySettings

    // Sort Configuration
    val sortConfig: StateFlow<SortConfig> = repository.sortConfig

    // Bottom-Up Evaluated Tree
    val calculatedResult: StateFlow<TreeEngine.CalculatedTreeResult?> = storedNodes
        .map { nodes ->
            if (nodes.isNotEmpty()) TreeEngine.evaluateTree(nodes) else null
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    // Sorted Tree for display
    val sortedRoot: StateFlow<CalculatedNode?> = combine(
        calculatedResult,
        sortConfig
    ) { res, sort ->
        res?.rootCalculated?.let { TreeEngine.sortCalculatedTree(it, sort) }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    // Modals / Dialogs State
    private val _detailsNode = MutableStateFlow<CalculatedNode?>(null)
    val detailsNode: StateFlow<CalculatedNode?> = _detailsNode.asStateFlow()

    private val _addChildParent = MutableStateFlow<CalculatedNode?>(null)
    val addChildParent: StateFlow<CalculatedNode?> = _addChildParent.asStateFlow()

    private val _editNode = MutableStateFlow<CalculatedNode?>(null)
    val editNode: StateFlow<CalculatedNode?> = _editNode.asStateFlow()

    private val _moveNodeTarget = MutableStateFlow<CalculatedNode?>(null)
    val moveNodeTarget: StateFlow<CalculatedNode?> = _moveNodeTarget.asStateFlow()

    private val _deleteNodeTarget = MutableStateFlow<CalculatedNode?>(null)
    val deleteNodeTarget: StateFlow<CalculatedNode?> = _deleteNodeTarget.asStateFlow()

    private val _isExcelImportOpen = MutableStateFlow(false)
    val isExcelImportOpen: StateFlow<Boolean> = _isExcelImportOpen.asStateFlow()

    private val _isSymbolBookOpen = MutableStateFlow(false)
    val isSymbolBookOpen: StateFlow<Boolean> = _isSymbolBookOpen.asStateFlow()

    private val _isSettingsOpen = MutableStateFlow(false)
    val isSettingsOpen: StateFlow<Boolean> = _isSettingsOpen.asStateFlow()

    private val _isUndoHistoryOpen = MutableStateFlow(false)
    val isUndoHistoryOpen: StateFlow<Boolean> = _isUndoHistoryOpen.asStateFlow()

    private val _toast = MutableStateFlow<UiToast?>(null)
    val toast: StateFlow<UiToast?> = _toast.asStateFlow()

    fun setActiveView(view: AppViewMode) {
        _activeView.value = view
    }

    fun showToast(message: String, isError: Boolean = false) {
        _toast.value = UiToast(message, isError)
    }

    fun clearToast() {
        _toast.value = null
    }

    // Modal Setters
    fun setDetailsNode(node: CalculatedNode?) {
        _detailsNode.value = node
    }

    fun setAddChildParent(node: CalculatedNode?) {
        _addChildParent.value = node
    }

    fun setEditNode(node: CalculatedNode?) {
        _editNode.value = node
    }

    fun setMoveNodeTarget(node: CalculatedNode?) {
        _moveNodeTarget.value = node
    }

    fun setDeleteNodeTarget(node: CalculatedNode?) {
        _deleteNodeTarget.value = node
    }

    fun setExcelImportOpen(open: Boolean) {
        _isExcelImportOpen.value = open
    }

    fun setSymbolBookOpen(open: Boolean) {
        _isSymbolBookOpen.value = open
    }

    fun setSettingsOpen(open: Boolean) {
        _isSettingsOpen.value = open
    }

    fun setUndoHistoryOpen(open: Boolean) {
        _isUndoHistoryOpen.value = open
    }

    // --- Action Handlers ---

    fun onAddChild(
        parentId: String,
        name: String,
        unitPrice: Double,
        quantity: Double,
        unit: String
    ) {
        viewModelScope.launch {
            repository.addChild(parentId, name, unitPrice, quantity, unit)
            showToast("دارایی «$name» با موفقیت افزوده شد.")
            setAddChildParent(null)
        }
    }

    fun onEditNode(
        nodeId: String,
        name: String,
        quantity: Double,
        unit: String,
        unitPrice: Double
    ) {
        viewModelScope.launch {
            repository.editNode(nodeId, name, quantity, unit, unitPrice)
            showToast("دارایی «$name» با موفقیت ویرایش شد.")
            setEditNode(null)
        }
    }

    fun onMoveNode(movingNodeId: String, targetParentId: String) {
        viewModelScope.launch {
            val res = repository.moveNode(movingNodeId, targetParentId)
            res.fold(
                onSuccess = {
                    showToast("انتقال شاخه با موفقیت انجام شد.")
                    setMoveNodeTarget(null)
                },
                onFailure = { err ->
                    showToast(err.message ?: "خطا در انتقال شاخه", isError = true)
                }
            )
        }
    }

    fun onDeleteNode(nodeId: String) {
        viewModelScope.launch {
            val count = repository.deleteNodeWithSubtree(nodeId)
            showToast("$count گره با موفقیت حذف شد.")
            setDeleteNodeTarget(null)
            if (_detailsNode.value?.id == nodeId) {
                setDetailsNode(null)
            }
        }
    }

    fun onUpdateSettings(settings: DisplaySettings) {
        repository.updateDisplaySettings(settings)
    }

    fun saveCurrentSettingsAsDefault() {
        repository.saveCurrentSettingsAsDefault()
    }

    fun restoreSettingsToDefault() {
        repository.restoreSettingsToDefault()
    }


    fun onUpdateFontSize(fontSize: AppFontSize) {
        val current = displaySettings.value
        repository.updateDisplaySettings(current.copy(fontSize = fontSize))
    }

    fun onUpdateSort(sortConfig: SortConfig) {
        repository.updateSortConfig(sortConfig)
    }

    fun onApplyExcelImport(
        plan: ImportPlan,
        skipAllDuplicates: Boolean,
        confirmDeleteAbsentStocks: Boolean
    ) {
        viewModelScope.launch {
            val msg = repository.applyImportPlan(plan, skipAllDuplicates, confirmDeleteAbsentStocks)
            showToast(msg)
            setExcelImportOpen(false)
        }
    }

    fun onSaveSymbol(symbol: SymbolEntryEntity) {
        viewModelScope.launch {
            repository.insertSymbol(symbol)
            showToast("نماد «${symbol.rawSymbol}» ذخیره شد.")
        }
    }

    fun onDeleteSymbol(rawSymbol: String) {
        viewModelScope.launch {
            repository.deleteSymbol(rawSymbol)
            showToast("نماد «$rawSymbol» حذف گردید.")
        }
    }

    fun onResetSymbolBook() {
        viewModelScope.launch {
            repository.resetSymbolBook()
            showToast("کتابچه نمادها به حالت پیش‌فرض بازار بازگردانی شد.")
        }
    }

    fun onSyncDefaultSymbols() {
        viewModelScope.launch {
            repository.syncDefaultSymbols()
            showToast("همگام‌سازی نمادها با موفقیت انجام شد.")
        }
    }

    fun onResetAllData() {
        viewModelScope.launch {
            repository.resetAllToDefaults()
            showToast("تمام اطلاعات به پرتفوی اولیه نمونه بازگردانی شد.")
            setSettingsOpen(false)
        }
    }

    fun onUndo() {
        viewModelScope.launch {
            val success = repository.undoLastAction()
            if (success) {
                showToast("تغییرات با موفقیت به مرحله قبل بازگردانده شد.")
            } else {
                showToast("مرحله‌ای برای بازگشت وجود ندارد.")
            }
        }
    }

    fun onUndoSteps(stepsCount: Int) {
        viewModelScope.launch {
            val success = repository.undoMultipleSteps(stepsCount)
            if (success) {
                showToast("بازگشت به $stepsCount مرحله قبل با موفقیت اعمال شد.")
                setUndoHistoryOpen(false)
            } else {
                showToast("خطا در بازگشت به مراحل انتخابی", isError = true)
            }
        }
    }

    fun onTogglePrivacyMode() {
        repository.togglePrivacyMode()
    }

    fun onWipeDatabaseToZero() {
        viewModelScope.launch {
            repository.wipeDatabaseToZero()
            showToast("پایگاه داده خام شد و دارایی‌ها به صفر ریال بازنشانی شدند.")
            setSettingsOpen(false)
        }
    }

    fun onRestoreJsonBackup(json: String) {
        viewModelScope.launch {
            val res = repository.importBackupJson(json)
            res.fold(
                onSuccess = {
                    showToast("بازیابی نسخه پشتیبان با موفقیت انجام شد.")
                    setSettingsOpen(false)
                },
                onFailure = {
                    showToast(it.message ?: "خطا در بازیابی نسخه پشتیبان", isError = true)
                }
            )
        }
    }
}
