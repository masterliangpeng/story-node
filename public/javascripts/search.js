let currentState = {
    searchKeyword:''
}
document.addEventListener('DOMContentLoaded', async () => {
    // 打开搜索与主题
    toggleSearchBox();
    checkSavedTheme();

    // 事件绑定
    const closeBtn = document.getElementById('searchClose');
    closeBtn?.addEventListener('click', closeSearchBox);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const keyword = (searchInput?.value || '').trim().toLowerCase();
                const res = await fetch('/story/search/page?keyword=' + keyword,{
                    headers: {'x-search': 'true'}
                });
            }
        });
    }
});

function toggleSearchBox() {
    const searchBox = document.getElementById('floatingSearch');
    const searchInput = document.getElementById('searchInput');
    if(currentState.searchKeyword){
        searchInput.value = currentState.searchKeyword;
    }
    if (!searchBox.classList.contains('active')) {
        searchBox.classList.add('active');
    }
    setTimeout(() => searchInput.focus(), 300);
}

function closeSearchBox() {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    currentState.searchKeyword = '';
}

function checkSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}