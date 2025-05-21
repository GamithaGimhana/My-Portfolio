document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const closeBtn = document.querySelector('.close-btn');
    const navContainer = document.querySelector('.nav-container');

    // Function to open the menu
    function openMenu() {
        navContainer.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Function to close the menu
    function closeMenu() {
        navContainer.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Event listeners
    menuToggle.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', closeMenu);
});