# 📱 Phase 6: 手勢操作、抽屜彈窗與離線韌性 (Gestures, Bottom Sheet & Offline)

> **狀態**：規劃中 (Ready for Implementation)  
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

1. **iOS 風格 Liquid Glass 底部抽屜 (Glass Bottom Sheet)**：
   - 在移動端（螢幕寬度 < 768px），彈窗統一自動轉為底部向上滑出的抽屜。
   - 頂部帶有拖曳把手（Drag Handle），支援向下滑動關閉手勢（Swipe down to dismiss）。
2. **滑動快捷手勢 (Swipe-to-action)**：
   - 購物清單與行李清單支援水平滑動：
     - 👉 **向右滑動**：快速標記已購買 / 已打包（觸發輕微震動與綠色背景）。
     - 👈 **向左滑動**：快速刪除或封存（紅色背景）。
3. **觸覺回饋公用庫 (Haptic Feedback Utility)**：
   - 封裝 `HapticUtil.ts`，支援輕觸（Selection 10ms）、確認（Success [15, 40, 15]ms）與警示（Warning 40ms）。
   - 在不支援或桌機環境優雅降級（No-op）。
4. **離線連線感知徽章 (Offline Connection Banner)**：
   - 當瀏覽器偵測到離線（`navigator.onLine === false`）時，頂部以微光膠囊溫馨提示「離線模式中，仍可順暢查閱旅程手冊與票夾」。

---

## 3. 目標檔案矩陣 (Target File Matrix)

| 操作 | 檔案路徑 | 職責與說明 |
|:---|:---|:---|
| **新增** | `src/utils/HapticUtil.ts` | 觸覺震動微回饋封裝庫（支援多種反饋模式與防呆保護） |
| **新增** | `src/components/ui/GlassBottomSheet.tsx` | 支援手勢向下滑動關閉的行動端毛玻璃抽屜元件 |
| **新增** | `src/components/common/SwipeableRow.tsx` | 通用列表左右滑動快捷操作容器 |
| **新增** | `src/components/common/OfflineStatusBadge.tsx` | 網路狀態感應膠囊（離線溫馨提示） |
| **整合** | [`src/components/ui/GlassModal.tsx`](file:///d:/Projects/travel-app/src/components/ui/GlassModal.tsx) | 在手機端自適應切換為 Bottom Sheet 模式 |
| **整合** | [`src/components/shopping/ShoppingCard.tsx`](file:///d:/Projects/travel-app/src/components/shopping/ShoppingCard.tsx) | 支援滑動標記購買與完成 |

---

## 4. 驗收標準 (Acceptance Criteria)

1. [ ] 在手機螢幕下，彈窗自底部流暢升起，手指按住頂部向下滑動即可順暢關閉。
2. [ ] 購物項目向右滑動可秒速完成勾選，並伴隨手機微觸覺震動反饋。
3. [ ] 拔除網路或切換飛航模式時，App 頂部顯示離線手冊就緒徽章，畫面不崩潰白屏。
