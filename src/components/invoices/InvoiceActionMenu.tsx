// components/invoices/InvoiceActionMenu.tsx

import { Menu, MenuItem } from "@mui/material";
import { InvoiceInfo } from "@/types/invoice";
import { deleteInvoice_API } from "@/services/invoice.api";
import toast from "react-hot-toast";

interface InvoiceActionMenuProps {
  anchorEl: null | HTMLElement;
  selectedInvoice: InvoiceInfo | null;
  onClose: () => void;
  onEdit: (invoice: InvoiceInfo) => void;
  onDeleteSuccess: () => void;
}

export default function InvoiceActionMenu({
  anchorEl,
  selectedInvoice,
  onClose,
  onEdit,
  onDeleteSuccess,
}: InvoiceActionMenuProps) {
  const handleEdit = () => {
    if (!selectedInvoice) return;
    onEdit(selectedInvoice);
    onClose();
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;

    const confirmDelete = window.confirm(`Bạn có chắc muốn xoá hoá đơn ${selectedInvoice.invoiceNumber}?`);
    if (!confirmDelete) {
      onClose();
      return;
    }

    try {
      const res = await deleteInvoice_API(selectedInvoice._id);

      if (res?.status === 200 || res?.status === 204) {
        toast.success("Xoá hoá đơn thành công!");
        onDeleteSuccess(); // Gọi hàm reload từ component cha
      } else {
        toast.error("Không thể xoá hoá đơn, vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi xoá hoá đơn:", error);
      toast.error("Đã xảy ra lỗi khi xoá hoá đơn.");
    } finally {
      onClose();
    }
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      <MenuItem onClick={handleEdit} sx={{ color: "blue", fontSize: 13 }}>
        Chỉnh sửa hoá đơn
      </MenuItem>

      <MenuItem onClick={handleDelete} sx={{ color: "red", fontSize: 13 }}>
        Xoá hoá đơn
      </MenuItem>
    </Menu>
  );
}
