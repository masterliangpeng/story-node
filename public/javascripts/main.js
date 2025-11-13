const PAGE_MAX_SIZE = 50;
const MAX_NAV_CATEGORIES = 10; // 导航栏最多显示的分类数

let currentState = {
    activeCategoryId: null, // 初始为null，加载后设为第一个分类的ID
    currentPage: 1,//当前页数
    totalPages: 0,//总页数
    categories: [],
    selectedCategoryIds: [], // 用户选择的分类ID列表
    isLoading: true,   // 是否正在加载数据
    hasMoreData: false,   // 是否还有更多数据
    isSimpleMode: false,  // 是否为简约模式
    homeChoice: 'home2',
    welcomeMsg: ['欢迎来到《小故事铺》这里藏着一段段温暖的小故事，等你慢慢翻阅，慢慢收藏，和我们一起，在文字里遇见生活的温度',
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
    categorySettingsList: document.getElementById('categorySettingsList'),
    settingsClose: document.getElementById('settingsClose'),
    categoryTags: document.getElementById('categoryTags'),
    homeSelectBtn: document.getElementById('homeSelectBtn'),
    homeModal: document.getElementById('homeModal'),
    homeOptions: document.getElementById('homeOptions'),
    homeCancelBtn: document.getElementById('homeCancelBtn'),
    homeModalBackdrop: document.getElementById('homeModalBackdrop'),
    homeConfirmBtn: document.getElementById('homeConfirmBtn'),
};

const sidebarElements = {
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebarClose: document.getElementById('sidebarClose'),
    multiFunctionButton: document.getElementById('multiFunctionButton'),
    categorySettingsButton: document.getElementById('categorySettingsButton'),
    themeToggle: document.getElementById('themeToggle'),
    refreshButton: document.getElementById('refreshButton'),
    viewModeToggle: document.getElementById('viewModeToggle'),
    searchButton: document.getElementById('searchButton'),
};

document.addEventListener('DOMContentLoaded', async () => {

    // 页面加载时检测
    detectMobileAndRedirect();

    // 监听窗口大小变化
    window.addEventListener('resize', detectMobileAndRedirect);

    //欢迎动画
    showWelcomeAnimation();

    //判断是否重定向到主页1
    redirectHome();

    //初始化侧边栏
    initSidebar();

    //故事点击事件
    bindStoryClick();

    let activeCategoryId = getCookie('activeCategoryId');
    let selectedCategoryIds = getCookie('selectedCategoryIds');
    if (isNullOrUndefined(activeCategoryId) || isNullOrUndefined(selectedCategoryIds)) {
        const res = await fetch('/story/initCategoryId');
        const result = await res.json();
        activeCategoryId = JSON.stringify(result.defaultCategoryId);
        selectedCategoryIds = JSON.stringify(result.defaultCategoryIds);
        document.cookie = 'activeCategoryId=' + activeCategoryId + '; path=/;';
        document.cookie = 'selectedCategoryIds=' + selectedCategoryIds + '; path=/;';
    }
    currentState.activeCategoryId = JSON.parse(activeCategoryId);
    currentState.selectedCategoryIds = JSON.parse(selectedCategoryIds);

    const count = await fetchCount(activeCategoryId);
    currentState.totalPages = Math.ceil(count / PAGE_MAX_SIZE);
    currentState.currentPage = 1;

    //判断是否可以加载数据
    currentState.hasMoreData = currentState.currentPage < currentState.totalPages;
    // 添加滚动事件监听
    window.addEventListener('scroll', handleScroll);

    // 为新添加的卡片添加淡入动画
    showStoryCardAnimation();
});

//绑定分类点击事件
function bindCategoryClick(){
    // 让点击整个 li 区域都触发内部 a 的点击
    document.querySelectorAll('.filter-tag').forEach(li => {
        li.addEventListener('click', e => {
            // 如果点击的不是 <a> 元素，手动触发 a 点击
            if (!e.target.closest('a')) {
                const a = li.querySelector('a');
                if (a) a.click();
            }
        });
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
                currentState.totalPages = totalPages;
                currentState.currentPage = 1;
                // 重置分页状态
                currentState.hasMoreData = currentState.currentPage < currentState.totalPages;

                const res = await fetch(href, {headers: {'X-Partial': 'true'}});
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
            } finally {
                currentState.isLoading = false;
                hideLoading();
            }
        });
    });
}

