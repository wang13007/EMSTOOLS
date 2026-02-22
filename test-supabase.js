// Supabase 服务测试脚本
import { userService, surveyService, templateService, dictService, logService, messageService } from './src/services/supabaseService.js';

async function testSupabaseServices() {
  console.log('=== 开始测试 Supabase 服务 ===\n');

  try {
    // 测试 1: 获取用户列表
    console.log('测试 1: 获取用户列表');
    const users = await userService.getUsers();
    console.log('用户列表:', users);
    console.log('用户数量:', users.length);
    console.log('测试 1 完成\n');

    // 测试 2: 创建调研表单
    console.log('测试 2: 创建调研表单');
    const survey = await surveyService.createSurvey({
      name: '测试调研',
      customer_name: '测试客户',
      project_name: '测试项目',
      industry: '制造业',
      region: '北京市',
      template_id: 'template-1',
      status: '草稿',
      report_status: '未生成',
      creator_id: 'user-1',
      data: {}
    });
    console.log('创建的表单:', survey);
    console.log('测试 2 完成\n');

    // 测试 3: 获取模板列表
    console.log('测试 3: 获取模板列表');
    const templates = await templateService.getTemplates();
    console.log('模板列表:', templates);
    console.log('模板数量:', templates.length);
    console.log('测试 3 完成\n');

    // 测试 4: 获取字典类型列表
    console.log('测试 4: 获取字典类型列表');
    const dictTypes = await dictService.getDictTypes();
    console.log('字典类型列表:', dictTypes);
    console.log('字典类型数量:', dictTypes.length);
    console.log('测试 4 完成\n');

    console.log('=== 所有测试完成 ===');
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

testSupabaseServices();
