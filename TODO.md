# TODO - Hiển thị log lỗi cho người dùng

## Mục tiêu
Hiển thị các thông báo lỗi chi tiết từ backend ra màn hình để người dùng hiểu được lỗi gì đã xảy ra, mà không làm ảnh hưởng đến các chức năng hiện có.

## Các bước thực hiện

### 1. AddInvoiceDialog.tsx
- [x] Thêm xử lý hiển thị lỗi chi tiết từ API
- [x] Import `isAxiosError` từ axios
- [x] Cập nhật catch block để hiển thị message từ server

### 2. EditInvoiceDialog.tsx  
- [x] Cải thiện xử lý lỗi - hiển thị chi tiết hơn
- [x] Đảm bảo không thay đổi logic nghiệp vụ

### 3. UploadInvoiceByUserDialog.tsx
- [x] Thêm import `isAxiosError` 
- [x] Hiển thị message lỗi từ backend

### 4. UploadInvoiceWithProvinceDialog.tsx
- [x] Thêm import `isAxiosError`
- [x] Hiển thị message lỗi từ backend

## Lưu ý
- Chỉ sửa phần hiển thị lỗi, không thay đổi logic nghiệp vụ
- Giữ nguyên các validation hiện có
- Sử dụng toast.error() để hiển thị lỗi cho nhất quán

