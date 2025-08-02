
  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');
  
  mobileMenuBtn.addEventListener('click', () => {
    mainNav.classList.toggle('active');
  });

  // Biến toàn cục để lưu dữ liệu
  let allData = {};
  let uniqueMembers = new Set();
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
      allData = await response.json();
      
      // Cập nhật thời gian cập nhật
      document.getElementById('lastUpdate').textContent = `Cập nhật lần cuối: ${todayFormatted} ${today.getHours()}:${String(today.getMinutes()).padStart(2, '0')}`;
      
      // Tính toán thống kê
      calculateStatistics();
      
      // Hiển thị dữ liệu
      displayData('today');
      
      // Vẽ biểu đồ
      drawCharts();
      
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      document.getElementById('lastUpdate').textContent = 'Lỗi khi tải dữ liệu';
    }
  }
  
  // Hàm tính toán các thống kê
  function calculateStatistics() {
    let totalPosts = 0;
    let totalSalary = 0;
    let paidSalary = 0;
    let todayPosts = 0;
    let todaySalary = 0;
    
    // Lặp qua tất cả dữ liệu
    for (const date in allData) {
      allData[date].forEach(item => {
        // Thêm thành viên vào Set để đếm số lượng thành viên duy nhất
        uniqueMembers.add(item.name);
        
        // Tính tổng số bài đăng và lương
        const amount = item.quantity * item.unitPrice;
        totalPosts += item.quantity;
        totalSalary += amount;
        
        if (item.status === 'Đã thanh toán') {
          paidSalary += amount;
        }
        
        // Nếu là ngày hôm nay
        if (date === todayFormatted) {
          todayPosts += item.quantity;
          todaySalary += amount;
        }
      });
    }
    
    // Cập nhật UI
    document.getElementById('totalMembers').textContent = uniqueMembers.size;
    document.getElementById('newMembers').textContent = `+${allData[todayFormatted] ? allData[todayFormatted].length : 0} trong ngày`;
    document.getElementById('totalPosts').textContent = totalPosts.toLocaleString();
    document.getElementById('todayPosts').textContent = `${todayPosts.toLocaleString()} bài hôm nay`;
    document.getElementById('totalSalary').textContent = `${(totalSalary / 1000000).toLocaleString()}tr`;
    document.getElementById('paidSalary').textContent = `Đã thanh toán: ${(paidSalary / 1000000).toLocaleString()}tr`;
    document.getElementById('performance').textContent = `${Math.round((paidSalary / totalSalary) * 100) || 0}%`;
  }
  
  // Hàm hiển thị dữ liệu theo khoảng thời gian
  function displayData(period) {
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = '';
    
    let datesToShow = [];
    
    switch (period) {
      case 'today':
        datesToShow = [todayFormatted];
        break;
      case 'week':
        datesToShow = getWeekDates(today);
        break;
      case 'month':
        datesToShow = getMonthDates(today);
        break;
      case 'all':
        datesToShow = Object.keys(allData).sort((a, b) => {
          const [dayA, monthA, yearA] = a.split('/');
          const [dayB, monthB, yearB] = b.split('/');
          return new Date(yearB, monthB - 1, dayB) - new Date(yearA, monthA - 1, dayA);
        });
        break;
    }
    
    // Lặp qua các ngày cần hiển thị
    datesToShow.forEach(date => {
      if (allData[date]) {
        allData[date].forEach(item => {
          const row = document.createElement('tr');
          const amount = item.quantity * item.unitPrice;
          
          row.innerHTML = `
            <td>${date}</td>
            <td>${item.name}</td>
            <td>${item.quantity.toLocaleString()}</td>
            <td>${item.unitPrice.toLocaleString()}đ</td>
            <td>${amount.toLocaleString()}đ</td>
            <td class="status-${item.status === 'Đã thanh toán' ? 'paid' : 'pending'}">${item.status}</td>
          `;
          
          tableBody.appendChild(row);
        });
      }
    });
  }
  
  // Hàm vẽ biểu đồ
  function drawCharts() {
    // Chuẩn bị dữ liệu cho biểu đồ hoạt động (7 ngày gần nhất)
    const weekDates = getWeekDates(today);
    const activityData = weekDates.map(date => {
      if (allData[date]) {
        return allData[date].reduce((sum, item) => sum + item.quantity, 0);
      }
      return 0;
    });
    
    // Chuẩn bị dữ liệu cho biểu đồ thu nhập (6 tháng gần nhất)
    const months = [];
    const earningsData = [];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    for (let i = 5; i >= 0; i--) {
      const month = (currentMonth - i + 12) % 12;
      const year = currentYear - Math.floor((i - currentMonth) / 12);
      const monthName = `Tháng ${month + 1}/${year}`;
      months.push(monthName);
      
      // Tính tổng thu nhập trong tháng
      let monthlyEarnings = 0;
      for (const date in allData) {
        const [day, m, y] = date.split('/');
        if (parseInt(m) === month + 1 && parseInt(y) === year) {
          monthlyEarnings += allData[date].reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        }
      }
      earningsData.push(monthlyEarnings / 1000000); // Chuyển đổi sang triệu đồng
    }
    
    // Biểu đồ hoạt động
    const activityCtx = document.getElementById('activityChart').getContext('2d');
    const activityChart = new Chart(activityCtx, {
      type: 'bar',
      data: {
        labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
        datasets: [{
          label: 'Bài đăng',
          data: activityData,
          backgroundColor: 'rgba(0, 255, 204, 0.5)',
          borderColor: '#00ffcc',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'SỐ BÀI ĐĂNG THEO TUẦN',
            color: '#fff'
          },
          legend: {
            labels: {
              color: '#fff'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#fff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#fff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });
    
    // Biểu đồ thu nhập
    const earningsCtx = document.getElementById('earningsChart').getContext('2d');
    const earningsChart = new Chart(earningsCtx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Tổng thu nhập (triệu)',
          data: earningsData,
          fill: true,
          backgroundColor: 'rgba(0, 255, 204, 0.2)',
          borderColor: '#00ffcc',
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'TỔNG THU NHẬP CỘNG ĐỒNG',
            color: '#fff'
          },
          legend: {
            labels: {
              color: '#fff'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#fff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#fff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    });
  }
  
  // Xử lý nút chọn thời gian
  document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      displayData(this.dataset.period);
    });
  });
  
  // Tải dữ liệu khi trang được load
  window.addEventListener('DOMContentLoaded', loadData);
