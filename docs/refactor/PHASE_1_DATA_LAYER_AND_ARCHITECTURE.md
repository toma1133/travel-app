# ⚙️ Phase 1: 架構解耦與資料層統整 (Data Layer & Architecture)

> **狀態**：已完成 (Completed)  
> **前置需求**：[Phase 0: Design System & Liquid Glass 基礎建設](file:///d:/Projects/travel-app/docs/refactor/PHASE_0_DESIGN_SYSTEM_AND_LIQUID_GLASS.md) 完成  
> **核心任務**：掃除 View 元件直接存取 Repository 的壞味道、統整 React Query 快取鍵與資料流、清理資料型別。

---

## 1. 現況分析與痛點 (Current State & Pain Points)

- **現狀**：
  - 在 `ItineraryPage.tsx` 與 `ItineraryItem.tsx` 中，大量直接在 `useEffect` 中呼叫 `placeRepo.getByIds(...)` 與 `toPlaceVM(...)`，繞過了 React Query 的快取管理與生命週期。
  - 當切換分頁或重複點擊相同地標時，造成多餘的非同步呼叫與元件重複渲染，且快取狀態難以在不同頁面（如景點頁 GuidePage 與行程頁 ItineraryPage）之間共享。
  - 部分 Hook 的 Mutation 處理缺少標準的樂觀更新（Optimistic Updates）與統一錯誤處理，導致使用者點擊後出現瞬態卡頓。
  - 型別定義散落在各處，部分欄位為可選但未有預設值，存在潛在的 `undefined` 存取風險。

---

## 2. 技術規格與架構設計 (Technical Specifications)

### 2.1 統一 Query Keys 策略 (`src/constants/QueryKeys.ts`)
建立型別安全的 Query Key 工廠：
```typescript
export const QUERY_KEYS = {
    trip: (tripId?: string) => ["trip", tripId] as const,
    trips: () => ["trips"] as const,
    itineraries: (tripId?: string) => ["itineraries", tripId] as const,
    places: (tripId?: string) => ["places", tripId] as const,
    placesBatch: (tripId: string, placeIds: string[]) => ["places", tripId, "batch", placeIds.sort().join(",")] as const,
    transactions: (tripId?: string) => ["transactions", tripId] as const,
    shoppingItems: (tripId?: string) => ["shoppingItems", tripId] as const,
    weather: (lat: number, lng: number, date: string) => ["weather", lat, lng, date] as const,
};
```

### 2.2 封裝地標批次查詢 Hook (`src/hooks/place/UseTripPlacesBatch.ts`)
取代所有在 UI 內部散落的 `placeRepo` 直接呼叫：
- 透過 React Query 快取地標資料。
- 支援單次批次查詢並快取 10 分鐘（`staleTime: 10 * 60 * 1000`）。
- 跨組件（ItineraryPage, GuidePage, MapView）直接共用記憶體快取。

### 2.3 統一型別整平 (`src/models/types/`)
- 檢查並確保 `PlaceVM`, `ItineraryVM`, `ItineraryActivitiy`, `TransactionVM`, `ShoppingItemVM` 具備清晰的欄位註解與統一預設值工具。
- 消除任何隱蔽的 `any` 與非型別安全轉型。

---

## 3. 目標檔案矩陣 (Target File Matrix)

| 操作 | 檔案路徑 | 說明 |
|:---|:---|:---|
| **新增** | `src/constants/QueryKeys.ts` | 定義全站統一的 TanStack Query Key 工廠 |
| **新增** | `src/hooks/place/UseTripPlacesBatch.ts` | 建立批次地標查詢與快取專用 Hook |
| **新增** | `src/hooks/weather/UseDailyWeather.ts` | 封裝天氣 API 查詢為 React Query Hook |
| **重構** | `src/hooks/itinerary/UseItineraryMutations.ts` | 強化樂觀更新與錯誤復原機制 |
| **重構** | `src/hooks/shopping/UseShoppingMutations.ts` | 規範購物項目變更快取無效化 |
| **重構** | `src/hooks/budget/UseBudgetMutations.ts` | 規範預算與交易紀錄變更快取 |
| **清理** | [`src/models/types/PlaceTypes.ts`](file:///d:/Projects/travel-app/src/models/types/PlaceTypes.ts) | 健全化 PlaceVM 相關型別宣告 |
| **清理** | [`src/models/types/ItineraryTypes.ts`](file:///d:/Projects/travel-app/src/models/types/ItineraryTypes.ts) | 健全化行程相關型別宣告 |

---

## 4. 執行用 Prompt (Execution Prompt)

> 複製以下 Prompt 給 AI 即可啟動 Phase 1 執行：

```markdown
請依照 [PHASE_1_DATA_LAYER_AND_ARCHITECTURE.md](file:///d:/Projects/travel-app/docs/refactor/PHASE_1_DATA_LAYER_AND_ARCHITECTURE.md) 規格執行 Phase 1:

【任務目標】
重構 travel-app 的資料存取層與 React Query 快取體系，徹底解耦 View 與 Repository，並建立型別安全的 Query Keys。

【具體工作項目】
1. 建立 `src/constants/QueryKeys.ts`:
   - 建立集中管理的 query keys 物件工廠 (涵蓋 trip, itineraries, places, shopping, transactions, weather)。
2. 建立專用查詢 Hook:
   - `src/hooks/place/UseTripPlacesBatch.ts`: 接收 tripId 與 placeIds 陣列，使用 React Query 與 placeRepo.getByIds 結合，設定合理 staleTime，避免重複拉取相同的地標。
   - `src/hooks/weather/UseDailyWeather.ts`: 將原在 ItineraryItem 內自行呼叫的 WeatherService 封裝為 React Query Hook，自動快取同經緯度與日期的天氣資訊。
3. 優化 Mutation Hooks:
   - 檢視 `UseItineraryMutations.ts`、`UseShoppingMutations.ts`、`UseBudgetMutations.ts`，確保使用統一的 query keys 進行 invalidateQueries 與樂觀快取更新。
4. 清理型別與移除不規範的直接引用:
   - 確保 `PlaceVM` 與 `ItineraryTypes.ts` 等核心型別嚴格定義，杜絕未經型別檢查的 `any`。
5. 驗證:
   - 執行 `npm run build` 確認編譯無錯誤，現有資料存取功能完全正常相容。
```

---

## 5. 驗收標準 (Acceptance Criteria)

- [x] View 元件中不再有為了拉取資料而直接呼叫 `repo.getByIds` 的裸 `useEffect`，全部透過 React Query Hook 統一取得。
- [x] 多個元件查詢相同地標清單時，在 Network 面板中只發出一次查詢，隨後命中 React Query 快取。
- [x] 執行 `npm run build` 通過，TypeScript 型別完全吻合。

---

## 6. 交接文件給 Phase 2 (Handover to Phase 2)

### 產出清單：
- 集中式 Query Keys：`QUERY_KEYS`。
- 批次查詢 Hook：`useTripPlacesBatch(tripId, placeIds)`。
- 天氣查詢 Hook：`useDailyWeather(lat, lng, date)`。
- 穩定純淨的 `PlaceVM` 與相關資料型別。

### Phase 2 須知：
- Phase 2 將解構巨石檔案 `PlaceModal.tsx`（2047行）與 `PreviewPlaceModal.tsx`（1500行）。
- 請在解構後的子元件中充分利用 Phase 0 產出的 `GlassModal`、`GlassInput`、`GlassButton` 以及 Phase 1 的標準型別與資料 Hook。
