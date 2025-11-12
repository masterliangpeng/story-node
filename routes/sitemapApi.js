const express = require('express');
const router = express.Router();
const supabase = require('./server');

const BASE_URL = "https://storynook.cn";

router.get("/sitemap.xml", async (req, res) => {

    let {data, error} = await supabase.fetchData('story_category');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 首页 sitemap 文件
    xml += `  <sitemap><loc>${BASE_URL}/sitemap-home.xml</loc></sitemap>\n`;

    // 分类页 sitemap 文件
    xml += `  <sitemap><loc>${BASE_URL}/sitemap-category.xml</loc></sitemap>\n`;
    // 分页故事 sitemap 文件
    for (let i = 0; i < data.length; i++) {
        let categoryId = data[i].id;
        xml += `  <sitemap><loc>${BASE_URL}/sitemap-story-${categoryId}.xml</loc></sitemap>\n`;
    }
    xml += `</sitemapindex>`;
    res.header("Content-Type", "application/xml");
    res.send(xml);
});

// 首页 sitemap
router.get("/sitemap-home.xml", (req, res) => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `
    <url>
      <loc>${BASE_URL}/</loc>
      <priority>1.0</priority>
      <changefreq>daily</changefreq>
    </url>\n`;
    xml += `</urlset>`;
    res.header("Content-Type", "application/xml");
    res.send(xml);
});

// 分类页 sitemap
router.get("/sitemap-category.xml", async (req, res) => {
    let {data, error} = await supabase.fetchData('story_category');
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    data.forEach(cat => {
        xml += `  <url><loc>${BASE_URL}/story/list/${cat.id}/1</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>\n`;
    });
    xml += `</urlset>`;
    res.header("Content-Type", "application/xml");
    res.send(xml);
});

// 分页故事 sitemap
router.get("/sitemap-story-:categoryId.xml", async (req, res) => {
    const categoryId = req.params.categoryId;
    let options = {
        orderBy: {column: 'id', ascending: true},
        filter: {category_id: categoryId}
    };
    let {data, error} = await supabase.fetchData('story_main', options);
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    data.forEach(story => {
        xml += `  <url><loc>${BASE_URL}/story/${story.id}</loc></url>\n`;
    });
    xml += `</urlset>`;
    res.header("Content-Type", "application/xml");
    res.send(xml);
});


module.exports = router;
