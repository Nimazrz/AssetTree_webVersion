package com.example.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.example.core.TreeEngine
import com.example.data.local.AppDatabase
import com.example.data.local.ROOT_NODE_ID
import com.example.data.local.SeedData
import com.example.data.model.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

class AssetRepository(
    private val database: AppDatabase,
    private val context: Context,
    private val coroutineScope: CoroutineScope
) {
    private val nodeDao = database.nodeDao()
    private val symbolBookDao = database.symbolBookDao()
    private val prefs: SharedPreferences = context.getSharedPreferences("asset_tree_prefs", Context.MODE_PRIVATE)

    val storedNodesFlow: Flow<List<StoredNodeEntity>> = nodeDao.getAllNodesFlow()
    val symbolBookFlow: Flow<List<SymbolEntryEntity>> = symbolBookDao.getAllSymbolsFlow()

    private val _displaySettings = MutableStateFlow(loadDisplaySettings())
    val displaySettings: StateFlow<DisplaySettings> = _displaySettings.asStateFlow()

    private val _sortConfig = MutableStateFlow(loadSortConfig())
    val sortConfig: StateFlow<SortConfig> = _sortConfig.asStateFlow()

    // In-memory multi-step Undo Stack with Snapshots
    private val undoStack = java.util.ArrayDeque<UndoSnapshot>()
    private val _undoCount = MutableStateFlow(0)
    val undoCount: StateFlow<Int> = _undoCount.asStateFlow()
    private val _undoHistory = MutableStateFlow<List<UndoSnapshot>>(emptyList())
    val undoHistory: StateFlow<List<UndoSnapshot>> = _undoHistory.asStateFlow()

    init {
        coroutineScope.launch(Dispatchers.IO) {
            val existingNodes = nodeDao.getAllNodes()
            if (existingNodes.isEmpty()) {
                nodeDao.insertAll(SeedData.getInitialNodes())
            }
            val existingSymbols = symbolBookDao.getAllSymbols()
            if (existingSymbols.isEmpty()) {
                symbolBookDao.insertAll(SeedData.getDefaultSymbolBook())
            }
        }
    }

    private suspend fun recordSnapshotForUndo(actionTitle: String = "تغییر اطلاعات پرتفوی") {
        val currentNodes = nodeDao.getAllNodes()
        if (undoStack.size >= 30) {
            undoStack.removeLast()
        }
        val snapshot = UndoSnapshot(
            title = actionTitle,
            timestamp = System.currentTimeMillis(),
            nodeCount = currentNodes.size,
            nodes = currentNodes
        )
        undoStack.push(snapshot)
        _undoCount.value = undoStack.size
        _undoHistory.value = undoStack.toList()
    }

    suspend fun undoLastAction(): Boolean = withContext(Dispatchers.IO) {
        if (undoStack.isEmpty()) return@withContext false
        val previousSnapshot = undoStack.pop()
        _undoCount.value = undoStack.size
        _undoHistory.value = undoStack.toList()
        nodeDao.replaceAll(previousSnapshot.nodes)
        true
    }

    suspend fun undoMultipleSteps(stepsCount: Int): Boolean = withContext(Dispatchers.IO) {
        if (undoStack.isEmpty() || stepsCount <= 0) return@withContext false
        val toPop = stepsCount.coerceAtMost(undoStack.size)
        var targetSnapshot: UndoSnapshot? = null
        repeat(toPop) {
            targetSnapshot = undoStack.pop()
        }
        _undoCount.value = undoStack.size
        _undoHistory.value = undoStack.toList()
        if (targetSnapshot != null) {
            nodeDao.replaceAll(targetSnapshot!!.nodes)
            true
        } else {
            false
        }
    }

    private fun loadDisplaySettings(): DisplaySettings {
        val showPT = prefs.getBoolean("showPercentOfTotal", true)
        val showPG = prefs.getBoolean("showPercentOfGroup", true)
        val showTV = prefs.getBoolean("showTotalValue", true)
        val dec = prefs.getInt("decimalPlaces", 1)
        val compact = prefs.getBoolean("compactCurrency", true)
        val cUnitStr = prefs.getString("currencyUnit", CurrencyUnit.TOMAN.name) ?: CurrencyUnit.TOMAN.name
        val cUnit = try { CurrencyUnit.valueOf(cUnitStr) } catch (e: Exception) { CurrencyUnit.TOMAN }
        val persianDigits = prefs.getBoolean("usePersianDigits", true)
        val themeModeStr = prefs.getString("themeMode", ThemeMode.SYSTEM.name) ?: ThemeMode.SYSTEM.name
        val themeMode = try { ThemeMode.valueOf(themeModeStr) } catch (e: Exception) { ThemeMode.SYSTEM }
        val privacy = prefs.getBoolean("privacyMode", false)
        val fontSizeStr = prefs.getString("fontSize", AppFontSize.STANDARD.name) ?: AppFontSize.STANDARD.name
        val fontSize = try { AppFontSize.valueOf(fontSizeStr) } catch (e: Exception) { AppFontSize.STANDARD }
        val customAppColor = prefs.getLong("customAppColor", 0xFF005FB1)
        val viewOrderStr = prefs.getString("customViewOrder", null)
        val customViewOrder = if (!viewOrderStr.isNullOrBlank()) {
            try {
                val parsed = viewOrderStr.split(",").mapNotNull { name ->
                    try { AppViewMode.valueOf(name.trim()) } catch (e: Exception) { null }
                }
                if (parsed.isNotEmpty()) parsed else DisplaySettings().customViewOrder
            } catch (e: Exception) {
                DisplaySettings().customViewOrder
            }
        } else {
            DisplaySettings().customViewOrder
        }

        return DisplaySettings(
            showPercentOfTotal = showPT,
            showPercentOfGroup = showPG,
            showTotalValue = showTV,
            decimalPlaces = dec,
            compactCurrency = compact,
            currencyUnit = cUnit,
            usePersianDigits = persianDigits,
            themeMode = themeMode,
            privacyMode = privacy,
            fontSize = fontSize,
            customAppColor = customAppColor,
            customViewOrder = customViewOrder
        )
    }

    fun saveCurrentSettingsAsDefault() {
        val settings = _displaySettings.value
        prefs.edit().apply {
            putBoolean("def_showPercentOfTotal", settings.showPercentOfTotal)
            putBoolean("def_showPercentOfGroup", settings.showPercentOfGroup)
            putBoolean("def_showTotalValue", settings.showTotalValue)
            putInt("def_decimalPlaces", settings.decimalPlaces)
            putBoolean("def_compactCurrency", settings.compactCurrency)
            putString("def_currencyUnit", settings.currencyUnit.name)
            putBoolean("def_usePersianDigits", settings.usePersianDigits)
            putString("def_themeMode", settings.themeMode.name)
            putBoolean("def_privacyMode", settings.privacyMode)
            putString("def_fontSize", settings.fontSize.name)
            putLong("def_customAppColor", settings.customAppColor)
            putString("def_customViewOrder", settings.customViewOrder.joinToString(",") { it.name })
            apply()
        }
    }

    fun restoreSettingsToDefault() {
        val showPT = prefs.getBoolean("def_showPercentOfTotal", true)
        val showPG = prefs.getBoolean("def_showPercentOfGroup", true)
        val showTV = prefs.getBoolean("def_showTotalValue", true)
        val dec = prefs.getInt("def_decimalPlaces", 1)
        val compact = prefs.getBoolean("def_compactCurrency", true)
        val cUnitStr = prefs.getString("def_currencyUnit", CurrencyUnit.TOMAN.name) ?: CurrencyUnit.TOMAN.name
        val cUnit = try { CurrencyUnit.valueOf(cUnitStr) } catch (e: Exception) { CurrencyUnit.TOMAN }
        val persianDigits = prefs.getBoolean("def_usePersianDigits", true)
        val themeModeStr = prefs.getString("def_themeMode", ThemeMode.SYSTEM.name) ?: ThemeMode.SYSTEM.name
        val themeMode = try { ThemeMode.valueOf(themeModeStr) } catch (e: Exception) { ThemeMode.SYSTEM }
        val privacy = prefs.getBoolean("def_privacyMode", false)
        val fontSizeStr = prefs.getString("def_fontSize", AppFontSize.STANDARD.name) ?: AppFontSize.STANDARD.name
        val fontSize = try { AppFontSize.valueOf(fontSizeStr) } catch (e: Exception) { AppFontSize.STANDARD }
        val customAppColor = prefs.getLong("def_customAppColor", 0xFF005FB1)
        val viewOrderStr = prefs.getString("def_customViewOrder", null)
        val customViewOrder = if (!viewOrderStr.isNullOrBlank()) {
            try {
                val parsed = viewOrderStr.split(",").mapNotNull { name ->
                    try { AppViewMode.valueOf(name.trim()) } catch (e: Exception) { null }
                }
                if (parsed.isNotEmpty()) parsed else DisplaySettings().customViewOrder
            } catch (e: Exception) {
                DisplaySettings().customViewOrder
            }
        } else {
            DisplaySettings().customViewOrder
        }

        val restored = DisplaySettings(
            showPercentOfTotal = showPT,
            showPercentOfGroup = showPG,
            showTotalValue = showTV,
            decimalPlaces = dec,
            compactCurrency = compact,
            currencyUnit = cUnit,
            usePersianDigits = persianDigits,
            themeMode = themeMode,
            privacyMode = privacy,
            fontSize = fontSize,
            customAppColor = customAppColor,
            customViewOrder = customViewOrder
        )
        updateDisplaySettings(restored)
    }

    fun updateDisplaySettings(settings: DisplaySettings) {
        _displaySettings.value = settings
        prefs.edit().apply {
            putBoolean("showPercentOfTotal", settings.showPercentOfTotal)
            putBoolean("showPercentOfGroup", settings.showPercentOfGroup)
            putBoolean("showTotalValue", settings.showTotalValue)
            putInt("decimalPlaces", settings.decimalPlaces)
            putBoolean("compactCurrency", settings.compactCurrency)
            putString("currencyUnit", settings.currencyUnit.name)
            putBoolean("usePersianDigits", settings.usePersianDigits)
            putString("themeMode", settings.themeMode.name)
            putBoolean("privacyMode", settings.privacyMode)
            putString("fontSize", settings.fontSize.name)
            putLong("customAppColor", settings.customAppColor)
            putString("customViewOrder", settings.customViewOrder.joinToString(",") { it.name })
            apply()
        }
    }

    fun togglePrivacyMode() {
        val current = _displaySettings.value
        updateDisplaySettings(current.copy(privacyMode = !current.privacyMode))
    }

    private fun loadSortConfig(): SortConfig {
        val fieldStr = prefs.getString("sortField", SortField.TOTAL_VALUE.name) ?: SortField.TOTAL_VALUE.name
        val dirStr = prefs.getString("sortDirection", SortDirection.DESC.name) ?: SortDirection.DESC.name
        val field = try { SortField.valueOf(fieldStr) } catch (e: Exception) { SortField.TOTAL_VALUE }
        val dir = try { SortDirection.valueOf(dirStr) } catch (e: Exception) { SortDirection.DESC }
        return SortConfig(field, dir)
    }

    fun updateSortConfig(config: SortConfig) {
        _sortConfig.value = config
        prefs.edit().apply {
            putString("sortField", config.field.name)
            putString("sortDirection", config.direction.name)
            apply()
        }
    }

    // --- CRUD Operations with Undo History ---

    suspend fun addChild(
        parentId: String,
        name: String,
        unitPrice: Double,
        quantity: Double,
        unit: String
    ): Boolean = withContext(Dispatchers.IO) {
        recordSnapshotForUndo("افزودن دارایی «$name»")
        val currentNodes = nodeDao.getAllNodes().toMutableList()
        val parent = currentNodes.find { it.id == parentId }
        val now = System.currentTimeMillis()

        // If parent was an individual leaf node with non-zero value, preserve original leaf content
        if (parent != null && parent.id != ROOT_NODE_ID) {
            val existingChildren = currentNodes.filter { it.parentId == parentId }
            if (existingChildren.isEmpty() && parent.quantity > 0 && parent.unitPrice > 0) {
                val preservationChild = StoredNodeEntity(
                    id = TreeEngine.generateNodeId(),
                    parentId = parentId,
                    name = "${parent.name} (اصلی)",
                    quantity = parent.quantity,
                    unit = parent.unit,
                    unitPrice = parent.unitPrice,
                    createdAt = now
                )
                currentNodes.add(preservationChild)
                val pIdx = currentNodes.indexOfFirst { it.id == parentId }
                if (pIdx != -1) {
                    currentNodes[pIdx] = currentNodes[pIdx].copy(
                        quantity = 1.0,
                        unit = "گروه",
                        updatedAt = now
                    )
                }
            }
        }

        val newChild = StoredNodeEntity(
            id = TreeEngine.generateNodeId(),
            parentId = parentId,
            name = name,
            quantity = quantity,
            unit = unit,
            unitPrice = unitPrice,
            createdAt = now
        )
        currentNodes.add(newChild)
        nodeDao.insertAll(currentNodes)
        true
    }

    suspend fun editNode(
        nodeId: String,
        name: String,
        quantity: Double,
        unit: String,
        unitPrice: Double
    ) = withContext(Dispatchers.IO) {
        recordSnapshotForUndo("ویرایش دارایی «$name»")
        val currentNodes = nodeDao.getAllNodes().toMutableList()
        val idx = currentNodes.indexOfFirst { it.id == nodeId }
        if (idx != -1) {
            val existing = currentNodes[idx]
            val updated = existing.copy(
                name = name,
                quantity = quantity,
                unit = unit,
                unitPrice = unitPrice,
                updatedAt = System.currentTimeMillis()
            )
            nodeDao.update(updated)
        }
    }

    suspend fun moveNode(
        movingNodeId: String,
        targetParentId: String
    ): Result<Unit> = withContext(Dispatchers.IO) {
        if (movingNodeId == targetParentId || movingNodeId == ROOT_NODE_ID) {
            return@withContext Result.failure(Exception("انتقال به این هم‌گروه امکان‌پذیر نیست"))
        }

        val currentNodes = nodeDao.getAllNodes().toMutableList()
        if (TreeEngine.checkCycle(currentNodes, movingNodeId, targetParentId)) {
            return@withContext Result.failure(Exception("خطا: امکان انتقال به زیرمجموعه خود وجود ندارد (حلقه نامعتبر)"))
        }

        val movingNode = currentNodes.find { it.id == movingNodeId } ?: return@withContext Result.failure(Exception("گره یافت نشد"))
        val targetNode = currentNodes.find { it.id == targetParentId } ?: return@withContext Result.failure(Exception("هم‌گروه مقصد یافت نشد"))

        recordSnapshotForUndo("انتقال «${movingNode.name}» به «${targetNode.name}»")
        val now = System.currentTimeMillis()

        // Check if target is a leaf node; if so convert to group
        val targetHasChildren = currentNodes.any { it.parentId == targetParentId && it.id != movingNodeId }
        if (!targetHasChildren && targetParentId != ROOT_NODE_ID) {
            if (targetNode.quantity > 0 && targetNode.unitPrice > 0) {
                val preservationChild = StoredNodeEntity(
                    id = TreeEngine.generateNodeId(),
                    parentId = targetParentId,
                    name = "${targetNode.name} (اصلی)",
                    quantity = targetNode.quantity,
                    unit = targetNode.unit,
                    unitPrice = targetNode.unitPrice,
                    createdAt = now
                )
                currentNodes.add(preservationChild)
                val tIdx = currentNodes.indexOfFirst { it.id == targetParentId }
                if (tIdx != -1) {
                    currentNodes[tIdx] = currentNodes[tIdx].copy(
                        quantity = 1.0,
                        unit = "گروه",
                        updatedAt = now
                    )
                }
            }
        }

        val mIdx = currentNodes.indexOfFirst { it.id == movingNodeId }
        if (mIdx != -1) {
            currentNodes[mIdx] = currentNodes[mIdx].copy(
                parentId = targetParentId,
                updatedAt = now
            )
        }

        nodeDao.insertAll(currentNodes)
        Result.success(Unit)
    }

    suspend fun deleteNodeWithSubtree(nodeId: String): Int = withContext(Dispatchers.IO) {
        if (nodeId == ROOT_NODE_ID) return@withContext 0

        val currentNodes = nodeDao.getAllNodes()
        val targetName = currentNodes.find { it.id == nodeId }?.name ?: "گره انتخابی"
        recordSnapshotForUndo("حذف «$targetName» و زیرمجموعه‌ها")
        val toDelete = mutableSetOf(nodeId)
        var added = true
        while (added) {
            added = false
            for (node in currentNodes) {
                val pId = node.parentId
                if (pId != null && toDelete.contains(pId) && !toDelete.contains(node.id)) {
                    toDelete.add(node.id)
                    added = true
                }
            }
        }

        nodeDao.deleteByIds(toDelete.toList())
        toDelete.size
    }

    // --- Wipe Database to Zero (خام کردن پایگاه داده) ---
    suspend fun wipeDatabaseToZero(): Unit = withContext(Dispatchers.IO) {
        recordSnapshotForUndo("خام و صفر کردن اطلاعات پایگاه داده")
        val emptyRoot = StoredNodeEntity(
            id = ROOT_NODE_ID,
            parentId = null,
            name = "کل دارایی‌ها",
            quantity = 1.0,
            unit = "پرتفوی",
            unitPrice = 0.0,
            createdAt = System.currentTimeMillis()
        )
        nodeDao.replaceAll(listOf(emptyRoot))
    }

    // --- Excel Import Execution ---

    suspend fun applyImportPlan(
        importPlan: ImportPlan,
        skipAllDuplicates: Boolean,
        confirmDeleteAbsentStocks: Boolean
    ): String = withContext(Dispatchers.IO) {
        recordSnapshotForUndo("بارگذاری و ادغام اطلاعات از فایل اکسل")
        val workingNodes = nodeDao.getAllNodes().toMutableList()
        val now = System.currentTimeMillis()

        fun findOrCreateIndustryGroup(industryName: String): String {
            val existing = workingNodes.find { it.name.trim().equals(industryName.trim(), ignoreCase = true) }
            if (existing != null) return existing.id

            val stocksMain = workingNodes.find { it.name.contains("سهام") || it.name.contains("بورس") }
            val parentId = stocksMain?.id ?: ROOT_NODE_ID
            val newIndId = TreeEngine.generateNodeId()
            val newIndNode = StoredNodeEntity(
                id = newIndId,
                parentId = parentId,
                name = industryName,
                quantity = 1.0,
                unit = "صنعت",
                unitPrice = 0.0,
                createdAt = now
            )
            workingNodes.add(newIndNode)
            return newIndId
        }

        var addedCount = 0
        var replacedCount = 0
        var deletedCount = 0

        val approvedRows = (importPlan.standardRows + importPlan.needsReviewRows).filter { it.selected }

        for (row in approvedRows) {
            if (row.isDuplicateInTree) {
                if (skipAllDuplicates || row.duplicateResolution == DuplicateResolution.SKIP) {
                    continue
                }
                if (row.duplicateResolution == DuplicateResolution.REPLACE && row.matchedExistingNodeId != null) {
                    val idx = workingNodes.indexOfFirst { it.id == row.matchedExistingNodeId }
                    if (idx != -1) {
                        workingNodes[idx] = workingNodes[idx].copy(
                            quantity = row.raw.quantity,
                            unitPrice = row.unitPriceCalculated,
                            updatedAt = now
                        )
                        replacedCount++
                    }
                } else if (row.duplicateResolution == DuplicateResolution.SUM && row.matchedExistingNodeId != null) {
                    val idx = workingNodes.indexOfFirst { it.id == row.matchedExistingNodeId }
                    if (idx != -1) {
                        val currentQty = workingNodes[idx].quantity
                        val currentPrice = workingNodes[idx].unitPrice
                        val newQty = row.raw.quantity
                        val newPrice = row.unitPriceCalculated
                        val totalQty = currentQty + newQty
                        val avgPrice = if (totalQty > 0) ((currentQty * currentPrice) + (newQty * newPrice)) / totalQty else 0.0
                        workingNodes[idx] = workingNodes[idx].copy(
                            quantity = totalQty,
                            unitPrice = avgPrice,
                            updatedAt = now
                        )
                        replacedCount++
                    }
                } else if (row.duplicateResolution == DuplicateResolution.NEW_NODE_WITH_TAG) {
                    val existing = workingNodes.find { it.id == row.matchedExistingNodeId }
                    val parentId = existing?.parentId ?: findOrCreateIndustryGroup(row.industry)
                    workingNodes.add(
                        StoredNodeEntity(
                            id = TreeEngine.generateNodeId(),
                            parentId = parentId,
                            name = row.canonicalName,
                            quantity = row.raw.quantity,
                            unit = "سهم",
                            unitPrice = row.unitPriceCalculated,
                            categoryTag = row.customCategoryTag ?: "کارگزاری",
                            createdAt = now
                        )
                    )
                    addedCount++
                }
            } else {
                val indParentId = findOrCreateIndustryGroup(row.industry)
                workingNodes.add(
                    StoredNodeEntity(
                        id = TreeEngine.generateNodeId(),
                        parentId = indParentId,
                        name = row.canonicalName,
                        quantity = row.raw.quantity,
                        unit = "سهم",
                        unitPrice = row.unitPriceCalculated,
                        createdAt = now
                    )
                )
                addedCount++
            }
        }

        if (confirmDeleteAbsentStocks && importPlan.absentTreeNodes.isNotEmpty()) {
            val absentIds = importPlan.absentTreeNodes.map { it.id }.toSet()
            workingNodes.removeAll { absentIds.contains(it.id) }
            deletedCount = absentIds.size
        }

        nodeDao.replaceAll(workingNodes)

        "واردسازی با موفقیت انجام شد: $addedCount نماد جدید افزوده شد، $replacedCount نماد به‌روزرسانی شد" +
                if (deletedCount > 0) "، $deletedCount سهم ناموجود حذف گردید." else "."
    }

    // --- Symbol Book CRUD ---

    suspend fun insertSymbol(symbol: SymbolEntryEntity) = withContext(Dispatchers.IO) {
        symbolBookDao.insert(symbol)
    }

    suspend fun deleteSymbol(rawSymbol: String) = withContext(Dispatchers.IO) {
        symbolBookDao.deleteByRawSymbol(rawSymbol)
    }

    suspend fun resetSymbolBook() = withContext(Dispatchers.IO) {
        symbolBookDao.replaceAll(SeedData.getDefaultSymbolBook())
    }

    suspend fun syncDefaultSymbols() = withContext(Dispatchers.IO) {
        val existing = symbolBookDao.getAllSymbols()
        val existingMap = existing.associateBy { it.rawSymbol }
        val toAdd = SeedData.getDefaultSymbolBook().filter { !existingMap.containsKey(it.rawSymbol) }
        if (toAdd.isNotEmpty()) {
            symbolBookDao.insertAll(toAdd)
        }
    }

    // --- Backup & Restore ---

    suspend fun resetAllToDefaults() = withContext(Dispatchers.IO) {
        nodeDao.replaceAll(SeedData.getInitialNodes())
        symbolBookDao.replaceAll(SeedData.getDefaultSymbolBook())
        updateDisplaySettings(DisplaySettings())
        updateSortConfig(SortConfig())
    }

    suspend fun exportBackupJson(): String = withContext(Dispatchers.IO) {
        val nodes = nodeDao.getAllNodes()
        val symbols = symbolBookDao.getAllSymbols()
        val settings = _displaySettings.value
        val sort = _sortConfig.value

        val rootJson = JSONObject().apply {
            put("version", 1)
            put("exportedAt", System.currentTimeMillis())

            val nodesArray = JSONArray()
            for (n in nodes) {
                nodesArray.put(JSONObject().apply {
                    put("id", n.id)
                    put("parentId", n.parentId ?: JSONObject.NULL)
                    put("name", n.name)
                    put("quantity", n.quantity)
                    put("unit", n.unit)
                    put("unitPrice", n.unitPrice)
                    put("createdAt", n.createdAt)
                    if (n.categoryTag != null) put("categoryTag", n.categoryTag)
                })
            }
            put("nodes", nodesArray)

            val symbolsArray = JSONArray()
            for (s in symbols) {
                symbolsArray.put(JSONObject().apply {
                    put("rawSymbol", s.rawSymbol)
                    put("canonicalName", s.canonicalName)
                    put("industry", s.industry)
                    put("source", s.source)
                })
            }
            put("symbols", symbolsArray)
        }

        rootJson.toString(2)
    }

    suspend fun importBackupJson(jsonString: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val root = JSONObject(jsonString)
            val nodesArray = root.getJSONArray("nodes")
            val restoredNodes = mutableListOf<StoredNodeEntity>()

            for (i in 0 until nodesArray.length()) {
                val obj = nodesArray.getJSONObject(i)
                val id = obj.getString("id")
                val parentId = if (obj.isNull("parentId")) null else obj.getString("parentId")
                val name = obj.getString("name")
                val quantity = obj.optDouble("quantity", 1.0)
                val unit = obj.optString("unit", "واحد")
                val unitPrice = obj.optDouble("unitPrice", 0.0)
                val createdAt = obj.optLong("createdAt", System.currentTimeMillis())
                val tag = if (obj.has("categoryTag")) obj.getString("categoryTag") else null

                restoredNodes.add(
                    StoredNodeEntity(
                        id = id,
                        parentId = parentId,
                        name = name,
                        quantity = quantity,
                        unit = unit,
                        unitPrice = unitPrice,
                        createdAt = createdAt,
                        categoryTag = tag
                    )
                )
            }

            if (restoredNodes.isEmpty()) {
                return@withContext Result.failure(Exception("فایل پشتیبان فاقد گره‌های دارایی معتبر است"))
            }

            nodeDao.replaceAll(restoredNodes)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
