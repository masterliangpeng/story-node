const express = require('express');
const router = express.Router();
const supabase = require('../public/javascripts/supabase-client');

router.get('/test/:id',async (req,res)=>{
    const options = {
        orderBy:{column:'sort_id',ascending:false}
    }
    console.log(req.params);
    let {data, error} = await supabase.fetchData('story_category', options);
    res.json({
        data
    });
})

//初始化加载
router.get('/', async (req, res, next) => {
    let categoryList
    let storyList;
    try {
        //todo判断缓存中是否存在已选中的分类，如果选中，则使用选中的分类加载数据，且分类也要选中
        let options = {
            orderBy: {column: 'sort_id', ascending: false}
        }
        let {data, error} = await supabase.fetchData('story_category', options);
        categoryList = data;
        if (data.length > 0) {
            let options = {
                orderBy: {column: 'id', ascending: true},
                pagination: {page: 1, pageSize: 50},
                filter: {category_id: data[0].id}
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
    res.render('index', {
        categoryList: categoryList,
        storyList: storyList
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

    res.json({
        storyList
    })

});

module.exports = router;

