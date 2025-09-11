import mongoose from 'mongoose';

// 连接数据库
mongoose.connect('mongodb://localhost:27017/studdy')
  .then(() => {
    console.log('数据库连接成功');
    
    // 定义Question模型
    const Question = mongoose.model('Question', new mongoose.Schema({}, {strict: false}));
    
    // 查找所有题目类型
    return Question.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  })
  .then(results => {
    console.log('题目类型分布:');
    
    results.forEach(result => {
      console.log(`${result._id || '未分类'}: ${result.count} 道题目`);
    });
    
    // 查找最近添加的题目
    const Question = mongoose.model('Question');
    return Question.find().sort({_id: -1}).limit(10);
  })
  .then(recentQuestions => {
    console.log('\n最近添加的题目详情:');
    console.log('题目数量:', recentQuestions.length);
    
    recentQuestions.forEach((q, i) => {
      console.log(`\n=== 题目 ${i+1} ===`);
      console.log('ID:', q._id);
      console.log('内容:', q.content?.substring(0, 150) + '...');
      console.log('是否有SVG数据:', !!q.svgData);
      console.log('SVG数据长度:', q.svgData?.length || 0);
      console.log('图形属性:', !!q.figureProperties);
      console.log('包含几何图形:', q.hasGeometryFigure);
      console.log('学科:', q.subject);
      console.log('难度:', q.difficulty);
      
      if (q.svgData) {
        console.log('SVG预览:', q.svgData.substring(0, 200) + '...');
      }
    });
  })
  .catch(error => {
    console.error('错误:', error);
  })
  .finally(() => {
    mongoose.connection.close();
    process.exit();
  });