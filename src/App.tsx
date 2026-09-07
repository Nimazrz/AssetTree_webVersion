/**
 * AssetTree Web Application Entry Point
 * Orchestrates portfolio state, dynamic views, interactive modal dialogs,
 * theme management, and localized backup operations.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  StoredNodeEntity,
  CalculatedNode,
  SymbolEntryEntity,
  DisplaySettings,
  SortConfig,
  AppViewMode,
  ImportPlan,
  UserProfile,
} from './types';
import { assetStorage } from './data/storage';
import { TreeEngine } from './core/TreeEngine';
import { getPersianBackupFileName } from './utils/persianDate';
import { AppTopBar } from './components/AppTopBar';
import { PortfolioSummaryBar } from './components/PortfolioSummaryBar';
import { SearchAndChartTabsBar } from './components/SearchAndChartTabsBar';
import {
  auth,
  onAuthStateChanged,
  loadUserPortfolioFromFirestore,
  saveUserPortfolioToFirestore,
} from './lib/firebase';

// Views
import { ModernTreeView } from './views/ModernTreeView';
import { ClassicTreeView } from './views/ClassicTreeView';
import { TreemapChartView } from './views/TreemapChartView';
import { SunburstChartView } from './views/SunburstChartView';
import { BarChartView } from './views/BarChartView';
import { PieChartView } from './views/PieChartView';
import { AnalyticsDashboardView } from './views/AnalyticsDashboardView';

// Dialogs
import { NodeDetailsDialog } from './dialogs/NodeDetailsDialog';
import { AddChildDialog } from './dialogs/AddChildDialog';
import { EditNodeDialog } from './dialogs/EditNodeDialog';
import { MoveNodeDialog } from './dialogs/MoveNodeDialog';
import { DeleteNodeDialog } from './dialogs/DeleteNodeDialog';
import { ExcelImportDialog } from './dialogs/ExcelImportDialog';
import { SymbolBookDialog } from './dialogs/SymbolBookDialog';
import { SettingsDialog } from './dialogs/SettingsDialog';
import { UndoHistoryDialog } from './dialogs/UndoHistoryDialog';
import { AuthDialog, AuthMode } from './dialogs/AuthDialog';
import { UserProfileDialog } from './dialogs/UserProfileDialog';

export const App: React.FC = () => {
  // Primary State
  const [storedNodes, setStoredNodes] = useState<StoredNodeEntity[]>(() => assetStorage.getNodes());
  const [symbols, setSymbols] = useState<SymbolEntryEntity[]>(() => assetStorage.getSymbols());
  const [settings, setSettings] = useState<DisplaySettings>(() => assetStorage.getSettings());
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => assetStorage.getSortConfig());
  const [activeView, setActiveView] = useState<AppViewMode>('TREE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [undoCount, setUndoCount] = useState<number>(() => assetStorage.getUndoCount());

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authDialogMode, setAuthDialogMode] = useState<AuthMode>('LOGIN');
  const [resetOobCode, setResetOobCode] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Listen to Firebase Auth state changes & sync user's personal portfolio
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'کاربر',
          photoURL: firebaseUser.photoURL,
          createdAt: firebaseUser.metadata.creationTime,
          lastLoginAt: firebaseUser.metadata.lastSignInTime,
        };
        setCurrentUser(profile);
        assetStorage.setActiveUser(firebaseUser.uid);

        // Fetch user's personal portfolio from Firestore
        try {
          const cloudData = await loadUserPortfolioFromFirestore(firebaseUser.uid);
          if (cloudData && Array.isArray(cloudData.nodes) && cloudData.nodes.length > 0) {
            assetStorage.applyCloudData(cloudData);
          } else {
            // First time registration: persist current initial nodes under this user account
            await saveUserPortfolioToFirestore(firebaseUser.uid, {
              nodes: assetStorage.getNodes(),
              symbols: assetStorage.getSymbols(),
              settings: assetStorage.getSettings(),
            });
          }
        } catch (err) {
          console.warn('Error syncing cloud portfolio data:', err);
        }
        reloadFromStorage();
      } else {
        setCurrentUser(null);
        assetStorage.setActiveUser(null);
        reloadFromStorage();
      }
    });

    return () => unsubscribe();
  }, []);

  // Check URL query parameters for password reset email action links
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const modeParam = searchParams.get('mode');
      const oobCodeParam = searchParams.get('oobCode');
      if (modeParam === 'resetPassword' && oobCodeParam) {
        setResetOobCode(oobCodeParam);
        setAuthDialogMode('RESET_CONFIRM');
        setIsAuthOpen(true);
      }
    } catch (e) {
      console.warn('Could not check reset password params:', e);
    }
  }, []);

  // Dark Theme detection and sync
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (settings.themeMode === 'DARK') return true;
    if (settings.themeMode === 'LIGHT') return false;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Keep isDark in sync with settings.themeMode changes (e.g., from settings dialog or reload)
  useEffect(() => {
    if (settings.themeMode === 'DARK') {
      setIsDark(true);
    } else if (settings.themeMode === 'LIGHT') {
      setIsDark(false);
    } else if (settings.themeMode === 'SYSTEM') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDark(media.matches);
      const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [settings.themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [isDark]);

  // Synchronize document dir and lang attributes based on settings.language
  useEffect(() => {
    const currentLang = settings.language || 'fa';
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'fa' ? 'rtl' : 'ltr';
  }, [settings.language]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    const newSettings: DisplaySettings = {
      ...settings,
      themeMode: nextDark ? 'DARK' : 'LIGHT',
    };
    setSettings(newSettings);
    assetStorage.saveSettings(newSettings);
  };

  const toggleLanguage = () => {
    const nextLang = (settings.language || 'fa') === 'fa' ? 'en' : 'fa';
    const newSettings: DisplaySettings = {
      ...settings,
      language: nextLang,
      usePersianDigits: nextLang === 'fa',
    };
    setSettings(newSettings);
    assetStorage.saveSettings(newSettings);
  };

  const togglePrivacy = () => {
    const newSettings: DisplaySettings = {
      ...settings,
      privacyMode: !settings.privacyMode,
    };
    setSettings(newSettings);
    assetStorage.saveSettings(newSettings);
  };

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Dialog State
  const [selectedDetailsNode, setSelectedDetailsNode] = useState<CalculatedNode | null>(null);
  const [selectedAddChildParent, setSelectedAddChildParent] = useState<CalculatedNode | null>(null);
  const [selectedEditNode, setSelectedEditNode] = useState<CalculatedNode | null>(null);
  const [selectedMoveNode, setSelectedMoveNode] = useState<CalculatedNode | null>(null);
  const [selectedDeleteNode, setSelectedDeleteNode] = useState<CalculatedNode | null>(null);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isSymbolBookOpen, setIsSymbolBookOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUndoHistoryOpen, setIsUndoHistoryOpen] = useState(false);

  // Core Bottom-Up Evaluation
  const evaluatedTree = useMemo(() => {
    return TreeEngine.evaluateTree(storedNodes);
  }, [storedNodes]);

  // Apply sorting to evaluated tree
  const sortedRoot = useMemo(() => {
    return TreeEngine.sortCalculatedTree(evaluatedTree.rootCalculated, sortConfig);
  }, [evaluatedTree.rootCalculated, sortConfig]);

  // Keep details node updated if tree recalculated
  const activeDetailsNode = useMemo(() => {
    if (!selectedDetailsNode) return null;
    return evaluatedTree.calculatedMap.get(selectedDetailsNode.id) || null;
  }, [evaluatedTree.calculatedMap, selectedDetailsNode]);

  // Reload storage state helper
  const reloadFromStorage = () => {
    setStoredNodes(assetStorage.getNodes());
    setSymbols(assetStorage.getSymbols());
    setSettings(assetStorage.getSettings());
    setSortConfig(assetStorage.getSortConfig());
    setUndoCount(assetStorage.getUndoCount());
  };

  // --- CRUD Handlers ---

  const handleAddChild = (
    name: string,
    unitPrice: number,
    quantity: number,
    unit: string
  ) => {
    if (!selectedAddChildParent) return;
    assetStorage.addChild(selectedAddChildParent.id, name, unitPrice, quantity, unit);
    reloadFromStorage();
    setSelectedAddChildParent(null);
    showToast(`دارایی «${name}» با موفقیت افزوده شد.`);
  };

  const handleEditNode = (
    nodeId: string,
    name: string,
    quantity: number,
    unit: string,
    unitPrice: number
  ) => {
    assetStorage.editNode(nodeId, name, quantity, unit, unitPrice);
    reloadFromStorage();
    setSelectedEditNode(null);
    showToast(`دارایی «${name}» به‌روزرسانی شد.`);
  };

  const handleMoveNode = (movingNodeId: string, targetParentId: string) => {
    const res = assetStorage.moveNode(movingNodeId, targetParentId);
    if (res.success) {
      reloadFromStorage();
      setSelectedMoveNode(null);
      showToast('شاخه با موفقیت به دسته‌بندی جدید انتقال یافت.');
    } else {
      alert(res.message || 'خطا در انتقال شاخه');
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    const deletedCount = assetStorage.deleteNodeWithSubtree(nodeId);
    reloadFromStorage();
    setSelectedDeleteNode(null);
    setSelectedDetailsNode(null);
    showToast(`${deletedCount} دارایی و زیرمجموعه با موفقیت حذف گردید.`);
  };

  // Undo Operations
  const handleUndoSingle = () => {
    const success = assetStorage.undoLast();
    if (success) {
      reloadFromStorage();
      showToast('آخرین عملیات با موفقیت بازگردانده شد.');
    }
  };

  const handleRollbackMultiple = (steps: number) => {
    const success = assetStorage.undoMultipleSteps(steps);
    if (success) {
      reloadFromStorage();
      showToast(`${steps} مرحله با موفقیت بازگردانده شد.`);
    }
  };

  // Excel Import Apply
  const handleApplyImportPlan = (
    plan: ImportPlan,
    skipAllDuplicates: boolean,
    confirmDeleteAbsent: boolean
  ) => {
    const summary = assetStorage.applyImportPlan(plan, skipAllDuplicates, confirmDeleteAbsent);
    reloadFromStorage();
    setIsExcelImportOpen(false);
    showToast(summary);
  };

  // Symbol Book Operations
  const handleAddSymbol = (symbol: SymbolEntryEntity) => {
    assetStorage.insertSymbol(symbol);
    reloadFromStorage();
    showToast(`نماد «${symbol.rawSymbol}» به کتابچه افزوده شد.`);
  };

  const handleDeleteSymbol = (rawSymbol: string) => {
    assetStorage.deleteSymbol(rawSymbol);
    reloadFromStorage();
    showToast(`نماد «${rawSymbol}» حذف گردید.`);
  };

  const handleResetSymbolBook = () => {
    assetStorage.resetSymbolBook();
    reloadFromStorage();
    showToast('کتابچه نمادها به حالت پیش‌فرض TSETMC بازنشانی شد.');
  };

  // Settings & Resets
  const handleUpdateSettings = (newSettings: DisplaySettings) => {
    setSettings(newSettings);
    assetStorage.saveSettings(newSettings);
  };

  const handleUpdateSortConfig = (newSort: SortConfig) => {
    setSortConfig(newSort);
    assetStorage.saveSortConfig(newSort);
  };

  const handleExportBackup = () => {
    const json = assetStorage.exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = settings.language === 'en'
      ? `AssetTree_Backup_${new Date().toISOString().slice(0, 10)}.json`
      : getPersianBackupFileName();
    a.click();
    URL.revokeObjectURL(url);
    showToast(settings.language === 'en' ? 'Backup file downloaded successfully.' : 'فایل پشتیبان با موفقیت دانلود شد.');
  };

  const handleImportBackup = (jsonString: string) => {
    const res = assetStorage.importBackupJson(jsonString);
    if (res.success) {
      reloadFromStorage();
      setIsSettingsOpen(false);
      showToast('نسخه پشتیبان با موفقیت بازیابی شد.');
    } else {
      alert(res.message || 'خطا در بازیابی فایل');
    }
  };

  const handleResetToDefaults = () => {
    assetStorage.resetAllToDefaults();
    reloadFromStorage();
    showToast('پرتفوی نمونه با موفقیت جایگزین شد.');
  };

  const handleWipeToZero = () => {
    assetStorage.wipeDatabaseToZero();
    reloadFromStorage();
    showToast('پایگاه داده خام شد.');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Bar */}
      <AppTopBar
        settings={settings}
        undoCount={undoCount}
        currentUser={currentUser}
        onTogglePrivacy={togglePrivacy}
        onUndo={() => setIsUndoHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => {
          setAuthDialogMode('LOGIN');
          setIsAuthOpen(true);
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-12">
        {/* Floating Portfolio Summary Hero */}
        <PortfolioSummaryBar
          rootCalculated={sortedRoot}
          settings={settings}
          onOpenAddRootAsset={() => setSelectedAddChildParent(sortedRoot)}
          onOpenChart={() => setActiveView('CHART')}
        />

        {/* Search Box and Chart Type Selection Menu (منوی انتخاب نوع نمودار در زیر باکس جستجو) */}
        <SearchAndChartTabsBar
          activeView={activeView}
          onSelectView={setActiveView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          settings={settings}
          sortConfig={sortConfig}
          onUpdateSort={handleUpdateSortConfig}
        />

        {/* View Switcher Container */}
        {activeView === 'TREE' && (
          <ModernTreeView
            rootCalculated={sortedRoot}
            settings={settings}
            sortConfig={sortConfig}
            onUpdateSort={handleUpdateSortConfig}
            onSelectNodeDetails={setSelectedDetailsNode}
            onAddChildNode={setSelectedAddChildParent}
            onEditNode={setSelectedEditNode}
            onMoveNode={setSelectedMoveNode}
            onDeleteNode={setSelectedDeleteNode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {activeView === 'CLASSIC_TREE' && (
          <ClassicTreeView
            rootCalculated={sortedRoot}
            settings={settings}
            onSelectNodeDetails={setSelectedDetailsNode}
            onAddChildNode={setSelectedAddChildParent}
            onEditNode={setSelectedEditNode}
            onMoveNode={setSelectedMoveNode}
            onDeleteNode={setSelectedDeleteNode}
            searchQuery={searchQuery}
          />
        )}

        {activeView === 'TREEMAP' && (
          <TreemapChartView
            rootCalculated={sortedRoot}
            settings={settings}
            onSelectNodeDetails={setSelectedDetailsNode}
          />
        )}

        {activeView === 'CHART' && (
          <SunburstChartView
            rootCalculated={sortedRoot}
            settings={settings}
            onSelectNodeDetails={setSelectedDetailsNode}
          />
        )}

        {activeView === 'BAR_CHART' && (
          <BarChartView
            rootCalculated={sortedRoot}
            settings={settings}
            onSelectNodeDetails={setSelectedDetailsNode}
          />
        )}

        {activeView === 'PIE_CHART' && (
          <PieChartView
            rootCalculated={sortedRoot}
            settings={settings}
            onSelectNodeDetails={setSelectedDetailsNode}
          />
        )}

        {activeView === 'ANALYTICS' && (
          <AnalyticsDashboardView
            rootCalculated={sortedRoot}
            settings={settings}
            onSelectNodeDetails={setSelectedDetailsNode}
            onExportBackup={handleExportBackup}
          />
        )}
      </main>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900 text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Dialogs */}
      {activeDetailsNode && (
        <NodeDetailsDialog
          node={activeDetailsNode}
          settings={settings}
          isRoot={activeDetailsNode.id === sortedRoot.id}
          onClose={() => setSelectedDetailsNode(null)}
          onAddChild={() => {
            setSelectedAddChildParent(activeDetailsNode);
            setSelectedDetailsNode(null);
          }}
          onEdit={() => {
            setSelectedEditNode(activeDetailsNode);
            setSelectedDetailsNode(null);
          }}
          onMove={() => {
            setSelectedMoveNode(activeDetailsNode);
            setSelectedDetailsNode(null);
          }}
          onDelete={() => {
            setSelectedDeleteNode(activeDetailsNode);
            setSelectedDetailsNode(null);
          }}
          onSelectChildNode={setSelectedDetailsNode}
        />
      )}

      {selectedAddChildParent && (
        <AddChildDialog
          parentNode={selectedAddChildParent}
          settings={settings}
          onClose={() => setSelectedAddChildParent(null)}
          onSave={handleAddChild}
        />
      )}

      {selectedEditNode && (
        <EditNodeDialog
          node={selectedEditNode}
          settings={settings}
          onClose={() => setSelectedEditNode(null)}
          onSave={(name, unitPriceRials, quantity, unit) =>
            handleEditNode(selectedEditNode.id, name, quantity, unit, unitPriceRials)
          }
        />
      )}

      {selectedMoveNode && (
        <MoveNodeDialog
          movingNode={selectedMoveNode}
          allStoredNodes={storedNodes}
          rootCalculated={sortedRoot}
          onClose={() => setSelectedMoveNode(null)}
          onMove={handleMoveNode}
        />
      )}

      {selectedDeleteNode && (
        <DeleteNodeDialog
          node={selectedDeleteNode}
          onClose={() => setSelectedDeleteNode(null)}
          onConfirmDelete={handleDeleteNode}
        />
      )}

      {isExcelImportOpen && (
        <ExcelImportDialog
          currentStoredNodes={storedNodes}
          calculatedTree={sortedRoot}
          symbolBook={symbols}
          settings={settings}
          onClose={() => setIsExcelImportOpen(false)}
          onApplyPlan={handleApplyImportPlan}
        />
      )}

      {isSymbolBookOpen && (
        <SymbolBookDialog
          symbols={symbols}
          onClose={() => setIsSymbolBookOpen(false)}
          onAddSymbol={handleAddSymbol}
          onDeleteSymbol={handleDeleteSymbol}
          onResetToDefaults={handleResetSymbolBook}
        />
      )}

      {isSettingsOpen && (
        <SettingsDialog
          settings={settings}
          onClose={() => setIsSettingsOpen(false)}
          onUpdateSettings={handleUpdateSettings}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onResetToDefaults={handleResetToDefaults}
          onWipeToZero={handleWipeToZero}
          onOpenExcelImport={() => {
            setIsSettingsOpen(false);
            setIsExcelImportOpen(true);
          }}
          onOpenSymbolBook={() => {
            setIsSettingsOpen(false);
            setIsSymbolBookOpen(true);
          }}
        />
      )}

      {isUndoHistoryOpen && (
        <UndoHistoryDialog
          history={assetStorage.getUndoHistory()}
          onClose={() => setIsUndoHistoryOpen(false)}
          onUndoStep={handleUndoSingle}
          onRollbackSteps={handleRollbackMultiple}
        />
      )}

      {/* Authentication Dialog (Login, Register, Forgot Password, Reset Password) */}
      <AuthDialog
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        language={settings.language || 'fa'}
        initialMode={authDialogMode}
        initialOobCode={resetOobCode}
        onSuccess={(email) => {
          showToast(
            (settings.language || 'fa') === 'en'
              ? `Welcome, ${email}!`
              : `خوش آمدید! ورود با موفقیت انجام شد.`
          );
        }}
      />

      {/* User Personal Profile Dialog */}
      <UserProfileDialog
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        language={settings.language || 'fa'}
        settings={settings}
        totalPortfolioValue={sortedRoot.totalValue}
        totalNodeCount={storedNodes.length}
        onLoggedOut={() => {
          showToast(
            (settings.language || 'fa') === 'en'
              ? 'Signed out successfully.'
              : 'با موفقیت از حساب کاربری خارج شدید.'
          );
        }}
        onProfileUpdated={(newName) => {
          setCurrentUser((prev) => (prev ? { ...prev, displayName: newName } : null));
          showToast(
            (settings.language || 'fa') === 'en'
              ? 'Profile updated.'
              : 'نام حساب با موفقیت به‌روزرسانی شد.'
          );
        }}
      />
    </div>
  );
};

export default App;
