document.querySelectorAll('.category-link').forEach(link => {
    link.addEventListener('click', async e => {
        e.preventDefault(); // 阻止默认跳转
        const href = link.getAttribute('href');

        // 异步加载分类内容
        const res = await fetch(href, { headers: { 'X-Partial': 'true' } });
        const html = await res.text();
        document.querySelector('#storyGrid').innerHTML = html;

        // 更新浏览器地址
        history.pushState(null, '', href);
    });
});


// 支持浏览器回退
// window.addEventListener('popstate', async () => {
//     const res = await fetch(location.pathname, { headers: { 'X-Partial': 'true' } });
//     const html = await res.text();
//     document.querySelector('#storyGrid').innerHTML = html;
// });
