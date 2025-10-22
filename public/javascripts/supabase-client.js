const supabase = require('./supabase.js');

exports.fetchData = async (tableName, options = {})=>{
    try {
        //构建查询
        let query = supabase.from(tableName).select(options.columns || '*');

        // 添加过滤条件
        if (options.filter) {
            for (const [column, value] of Object.entries(options.filter)) {
                query = query.eq(column, value);
            }
        }

        // 添加过滤条件
        if (options.filterLike) {
            for (const [column, value] of Object.entries(options.filterLike)) {
                query = query.like(column, '%' + value + '%');
            }
        }

        // 添加排序
        if (options.orderBy) {
            query = query.order(options.orderBy.column, {
                ascending: options.orderBy.ascending
            });
        }

        // 添加分页
        if (options.pagination) {
            const { page, pageSize } = options.pagination;
            query = query
                .range((page - 1) * pageSize, page * pageSize - 1);
        }

        // 执行查询
        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return { data: data, error: error };
    } catch (error) {
        console.error('Supabase查询错误:', error);
        return { data: null, error };
    }
};


// 插入数据
exports.insertData = async (tableName, data) =>{
    try {
        const { data: insertedData, error } = await supabaseClient
            .from(tableName)
            .insert(data)
            .select();

        if (error) {
            throw error;
        }

        return { data: insertedData, error: null };
    } catch (error) {
        console.error('Supabase插入错误:', error);
        return { data: null, error };
    }
}
