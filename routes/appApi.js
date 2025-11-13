const express = require('express');
const router = express.Router();
const supabase = require('./server');

router.get('/', async function(req, res, next) {
    res.render('app/app')
});

//获取故事列表
router.get('/list/:activeCategoryId/:page', async (req, res) => {
    let storyList = null;
    try {
        const options = {
            orderBy: {column: 'id', ascending: true},
            pagination: {page: req.params.page, pageSize: 20},
            filter: {category_id: req.params.activeCategoryId}
        }
        let {data, error} = await supabase.fetchData('story_main', options);
        if (error) {
            throw new Error(error);
        }

        storyList = data;
    } catch (error) {
        console.log(error);
    }
    return res.json({
        storyList: storyList
    });
});

//获取当个故事
router.get('/:id', async (req, res) => {
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
    res.json({storyContent});
});

//获取所有分类
router.get('/all/category', async (req, res) => {
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


module.exports = router;
