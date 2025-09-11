import { MongoClient } from 'mongodb';

async function checkRandomQuestions() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        console.log('已连接到数据库\n');
        
        const db = client.db('studdy');
        const collection = db.collection('questions');
        
        // 获取最近添加的5道题目
        const recentQuestions = await collection.find({
            hasGeometryFigure: true
        }).sort({ _id: -1 }).limit(5).toArray();
        
        console.log(`检查最近添加的 ${recentQuestions.length} 道几何题目:\n`);
        
        recentQuestions.forEach((question, index) => {
            console.log(`题目 ${index + 1}:`);
            console.log(`内容: ${question.content}`);
            console.log(`SVG数据存在: ${!!question.svgData}`);
            console.log(`SVG数据长度: ${question.svgData ? question.svgData.length : 0}`);
            console.log(`图形属性存在: ${!!question.figureProperties}`);
            console.log(`包含几何图形: ${question.hasGeometryFigure}`);
            if (question.svgData) {
                console.log(`SVG数据预览: ${question.svgData.substring(0, 200)}...`);
            }
            if (question.figureProperties) {
                console.log(`图形属性: ${JSON.stringify(question.figureProperties, null, 2)}`);
            }
            console.log('---\n');
        });
        
    } catch (error) {
        console.error('检查题目时出错:', error);
    } finally {
        await client.close();
    }
}

checkRandomQuestions();