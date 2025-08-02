// Bảng xếp hạng người dùng
// Chức năng: Hiển thị bảng xếp hạng người dùng dựa trên dữ liệu từ file JSON
// Phiên bản: 1.0
// Tác giả: [Từ Quang Nam]
// Ngày tạo: [03/06/2025]
// Ngày cập nhật: [03/06/2025]
// Thư viện: Không sử dụng thư viện bên ngoài
// Mô tả: Trang này hiển thị bảng xếp hạng người dùng theo ngày, tuần hoặc tháng.

// Các tab để chọn khoảng thời gian
document.addEventListener('DOMContentLoaded', () => {
  // Thêm sự kiện click cho các tab
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Xóa class 'active' khỏi tất cả các tab
      tabs.forEach(t => t.classList.remove('active'));
      // Thêm class 'active' cho tab được click
      tab.classList.add('active');
      // Cập nhật nội dung bảng xếp hạng
      const period = tab.dataset.period;
      renderLeaderboard(period);
    });
  });
});

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mainNav = document.getElementById('mainNav');
    
    mobileMenuBtn.addEventListener('click', () => {
      mainNav.classList.toggle('active');
    });

    // Dữ liệu bảng xếp hạng
    let rawData = {};
    let currentPeriod = 'today';
    let today = new Date();
    let todayFormatted = formatDate(today);
    
    // Hàm định dạng ngày tháng
    function formatDate(date) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    // Hàm tính ngày trong tuần
    function getWeekDates(date) {
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
      const monday = new Date(date.setDate(diff));
      const weekDates = [];
      
      for (let i = 0; i < 7; i++) {
        const newDate = new Date(monday);
        newDate.setDate(monday.getDate() + i);
        weekDates.push(formatDate(newDate));
      }
      
      return weekDates;
    }
    
    // Hàm tính ngày trong tháng
    function getMonthDates(date) {
      const year = date.getFullYear();
      const month = date.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthDates = [];
      
      for (let i = 1; i <= daysInMonth; i++) {
        monthDates.push(`${String(i).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`);
      }
      
      return monthDates;
    }
    
    // Hàm tải dữ liệu từ JSON
    async function loadData() {
      try {
        const response = await fetch('../data/data.json');
        rawData = await response.json();
        renderLeaderboard(currentPeriod);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        document.getElementById('leaderboard-content').innerHTML = 
          '<div class="error-message">Không thể tải dữ liệu bảng xếp hạng. Vui lòng thử lại sau.</div>';
      }
    }
    
    // Hàm xử lý dữ liệu và tạo bảng xếp hạng
    function processData(period) {
      let userStats = {};
      
      // Xác định các ngày cần xử lý
      let datesToProcess = [];
      
      switch (period) {
        case 'today':
          datesToProcess = [todayFormatted];
          break;
        case 'week':
          datesToProcess = getWeekDates(today);
          break;
        case 'month':
          datesToProcess = getMonthDates(today);
          break;
      }
      
      // Tính toán thống kê cho từng người dùng
      datesToProcess.forEach(date => {
        if (rawData[date]) {
          rawData[date].forEach(entry => {
            if (!userStats[entry.name]) {
              userStats[entry.name] = {
                posts: 0,
                earnings: 0,
                paid: 0
              };
            }
            
            userStats[entry.name].posts += entry.quantity;
            userStats[entry.name].earnings += entry.quantity * entry.unitPrice;
            
            if (entry.status === 'Đã thanh toán') {
              userStats[entry.name].paid += entry.quantity * entry.unitPrice;
            }
          });
        }
      });
      
      // Chuyển đổi thành mảng và sắp xếp
      return Object.entries(userStats)
        .map(([name, stats]) => ({
          name,
          posts: stats.posts,
          earnings: stats.earnings,
          paid: stats.paid
        }))
        .sort((a, b) => b.earnings - a.earnings);
    }
    
    // Hàm hiển thị bảng xếp hạng
    function renderLeaderboard(period) {
      const contentDiv = document.getElementById('leaderboard-content');
      const leaderboardData = processData(period);
      
      if (leaderboardData.length === 0) {
        contentDiv.innerHTML = '<div class="no-data">Không có dữ liệu cho khoảng thời gian này</div>';
        return;
      }
      
      let html = '';
      
      leaderboardData.forEach((user, index) => {
        const rankClass = `rank-${index + 1}`;
        const topBadge = index < 3 ? `<span class="badge top-badge">TOP ${index + 1}</span>` : '';
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=100`;
        
        html += `
          <div class="user-card">
            <div class="rank ${rankClass}">${index + 1}</div>
            <img src="${avatarUrl}" class="avatar" alt="${user.name}">
            <div class="user-info">
              <strong>${user.name}</strong>
              <div><small>Đã đăng: ${user.posts.toLocaleString()} bài</small></div>
              <div><small>Đã thanh toán: ${(user.paid / 1000).toLocaleString()}k</small></div>
            </div>
            <div class="user-stats">
              <div class="highlight">${(user.earnings / 1000).toLocaleString()}k</div>
              <div>${topBadge}</div>
            </div>
          </div>
        `;
      });
      
      contentDiv.innerHTML = html;
    }
    
    // Xử lý sự kiện click tab
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentPeriod = this.dataset.period;
        renderLeaderboard(currentPeriod);
      });
    });
    
    // Tải dữ liệu khi trang được load
    window.addEventListener('DOMContentLoaded', loadData);
