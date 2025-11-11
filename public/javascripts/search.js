let currentState = {
    searchKeyword: '',
    homeChoice: ''
}
const elements = {
    closeBtn: document.getElementById('searchClose'),
    searchInput: document.getElementById('searchInput'),
    quickTags: document.getElementById('quickTags'),
    // 主页选择相关元素
    homeSelectBtn: document.getElementById('homeSelectBtn'),
    homeModal: document.getElementById('homeModal'),
    homeOptions: document.getElementById('homeOptions'),
    homeCancelBtn: document.getElementById('homeCancelBtn'),
    homeModalBackdrop: document.getElementById('homeModalBackdrop'),
    homeConfirmBtn: document.getElementById('homeConfirmBtn'),
};
document.addEventListener('DOMContentLoaded', async () => {
    // 打开搜索与主题
    toggleSearchBox();
    checkSavedTheme();

    // 事件关闭页面绑定
    elements.closeBtn?.addEventListener('click', closeSearchBox);
    // 搜索事件
    if (elements.searchInput) {
        elements.searchInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const keyword = (elements.searchInput?.value || '').trim();
                await performSearch(keyword);
            }
        });
    }

    // 快速标签点击搜索
    elements.quickTags?.addEventListener('click', async (e) => {
        const tagBtn = e.target.closest('.tag');
        if (!tagBtn) return;
        const tag = tagBtn.dataset.tag || tagBtn.textContent.trim();
        if (elements.searchInput) elements.searchInput.value = tag;
        await performSearch(tag);
    });

    // 主页选择按钮与弹窗交互
    elements.homeSelectBtn?.addEventListener('click', () => openHomeModal());
    elements.homeCancelBtn?.addEventListener('click', () => closeHomeModal());
    elements.homeModalBackdrop?.addEventListener('click', () => closeHomeModal());
    elements.homeOptions?.addEventListener('click', (e) => {
        const option = e.target.closest('.home-option');
        if (!option) return;
        const selected = option.dataset.home;
        currentState.homeChoice = selected;
        applyHomeSelectionUI(selected);
        //setConfirmEnabled(true);
    });

    // 确认选择后存储至本地
    elements.homeConfirmBtn?.addEventListener('click', () => {
        if (!currentState.homeChoice) return;
        localStorage.setItem('homepage', currentState.homeChoice);
        closeHomeModal();
        const homepage = localStorage.getItem('homepage');
        if(homepage === 'home2'){
            window.location.href = '/';
        }else if(homepage === 'home1'){
            window.location.href = '/story/home/index';
        }
    });

    // 初始化已选择的主页
    initHomeSelection();
});

function toggleSearchBox() {
    const searchBox = document.getElementById('floatingSearch');
    const searchInput = document.getElementById('searchInput');
    if (currentState.searchKeyword) {
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

// 执行搜索
async function performSearch(keyword) {
    const k = (keyword || '').trim().toLowerCase();
    if (!k) return;

    currentState.searchKeyword = k;
    updateListLabel(`搜索 “${k}” 的结果`);

    // 显示骨架屏
    //renderSkeleton(6);

    try {
        const res = await fetch('/story/search/page?keyword=' + encodeURIComponent(k), {
            headers: {'x-search': 'true'}
        });
        if (!res.ok) throw new Error('网络请求失败');
        const data = await res.json();
        const list = data?.storyList || [];
        renderResults(list);
        //if (data?.title) updateListLabel(data.title);
    } catch (err) {
        console.error(err);
        renderResults([]);
    }
}

function updateListLabel(text) {
    const label = document.getElementById('listLabel') || document.querySelector('.list-label');
    if (label && text) label.textContent = text;
}

// function renderSkeleton(count = 6) {
//     const resultsList = document.getElementById('resultsList');
//     const emptyState = document.getElementById('emptyState');
//     if (emptyState) emptyState.style.display = 'none';
//     if (!resultsList) return;
//     let html = '';
//     for (let i = 0; i < count; i++) {
//         html += `
//         <article class="list-item" aria-hidden="true">
//             <div class="skeleton skeleton-title"></div>
//             <div class="skeleton skeleton-text"></div>
//             <div class="skeleton skeleton-text short"></div>
//         </article>`;
//     }
//     resultsList.innerHTML = html;
// }

function renderResults(storyList) {
    const resultsList = document.getElementById('resultsList');
    const emptyState = document.getElementById('emptyState');
    if (!resultsList) return;

    const hasData = Array.isArray(storyList) && storyList.length > 0;
    if (emptyState) emptyState.style.display = hasData ? 'none' : 'block';

    if (!hasData) {
        resultsList.innerHTML = '';
        return;
    }

    let html = '';
    storyList.forEach((story, idx) => {
        const delay = idx * 60; // 逐帧延迟，形成瀑布式入场
        const title = (story?.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const category = (story?.category_name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const excerpt = (story?.excerpt || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += `
        <article class="list-item animate-in" style="animation-delay:${delay}ms">
            <h2 class="list-title">
                <i class="fas fa-star star-icon" aria-hidden="true"></i>
                <a href="/story/${story.id}" target="_blank" rel="noopener">${title}</a>
            </h2>
            <div class="list-meta">分类：${category}</div>
            <p class="list-excerpt">${excerpt}</p>
        </article>`;
    });

    resultsList.innerHTML = html;
}

function openHomeModal() {
    elements.homeModal.classList.add('active');
    // 打开时根据当前选择状态设置按钮可用性
    //setConfirmEnabled(!!currentState.homeChoice);
}

function closeHomeModal() {
    elements.homeModal.classList.remove('active');
}

function initHomeSelection() {
    const saved = localStorage.getItem('homepage');
    if (!saved) return;
    currentState.homeChoice = saved;
    applyHomeSelectionUI(saved);
}

function applyHomeSelectionUI(value) {
    const homeOptions = document.getElementById('homeOptions');
    if (!homeOptions) return;
    const options = homeOptions.querySelectorAll('.home-option');
    options.forEach(opt => {
        const isSelected = opt.dataset.home === value;
        opt.classList.toggle('selected', isSelected);
    });
}

// function setConfirmEnabled(enabled) {
//     const btn = elements.homeConfirmBtn;
//     if (!btn) return;
//     btn.disabled = !enabled;
// }
