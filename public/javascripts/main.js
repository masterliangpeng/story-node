const PAGE_MAX_SIZE = 50;
const MAX_NAV_CATEGORIES = 10; // 导航栏最多显示的分类数

let currentState = {
    activeCategoryId: null, // 初始为null，加载后设为第一个分类的ID
    currentPage: 1,//当前页数
    totalPages: 0,//总页数
    stories: [],
    categories: [],
    selectedCategoryIds: [], // 用户选择的分类ID列表
    searchKeyword: '',
    isLoading: true,   // 是否正在加载数据
    hasMoreData: false,   // 是否还有更多数据
    isSimpleMode: false,  // 是否为简约模式
    welcomeMsg:['欢迎来到《小故事铺》这里藏着一段段温暖的小故事，等你慢慢翻阅，慢慢收藏，和我们一起，在文字里遇见生活的温度',
        '欢迎光临《小故事铺》✨ 星光为笔，梦境作纸，每个故事，都藏着属于你的奇遇',
        '欢迎来到小故事铺 这里的故事都在等你翻开',
        '小故事铺开门啦 今天也偷偷准备了几个温暖小故事',
        '这里装满了好玩的、有趣的、感动的故事，快来选一篇讲给你喜欢的人听吧',
        '喜欢的话就多看几篇 不限量供应小温暖',
        '每天一则好故事，点亮你的好心情',
        '欢迎光临《小故事铺》有些故事，白天不敢看，晚上别错过，深夜来访，胆小勿入']
};

