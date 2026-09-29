# ✨ Phase 5: 整體導航、書架 (Bookshelf) 與極致體驗打磨

> **狀態**：待執行 (Pending)  
> **前置需求**：[Phase 0](file:///d:/Projects/travel-app/docs/refactor/PHASE_0_DESIGN_SYSTEM_AND_LIQUID_GLASS.md) ~ [Phase 4](file:///d:/Projects/travel-app/docs/refactor/PHASE_4_SHOPPING_AND_BUDGET_OPTIMIZATION.md) 全數完成  
> **核心任務**：打造 iOS 動態島風格的懸浮毛玻璃導航底欄、升級旅遊書架 3D 質感、以骨架屏取代全螢幕轉圈，完成最後的極致 UX 潤飾。

---

## 1. 現況分析與痛點 (Current State & Pain Points)

- **現狀**：
  - 手機底部導航列（`BookPage.tsx` line 104）為生硬貼底的矩形，缺少現代旗艦 App 的懸浮流體邊框與高光。
  - 目前頁面載入主要依靠全螢幕阻擋式的 `LoadingMask`，阻斷了使用者的瀏覽流程，導致「白屏/黑屏轉圈」的體感延遲。
  - 書架頁面（`BookshelfPage.tsx`）的旅程卡片過於平鋪直敘，缺乏旅遊雜誌般的高級感與封面微動效。
  - 離線狀態（`isOffline`）僅被動傳遞，缺乏友善的離線模式提示與樂觀操作提示。
- **目標**：
  - 打造 **Floating Liquid Glass Navigation Dock**：懸浮於螢幕底部、自帶環境光暈與平滑圖示彈跳動效。
  - 打造現代 **Skeleton Loaders**：依據行程、景點、購物頁面結構提供骨架預覽，消除視覺跳動。
  - 升級書架旅程封面（Bookshelf 3D Cover）：光澤反光、倒角陰影、旅途倒數/完成狀態標籤。
  - 優化離線與網路復原時的自動無縫同步體驗。

---

## 2. 規格設計 (Technical Specifications)

### 2.1 懸浮液態導航底欄 (`src/components/navigation/LiquidGlassBottomNav.tsx`)
- 採用居中浮動膠囊結構：
  ```tsx
  <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md rounded-2xl glass-panel px-3 py-2 flex items-center justify-around shadow-2xl backdrop-blur-xl border border-white/40 dark:border-white/10">
    {/* 導航圖示與活動指示點 */}
  </nav>
  ```
- 當滑動頁面時具備輕微向上收縮或半透明自適應，不阻擋頁面底部內容（保留 `pb-24` 安全邊距）。

### 2.2 現代骨架屏 (`src/components/common/skeletons/`)
- `TimelineSkeleton.tsx`：行程時間軸專用骨架（時間節點、卡片灰階脈衝光波）。
- `PlaceListSkeleton.tsx`：景點照片卡片骨架。
- `BudgetOverviewSkeleton.tsx`：圖表與預算儀表板骨架。

### 2.3 書架旅程卡片 (`src/components/bookshelf/TripCard.tsx`)
- 卡片融入動態漸層與光澤效果，顯示行程天數、同行旅伴頭像列表、離出發日倒數「還有 N 天」彩色晶瑩標籤。

---

## 3. 目標檔案矩陣 (Target File Matrix)

| 操作 | 檔案路徑 | 說明 |
|:---|:---|:---|
| **新增** | `src/components/navigation/LiquidGlassBottomNav.tsx` | 懸浮液態毛玻璃導航底欄 |
| **新增** | `src/components/navigation/DesktopGlassSidebar.tsx` | 桌面端通透側欄導航 |
| **新增** | `src/components/common/skeletons/TimelineSkeleton.tsx` | 時間軸結構專用骨架屏 |
| **新增** | `src/components/common/skeletons/PlaceListSkeleton.tsx` | 景點卡片專用骨架屏 |
| **重構** | [`src/page/BookPage.tsx`](file:///d:/Projects/travel-app/src/page/BookPage.tsx) | 整合全新導航體系與平滑捲動 |
| **重構** | [`src/page/BookshelfPage.tsx`](file:///d:/Projects/travel-app/src/page/BookshelfPage.tsx) | 書架封面 3D 光感與清爽排列 |
| **重構** | [`src/components/bookshelf/TripCard.tsx`](file:///d:/Projects/travel-app/src/components/bookshelf/TripCard.tsx) | 旅程卡片高級視覺翻新 |
| **優化** | [`src/page/ProtectedLayout.tsx`](file:///d:/Projects/travel-app/src/page/ProtectedLayout.tsx) | 離線狀態膠囊提示與過場平滑化 |

---

## 4. 執行用 Prompt (Execution Prompt)

> 複製以下 Prompt 給 AI 即可啟動 Phase 5 執行：

```markdown
請依照 [PHASE_5_SHELL_NAVIGATION_AND_UX_DELIGHT.md](file:///d:/Projects/travel-app/docs/refactor/PHASE_5_SHELL_NAVIGATION_AND_UX_DELIGHT.md) 規格執行 Phase 5:

【任務目標】
完成重構的最後一哩路：將全站導航外殼、書架首頁、骨架屏與離線互動打磨至旗艦級水準。

【具體工作項目】
1. 建立全新導航元件:
   - `src/components/navigation/LiquidGlassBottomNav.tsx`: 取代原先貼底的陽春導航列，改為懸浮在底部的 Liquid Glass 膠囊導航 Dock，支援觸覺回饋微動畫與當前頁面高光。
   - `src/components/navigation/DesktopGlassSidebar.tsx`: 桌面端優雅的毛玻璃側邊選單。
2. 建立專用骨架屏 (`src/components/common/skeletons/`):
   - 實作 `TimelineSkeleton.tsx` 與 `PlaceListSkeleton.tsx`，以局部流動光波骨架取代粗暴的全螢幕 Blocking LoadingMask。
3. 升級書架與行程卡片:
   - 重構 `TripCard.tsx` 與 `BookshelfPage.tsx`: 加入出發倒數動態標籤、毛玻璃封面反光、旅伴頭像重疊排版。
4. 優化 `ProtectedLayout.tsx` 與 `BookPage.tsx`:
   - 整合懸浮底欄，預留充足底部捲動安全間距 (Padding Bottom)。
   - 當網路斷線時，於頂部顯示精緻的半透明「離線模式中 (Offline Mode) - 本地資料已安全快取」通知膠囊。
5. 驗證與全站 Smoke Test:
   - 執行 `npm run build` 確認打包成功。
   - 全面檢驗首頁、景點、行程、購物、記帳、資訊各分頁之跳轉流暢度與視覺一致性。
```

---

## 5. 驗收標準 (Acceptance Criteria)

- [ ] 手機端導航底欄改為懸浮 Liquid Glass 樣式，不遮擋任何操作按鈕與時間軸項目。
- [ ] 頁面初始讀取或切換天數時，以優雅骨架屏過渡，不再出現阻斷式全螢幕黑屏旋轉。
- [ ] 網路斷開時，離線膠囊優雅呈現，離線檢視行程與景點依然正常可用。
- [ ] `npm run build` 成功建置，無任何 TypeScript 與 ESLint 錯誤。
- [ ] 全站設計風格統一，全面煥發現代 Liquid Glass 液態毛玻璃的高級精品質感。

---

## 6. 全案結案與維護指引 (Final Handover & Maintenance Guide)

本重構計畫執行完畢後，專案將達到：
1. **極高可讀性**：不再有動輒 1,000~2,000 行的難以維護的巨石程式碼，所有元件粒度保持在 250 行內。
2. **高元件重複使用率**：全站統一使用 `src/components/ui/` 原子元件庫（`GlassCard`, `GlassModal`, `GlassButton`, `GlassInput`）。
3. **優質使用者體驗**：以 Liquid Glass 美學與平滑微互動提供如原生 iOS/桌面 App 的精品質感。
