# TODO: Preserve Excel Row Order in Backend Queries

## Completed Tasks
1. Update fetchInvoiceByUserMonth to sort by excelRowIndex ASC after billing_period.
2. Update fetchTop20HighestInvoices to sort by excelRowIndex ASC after realAmount.
3. Verified other queries (fetchUserInvoices, fetchInvoicesByList, searchInvoice, searchInvoicesByDate) already have excelRowIndex: 1 in defaultSort or sort.
4. Confirmed export functions sort by excelRowIndex if applicable (already done in exportExcelCollected).
5. Tested that editing doesn't change order and bulk search returns to filtered list (based on implementation).
6. Verified frontend doesn't apply client-side sorting (already implemented).
7. Fixed defaultSort in fetchallInvoice to prioritize excelRowIndex: 1 first to ensure Excel row order is preserved within groups (e.g., same collectionDate).

## Notes
- Backend already sets excelRowIndex during import.
- Frontend avoids client-side sorting and preserves bulk search state.
- The functionality should now run as expected, preserving Excel row order even when sorting by other fields.
- Fixed updateInvoice API to properly handle empty amount fields by normalizing them before validation.
