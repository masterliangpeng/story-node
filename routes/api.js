const express = require('express');
const router = express.Router();
const supabase = require('../public/javascripts/supabase-client');

// router.get('/test/:id',async (req,res)=>{
//     // const options = {
//     //     orderBy:{column:'sort_id',ascending:false}
//     // }
//     // console.log(req.params);
//     // let {data, error} = await supabase.fetchData('story_category', options);
//     // res.json({
//     //     data
//     // });
//
//     // let options2 = {
//     //     orderBy: {column: 'id', ascending: true},
//     //     pagination: {page: 1, pageSize: 50},
//     //     filter: {category_id: 1}
//     // };
//     // let {data, error} = await supabase.fetchData('story_main', options2);
//     // res.json({
//     //         data
//     //     });
// })

//初始化加载
router.get('/', async (req, res, next) => {
    let categoryList
    let storyList;

    //用户选中的分类
    let activeCategoryId = req.cookies.activeCategoryId;
    console.log('activeCategoryId',activeCategoryId);
    //用户勾选的设置
    let selectedCategoryIds = req.cookies.selectedCategoryIds;

    try {
        //todo判断cookie中是否存在已选中的分类，如果选中，则使用选中的分类加载数据，且分类也要选中
        let options = {
            orderBy: {column: 'sort_id', ascending: false}
        }
        let {data, error} = await supabase.fetchData('story_category', options);
        categoryList = data;
        if (data.length > 0) {
            let options = {
                orderBy: {column: 'id', ascending: true},
                pagination: {page: 1, pageSize: 50},
                filter: {category_id: !isNullOrUndefined(activeCategoryId) ? activeCategoryId : categoryList[0].id}
            };
            let {data, error} = await supabase.fetchData('story_main', options);
            storyList = data;
        }
        console.log('Fetched all languages');
        if (error) {
            throw new Error(error);
        }
    } catch (error) {
        console.log(error);
    }

    if(!isNullOrUndefined(selectedCategoryIds)){
        categoryList = categoryList.filter(item=>selectedCategoryIds.includes(item.id));
    }else{
        categoryList = categoryList.slice(0,7);
    }

    res.render('index2', {
        categoryList: categoryList,
        storyList: storyList,
        activeCategoryId : !isNullOrUndefined(activeCategoryId) ? activeCategoryId : categoryList[0].id
    })
});

//获取当个故事
router.get('/story/:id', async (req, res) => {
    let story;
    try {
        let options = {filter: {story_id: req.params.id}}
        let {data, error} = await supabase.fetchData('story_content', options);
        story = data;
        if (error) {
            throw new Error(error);
        }
    } catch (error) {
        console.log(error);
    }
    res.render('read', {
        story: story
    })
});

/**
 * 获取故事列表
 */
router.get('/list/:activeCategoryId/:page', async (req, res) => {
    let storyList;
    try {
        const options = {
            orderBy: {column: 'id', ascending: true},
            pagination: {page: req.params.page, pageSize: 50},
            filter: {category_id: req.params.activeCategoryId}
        }
        let {data, error} = await supabase.fetchData('story_main', options);
        storyList = data;
        if (error) {
            throw new Error(error);
        }
    } catch (error) {
        console.log(error);
    }

    // 如果是局部请求，只渲染 story-list 局部模板
    if (req.headers['x-partial']) {
        return res.render('main/story', { storyList : storyList });
    }

    res.render('index2',{
        storyList:storyList
    })

});

/**
 * 获取故事列表
 */
router.get('/list/:activeCategoryId/:page/:searchKeyword', async (req, res) => {
    let storyList;
    try {
        const options = {
            orderBy: {column: 'id', ascending: true},
            pagination: {page: req.params.page, pageSize: 50},
            filter: {category_id: req.params.activeCategoryId},
            filterLike: {}
        }
        if (req.params.searchKeyword) {
            options.filterLike = {title: req.params.searchKeyword};
        }
        let {data, error} = await supabase.fetchData('story_main', options);
        storyList = data;
        console.log('Fetched all languages');
        if (error) {
            throw new Error(error);
        }
    } catch (error) {
        console.log(error);
    }

    res.render('index',{
        storyList:storyList
    })

});

function isNullOrUndefined(value) {
    return typeof value === 'undefined' || value === null;
}


module.exports = router;

