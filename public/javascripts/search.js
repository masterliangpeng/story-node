let currentState = {
    homeChoice: 'home2'
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

    listOverlay: document.getElementById('listOverlay'),
    resultsList: document.getElementById('resultsList'),
};

document.addEventListener('DOMContentLoaded', async () => {
    // 打开搜索与主题
    toggleSearchBox();

    checkSavedTheme();

    if(window.location.pathname.includes('/home/index')){
        // 主页选择按钮与弹窗交互
        elements.homeSelectBtn.addEventListener('click', () => openHomeModal());
        elements.homeCancelBtn.addEventListener('click', () => closeHomeModal());
        elements.homeModalBackdrop.addEventListener('click', () => closeHomeModal());
        elements.homeOptions.addEventListener('click', (e)=> choiceHome(e));

        // 确认选择后存储至本地
        elements.homeConfirmBtn.addEventListener('click', () => confirmHome());

        // 初始化已选择的主页
        initHomeSelection();
    }else{
        // 事件关闭页面绑定
        elements.closeBtn.addEventListener('click', closeSearchBox);
    }

    // 搜索事件
    if (elements.searchInput) {
        elements.searchInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const keyword = (elements.searchInput.value || '').trim();
                await performSearch(keyword);
            }
        });
    }

    // 快速标签点击搜索
    elements.quickTags.addEventListener('click', async (e) => {
        const tagBtn = e.target.closest('.tag');
        if (!tagBtn) return;
        const tag = tagBtn.dataset.tag || tagBtn.textContent.trim();
        // if (elements.searchInput) elements.searchInput.value = tag;
        await performTagSearch(tag,tagBtn.innerText);
    });
});

function toggleSearchBox() {
    const searchBox = document.getElementById('floatingSearch');
    const searchInput = document.getElementById('searchInput');
    if (!searchBox.classList.contains('active')) {
        searchBox.classList.add('active');
    }
    setTimeout(() => searchInput.focus(), 300);
}

//关闭页面
function closeSearchBox() {
    window.history.back();
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
    if(isNullOrUndefined(k)){
        updateListLabel('推荐故事');
    }else{
        updateListLabel(`搜索 "${k}" 的结果`);
    }
    // 打开列表局部遮罩
    showListOverlay();
    try {
        const res = await fetch('/story/search/page?keyword=' + encodeURIComponent(k), {
            headers: {'x-search': 'true'}
        });
        if (!res.ok) throw new Error('网络请求失败');
        const data = await res.json();
        const list = data?.storyList || [];
        renderResults(list);
        hideListOverlay();
    } catch (err) {
        console.error(err);
        renderResults([]);
        hideListOverlay();
    }
}

//执行标签搜索
async function performTagSearch(tagVal,tagText){
    updateListLabel(`标签： "${tagText}" 的故事`);
    // 打开列表局部遮罩
    showListOverlay();
    try {
        const res = await fetch('/story/search/page?keyword=' + encodeURIComponent(tagVal), {
            headers: {'x-search-tag': 'true'}
        });
        if (!res.ok) throw new Error('网络请求失败');
        const data = await res.json();
        const list = data?.storyList || [];
        renderResults(list);
        hideListOverlay();
    } catch (err) {
        console.error(err);
        renderResults([]);
        hideListOverlay();
    }
}

function updateListLabel(text) {
    const label = document.getElementById('listLabel') || document.querySelector('.list-label');
    if (label && text) label.textContent = text;
}

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
}

function closeHomeModal() {
    elements.homeModal.classList.remove('active');
}

function choiceHome(e){
    const option = e.target.closest('.home-option');
    if (!option) return;
    const selected = option.dataset.home;
    currentState.homeChoice = selected;
    applyHomeSelectionUI(selected);
}


function confirmHome(){
    localStorage.setItem('homepage', currentState.homeChoice);
    closeHomeModal();
    const homepage = localStorage.getItem('homepage');
    if(homepage === 'home2'){
        window.location.href = '/';
    }else if(homepage === 'home1'){
        window.location.href = '/story/home/index';
    }
}

function initHomeSelection() {
    const saved = localStorage.getItem('homepage');
    if (!isNullOrUndefined(saved)){
        currentState.homeChoice = saved;
    }
    applyHomeSelectionUI(currentState.homeChoice);
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

function isNullOrUndefined(value) {
    return typeof value === 'undefined' || value === null || value === '';
}

// 列表局部遮罩控制
function showListOverlay() {
    const overlay = elements.listOverlay;
    const list = elements.resultsList;
    if (!overlay || !list) return;
    const rect = list.getBoundingClientRect();
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
}

function hideListOverlay() {
    const overlay = elements.listOverlay;
    if (!overlay) return;
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
}

// 窗口尺寸变化时，若遮罩显示则更新其位置与尺寸
// window.addEventListener('resize', () => {
//     const overlay = elements.listOverlay;
//     if (overlay && overlay.style.display !== 'none') {
//         showListOverlay();
//     }
// });
