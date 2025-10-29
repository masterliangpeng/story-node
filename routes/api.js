const express = require('express');
const router = express.Router();
const supabase = require('../public/javascripts/supabase-client');
const pageMaxSize = 50;
let defaultCategoryId = null;

//初始化加载
router.get('/', async (req, res, next) => {
    let categoryList
    let storyList;

    //用户选中的分类
    let activeCategoryId = req.cookies.activeCategoryId;
    //用户勾选的设置
    let selectedCategoryIds = req.cookies.selectedCategoryIds;

    try {
        //todo判断cookie中是否存在已选中的分类，如果选中，则使用选中的分类加载数据，且分类也要选中
        let options = {
            orderBy: {column: 'sort_id', ascending: false}
        }
        if(!isNullOrUndefined(selectedCategoryIds)){


        }else{
            let {data, error} = await supabase.fetchData('story_category', options);
            categoryList = data;
            defaultCategoryId = categoryList[0].id;
        }

        if (categoryList.length > 0) {
            activeCategoryId = !isNullOrUndefined(activeCategoryId) ? activeCategoryId : categoryList[0].id;
            let options = {
                orderBy: {column: 'id', ascending: true},
                pagination: {page: 1, pageSize: pageMaxSize},
                filter: {category_id: activeCategoryId}
            };
            let {data, error} = await supabase.fetchData('story_main', options);
            storyList = data;
        }
        if (error) {
            throw new Error(error);
        }
    } catch (error) {
        console.log(error);
    }

    if (!isNullOrUndefined(selectedCategoryIds)) {
        categoryList = categoryList.filter(item => selectedCategoryIds.includes(item.id));
    } else {
        categoryList = categoryList.slice(0, 7);
    }
    //故事总量
    let storyCount = await fetchCount(activeCategoryId);
    //总分页数
    let totalPages = Math.ceil(storyCount / pageMaxSize);

    res.render('index', {
        categoryList: categoryList,
        storyList: storyList,
        activeCategoryId: activeCategoryId,
        page: 1,
        totalPages: totalPages
    })
});

//获取故事列表
router.get('/story/list/:activeCategoryId/:page', async (req, res) => {

    let storyList;
    let activeCategoryId = req.params.activeCategoryId;
    let page = req.params.page;
    try {
        const options = {
            orderBy: {column: 'id', ascending: true},
            pagination: {page: page, pageSize: pageMaxSize},
            filter: {category_id: activeCategoryId}
        }
        let {data, error} = await supabase.fetchData('story_main', options);
        storyList = data;
        if (error) {
            throw new Error(error);
        }
    } catch (error) {
        console.log(error);
    }
    //故事总量
    let storyCount = await fetchCount(activeCategoryId);
    //总分页数
    let totalPages = Math.ceil(storyCount / pageMaxSize);
    console.log(storyCount);
    console.log(totalPages);
    // 切换分类做局部页面刷新
    if (req.headers['x-partial']) {
        return res.render('partial/story', {
            storyList: storyList,
            activeCategoryId: activeCategoryId,
            page: page,
            totalPages: totalPages
        });
    }else if(req.headers['x-pagination']){
        return res.json({
            storyList: storyList
        });
    }else{
        let categoryList;
        //用户勾选的设置
        let selectedCategoryIds = req.cookies.selectedCategoryIds;
        try {
            let options = {
                orderBy: {column: 'sort_id', ascending: false}
            }
            let {data, error} = await supabase.fetchData('story_category', options);
            categoryList = data;
        } catch (error) {
            console.log(error);
        }

        if (!isNullOrUndefined(selectedCategoryIds)) {
            categoryList = categoryList.filter(item => selectedCategoryIds.includes(item.id));
        } else {
            categoryList = categoryList.slice(0, 7);
        }
        res.render('index', {
            categoryList: categoryList,
            storyList: storyList,
            activeCategoryId: activeCategoryId,
            page: page,
            totalPages: totalPages
        });
    }
});


//获取默认分类id
router.get('/story/initCategoryId', async (req,res)=>{
    console.log(defaultCategoryId);
    res.json({defaultCategoryId});
})


//获取当个故事
router.get('/story/:id', async (req, res) => {
    let storyMain;
    try {
        let options = {filter: {id: req.params.id}}
        let {data, error} = await supabase.fetchData('story_main', options);
        storyMain = data[0];
    } catch (error) {
        console.log(error);
    }

    let storyContent;
    try {
        let options = {filter: {story_id: req.params.id}}
        let {data, error} = await supabase.fetchData('story_content', options);
        storyContent = data[0];
        if (error) {
            throw new Error(error);
        }
    } catch (error) {
        console.log(error);
    }
    const contentList = storyContent.content.split('\n').filter(p => p.trim() !== '');
    res.render('read', {
        contentList: contentList,
        storyTitle: storyMain.title,
        categoryName: storyMain.category_name,
    });
});


//获取故事总量
router.get('/story/count/:activeCategoryId', async (req, res) => {
    let dataCount;
    try {
        const options = {
            filter: {category_id: req.params.activeCategoryId}
        }
        let {count, error} = await supabase.fetchCount('story_main', options);
        dataCount = count;
        if (error) {
            throw new Error(error);
        }
    } catch (error) {
        console.log(error);
    }

    res.json({dataCount});

});

async function fetchCount(categoryId) {
    let dataCount;
    try {
        const options = {
            filter: {category_id: categoryId}
        }
        let {count, error} = await supabase.fetchCount('story_main', options);
        dataCount = count;
        if (error) {
            throw new Error(error);
        }
    } catch (error) {
        console.log(error);
    }
    return dataCount;
}

function isNullOrUndefined(value) {
    return typeof value === 'undefined' || value === null;
}


module.exports = router;

