// MainLayout.jsx

// Mục đích: Dùng cho phần chính của web — gồm Lobby, Friends, Profile, Chat riêng, Lịch sử.

// Đặc điểm:

// Có Navbar cố định trên cùng (chứa UserMenu, NotificationBell).

// Có Sidebar bên trái cho điều hướng (Lobby / Bạn bè / Chat / Hồ sơ / Cài đặt).

// Khu vực chính ở giữa hiển thị nội dung trang con.

// Thành phần chính:

// <Navbar />

// <Sidebar />

// <main><Outlet /></main>

// Lợi ích: Giúp toàn bộ các trang nội bộ có giao diện thống nhất, dễ mở rộng về sau.

// 📝 Sơ đồ bố cục

// +-----------------------------------------------------------+
// | Navbar: Logo | Search | NotificationBell | UserMenu       |
// +--------------------+--------------------------------------+
// | Sidebar            | Nội dung chính (Outlet)              |
// | (Lobby, Friends,…) |  - Danh sách phòng / bạn bè / chat   |
// |                    |  - Hiển thị động theo route          |
// +--------------------+--------------------------------------+