//绑定故事点击事件
function bindStoryClick(){
    document.querySelectorAll('.content-card').forEach(card => {
        const link = card.querySelector('a');
        if (!link) return; // 没有链接就跳过

        card.addEventListener('click', e => {
            // 如果用户点的就是 a 标签本身，则不重复执行
            if (e.target.tagName.toLowerCase() === 'a') return;

            // 模拟点击 a 标签
            link.click();
        });
    });
}


//欢迎页
function showWelcomeAnimation() {
    const welcomeText = currentState.welcomeMsg[getRandomInt()];
    // 添加初始欢迎遮罩
    const welcomeOverlay = document.createElement('div');
    welcomeOverlay.className = 'welcome-overlay';
    welcomeOverlay.innerHTML = `
        <div class="welcome-content">
            <div class="welcome-icon">
                <img src="/images/story.png" alt="小故事铺" class="logo-img" loading="lazy" decoding="async"/>
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
        await loadStory(currentState.activeCategoryId,nextPage)

        //重新绑定故事点击事件
        bindStoryClick();
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
        // setTimeout(() => {
        //     window.scrollTo(0, scrollPos+200);
        // }, 200);
    }
}

// 初始化侧边栏
function initSidebar() {
    //绑定分类点击事件
    bindCategoryClick()
    // 侧边栏收起按钮
    sidebarElements.sidebarClose.addEventListener('click', toggleSidebar);

    // 侧边栏展开按钮（在collapsed状态显示）
    sidebarElements.sidebarToggle.addEventListener('click', toggleSidebar);

    // 多功能按钮点击事件
    sidebarElements.multiFunctionButton.addEventListener('click', toggleFunctionDropdown);

    // 故事搜索点击事件
    const link = sidebarElements.searchButton.querySelector('a');
    sidebarElements.searchButton.addEventListener('click', (event) => {
        // 如果点击的目标是 a 标签本身，说明用户已经点了链接，就不再触发
        if (event.target.tagName.toLowerCase() === 'a') {
            return;
        }
        // 否则手动触发 a 标签跳转
        link.click();
    });

    // 点击其他区域关闭下拉菜单
    document.addEventListener('click', (e) => {
        // 如果点击的不是多功能按钮内的元素，则关闭下拉菜单
        const isClickInsideButton = sidebarElements.multiFunctionButton.contains(e.target);
        if (!isClickInsideButton && sidebarElements.multiFunctionButton.classList.contains('active')) {
            toggleFunctionDropdown();
        }
    });
    // 从功能下拉菜单中移动原有功能按钮的事件监听
    sidebarElements.viewModeToggle.addEventListener('click', openHomeModal);
    sidebarElements.categorySettingsButton.addEventListener('click', openCategorySettingsModal);
    sidebarElements.themeToggle.addEventListener('click', toggleTheme);
    sidebarElements.refreshButton.addEventListener('click', refreshHome);
    elements.settingsClose.addEventListener('click', closeCategorySettingsModal);
    //选择主页按钮事件监听
    elements.homeCancelBtn.addEventListener('click', closeHomeModal);
    elements.homeModalBackdrop.addEventListener('click', closeHomeModal);
    elements.homeOptions.addEventListener('click', (e) => choiceHome(e));

    // 确认选择后存储至本地
    elements.homeConfirmBtn.addEventListener('click', confirmHome);

    // 初始化已选择的主页
    initHomeSelection();

    //检查并应用存储的主题
    checkSavedTheme();

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

function openHomeModal(){
    // 禁止背景滚动
    elements.homeModal.classList.add('active');
    // 禁止背景滚动
    document.body.classList.add('modal-open');
}
function closeHomeModal() {
    // 恢复背景滚动
    elements.homeModal.classList.remove('active');
    // 禁止背景滚动
    document.body.classList.remove('modal-open');
}


function choiceHome(e){
    const option = e.target.closest('.home-option');
    if (!option) return;
    const selected = option.dataset.home;
    currentState.homeChoice = selected;
    applyHomeSelectionUI(selected);
}


function confirmHome(){
    showLoading();
    showToast('切换主页成功', 'success');
    try {
        localStorage.setItem('homepage', currentState.homeChoice);
        closeHomeModal();
        const homepage = localStorage.getItem('homepage');
        if(homepage === 'home2'){
            window.location.href = '/';
        }else if(homepage === 'home1'){
            window.location.href = '/story/home/index';
        }
    }finally {
        hideLoading();
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
async function openCategorySettingsModal() {
    await populateCategorySettings();
    elements.categorySettingsModal.classList.add('active');

    // 禁止背景滚动
    document.body.classList.add('modal-open');

    // 记录当前滚动位置
    window.modalScrollY = window.scrollY;
}

// 填充分类设置内容
async function populateCategorySettings() {
    // 创建分类设置的视图容器
    if (currentState.categories === null || currentState.categories.length === 0) {
        currentState.categories = await fetchCategory();
    }

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
}

// 关闭分类设置弹窗
function closeCategorySettingsModal() {
    elements.categorySettingsModal.classList.remove('active');

    // 恢复背景滚动
    document.body.classList.remove('modal-open');

    // 恢复滚动位置
    setTimeout(() => {
        window.scrollTo(0, window.modalScrollY || 0);
    }, 10);
}

// 处理分类切换
async function handleCategoryToggle(categoryId, isAdd) {
    if (isAdd) {
        // 检查是否已达到最大限制
        if (currentState.selectedCategoryIds.length >= MAX_NAV_CATEGORIES) {
            // 显示最大限制警告
            const limitInfo = document.querySelector('.category-limit-info');
            if (limitInfo) {
                limitInfo.classList.add('shake-animation');
                setTimeout(() => {
                    limitInfo.classList.remove('shake-animation');
                }, 820);
            }
            return;
        }

        // 添加到选中列表
        if (!currentState.selectedCategoryIds.includes(categoryId)) {
            currentState.selectedCategoryIds.push(categoryId);
        }
    } else {
        // 检查是否只剩下最后一个分类
        if (currentState.selectedCategoryIds.length <= 1) {
            // 显示至少需要一个分类的警告
            showToast('至少需要选择一个分类', 'warning');

            // 高亮显示当前元素提示不能移除
            const categoryItem = document.querySelector(`.category-item[data-id="${categoryId}"]`);
            if (categoryItem) {
                categoryItem.classList.add('shake-animation');
                setTimeout(() => {
                    categoryItem.classList.remove('shake-animation');
                }, 820);
            }
            return;
        }
        // 从选中列表移除
        currentState.selectedCategoryIds = currentState.selectedCategoryIds.filter(id => id !== categoryId);
    }

    // 立即保存用户设置
    saveUserCategorySettings(currentState.selectedCategoryIds);

    // 重新渲染设置项
    await populateCategorySettings();

    // 重新渲染导航栏分类
    renderCategories();

    // 如果当前激活的分类不在选中列表中，切换到第一个选中的分类
    if (!currentState.selectedCategoryIds.includes(currentState.activeCategoryId) && currentState.selectedCategoryIds.length > 0) {
        //handleCategoryChange(currentState.selectedCategoryIds[0], true);
        elements.storyGrid.innerHTML = '';
        await loadStory(currentState.selectedCategoryIds[0],1);
        //重新绑定故事点击事件
        bindStoryClick();

        const tags = document.querySelectorAll('.filter-tag');
        for (const tag of tags) {
            tag.classList.remove('active');
            const a = tag.querySelector('a');
            if (parseInt(a.getAttribute('data-id')) === currentState.selectedCategoryIds[0]) {
                document.cookie = 'activeCategoryId=' + categoryId + '; path=/;';
                tag.classList.add('active');
                currentState.activeCategoryId = currentState.selectedCategoryIds[0];
                document.cookie = 'activeCategoryId=' + currentState.activeCategoryId + '; path=/;';
                break;
            }
        }
    }

    // 显示提示信息
    showToast('分类设置已更新', 'info');
}

// 保存用户分类设置到本地存储
function saveUserCategorySettings(selectedCategoryIds) {
    document.cookie = 'selectedCategoryIds=' + JSON.stringify(selectedCategoryIds) + '; path=/;';
    //localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentState.selectedCategoryIds));
}

// 渲染分类标签，只显示用户选择的分类
function renderCategories() {
    let html = '';
    // 过滤出用户选择的分类
    const selectedCategories = currentState.categories.filter(
        category => currentState.selectedCategoryIds.includes(category.id)
    );

    // 添加用户选择的分类，并默认选中第一个
    selectedCategories.forEach((category, index) => {
        const isActive = category.id === currentState.activeCategoryId;
        html += `
            <li class="filter-tag ${isActive ? 'active' : ''} category-link">
                <a class="tag-text" href="/story/list/${category.id}/1" data-id="${category.id}">${category.name}</a>
            </li>
        `;
    });

    elements.categoryTags.innerHTML = html;

    // 渐变淡入动画效果
    let tags = document.querySelectorAll('.filter-tag');
    tags.forEach((tag, index) => {
        tag.style.opacity = '0';
        tag.style.transform = 'translateY(5px)';
        setTimeout(() => {
            tag.style.transition = 'all 0.3s ease';
            tag.style.opacity = '1';
            tag.style.transform = 'translateY(0)';
        }, 50 * index);
    });

    // 滚动到当前活动分类
    setTimeout(() => {
        // 为活动分类添加轻微的动画效果，提供视觉反馈
        const activeTag = document.querySelector('.filter-tag.active');
        if (activeTag) {
            // 添加短暂的脉冲动画效果
            activeTag.classList.add('pulse-effect');
            setTimeout(() => {
                activeTag.classList.remove('pulse-effect');
            }, 800);
        }
    }, 300);

    // 重新绑定分类点击事件.
    bindCategoryClick();
}

//重置刷新
async function refreshHome(){
    localStorage.removeItem('theme')
    currentState.activeCategoryId = null;
    currentState.currentPage = 1;
    currentState.totalPages = 0;
    currentState.categories = [];
    currentState.selectedCategoryIds = [];
    currentState.isLoading = true;
    currentState.hasMoreData = false;
    currentState.isSimpleMode = true;
    const res = await fetch('/story/initCategoryId');
    const result = await res.json();
    document.cookie = 'activeCategoryId=' + JSON.stringify(result.defaultCategoryId) + '; path=/;';
    document.cookie = 'selectedCategoryIds=' + JSON.stringify(result.defaultCategoryIds) + '; path=/;';

    showToast('已恢复默认设置', 'info');

    window.location.href = "/";
}

// 主题切换功能
function toggleTheme() {
    const body = document.body;
    const isDarkMode = body.classList.contains('dark-theme');
    if (isDarkMode) {
        body.classList.remove('dark-theme');
        sidebarElements.themeToggle.innerHTML = '<i class="fas fa-moon"></i><span>切换主题</span>';
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark-theme');

        sidebarElements.themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>切换主题</span>';
        localStorage.setItem('theme', 'dark');
    }
}

// 检查保存的主题
function checkSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        sidebarElements.themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>切换主题</span>';
    }
}

// 显示轻提示 (Toast)
function showToast(message, type = 'success') {
    // 检查是否已存在toast元素，如果存在则移除
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
        existingToast.remove();
    }

    // 创建新的toast元素
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;

    // 设置图标
    let icon = 'check-circle';
    if (type === 'error') icon = 'times-circle';
    if (type === 'info') icon = 'info-circle';
    if (type === 'warning') icon = 'exclamation-circle';

    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;

    // 添加到页面
    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // 自动消失
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
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

async function loadStory(categoryId,pageNo){
    // 获取下一页数据
    const res = await fetch('/story/list/' + categoryId + '/' + pageNo, {
        headers: {'X-pagination': 'true'}
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
                        <h3 class="card-title"><a href='/story/${story.id}' target='_blank'>${story.title}</a></h3>
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
}


//显示故事卡片加载动画
function showStoryCardAnimation() {
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


// 检测移动端设备并跳转
function detectMobileAndRedirect() {
    // 检测屏幕宽度
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

    // 检测用户代理字符串
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

    // 如果屏幕宽度小于768px或检测到移动设备，则跳转到app.html
    if (screenWidth <= 768 || isMobileDevice) {
        // 避免无限重定向，检查当前页面是否已经是app.html
        if (!window.location.pathname.includes('/app')) {
            window.location.href = '/app';
        }
    }
}

function redirectHome(){
    const homepage = localStorage.getItem('homepage');
    if(!isNullOrUndefined(homepage) && homepage === 'home1'){
        window.location.href = '/story/home/index';
    }
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

function getCookie(cookieName) {
    const cookie = document.cookie;
    if (!cookie) {
        return '';
    }
    const cookieList = cookie.split(";");
    for (let i = 0; i < cookieList.length; i++) {
        const cookieValList = cookieList[i].split("=");

        if (cookieValList[0].trim() === cookieName) {
            return cookieValList[1];
        }
    }
}

//随机数0-10
function getRandomInt() {
    return Math.floor(Math.random() * 7);
}

function isNullOrUndefined(value) {
    return typeof value === 'undefined' || value === null || value === '';
}

// 支持浏览器回退
// window.addEventListener('popstate', async () => {
//     const res = await fetch(location.pathname, { headers: { 'X-Partial': 'true' } });
//     const html = await res.text();
//     document.querySelector('#storyGrid').innerHTML = html;
// });