// DOM元素
const elements = {
    storyGrid: document.getElementById('storyGrid'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    categorySettingsModal: document.getElementById('categorySettingsModal'),
};

const sidebarElements = {
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebarClose: document.getElementById('sidebarClose'),
    multiFunctionButton: document.getElementById('multiFunctionButton'),
    categorySettingsButton: document.getElementById('categorySettingsButton'),
};

document.addEventListener('DOMContentLoaded', async ()=>{
    //欢迎动画
    showWelcomeAnimation();

    //初始化侧边栏
    initSidebar();

    let activeCategoryId = getCookie('activeCategoryId');
    let selectedCategoryIds = getCookie('selectedCategoryIds');
    if(typeof activeCategoryId === 'undefined' || activeCategoryId === null || activeCategoryId === ''){
        const res= await fetch('/story/initCategoryId');
        const result = await res.json();
        activeCategoryId = result.defaultCategoryId;
        selectedCategoryIds = result.defaultCategoryIds;
        document.cookie = 'activeCategoryId=' + activeCategoryId + '; path=/;';
        document.cookie = 'selectedCategoryIds=' + JSON.stringify(selectedCategoryIds) + '; path=/;';
    }
    currentState.activeCategoryId = activeCategoryId;
    currentState.selectedCategoryIds = selectedCategoryIds;
    console.log(getCookie('selectedCategoryIds'));
    console.log(getCookie('activeCategoryId'));
    const count = await fetchCount(activeCategoryId);
    let totalPages = Math.ceil(count / PAGE_MAX_SIZE);
    currentState.totalPages = totalPages;
    currentState.currentPage = 1;

    //判断是否可以加载数据
    currentState.hasMoreData = currentState.currentPage < currentState.totalPages;
    // 添加滚动事件监听
    window.addEventListener('scroll', handleScroll);

    // 为新添加的卡片添加淡入动画
    showStoryCardAnimation();
});

//分类点击事件
document.querySelectorAll('.filter-tag a').forEach(a => {
    a.addEventListener('click', async e => {
        e.preventDefault();     // 阻止默认跳转
        e.stopPropagation();    // 防止冒泡到 li，避免重复触发

        const href = a.getAttribute('href');
        if (!href) return;
        currentState.isLoading = true;
        showLoading();
        const activeCategoryId = a.getAttribute('data-id');
        currentState.activeCategoryId = activeCategoryId;
        document.cookie = 'activeCategoryId=' + activeCategoryId + '; path=/;';
        // 异步加载分类内容
        try {
            //设置总页数
            const count = await fetchCount(activeCategoryId);
            let totalPages = Math.ceil(count / PAGE_MAX_SIZE);
            console.log('totalPages=',totalPages);
            currentState.totalPages = totalPages;
            currentState.currentPage = 1;
            // 重置分页状态
            currentState.hasMoreData = currentState.currentPage < currentState.totalPages;

            const res = await fetch(href, { headers: { 'X-Partial': 'true' } });
            const html = await res.text();
            document.querySelector('#storyGrid').innerHTML = html;

            // 更新浏览器地址（不会刷新页面）
            history.pushState(null, '', href);

            // 高亮当前分类（可选）
            document.querySelectorAll('.filter-tag').forEach(li => li.classList.remove('active'));
            a.closest('.filter-tag').classList.add('active');

            //添加动画
            showStoryCardAnimation();

        } catch (err) {
            console.error('加载分类内容失败:', err);
        }finally {
            currentState.isLoading = false;
            hideLoading();
        }
    });
});

//  让点击整个 li 区域都触发内部 a 的点击
document.querySelectorAll('.filter-tag').forEach(li => {
    li.addEventListener('click', e => {
        // 如果点击的不是 <a> 元素，手动触发 a 点击
        if (!e.target.closest('a')) {
            const a = li.querySelector('a');
            if (a) a.click();
        }
    });
});


//欢迎页
function showWelcomeAnimation() {
    const welcomeText = currentState.welcomeMsg[getRandomInt()];
    // 添加初始欢迎遮罩
    const welcomeOverlay = document.createElement('div');
    welcomeOverlay.className = 'welcome-overlay';
    welcomeOverlay.innerHTML = `
        <div class="welcome-content">
            <div class="welcome-icon">
                <img src="/images/story.png" alt="小故事铺" class="logo-img">
            </div>
            <h1 class="welcome-title">小故事铺</h1>
            <p class="welcome-text">${welcomeText}</p>
        </div>
    `;
    document.body.appendChild(welcomeOverlay);
    // 简单的加载动画后移除
    setTimeout(() => {
        // 首页淡入动画
        welcomeOverlay.classList.add('welcome-fade');
        setTimeout(() => {
            document.body.removeChild(welcomeOverlay);
            //等DOMContentLoaded走完表示数据不处于加载中
            currentState.isLoading = false;
        }, 1000);
    }, 2000);
}

// 监听滚动事件
async function handleScroll() {
    // 防抖处理，避免频繁触发
    if (currentState.isLoading || !currentState.hasMoreData) {
        return;
    }

    // 获取滚动位置
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 当滚动到距离底部200px时触发加载
    if (scrollTop + windowHeight >= documentHeight - 200) {
        currentState.isLoading = true;
        await loadMoreStories();
    }
}

// 加载更多故事
async function loadMoreStories() {
    const scrollPos = window.scrollY;
    console.log('分页前高度：',window.scrollY);
    showLoading();
    try {
        // 计算下一页
        const nextPage = currentState.currentPage + 1;

        // 检查是否还有更多数据
        if (nextPage > currentState.totalPages) {
            currentState.hasMoreData = false;
            return;
        }

        // 获取下一页数据
        const res = await fetch('/story/list/'+currentState.activeCategoryId+'/'+nextPage, {
            headers: { 'X-pagination': 'true' }
        });

        if (!res.ok) {
            throw new Error('网络请求失败');
        }

        const data = await res.json();
        const storyList = data.storyList;
        let html = '';
        for (const story of storyList) {
            html += `
                <article class="content-card">
                    <div class="card-info">
                        <span class="card-category">${story.category_name}</span>
                        <h3 class="card-title"><a href='/story/<%=story.id %>' target='_blank'>${story.title}</a></h3>
                        <p class="card-excerpt">${story.excerpt}</p>
                        <div class="card-meta">
                            <div class="account-name">${story.category_name}</div>
                            <div class="card-stats">
                                <span><i class="far fa-file-alt"></i>${story.length}字</span>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }

        elements.storyGrid.insertAdjacentHTML('beforeend', html);

        // 更新状态
        currentState.currentPage = nextPage;
        currentState.hasMoreData = nextPage < currentState.totalPages;
        console.log(`已加载第 ${nextPage} 页，共 ${currentState.totalPages} 页`);
    } catch (error) {
        console.error('加载更多故事失败:', error);
    } finally {
        currentState.isLoading = false;
        hideLoading();
        //记住当前滚动位置
        setTimeout(() => {
            window.scrollTo(0, scrollPos);
        }, 200);
    }
}

// 初始化侧边栏
function initSidebar() {
    // 侧边栏收起按钮
    sidebarElements.sidebarClose.addEventListener('click', toggleSidebar);

    // 侧边栏展开按钮（在collapsed状态显示）
    sidebarElements.sidebarToggle.addEventListener('click', toggleSidebar);

    // 多功能按钮点击事件
    sidebarElements.multiFunctionButton.addEventListener('click', toggleFunctionDropdown);

    // 点击其他区域关闭下拉菜单
    document.addEventListener('click', (e) => {
        // 如果点击的不是多功能按钮内的元素，则关闭下拉菜单
        const isClickInsideButton = sidebarElements.multiFunctionButton.contains(e.target);
        if (!isClickInsideButton && sidebarElements.multiFunctionButton.classList.contains('active')) {
            toggleFunctionDropdown();
        }
    });

    // 从功能下拉菜单中移动原有功能按钮的事件监听
    // sidebarElements.viewModeToggle.addEventListener('click', toggleViewMode);
    sidebarElements.categorySettingsButton.addEventListener('click', openCategorySettingsModal);
    // sidebarElements.themeToggle.addEventListener('click', toggleTheme);
    // sidebarElements.refreshButton.addEventListener('click', refreshHome);

    // 响应式处理
    handleResponsiveSidebar();
    window.addEventListener('resize', handleResponsiveSidebar);

    // 检查本地存储中的侧边栏状态
    const isSidebarCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    if (isSidebarCollapsed && window.innerWidth > 768) {
        document.body.classList.add('sidebar-collapsed');

        // 设置切换按钮初始状态
        const toggleIcon = sidebarElements.sidebarToggle.querySelector('i');
        if (toggleIcon) {
            toggleIcon.style.transform = 'rotate(0)';
        }
    } else if (window.innerWidth > 768) {
        // 默认展开状态
        const toggleIcon = sidebarElements.sidebarToggle.querySelector('i');
        if (toggleIcon) {
            toggleIcon.style.transform = 'rotate(180deg)';
        }
    }
}
// 切换侧边栏显示/隐藏
function toggleSidebar() {
    // 移动设备上
    if (window.innerWidth <= 768) {
        document.body.classList.toggle('sidebar-mobile-open');
    }
    // 桌面设备上
    else {
        document.body.classList.toggle('sidebar-collapsed');

        // 箭头方向动画
        const toggleIcon = sidebarElements.sidebarToggle.querySelector('i');
        if (document.body.classList.contains('sidebar-collapsed')) {
            toggleIcon.style.transform = 'rotate(0)';
        } else {
            toggleIcon.style.transform = 'rotate(180deg)';
        }

        // 存储侧边栏状态
        localStorage.setItem('sidebar_collapsed', document.body.classList.contains('sidebar-collapsed').toString());
    }
}

// 响应式处理侧边栏
function handleResponsiveSidebar() {
    // 移动设备上
    if (window.innerWidth <= 768) {
        document.body.classList.remove('sidebar-collapsed');
        // 如果之前在移动设备上打开了侧边栏，保持打开状态
        if (localStorage.getItem('sidebar_mobile_open') === 'true') {
            document.body.classList.add('sidebar-mobile-open');
        }
    }
    // 桌面设备上
    else {
        document.body.classList.remove('sidebar-mobile-open');
        // 恢复桌面设备上的侧边栏状态
        if (localStorage.getItem('sidebar_collapsed') === 'true') {
            document.body.classList.add('sidebar-collapsed');
        }
    }
}

// 切换多功能按钮下拉菜单
function toggleFunctionDropdown() {
    sidebarElements.multiFunctionButton.classList.toggle('active');
}

// 打开分类设置弹窗
function openCategorySettingsModal() {
    populateCategorySettings();
    elements.categorySettingsModal.classList.add('active');

    // 禁止背景滚动
    document.body.classList.add('modal-open');

    // 记录当前滚动位置
    window.modalScrollY = window.scrollY;
}

// 填充分类设置内容
async function populateCategorySettings() {
    // 创建分类设置的视图容器
    const categoryList = await fetchCategory();

    let selectedHTML = '';

    let unselectedHTML = '';
    const selectedCount = currentState.selectedCategoryIds.length;

    // 分类已选择和未选择的分类
    const selectedCategories = currentState.categories.filter(cat => currentState.selectedCategoryIds.includes(cat.id));
    const unselectedCategories = currentState.categories.filter(cat => !currentState.selectedCategoryIds.includes(cat.id));

    // 为已选择的分类创建UI项
    selectedCategories.forEach(category => {
        selectedHTML += `
            <div class="category-item selected" data-id="${category.id}">
                <div class="category-icon"><i class="fas fa-check-circle"></i></div>
                <div class="category-name">${category.name}</div>
                <button class="category-action-btn remove-btn" onclick="handleCategoryToggle(${category.id}, false)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });

    // 为未选择的分类创建UI项
    unselectedCategories.forEach(category => {
        // 如果已经选择了最大数量，则禁用该项
        const isDisabled = selectedCount >= MAX_NAV_CATEGORIES;

        unselectedHTML += `
            <div class="category-item ${isDisabled ? 'disabled' : ''}" data-id="${category.id}">
                <div class="category-icon"><i class="far fa-circle"></i></div>
                <div class="category-name">${category.name}</div>
                <button class="category-action-btn add-btn" onclick="handleCategoryToggle(${category.id}, true)" ${isDisabled ? 'disabled' : ''}>
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
    });

    // 创建完整的设置UI
    let html = `
        <div class="category-sections">
            <div class="category-section">
                <div class="section-header">
                    <h4><i class="fas fa-check-square"></i> 已选择的分类 (${selectedCategories.length}/${MAX_NAV_CATEGORIES})</h4>
                    <span class="section-subtitle">这些分类将显示在导航栏中</span>
                </div>
                <div class="category-items selected-items">
                    ${selectedHTML || '<div class="empty-message">没有选择任何分类，请从下方添加</div>'}
                </div>
            </div>
            
            <div class="category-divider"></div>
            
            <div class="category-section">
                <div class="section-header">
                    <h4><i class="fas fa-list"></i> 可用分类 (${unselectedCategories.length})</h4>
                    <span class="section-subtitle">点击添加按钮将分类添加到导航栏</span>
                </div>
                <div class="category-items unselected-items">
                    ${unselectedHTML || '<div class="empty-message">没有更多可选择的分类</div>'}
                </div>
            </div>
        </div>
        
        <div class="category-limit-info ${selectedCount >= MAX_NAV_CATEGORIES ? 'warning' : ''}">
            <i class="${selectedCount >= MAX_NAV_CATEGORIES ? 'fas fa-exclamation-circle' : 'fas fa-info-circle'}"></i> 
            <span>导航栏最多可显示 ${MAX_NAV_CATEGORIES} 个分类 (当前已选择 ${selectedCount} 个)</span>
        </div>
    `;

    elements.categorySettingsList.innerHTML = html;

    // 更新警告显示
    updateCategoryLimitWarning();
}

async function fetchCategory() {
    const res = await fetch('/story/all/category');
    const data = await res.json();
    return data.categoryList;
}


async function fetchCount(categoryId) {
    const res = await fetch('/story/count/' + categoryId);
    const data = await res.json();
    return data.dataCount;
}


function showLoading() {
    elements.loadingOverlay.classList.add('active');
    //禁用滚动
    document.body.classList.add('modal-open');
}

// 隐藏加载遮罩
function hideLoading() {
    // 添加淡出动画效果
    elements.loadingOverlay.classList.add('fade-out');

    setTimeout(() => {
        elements.loadingOverlay.classList.remove('active');
        elements.loadingOverlay.classList.remove('fade-out');

        document.body.classList.remove('modal-open');
    }, 200);
}

function getCookie(cookieName){
    const cookie = document.cookie;
    if(!cookie){
        return '';
    }
    const cookieList = cookie.split(";");
    for (let i = 0;i<cookieList.length;i++){
        const cookieValList = cookieList[i].split("=");

        if(cookieValList[0].trim() === cookieName){
            return cookieValList[1];
        }
    }
}

//随机数0-10
function getRandomInt() {
    return Math.floor(Math.random() * 7);
}

//显示故事卡片加载动画
function showStoryCardAnimation(){
    // 为新添加的卡片添加淡入动画
    const cards = elements.storyGrid.querySelectorAll('.content-card');
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 40 * i);
    }
    //滚动条复原
    window.scrollTo(0, 0);
}


// 支持浏览器回退
// window.addEventListener('popstate', async () => {
//     const res = await fetch(location.pathname, { headers: { 'X-Partial': 'true' } });
//     const html = await res.text();
//     document.querySelector('#storyGrid').innerHTML = html;
// });
