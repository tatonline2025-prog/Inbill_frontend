# Fix Excel Export Order Mismatch
## Status: ✅ In Progress

## Plan Breakdown (Approved ✅)

### Phase 1: Backend - Make Exports Sort-Aware [CURRENT]
- [x] 1. Create TODO.md ✅
- [x] 2. Edit `../../AppInBill_BE/Inbill_backend/src/controllers/invoice.excel.controller.ts` ✅ **Backend Phase 1 COMPLETE**
  - Add `sortField/sortDirection` params to ALL 4 export functions
  - Implement dynamic sort logic (mirror query.controller)
  - Test backend endpoints accept sort params

### Phase 2: Frontend - Pass Current Sort State
- [x] 3. Edit `src/services/invoice.api.ts` ✅ **API wrappers added**
  - Add 4 new export API functions with sort params
- [ ] 4. Edit `src/components/invoices/ExportModals.tsx`
  - Receive & pass current sort state to APIs
- [ ] 5. Update parent components/hooks (`useInvoiceManagement.ts`)

### Phase 3: Test & Verify
- [ ] 6. End-to-end test: Sort table → Export → Verify matching order
- [ ] 7. Update TODO.md → `attempt_completion`

## Next Steps (Phase 2 Frontend)
- [ ] 3. Edit `src/services/invoice.api.ts` ✅ **API functions added**
- [ ] 4. Edit `src/components/invoices/ExportModals.tsx` 
  - Pass `sortField/sortDirection` from parent hook
- [ ] 5. Update `src/hooks/useInvoiceManagement.ts` 
  - Import exportExcelAPI, update handleExportConfirm to pass sort state
- [ ] 6. Update ExportModals props interface
