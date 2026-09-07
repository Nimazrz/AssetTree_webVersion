/**
 * Local Storage Persistence & State Manager
 * Provides reliable offline storage, undo/redo history tracking, backup export/import,
 * and display configuration persistence.
 */

import {
  StoredNodeEntity,
  SymbolEntryEntity,
  UndoSnapshot,
  DisplaySettings,
  SortConfig,
  ImportPlan,
  ROOT_NODE_ID,
  ROOT_NODE_NAME,
} from '../types';
import { getInitialNodes, getDefaultSymbolBook } from './seedData';
import { TreeEngine } from '../core/TreeEngine';

const STORAGE_KEY_NODES = 'asset_tree_nodes';
const STORAGE_KEY_SYMBOLS = 'asset_tree_symbols';
const STORAGE_KEY_SETTINGS = 'asset_tree_settings';
const STORAGE_KEY_SORT = 'asset_tree_sort';

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  showPercentOfTotal: true,
  showPercentOfGroup: true,
  showTotalValue: true,
  decimalPlaces: 1,
  compactCurrency: true,
  currencyUnit: 'TOMAN',
  usePersianDigits: true,
  themeMode: 'SYSTEM',
  privacyMode: false,
  fontSize: 'STANDARD',
  language: 'fa',
  customAppColor: '#005FB1',
  customViewOrder: [
    'TREEMAP',
    'CLASSIC_TREE',
    'TREE',
    'CHART',
    'BAR_CHART',
    'PIE_CHART',
    'ANALYTICS',
  ],
  customAssetColors: {},
};

export const DEFAULT_SORT_CONFIG: SortConfig = {
  field: 'TOTAL_VALUE',
  direction: 'DESC',
};

export class AssetStorage {
  private undoStack: UndoSnapshot[] = [];

  constructor() {
    this.initIfEmpty();
  }

  private initIfEmpty() {
    if (!localStorage.getItem(STORAGE_KEY_NODES)) {
      this.saveNodes(getInitialNodes());
    }
    if (!localStorage.getItem(STORAGE_KEY_SYMBOLS)) {
      this.saveSymbols(getDefaultSymbolBook());
    }
    if (!localStorage.getItem(STORAGE_KEY_SETTINGS)) {
      this.saveSettings(DEFAULT_DISPLAY_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEY_SORT)) {
      this.saveSortConfig(DEFAULT_SORT_CONFIG);
    }
  }

