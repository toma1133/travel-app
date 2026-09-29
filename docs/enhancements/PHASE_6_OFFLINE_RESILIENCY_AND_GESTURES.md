# 📱 Phase 6: 手勢操作、抽屜彈窗與離線韌性 (Gestures, Bottom Sheet & Offline)

> **狀態**：✅ **已完成 (Completed)**  
> **核心目標**：升級行動端單手操作體驗，以 iOS 風格 Bottom Sheet（底部抽屜）取代生硬居中彈窗，並加入滑動手勢、觸覺回饋與離線快取韌性。

---

## 1. 痛點分析與行動端互動現狀 (Mobile UX Pain Points)

* **痛點 1：居中彈窗在手機上單手難以按到右上角關閉**
  - 在直向手機上，傳統居中彈窗需要雙手操作或大拇指費力伸到螢幕最上方點擊 `X`。
* **痛點 2：清單操作缺乏現代手機 App 的滑動手勢**
  - 購物清單打勾或刪除需要先點選或開啟彈窗，缺少「右滑標記完成、左滑刪除」的流暢快感。
* **痛點 3：海外無網路環境下的斷線焦慮**
  - 需要加強 Service Worker 靜態快取與離線檢視指示器。

---

## 2. 解決方案與功能亮點 (Key Features)

1. **iOS 風格 Liquid Glass 底部抽屜 (Glass Bottom Sheet & GlassModal 自適應)**：
   - 在移動端（螢幕寬度 < 768px），彈窗統一自動轉為底部向上滑出的抽屜。
   - 頂部帶有拖曳把手（Drag Handle），支援向下滑動關閉手勢（Swipe down to dismiss，下拉超過 80px 自動關閉並伴隨微觸感）。
   - 桌機環境（≥ 768px）自動平滑保持優雅的居中卡片，達成兼具單手性與多端相容的響應體驗。
2. **滑動快捷手勢 (Swipe-to-action)**：
   - 購物清單項目支援平滑水平滑動：
     - 👉 **向右滑動**：快速標記已購買 / 設為未購（觸發綠色背景、Check 圖標與成功微震動）。
     - 👈 **向左滑動**：快速刪除或封存（觸發紅色背景、Trash 圖標與警示微震動）。
     - 內建垂直滾動智慧鎖定判定，垂直滑動網頁時不卡手誤觸。
3. **觸覺回饋公用庫 (Haptic Feedback Utility)**：
   - 封裝 `HapticUtil.ts`，支援輕觸（Selection 10ms）、確認（Success [15, 45, 20]ms）、警示（Warning [30, 50, 25]ms）與錯誤（Error）。
   - 在不支援或桌機環境優雅降級（No-op），並提供偏好設定開關與 try-catch 安全防護。
4. **離線連線感知徽章 (Offline Connection Banner)**：
   - 封裝 `OfflineStatusBadge.tsx`，當瀏覽器偵測到離線（`navigator.onLine === false`）時，頂部以琥珀金色微光毛玻璃膠囊溫馨提示「離線瀏覽模式 (Offline) · 票夾、離線手冊與記帳均可流暢查閱」，並提供即時重新整理檢查按鈕。
   - 當網路重新恢復時，平滑過渡為綠色「網路已恢復連線」微徽章，並於 3.5 秒後優雅隱藏。

---

## 3. 目標檔案矩陣 (Target File Matrix)

| 操作 | 檔案路徑 | 職責與說明 | 狀態 |
|:---|:---|:---|:---|
| **新增** | [`src/utils/HapticUtil.ts`](file:///d:/Projects/travel-app/src/utils/HapticUtil.ts) | 觸覺震動微回饋封裝庫（支援多種反饋模式、防呆保護與偏好設定） | ✅ 已完成 |
| **新增** | [`src/components/ui/GlassBottomSheet.tsx`](file:///d:/Projects/travel-app/src/components/ui/GlassBottomSheet.tsx) | 支援手勢向下滑動關閉的行動端毛玻璃抽屜元件 | ✅ 已完成 |
| **新增** | [`src/components/common/SwipeableRow.tsx`](file:///d:/Projects/travel-app/src/components/common/SwipeableRow.tsx) | 通用列表左右滑動快捷操作容器（防誤觸滾動判定、手感阻尼） | ✅ 已完成 |
| **新增** | [`src/components/common/OfflineStatusBadge.tsx`](file:///d:/Projects/travel-app/src/components/common/OfflineStatusBadge.tsx) | 網路狀態感應膠囊（離線溫馨提示、IndexedDB 狀態與手動重測） | ✅ 已完成 |
| **整合** | [`src/components/ui/GlassModal.tsx`](file:///d:/Projects/travel-app/src/components/ui/GlassModal.tsx) | 在手機端自適應切換為 Bottom Sheet 模式，支援下拉關閉手勢 | ✅ 已完成 |
| **整合** | [`src/components/shopping/ShoppingCard.tsx`](file:///d:/Projects/travel-app/src/components/shopping/ShoppingCard.tsx) | 注入微觸覺回饋（按鈕、計數器、店員展示、記帳切換） | ✅ 已完成 |
| **整合** | [`src/page/Book/ShoppingPage.tsx`](file:///d:/Projects/travel-app/src/page/Book/ShoppingPage.tsx) | 購物清單卡片整合 `SwipeableRow` 右滑完成 / 左滑刪除手勢 | ✅ 已完成 |
| **整合** | [`src/page/ProtectedLayout.tsx`](file:///d:/Projects/travel-app/src/page/ProtectedLayout.tsx) | 升級全局離線與恢復感應浮動膠囊 | ✅ 已完成 |

---

## 4. 驗收標準 (Acceptance Criteria)

1. [x] 在手機螢幕下，彈窗自底部流暢升起，手指按住頂部向下滑動即可順暢關閉。
2. [x] 購物項目向右滑動可秒速完成勾選，向左滑動可快速刪除，並伴隨微觸覺震動反饋。
3. [x] 拔除網路或切換離線模式時，App 頂部顯示精緻離線微光徽章，提示本地快取正常可用。
4. [x] 生產環境構建（`npm run build`）成功零錯誤，PWA Service Worker 快取打包順暢。
