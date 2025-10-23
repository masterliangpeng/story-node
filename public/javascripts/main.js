document.querySelectorAll('.filter-tag a').forEach(a => {
    a.addEventListener('click', async e => {
        e.preventDefault();     // 阻止默认跳转
        e.stopPropagation();    // 防止冒泡到 li，避免重复触发

        const href = a.getAttribute('href');
        if (!href) return;
        const activeCategoryId = a.getAttribute('data-id');
        document.cookie = 'activeCategoryId='+activeCategoryId + '; path=/;';
        // 异步加载分类内容
        try {
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
        }
    });
});

// 2️⃣ 让点击整个 li 区域都触发内部 a 的点击
document.querySelectorAll('.filter-tag').forEach(li => {
    li.addEventListener('click', e => {
        // 如果点击的不是 <a> 元素，手动触发 a 点击
        if (!e.target.closest('a')) {
            const a = li.querySelector('a');
            if (a) a.click();
        }
    });
});

// document.querySelectorAll('.filter-tag').forEach(link => {
//     link.addEventListener('click', async e => {
//         e.preventDefault(); // 阻止默认跳转
//         const href = link.getAttribute('href');
//
//         // 异步加载分类内容
//         const res = await fetch(href, { headers: { 'X-Partial': 'true' } });
//         const html = await res.text();
//         document.querySelector('#storyGrid').innerHTML = html;
//
//         // 更新浏览器地址
//         history.pushState(null, '', href);
//     });
// });

// 支持浏览器回退
// window.addEventListener('popstate', async () => {
//     const res = await fetch(location.pathname, { headers: { 'X-Partial': 'true' } });
//     const html = await res.text();
//     document.querySelector('#storyGrid').innerHTML = html;
// });