  getNodes(): StoredNodeEntity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_NODES);
      if (!data) return getInitialNodes();
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : getInitialNodes();
    } catch {
      return getInitialNodes();
    }
  }

  saveNodes(nodes: StoredNodeEntity[]) {
    localStorage.setItem(STORAGE_KEY_NODES, JSON.stringify(nodes));
  }

  getSymbols(): SymbolEntryEntity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SYMBOLS);
      if (!data) return getDefaultSymbolBook();
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultSymbolBook();
    } catch {
      return getDefaultSymbolBook();
    }
  }

  saveSymbols(symbols: SymbolEntryEntity[]) {
    localStorage.setItem(STORAGE_KEY_SYMBOLS, JSON.stringify(symbols));
  }

  getSettings(): DisplaySettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!data) return DEFAULT_DISPLAY_SETTINGS;
      const parsed = JSON.parse(data);
      return { ...DEFAULT_DISPLAY_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_DISPLAY_SETTINGS;
    }
  }

  saveSettings(settings: DisplaySettings) {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }

  getSortConfig(): SortConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SORT);
      if (!data) return DEFAULT_SORT_CONFIG;
      return JSON.parse(data);
    } catch {
      return DEFAULT_SORT_CONFIG;
    }
  }

  saveSortConfig(config: SortConfig) {
    localStorage.setItem(STORAGE_KEY_SORT, JSON.stringify(config));
  }

  // --- Undo System ---

  recordUndoSnapshot(title = 'تغییر اطلاعات پرتفوی') {
    const currentNodes = this.getNodes();
    if (this.undoStack.length >= 30) {
      this.undoStack.shift();
    }
    const snapshot: UndoSnapshot = {
      id: `undo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      timestamp: Date.now(),
      nodeCount: currentNodes.length,
      nodes: JSON.parse(JSON.stringify(currentNodes)),
    };
    this.undoStack.push(snapshot);
  }

  getUndoCount(): number {
    return this.undoStack.length;
  }

  getUndoHistory(): UndoSnapshot[] {
    return [...this.undoStack].reverse();
  }

  undoLast(): boolean {
    if (this.undoStack.length === 0) return false;
    const snapshot = this.undoStack.pop();
    if (!snapshot) return false;
    this.saveNodes(snapshot.nodes);
    return true;
  }

  undoMultipleSteps(stepsCount: number): boolean {
    if (this.undoStack.length === 0 || stepsCount <= 0) return false;
    const toPop = Math.min(stepsCount, this.undoStack.length);
    let targetSnapshot: UndoSnapshot | null = null;
    for (let i = 0; i < toPop; i++) {
      targetSnapshot = this.undoStack.pop() || null;
    }
    if (targetSnapshot) {
      this.saveNodes(targetSnapshot.nodes);
      return true;
    }
    return false;
  }

  // --- CRUD Operations ---

  addChild(
    parentId: string,
    name: string,
    unitPrice: number,
    quantity: number,
    unit: string
  ): StoredNodeEntity {
    this.recordUndoSnapshot(`افزودن دارایی «${name}»`);
    const nodes = this.getNodes();
    const newNode: StoredNodeEntity = {
      id: TreeEngine.generateNodeId(),
      parentId,
      name: name.trim(),
      unitPrice,
      quantity,
      unit: unit.trim() || 'واحد',
      createdAt: Date.now(),
      categoryTag: null,
    };
    nodes.push(newNode);
    this.saveNodes(nodes);
    return newNode;
  }

  editNode(
    nodeId: string,
    name: string,
    quantity: number,
    unit: string,
    unitPrice: number
  ) {
    this.recordUndoSnapshot(`ویرایش دارایی «${name}»`);
    const nodes = this.getNodes();
    const idx = nodes.findIndex((n) => n.id === nodeId);
    if (idx !== -1) {
      nodes[idx] = {
        ...nodes[idx],
        name: name.trim(),
        quantity,
        unit: unit.trim(),
        unitPrice,
        updatedAt: Date.now(),
      };
      this.saveNodes(nodes);
    }
  }

  moveNode(
    movingNodeId: string,
    targetParentId: string
  ): { success: boolean; message?: string } {
    const nodes = this.getNodes();
    const moving = nodes.find((n) => n.id === movingNodeId);
    if (!moving) return { success: false, message: 'گره مورد نظر یافت نشد' };

    if (TreeEngine.checkCycle(nodes, movingNodeId, targetParentId)) {
      return {
        success: false,
        message: 'خطا: امکان انتقال شاخه به زیرمجموعه‌های خودش وجود ندارد (حلقه نامعتبر).',
      };
    }

    this.recordUndoSnapshot(`انتقال شاخه «${moving.name}»`);
    moving.parentId = targetParentId;
    moving.updatedAt = Date.now();
    this.saveNodes(nodes);
    return { success: true };
  }

  deleteNodeWithSubtree(nodeId: string): number {
    if (nodeId === ROOT_NODE_ID) return 0;
    const nodes = this.getNodes();
    const target = nodes.find((n) => n.id === nodeId);
    if (!target) return 0;

    this.recordUndoSnapshot(`حذف دارایی «${target.name}»`);

    const idsToDelete = new Set<string>([nodeId]);
    let addedAny = true;
    while (addedAny) {
      addedAny = false;
      for (const n of nodes) {
        if (n.parentId && idsToDelete.has(n.parentId) && !idsToDelete.has(n.id)) {
          idsToDelete.add(n.id);
          addedAny = true;
        }
      }
    }

    const filtered = nodes.filter((n) => !idsToDelete.has(n.id));
    this.saveNodes(filtered);
    return idsToDelete.size;
  }

  // --- Symbol Book ---

  insertSymbol(symbol: SymbolEntryEntity) {
    const symbols = this.getSymbols();
    const idx = symbols.findIndex(
      (s) => s.rawSymbol.toLowerCase() === symbol.rawSymbol.toLowerCase()
    );
    if (idx !== -1) {
      symbols[idx] = { ...symbol, lastUpdated: Date.now() };
    } else {
      symbols.push({ ...symbol, lastUpdated: Date.now() });
    }
    this.saveSymbols(symbols);
  }

  deleteSymbol(rawSymbol: string) {
    const symbols = this.getSymbols().filter(
      (s) => s.rawSymbol.toLowerCase() !== rawSymbol.toLowerCase()
    );
    this.saveSymbols(symbols);
  }

  resetSymbolBook() {
    this.saveSymbols(getDefaultSymbolBook());
  }

  syncDefaultSymbols() {
    const defaults = getDefaultSymbolBook();
    const current = this.getSymbols();
    const map = new Map<string, SymbolEntryEntity>();
    for (const d of defaults) map.set(d.rawSymbol.toLowerCase(), d);
    for (const c of current) map.set(c.rawSymbol.toLowerCase(), c);
    this.saveSymbols(Array.from(map.values()));
  }

  // --- Reset & Backup ---

  resetAllToDefaults() {
    this.recordUndoSnapshot('بازنشانی به پرتفوی نمونه');
    this.saveNodes(getInitialNodes());
    this.saveSymbols(getDefaultSymbolBook());
    this.saveSettings(DEFAULT_DISPLAY_SETTINGS);
  }

  wipeDatabaseToZero() {
    this.recordUndoSnapshot('خام‌سازی پایگاه داده');
    const rootNode = TreeEngine.createDefaultRootNode();
    this.saveNodes([rootNode]);
  }

  exportBackupJson(): string {
    return JSON.stringify(
      {
        version: 1,
        appName: 'AssetTree',
        timestamp: Date.now(),
        nodes: this.getNodes(),
        symbols: this.getSymbols(),
        settings: this.getSettings(),
      },
      null,
      2
    );
  }

  importBackupJson(jsonString: string): { success: boolean; message?: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.nodes)) {
        return { success: false, message: 'فرمت فایل پشتیبان نامعتبر است.' };
      }
      this.recordUndoSnapshot('بازیابی نسخه پشتیبان');
      this.saveNodes(data.nodes);
      if (Array.isArray(data.symbols)) {
        this.saveSymbols(data.symbols);
      }
      if (data.settings && typeof data.settings === 'object') {
        this.saveSettings({ ...DEFAULT_DISPLAY_SETTINGS, ...data.settings });
      }
      return { success: true };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'خطا در بارگذاری' };
    }
  }

  // --- Excel Import Plan Application ---

  applyImportPlan(
    plan: ImportPlan,
    skipAllDuplicates: boolean,
    confirmDeleteAbsentStocks: boolean
  ): string {
    this.recordUndoSnapshot('ورود دسته‌ای داده‌های اکسل');
    const nodes = this.getNodes();

    // 1. Find or create default Stock / Industry group
    let stocksGroup = nodes.find(
      (n) =>
        n.parentId === ROOT_NODE_ID &&
        (n.name.includes("بورس") || n.name.includes("سهام"))
    );
    if (!stocksGroup) {
      stocksGroup = {
        id: "grp_stocks",
        parentId: ROOT_NODE_ID,
        name: "سهام و بورس اوراق بهادار",
        quantity: 1,
        unit: "گروه",
        unitPrice: 0,
        createdAt: Date.now(),
      };
      nodes.push(stocksGroup);
    }

    const industryGroupMap = new Map<string, StoredNodeEntity>();
    for (const n of nodes) {
      if (n.parentId === stocksGroup.id) {
        industryGroupMap.set(n.name.trim().toLowerCase(), n);
      }
    }

    const getOrCreateIndustryGroup = (industryName: string): StoredNodeEntity => {
      const key = (industryName.trim() || 'سایر صنایع').toLowerCase();
      let grp = industryGroupMap.get(key);
      if (!grp) {
        grp = {
          id: `grp_ind_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          parentId: stocksGroup!.id,
          name: industryName.trim() || 'سایر صنایع',
          quantity: 1,
          unit: 'صنعت',
          unitPrice: 0,
          createdAt: Date.now(),
        };
        nodes.push(grp);
        industryGroupMap.set(key, grp);
      }
      return grp;
    };

    let addedCount = 0;
    let updatedCount = 0;

    const allRows = [...plan.standardRows, ...plan.needsReviewRows];

    for (const row of allRows) {
      if (!row.selected) continue;

      if (row.isDuplicateInTree) {
        if (skipAllDuplicates || row.duplicateResolution === 'SKIP') {
          continue;
        }

        const existing = nodes.find((n) => n.id === row.matchedExistingNodeId);
        if (existing) {
          if (row.duplicateResolution === 'REPLACE') {
            existing.quantity = row.raw.quantity;
            existing.unitPrice = row.unitPriceCalculated;
            existing.updatedAt = Date.now();
            updatedCount++;
            continue;
          } else if (row.duplicateResolution === 'SUM') {
            const newQty = existing.quantity + row.raw.quantity;
            const existingTotal = existing.quantity * existing.unitPrice;
            const newTotal = existingTotal + row.raw.totalRialValue;
            existing.quantity = newQty;
            existing.unitPrice = newQty > 0 ? newTotal / newQty : 0;
            existing.updatedAt = Date.now();
            updatedCount++;
            continue;
          }
        }
      }

      // Add as new node
      const parentIndustry = getOrCreateIndustryGroup(row.industry);
      const newNode: StoredNodeEntity = {
        id: TreeEngine.generateNodeId(),
        parentId: parentIndustry.id,
        name: row.canonicalName || row.raw.symbolRaw,
        quantity: row.raw.quantity,
        unit: 'سهم',
        unitPrice: row.unitPriceCalculated,
        createdAt: Date.now(),
        categoryTag: row.customCategoryTag || null,
      };
      nodes.push(newNode);
      addedCount++;
    }

    // 2. Delete absent stocks if requested
    let deletedAbsentCount = 0;
    if (confirmDeleteAbsentStocks && plan.absentTreeNodes.length > 0) {
      const absentIds = new Set(plan.absentTreeNodes.map((a) => a.id));
      const filtered = nodes.filter((n) => {
        if (absentIds.has(n.id)) {
          deletedAbsentCount++;
          return false;
        }
        return true;
      });
      this.saveNodes(filtered);
      return `عملیات پایان یافت: ${addedCount} دارایی افزوده، ${updatedCount} دارایی به‌روزرسانی و ${deletedAbsentCount} سهم ناموجود حذف گردید.`;
    }

    this.saveNodes(nodes);
    return `عملیات پایان یافت: ${addedCount} سهم افزوده شد و ${updatedCount} سهم به‌روزرسانی گردید.`;
  }
}

export const assetStorage = new AssetStorage();
