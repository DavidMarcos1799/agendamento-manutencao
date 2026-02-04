document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const menuToggle = document.createElement('button');
  menuToggle.className = 'menu-toggle';
  menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
  const header = document.querySelector('header .container');
  const nav = document.querySelector('nav');
  
  if (header && nav) {
    header.insertBefore(menuToggle, nav);
    
    menuToggle.addEventListener('click', function() {
      nav.classList.toggle('active');
      menuToggle.innerHTML = nav.classList.contains('active') ? 
        '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
  }

  // Close mobile menu when clicking on a link
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (nav && nav.classList.contains('active')) {
        nav.classList.remove('active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
      }
    });
  });

  // Update active link based on current page
  const currentLocation = window.location.pathname;
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentLocation.split('/').pop()) {
      link.classList.add('active');
    }
  });

  // Check if user is logged in and update navbar
  const mainNav = document.getElementById('mainNav');
  if (mainNav) {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const currentPage = window.location.pathname.split('/').pop();
    const isLoginPage = currentPage === 'login.html';
    
    if (isLoginPage) {
      // Special styling for login page
      document.querySelector('header').style.boxShadow = 'none';
      document.querySelector('header').style.background = 'transparent';
      document.querySelector('header').style.position = 'absolute';
      document.querySelector('header a').style.color = '#2e7d32';
      document.querySelector('header .menu-toggle').style.color = '#2e7d32';
      
      // Only show logo and signup button on login page
      mainNav.innerHTML = `
        <li><a href="cadastro.html" class="btn btn-outline">Criar Conta</a></li>
      `;
    } 
    else if (userId && userName) {
      // User is logged in (not on login page)
      mainNav.innerHTML = `
        <li><a href="index.html#servicos">Serviços</a></li>
        <li><a href="index.html#sobre">Sobre Nós</a></li>
        <li><a href="index.html#contato">Contato</a></li>
        <li class="user-dropdown">
          <button class="user-dropdown-btn">
            <i class="fas fa-user-circle" style="margin-right: 5px;"></i>
            ${userName.split(' ')[0]}
            <i class="fas fa-chevron-down" style="margin-left: 5px; font-size: 0.8em;"></i>
          </button>
          <div class="user-dropdown-content">
            <a href="agendamento.html"><i class="fas fa-calendar-alt" style="width: 20px; text-align: center; margin-right: 5px;"></i> Meus Agendamentos</a>
            <a href="alterar-senha.html"><i class="fas fa-key" style="width: 20px; text-align: center; margin-right: 5px;"></i> Alterar Senha</a>
            <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt" style="width: 20px; text-align: center; margin-right: 5px;"></i> Sair</a>
          </div>
        </li>
      `;

      // Add logout functionality
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
          e.preventDefault();
          localStorage.removeItem('userId');
          localStorage.removeItem('userName');
          localStorage.removeItem('userEmail');
          window.location.href = 'index.html';
        });
      }
    } else {
      // User is not logged in (not on login page)
      const isRegisterPage = currentPage === 'cadastro.html';
      
      let navItems = `
        <li><a href="index.html#servicos">Serviços</a></li>
        <li><a href="index.html#sobre">Sobre Nós</a></li>
        <li><a href="index.html#contato">Contato</a></li>
        <li><a href="login.html" class="btn btn-outline">Entrar</a></li>
      `;
      
      if (!isRegisterPage) {
        navItems += `<li><a href="cadastro.html" class="btn btn-primary">Criar Conta</a></li>`;
      }
      
      mainNav.innerHTML = navItems;
    }
  }
});
