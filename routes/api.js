const express = require('express');
const router = express.Router();
const supabase = require('./server');
const pageMaxSize = 50;

//初始化加载
router.get('/', async (req, res, next) => {
    let categoryList
    let storyList;

    //用户选中的分类
    let activeCategoryId = req.cookies.activeCategoryId;
    //用户勾选的设置
    let selectedCategoryIds = req.cookies.selectedCategoryIds;

    try {
        let options = {
            orderBy: {column: 'sort_id', ascending: false},
        }
        if (!isNullOrUndefined(selectedCategoryIds)) {
            options.filterIn = {'id': JSON.parse(selectedCategoryIds)};
        }

        let {data, error} = await supabase.fetchData('story_category', options);
        categoryList = data;
        //initCategoryId(categoryList[0].id, categoryList);

        if (categoryList.length > 0) {
            activeCategoryId = !isNullOrUndefined(activeCategoryId) ? JSON.parse(activeCategoryId) : categoryList[0].id;
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

    if (isNullOrUndefined(selectedCategoryIds)) {
        categoryList = categoryList.slice(0, 10);
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
    let selectedCategoryIds = req.cookies.selectedCategoryIds;
    let page = req.params.page;
    // 切换分类做局部页面刷新
    if (req.headers['x-partial']) {
        try {
            storyList = await fetchStoryMain(page, activeCategoryId);
        } catch (error) {
            console.log(error);
        }
        //故事总量
        let storyCount = await fetchCount(activeCategoryId);
        //总分页数
        let totalPages = Math.ceil(storyCount / pageMaxSize);

        return res.render('partial/story', {
            storyList: storyList,
            activeCategoryId: activeCategoryId,
            page: page,
            totalPages: totalPages
        });
    } else if (req.headers['x-pagination']) {
        try {
            storyList = await fetchStoryMain(page, activeCategoryId);
        } catch (error) {
            console.log(error);
        }
        return res.json({
            storyList: storyList
        });
    } else {
        let categoryList;
        try {
            let options = {
                orderBy: {column: 'sort_id', ascending: false},
            }
            if (!isNullOrUndefined(selectedCategoryIds)) {
                options.filterIn = {'id': JSON.parse(selectedCategoryIds)};
            }
            console.log('selectedCategoryIds:',selectedCategoryIds)
            let {data, error} = await supabase.fetchData('story_category', options);
            categoryList = data;
            console.log('categoryList:',categoryList)
            //initCategoryId(activeCategoryId, categoryList);

            if (isNullOrUndefined(selectedCategoryIds)) {
                activeCategoryId = categoryList[0].id;
                categoryList = categoryList.slice(0, 10);
            }
            storyList = await fetchStoryMain(page, activeCategoryId);

        } catch (error) {
            console.log(error);
        }

        //故事总量
        let storyCount = await fetchCount(activeCategoryId);
        //总分页数
        let totalPages = Math.ceil(storyCount / pageMaxSize);

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
router.get('/story/initCategoryId', async (req, res) => {
    let options = {
        orderBy: {column: 'sort_id', ascending: false},
    }
    let {data, error} = await supabase.fetchData('story_category', options);

    res.json({defaultCategoryId:data[0].id, defaultCategoryIds: [data[0].id, data[1].id, data[2].id, data[3].id, data[4].id, data[5].id, data[6].id, data[7].id, data[8].id, data[9].id]});
})


//获取当个故事
router.get('/story/:id', async (req, res) => {
    console.log('进了了/story/:id');
    let storyMain;
    let id = JSON.parse(req.params.id);
    try {
        let options = {filter: {id: id}}
        let {data, error} = await supabase.fetchData('story_main', options);
        storyMain = data[0];
    } catch (error) {
        console.log(error);
    }

    let storyContent;
    try {
        let options = {filter: {story_id: id}}
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

router.get('/story/search/page/name',(req,res)=>{
    console.log('进了了/story/search')
    res.render('search');
})

//获取故事总量
router.get('/story/count/:activeCategoryId', async (req, res) => {
    let dataCount;
    try {
        const options = {
            filter: {category_id: JSON.parse(req.params.activeCategoryId)}
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

//获取所有分类
router.get('/story/all/category', async (req, res) => {
    let categoryList;
    try {
        let options = {
            orderBy: {column: 'sort_id', ascending: false}
        }
        let {data, error} = await supabase.fetchData('story_category', options);
        categoryList = data;
        if (error) {
            throw new Error(error);
        }
    } catch (error) {
        console.log(error);
    }
    res.json({categoryList});
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

// function initCategoryId(activeCategoryId, categoryList) {
//     if (defaultCategoryId === null) {
//         defaultCategoryId = activeCategoryId;
//     }
//     if (defaultCategoryIds.length === 0) {
//         defaultCategoryIds = [categoryList[0].id, categoryList[1].id, categoryList[2].id, categoryList[3].id, categoryList[4].id, categoryList[5].id, categoryList[6].id, categoryList[7].id, categoryList[8].id, categoryList[9].id];
//     }
// }

async function fetchStoryMain(page, activeCategoryId) {
    const options = {
        orderBy: {column: 'id', ascending: true},
        pagination: {page: page, pageSize: pageMaxSize},
        filter: {category_id: activeCategoryId}
    }
    let {data, error} = await supabase.fetchData('story_main', options);
    if (error) {
        throw new Error(error);
    }
    return data;
}

function isNullOrUndefined(value) {
    return typeof value === 'undefined' || value === null || value === '';
}


module.exports = router;

