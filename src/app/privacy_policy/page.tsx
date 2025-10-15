"use client";

import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-6 text-center">Chính Sách Bảo Mật</h1>
      <p>
        Chào mừng bạn đến với <strong>Hệ thống In Bill Của TAT</strong>
        Chính sách bảo mật này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn khi sử dụng
        ứng dụng.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">1. Thông tin chúng tôi thu thập</h2>
      <p>Khi bạn sử dụng ứng dụng, chúng tôi có thể thu thập một số thông tin như:</p>
      <ul className="list-disc list-inside">
        <li>Thông tin tài khoản (email, tên đăng nhập, mật khẩu).</li>
        <li>Thông tin thiết bị (hệ điều hành, trình duyệt, địa chỉ IP).</li>
        <li>Thông tin sử dụng (lịch sử truy cập, hành động trong ứng dụng).</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">2. Mục đích sử dụng thông tin</h2>
      <p>Thông tin của bạn được sử dụng để:</p>
      <ul className="list-disc list-inside">
        <li>Cung cấp và duy trì các tính năng của ứng dụng.</li>
        <li>Cải thiện chất lượng dịch vụ và trải nghiệm người dùng.</li>
        <li>Gửi thông báo, hỗ trợ hoặc phản hồi khi cần thiết.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">3. Chia sẻ thông tin</h2>
      <p>
        Chúng tôi không chia sẻ thông tin cá nhân của bạn với bên thứ ba, trừ khi có yêu cầu pháp lý hoặc được sự đồng ý
        của bạn.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">4. Bảo mật dữ liệu</h2>
      <p>
        Chúng tôi áp dụng các biện pháp bảo mật hợp lý để bảo vệ thông tin cá nhân của bạn khỏi truy cập, sử dụng hoặc
        tiết lộ trái phép.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">5. Quyền của người dùng</h2>
      <p>Bạn có quyền:</p>
      <ul className="list-disc list-inside">
        <li>Yêu cầu xem hoặc xóa thông tin cá nhân của mình.</li>
        <li>Liên hệ với chúng tôi để chỉnh sửa hoặc cập nhật thông tin.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">6. Liên hệ</h2>
      <p>
        Nếu bạn có bất kỳ câu hỏi hoặc yêu cầu nào liên quan đến chính sách bảo mật, vui lòng liên hệ qua email:{" "}
        <a href="mailto:youremail@example.com" className="text-blue-600">
          dvtienich2025@gmail.com
        </a>
        .
      </p>

      <p className="mt-10 italic">
        Chính sách này có thể được cập nhật theo thời gian. Mọi thay đổi sẽ được đăng tải tại trang này.
      </p>
    </div>
  );
}
