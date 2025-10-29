const PAGE_MAX_SIZE = 50;

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

const sidebarElements = {
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebarClose: document.getElementById('sidebarClose'),
    multiFunctionButton: document.getElementById('multiFunctionButton'),
    functionDropdown: document.getElementById('functionDropdown'),
    mainContainer: document.getElementById('mainContainer')
};

document.addEventListener('DOMContentLoaded', async ()=>{
    showWelcomeAnimation();

    let activeCategoryId = getCookie('activeCategoryId');
    if(typeof activeCategoryId === 'undefined' || activeCategoryId === null || activeCategoryId === ''){
        const res= await fetch('/story/initCategoryId');
        const result = await res.json();
        activeCategoryId = result.defaultCategoryId;
    }

    console.log('DOMContentLoaded:',activeCategoryId);
    currentState.activeCategoryId = activeCategoryId;
    const count = await fetchCount(activeCategoryId);

    let totalPages = Math.ceil(count / PAGE_MAX_SIZE);
    console.log('totalPages=',totalPages);
    currentState.totalPages = totalPages;
    currentState.currentPage = 1;

    //判断是否可以加载数据
    currentState.hasMoreData = currentState.currentPage < currentState.totalPages;
    // 添加滚动事件监听
    window.addEventListener('scroll', handleScroll);

    // 为新添加的卡片添加淡入动画
    showStoryCardAnimation();
});

document.querySelectorAll('.filter-tag a').forEach(a => {
    a.addEventListener('click', async e => {
        e.preventDefault();     // 阻止默认跳转
        e.stopPropagation();    // 防止冒泡到 li，避免重复触发

        const href = a.getAttribute('href');
        if (!href) return;
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
        await loadMoreStories();
    }
}

// 加载更多故事
async function loadMoreStories() {
    if (currentState.isLoading || !currentState.hasMoreData) {
        return;
    }

    currentState.isLoading = true;
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
                        <h3 class="card-title"><a href='/story/<%=story.id %>' target=‘_blank’>${story.title}</a></h3>
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

        document.getElementById('storyGrid').insertAdjacentHTML('beforeend', html);

        // 为新添加的卡片添加淡入动画
        // const cards = document.getElementById('storyGrid').querySelectorAll('.content-card');
        // const startIndex= (nextPage - 1) * PAGE_MAX_SIZE;
        // for (let i = startIndex; i < cards.length; i++) {
        //     const card = cards[i];
        //     card.style.opacity = '0';
        //     card.style.transform = 'translateY(20px)';
        //     setTimeout(() => {
        //         card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        //         card.style.opacity = '1';
        //         card.style.transform = 'translateY(0)';
        //     }, 30 * (i - startIndex));
        // }

        // 更新状态
        currentState.currentPage = nextPage;
        currentState.hasMoreData = nextPage < currentState.totalPages;

        console.log(`已加载第 ${nextPage} 页，共 ${currentState.totalPages} 页`);

    } catch (error) {
        console.error('加载更多故事失败:', error);
    } finally {
        currentState.isLoading = false;
        hideLoading();
    }
}


async function fetchCount(categoryId) {
    const res = await fetch('/story/count/' + categoryId);
    const data = await res.json();
    return data.dataCount;
}


function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

// 隐藏加载遮罩
function hideLoading(i) {
    // 添加淡出动画效果
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.add('fade-out');

    setTimeout(() => {
        loadingOverlay.classList.remove('active');
        loadingOverlay.classList.remove('fade-out');
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

function showStoryCardAnimation(){
    // 为新添加的卡片添加淡入动画
    const cards = document.getElementById('storyGrid').querySelectorAll('.content-card');
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
