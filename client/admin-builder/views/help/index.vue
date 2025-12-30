<template>
  <div class="help-center">
    <div class="page-header mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">帮助中心</h1>
          <p class="text-gray-500 mt-1">获取使用帮助和技术支持</p>
        </div>
        <div class="flex gap-2">
          <el-button type="primary" @click="contactSupport">
            <i class="i-carbon-chat mr-1"></i>
            联系支持
          </el-button>
          <el-button @click="refreshHelp">
            <i class="i-carbon-renew mr-1"></i>
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 快速指南 -->
      <el-card class="lg:col-span-2" shadow="hover">
        <template #header>
          <span class="font-bold">快速指南</span>
        </template>

        <div class="space-y-6">
          <div class="guide-section">
            <h3 class="text-lg font-bold mb-3 flex items-center">
              <i class="i-carbon-model text-blue-500 mr-2"></i>
              数据模型管理
            </h3>
            <div class="space-y-2 text-gray-600">
              <p>1. 点击"新建模型"按钮创建新的数据模型</p>
              <p>2. 在模型设计器中添加和配置字段</p>
              <p>3. 点击"创建数据表"生成数据库表</p>
              <p>4. 系统会自动生成对应的 API 接口</p>
            </div>
          </div>

          <div class="guide-section">
            <h3 class="text-lg font-bold mb-3 flex items-center">
              <i class="i-carbon-data-table text-green-500 mr-2"></i>
              数据记录管理
            </h3>
            <div class="space-y-2 text-gray-600">
              <p>1. 选择要管理的数据表</p>
              <p>2. 查看、编辑、删除数据记录</p>
              <p>3. 支持分页和搜索功能</p>
              <p>4. 可以导出数据为 CSV 格式</p>
            </div>
          </div>

          <div class="guide-section">
            <h3 class="text-lg font-bold mb-3 flex items-center">
              <i class="i-carbon-api text-purple-500 mr-2"></i>
              API 管理
            </h3>
            <div class="space-y-2 text-gray-600">
              <p>1. 查看自动生成的 API 文档</p>
              <p>2. 使用 API 测试工具调试接口</p>
              <p>3. 支持 GET、POST、PUT、DELETE 等请求方法</p>
              <p>4. 可以保存测试历史记录</p>
            </div>
          </div>

          <div class="guide-section">
            <h3 class="text-lg font-bold mb-3 flex items-center">
              <i class="i-carbon-pen text-orange-500 mr-2"></i>
              UI 设计器
            </h3>
            <div class="space-y-2 text-gray-600">
              <p>1. 从左侧组件库拖拽组件到画布</p>
              <p>2. 在右侧属性面板配置组件属性</p>
              <p>3. 支持桌面端和移动端预览</p>
              <p>4. 保存设计好的页面配置</p>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 常见问题 -->
      <el-card class="faq-card" shadow="hover">
        <template #header>
          <span class="font-bold">常见问题</span>
        </template>

        <el-collapse v-model="activeFaq">
          <el-collapse-item name="1" title="如何创建新的数据模型？">
            <div class="text-gray-600">
              <p>1. 导航到"数据模型管理"页面</p>
              <p>2. 点击"新建模型"按钮</p>
              <p>3. 填写模型名称、标签和描述</p>
              <p>4. 在模型设计器中添加字段</p>
              <p>5. 点击"创建数据表"生成数据库表</p>
            </div>
          </el-collapse-item>
          <el-collapse-item name="2" title="如何测试 API 接口？">
            <div class="text-gray-600">
              <p>1. 导航到"API 测试"页面</p>
              <p>2. 选择请求方法（GET、POST 等）</p>
              <p>3. 输入 API 地址和请求参数</p>
              <p>4. 点击"发送请求"按钮</p>
              <p>5. 查看响应结果和状态码</p>
            </div>
          </el-collapse-item>
          <el-collapse-item name="3" title="如何管理用户权限？">
            <div class="text-gray-600">
              <p>1. 导航到"角色权限"页面</p>
              <p>2. 创建或编辑角色</p>
              <p>3. 为角色分配模块权限</p>
              <p>4. 在用户管理中为用户分配角色</p>
            </div>
          </el-collapse-item>
          <el-collapse-item name="4" title="如何导出数据？">
            <div class="text-gray-600">
              <p>1. 导航到"数据记录管理"页面</p>
              <p>2. 选择要导出的数据表</p>
              <p>3. 点击"导出数据"按钮</p>
              <p>4. 选择导出格式（CSV、JSON）</p>
              <p>5. 下载导出的文件</p>
            </div>
          </el-collapse-item>
          <el-collapse-item name="5" title="如何获取技术支持？">
            <div class="text-gray-600">
              <p>1. 查看本文档和常见问题</p>
              <p>2. 使用页面上的"联系支持"按钮</p>
              <p>3. 发送邮件到 support@example.com</p>
              <p>4. 加入我们的技术交流群</p>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-card>
    </div>

    <!-- 资源链接 -->
    <el-card class="mt-6" shadow="hover">
      <template #header>
        <span class="font-bold">资源链接</span>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <el-card class="resource-card" shadow="never">
          <div class="text-center">
            <i class="i-carbon-document text-4xl text-blue-500 mb-3"></i>
            <h4 class="font-bold mb-2">官方文档</h4>
            <p class="text-gray-600 text-sm mb-3">查看完整的使用文档和 API 参考</p>
            <el-button type="primary" size="small" @click="openDocumentation">
              查看文档
            </el-button>
          </div>
        </el-card>

        <el-card class="resource-card" shadow="never">
          <div class="text-center">
            <i class="i-carbon-code text-4xl text-green-500 mb-3"></i>
            <h4 class="font-bold mb-2">示例项目</h4>
            <p class="text-gray-600 text-sm mb-3">查看实际应用示例和最佳实践</p>
            <el-button type="success" size="small" @click="openExamples">
              查看示例
            </el-button>
          </div>
        </el-card>

        <el-card class="resource-card" shadow="never">
          <div class="text-center">
            <i class="i-carbon-chat-bot text-4xl text-purple-500 mb-3"></i>
            <h4 class="font-bold mb-2">社区支持</h4>
            <p class="text-gray-600 text-sm mb-3">加入社区获取帮助和分享经验</p>
            <el-button type="info" size="small" @click="openCommunity">
              加入社区
            </el-button>
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const activeFaq = ref(['1'])

const refreshHelp = () => {
  ElMessage.success('帮助内容已刷新')
}

const contactSupport = () => {
  ElMessage.info('技术支持功能开发中')
}

const openDocumentation = () => {
  window.open('https://github.com/pure-admin/vue-pure-admin', '_blank')
}

const openExamples = () => {
  ElMessage.info('示例项目功能开发中')
}

const openCommunity = () => {
  ElMessage.info('社区功能开发中')
}
</script>

<style scoped>
.help-center {
  padding: 0;
}

.page-header {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.guide-section {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border-left: 4px solid #3b82f6;
}

.faq-card {
  height: fit-content;
  position: sticky;
  top: 1rem;
}

.resource-card {
  transition: transform 0.3s, box-shadow 0.3s;
  border: 1px solid #e2e8f0;
}

.resource-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.el-collapse-item__header) {
  font-weight: 500;
}

:deep(.el-collapse-item__content) {
  padding: 16px;
  background: #f8fafc;
  border-radius: 0 0 6px 6px;
}
</style>
