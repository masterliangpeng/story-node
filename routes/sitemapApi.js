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
router.get("/sitemap-categories.xml", async (req, res) => {
    const categories = await db.query("SELECT id FROM categories");
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    categories.forEach(cat => {
        xml += `  <url><loc>${BASE_URL}/story/${cat.id}/1</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>\n`;
    });
    xml += `</urlset>`;
    res.header("Content-Type", "application/xml");
    res.send(xml);
});

// 分页故事 sitemap
router.get("/sitemap-story-:categoryId.xml", async (req, res) => {
    const { page } = req.params;
    const limit = STORIES_PER_FILE;
    const offset = (page - 1) * STORIES_PER_FILE;

    const stories = await db.query(
        "SELECT id, updated_at FROM stories ORDER BY id ASC LIMIT ? OFFSET ?",
        [limit, offset]
    );

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    stories.forEach(story => {
        xml += `  <url><loc>${BASE_URL}/story/detail/${story.id}</loc><lastmod>${new Date(story.updated_at).toISOString().split("T")[0]}</lastmod></url>\n`;
    });
    xml += `</urlset>`;
    res.header("Content-Type", "application/xml");
    res.send(xml);
});


module.exports = router;
