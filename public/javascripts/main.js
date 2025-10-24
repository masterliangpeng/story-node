const PAGE_MAX_SIZE = 50;

let currentState = {
    activeCategoryId: null, // 初始为null，加载后设为第一个分类的ID
    currentPage: 1,//当前页数
    totalPages: 0,//总页数
    stories: [],
    categories: [],
    selectedCategoryIds: [], // 用户选择的分类ID列表
    searchKeyword: '',
    isLoading: false,   // 是否正在加载数据
    hasMoreData: true,   // 是否还有更多数据
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

document.addEventListener('DOMContentLoaded', ()=>{
    showWelcomeAnimation();
    // const activeCategoryId = getCookie('activeCategoryId');
    // const count = fetchCount(activeCategoryId);
    currentState.totalPages = window.ejsData.totalPages;
});

document.querySelectorAll('.filter-tag a').forEach(a => {
    a.addEventListener('click', async e => {
        e.preventDefault();     // 阻止默认跳转
        e.stopPropagation();    // 防止冒泡到 li，避免重复触发

        const href = a.getAttribute('href');
        if (!href) return;
        showLoading();
        const activeCategoryId = a.getAttribute('data-id');
        document.cookie = 'activeCategoryId=' + activeCategoryId + '; path=/;';
        // 异步加载分类内容
        try {

            //设置总页数
            // const count = fetchCount(activeCategoryId);
            currentState.totalPages = window.ejsData.totalPages;
            const res = await fetch(href, { headers: { 'X-Partial': 'true' } });
            const html = await res.text();
            document.querySelector('#storyGrid').innerHTML = html;

            // 更新浏览器地址（不会刷新页面）
            history.pushState(null, '', href);

            // 高亮当前分类（可选）
            document.querySelectorAll('.filter-tag').forEach(li => li.classList.remove('active'));
            a.closest('.filter-tag').classList.add('active');

        } catch (err) {
            console.error('加载分类内容失败:', err);
        }finally {
            setTimeout(()=>{
                hideLoading();
            },800)
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
        welcomeOverlay.classList.add('welcome-fade');
        setTimeout(() => {
            document.body.removeChild(welcomeOverlay);
        }, 1000);
    }, 2000);
}


// async function fetchCount(categoryId) {
//     const res = await fetch('/count/' + categoryId);
//     const data = await res.json();
//     return data.dataCount;
// }

// 加载效果控制函数
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('show');
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('show');
    }
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


// 支持浏览器回退
// window.addEventListener('popstate', async () => {
//     const res = await fetch(location.pathname, { headers: { 'X-Partial': 'true' } });
//     const html = await res.text();
//     document.querySelector('#storyGrid').innerHTML = html;
// });
