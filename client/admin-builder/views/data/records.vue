<template>
  <div class="data-records">
    <div class="page-header mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">数据记录管理</h1>
          <p class="text-gray-500 mt-1">查看和管理数据表中的记录</p>
        </div>
        <div class="flex gap-2">
          <el-button
            type="primary"
            @click="showCreateDialog = true"
            v-if="selectedTable"
          >
            <i class="i-carbon-add-alt mr-1"></i>
            新增记录
          </el-button>
          <el-button
            type="success"
            @click="showImportDialogHandle"
            v-if="selectedTable"
          >
            <i class="i-carbon-upload mr-1"></i>
            导入数据
          </el-button>
          <el-button @click="refreshData">
            <i class="i-carbon-renew mr-1"></i>
            刷新数据
          </el-button>
          <el-button @click="exportData" v-if="selectedTable">
            <i class="i-carbon-download mr-1"></i>
            导出数据
          </el-button>
        </div>
      </div>
    </div>

    <el-card class="mb-6 responsive-card" shadow="hover">
      <template #header>
        <div
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <span class="font-bold">数据表选择</span>
          <div class="flex gap-2 items-center w-full sm:w-auto">
            <el-select
              v-model="selectedTable"
              placeholder="选择数据表"
              class="w-full sm:w-64"
            >
              <el-option
                v-for="table in tables"
                :key="table.name"
                :label="table.label"
                :value="table.name"
              />
            </el-select>
            <el-input
              v-if="selectedTable"
              v-model="searchQuery"
              placeholder="搜索记录..."
              class="w-full sm:w-48"
              clearable
              @input="debounceSearch"
            >
              <template #prefix>
                <i class="i-carbon-search"></i>
              </template>
            </el-input>
          </div>
        </div>
      </template>

      <div v-if="selectedTable" class="space-y-4">
        <!-- 统计信息 -->
        <div
          class="stats-bar flex flex-wrap gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
        >
          <div class="stat-item">
            <div class="text-2xl font-bold text-blue-600">{{ total }}</div>
            <div class="text-sm text-gray-500">总记录数</div>
          </div>
          <div class="stat-item">
            <div class="text-2xl font-bold text-green-600">
              {{ currentPage }}
            </div>
            <div class="text-sm text-gray-500">当前页</div>
          </div>
          <div class="stat-item">
            <div class="text-2xl font-bold text-purple-600">
              {{ Math.ceil(total / pageSize) }}
            </div>
            <div class="text-sm text-gray-500">总页数</div>
          </div>
        </div>

        <!-- 数据表格 -->
        <div class="table-container">
          <el-table
            :data="tableData"
            stripe
            style="width: 100%"
            v-loading="loading"
            height="400"
            class="responsive-table"
            :default-sort="{ prop: 'created_at', order: 'descending' }"
            @sort-change="handleSortChange"
          >
            <el-table-column type="index" width="60" label="#" />
            <el-table-column
              v-for="column in columns"
              :key="column.prop"
              :prop="column.prop"
              :label="column.label"
              :width="getColumnWidth(column.prop)"
              :sortable="isSortableColumn(column.prop)"
              :show-overflow-tooltip="true"
            >
              <template #default="scope">
                <div class="cell-content">
                  <span
                    v-if="
                      column.prop === 'created_at' ||
                      column.prop === 'updated_at'
                    "
                  >
                    {{ formatDate(scope.row[column.prop]) }}
                  </span>
                  <span v-else-if="column.prop === 'status'">
                    <el-tag
                      :type="getStatusType(scope.row[column.prop])"
                      size="small"
                    >
                      {{ scope.row[column.prop] || "未知" }}
                    </el-tag>
                  </span>
                  <span v-else>
                    {{ scope.row[column.prop] || "-" }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <div class="table-actions flex gap-1">
                  <el-button
                    size="small"
                    @click="viewRecord(scope.row)"
                    class="action-btn"
                  >
                    <i class="i-carbon-view mr-1"></i>
                    查看
                  </el-button>
                  <el-button
                    size="small"
                    type="primary"
                    @click="editRecord(scope.row)"
                    class="action-btn"
                  >
                    <i class="i-carbon-edit mr-1"></i>
                    编辑
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="deleteRecord(scope.row)"
                    class="action-btn"
                  >
                    <i class="i-carbon-trash-can mr-1"></i>
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <div
          class="pagination-container flex flex-col sm:flex-row justify-between items-center gap-4 mt-6"
        >
          <div class="text-gray-500 text-sm order-2 sm:order-1">
            显示第 {{ (currentPage - 1) * pageSize + 1 }} -
            {{ Math.min(currentPage * pageSize, total) }} 条， 共
            {{ total }} 条记录
          </div>
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            :small="isMobile"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            class="order-1 sm:order-2"
          />
        </div>
      </div>

      <div v-else class="text-center py-12">
        <i class="i-carbon-data-table text-4xl text-gray-400 mb-4"></i>
        <p class="text-gray-500 text-lg">请选择一个数据表以查看记录</p>
        <p class="text-gray-400 text-sm mt-2">
          选择数据表后，您可以查看、编辑和管理数据记录
        </p>
      </div>
    </el-card>

    <!-- 创建记录对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新增记录"
      width="600px"
      :close-on-click-modal="false"
      class="responsive-dialog"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        label-width="100px"
        class="create-form"
      >
        <div v-if="!selectedModel" class="text-center p-8">
          <p class="text-gray-500">请先选择数据表</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <el-form-item
            v-for="field in availableFields"
            :key="field.name"
            :label="field.label"
            :required="field.required"
            class="form-item"
          >
            <el-input
              v-if="field.type === 'text'"
              v-model="createForm[field.name]"
              :placeholder="`请输入${field.label}`"
              clearable
            />
            <el-input-number
              v-else-if="field.type === 'number'"
              v-model="createForm[field.name]"
              :placeholder="`请输入${field.label}`"
              style="width: 100%"
            />
            <el-switch
              v-else-if="field.type === 'boolean'"
              v-model="createForm[field.name]"
              :active-text="'是'"
              :inactive-text="'否'"
            />
            <el-date-picker
              v-else-if="field.type === 'date' || field.type === 'datetime'"
              v-model="createForm[field.name]"
              :type="field.type === 'datetime' ? 'datetime' : 'date'"
              :placeholder="`请选择${field.label}`"
              style="width: 100%"
            />
            <el-select
              v-else
              v-model="createForm[field.name]"
              :placeholder="`请选择${field.label}`"
              style="width: 100%"
            >
              <el-option label="选项1" value="option1" />
              <el-option label="选项2" value="option2" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="createRecord" :loading="creating"
            >创建</el-button
          >
        </div>
      </template>
    </el-dialog>

    <!-- 导入数据对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="导入数据"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="import-dialog">
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="false"
          accept=".csv,.json"
          :on-change="handleImportFile"
          drag
          class="upload-area"
        >
          <i class="i-carbon-upload text-4xl text-blue-500 mb-4"></i>
          <p class="text-lg mb-2">拖拽文件到此处</p>
          <p class="text-sm text-gray-500">支持 CSV 和 JSON 格式</p>
          <el-button class="mt-4" type="primary">选择文件</el-button>
        </el-upload>

        <div v-if="importData.length > 0" class="mt-6">
          <h4 class="font-semibold mb-3">
            预览数据 ({{ importData.length }} 条记录)
          </h4>
          <div
            class="preview-container max-h-60 overflow-y-auto border rounded-lg p-2 bg-gray-50"
          >
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-100">
                  <th
                    v-for="header in importHeaders"
                    :key="header"
                    class="p-2 text-left"
                  >
                    {{ header }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in importData.slice(0, 10)"
                  :key="index"
                  class="border-b"
                >
                  <td v-for="header in importHeaders" :key="header" class="p-2">
                    {{ row[header] }}
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-if="importData.length > 10" class="text-sm text-gray-500 mt-2">
              仅显示前10条记录...
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <el-button @click="showImportDialog = false">取消</el-button>
          <div class="flex gap-2">
            <el-button @click="downloadTemplate">下载模板</el-button>
            <el-button
              type="primary"
              @click="confirmImport"
              :loading="importing"
              >确认导入</el-button
            >
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useAuthStore } from "../../store";

const authStore = useAuthStore();

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

const selectedTable = ref("");
const tables = ref([]);
const tableData = ref([]);
const columns = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const searchQuery = ref("");
const sortBy = ref("created_at");
const sortOrder = ref("desc");
const showCreateDialog = ref(false);
const showImportDialog = ref(false);
const createForm = ref({});
const createFormRef = ref(null);
const creating = ref(false);
const importing = ref(false);
const importData = ref([]);
const importHeaders = ref([]);
const uploadRef = ref(null);

// 响应式计算
const isMobile = computed(() => window.innerWidth < 768);
const isTablet = computed(
  () => window.innerWidth >= 768 && window.innerWidth < 1024
);

const availableFields = computed(() => {
  if (!selectedTable.value || !tables.value.length) return [];

  const currentModel = tables.value.find(
    (table) => table.name === selectedTable.value
  );
  return (
    currentModel?.fields?.filter(
      (field) => !["id", "created_at", "updated_at"].includes(field.name)
    ) || []
  );
});

// 获取请求头
const getHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };

  const token = authStore.token;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

// 加载可用的数据表（从模型API获取）
const loadAvailableTables = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/models`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (response.ok) {
      const models = await response.json();
      tables.value = models.map((model) => ({
        name: model.name,
        label: model.label || model.name,
        id: model.id,
      }));
    }
  } catch (error) {
    console.error("加载数据表失败:", error);
    ElMessage.error("加载数据表失败");
  }
};

// 加载表数据
const loadTableData = async () => {
  if (!selectedTable.value) return;

  loading.value = true;
  try {
    // 构建查询参数
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString(),
      sortBy: "created_at",
      sortOrder: "desc",
    });

    const response = await fetch(
      `${API_BASE_URL}/api/data/${selectedTable.value}?${params}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("加载数据失败");
    }

    const result = await response.json();

    if (result.success) {
      tableData.value = result.data || [];
      total.value = result.total || 0;

      // 动态生成列
      if (tableData.value.length > 0) {
        const firstRow = tableData.value[0];
        columns.value = Object.keys(firstRow).map((key) => ({
          prop: key,
          label: formatColumnLabel(key),
          width: getColumnWidth(key),
        }));
      } else {
        columns.value = [];
      }
    } else {
      tableData.value = [];
      columns.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error("加载数据失败:", error);
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
};

// 格式化列标签
const formatColumnLabel = (key) => {
  const labelMap = {
    id: "ID",
    created_at: "创建时间",
    updated_at: "更新时间",
    name: "名称",
    email: "邮箱",
    username: "用户名",
    role: "角色",
    status: "状态",
  };

  return (
    labelMap[key] ||
    key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
};

// 获取列宽度
const getColumnWidth = (key) => {
  const widthMap = {
    id: 80,
    created_at: 160,
    updated_at: 160,
    name: 150,
    email: 180,
    username: 120,
    role: 100,
    status: 100,
  };

  return widthMap[key] || 120;
};

const refreshData = () => {
  if (selectedTable.value) {
    loadTableData();
    ElMessage.success("数据已刷新");
  } else {
    ElMessage.warning("请先选择数据表");
  }
};

const viewRecord = async (record) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/data/${selectedTable.value}/${record.id}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (response.ok) {
      const result = await response.json();
      ElMessage.info(`查看记录: ${record.id} (数据已加载)`);
      console.log("记录详情:", result.data);
    } else {
      ElMessage.info(`查看记录: ${record.id}`);
    }
  } catch (error) {
    console.error("查看记录失败:", error);
    ElMessage.info(`查看记录: ${record.id}`);
  }
};

const editRecord = async (record) => {
  try {
    // 获取记录详情
    const response = await fetch(
      `${API_BASE_URL}/api/data/${selectedTable.value}/${record.id}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      ElMessage.info(`编辑记录: ${record.id}`);
      return;
    }

    const result = await response.json();

    // 创建一个更简单的编辑对话框，只编辑主要字段
    const recordData = result.data || record;

    // 找出可以编辑的字段（排除id、created_at等系统字段）
    const editableFields = Object.keys(recordData).filter(
      (key) =>
        !["id", "created_at", "updated_at", "password_hash"].includes(key)
    );

    if (editableFields.length === 0) {
      ElMessage.warning("没有可编辑的字段");
      return;
    }

    // 创建编辑表单
    let editForm = "";
    editableFields.forEach((field) => {
      const value = recordData[field];
      const displayValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);
      editForm += `${field}: <input type="text" value="${displayValue}" id="edit-${field}" style="width:100%;margin-bottom:10px;"><br>`;
    });

    const resultDialog = await ElMessageBox.confirm(
      `<div style="max-height:400px;overflow-y:auto;">
        <h4>编辑记录 ${record.id}</h4>
        ${editForm}
      </div>`,
      "编辑记录",
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        showClose: false,
      }
    );

    if (resultDialog) {
      // 收集编辑后的数据
      const updateData = {};
      editableFields.forEach((field) => {
        const input = document.getElementById(`edit-${field}`);
        if (input) {
          const value = input.value.trim();
          // 尝试解析JSON，如果不是JSON就保持原样
          try {
            updateData[field] = JSON.parse(value);
          } catch {
            updateData[field] = value;
          }
        }
      });

      // 更新记录
      const updateResponse = await fetch(
        `${API_BASE_URL}/api/data/${selectedTable.value}/${record.id}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(updateData),
        }
      );

      if (updateResponse.ok) {
        ElMessage.success("记录已更新");
        loadTableData(); // 刷新列表
      } else {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || "更新记录失败");
      }
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("编辑记录失败:", error);
      ElMessage.error(error.message || "编辑记录失败");
    }
  }
};

const handleSizeChange = (size) => {
  pageSize.value = size;
  loadTableData();
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  loadTableData();
};

const handleSortChange = ({ prop, order }) => {
  sortBy.value = prop;
  sortOrder.value = order;
  loadTableData();
};

const debounceSearch = (() => {
  let timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      currentPage.value = 1;
      loadTableData();
    }, 500);
  };
})();

const isSortableColumn = (prop) => {
  return !["id", "created_at", "updated_at"].includes(prop);
};

const getStatusType = (status) => {
  const statusMap = {
    active: "success",
    inactive: "warning",
    pending: "info",
    banned: "danger",
  };
  return statusMap[status?.toLowerCase()] || "info";
};

const createRecord = async () => {
  if (!selectedTable.value || !createFormRef.value) return;

  try {
    await createFormRef.value.validate();
    creating.value = true;

    const response = await fetch(
      `${API_BASE_URL}/api/data/${selectedTable.value}`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(createForm.value),
      }
    );

    if (response.ok) {
      ElMessage.success("记录创建成功");
      showCreateDialog.value = false;
      createForm.value = {};
      loadTableData();
    } else {
      const error = await response.json();
      throw new Error(error.error || "创建失败");
    }
  } catch (error) {
    ElMessage.error(error.message || "创建记录失败");
  } finally {
    creating.value = false;
  }
};

const handleImportFile = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      let data = [];
      let headers = [];

      if (file.name.endsWith(".json")) {
        const jsonData = JSON.parse(content);
        if (Array.isArray(jsonData)) {
          data = jsonData;
          headers = Object.keys(data[0] || {});
        }
      } else if (file.name.endsWith(".csv")) {
        const lines = content.split("\n").filter((line) => line.trim());
        if (lines.length > 0) {
          headers = lines[0].split(",").map((h) => h.trim());
          data = lines.slice(1).map((line) => {
            const values = line.split(",").map((v) => v.trim());
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] || "";
            });
            return obj;
          });
        }
      }

      importData.value = data;
      importHeaders.value = headers;
    } catch (error) {
      ElMessage.error("文件解析失败");
    }
  };

  if (file.name.endsWith(".csv")) {
    reader.readAsText(file);
  } else {
    reader.readAsText(file);
  }
};

const downloadTemplate = () => {
  if (!selectedTable.value) {
    ElMessage.warning("请先选择数据表");
    return;
  }

  const selectedModel = tables.value.find(
    (table) => table.name === selectedTable.value
  );
  if (!selectedModel?.fields) return;

  const template = {};
  selectedModel.fields.forEach((field) => {
    if (!["id", "created_at", "updated_at"].includes(field.name)) {
      template[field.name] = "";
    }
  });

  const csv = [
    Object.keys(template).join(","),
    Object.values(template).join(","),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${selectedTable.value}_template.csv`;
  a.click();
  URL.revokeObjectURL(url);

  ElMessage.success("模板下载成功");
};

const confirmImport = async () => {
  if (importData.value.length === 0) {
    ElMessage.warning("没有可导入的数据");
    return;
  }

  try {
    importing.value = true;

    for (const record of importData.value) {
      const response = await fetch(
        `${API_BASE_URL}/api/data/${selectedTable.value}`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(record),
        }
      );

      if (!response.ok) {
        throw new Error(`导入记录失败: ${JSON.stringify(record)}`);
      }
    }

    ElMessage.success(`成功导入 ${importData.value.length} 条记录`);
    showImportDialog.value = false;
    importData.value = [];
    importHeaders.value = [];
    loadTableData();
  } catch (error) {
    ElMessage.error(error.message || "导入失败");
  } finally {
    importing.value = false;
  }
};

// 监听器
watch(
  () => selectedTable.value,
  () => {
    createForm.value = {};
  }
);

// 初始化加载数据表
onMounted(() => {
  loadAvailableTables();

  // 添加窗口大小监听
  window.addEventListener("resize", () => {
    // 响应式处理可以在这里添加
  });
});
</script>

<style scoped>
.data-records {
  padding: 0;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  margin: -2rem -2rem 2rem -2rem;
  border-radius: 0 0 1rem 1rem;
}

.responsive-card {
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  overflow: hidden;
}

.stats-bar {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #3b82f6;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  text-align: center;
  min-width: 80px;
  flex-shrink: 0;
}

.table-container {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.responsive-table {
  border-radius: 0.75rem;
  overflow: hidden;
}

.cell-content {
  line-height: 1.6;
  padding: 0.25rem 0;
  word-break: break-word;
}

.table-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.pagination-container {
  padding: 1rem 0;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.create-form :deep(.el-form-item) {
  margin-bottom: 1.25rem;
}

.create-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #374151;
}

.import-dialog {
  padding: 1rem 0;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 0.75rem;
  padding: 3rem 2rem;
  text-align: center;
  background: #fafafa;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.preview-container {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.preview-container table {
  border-collapse: collapse;
  width: 100%;
}

.preview-container th,
.preview-container td {
  border: 1px solid #e2e8f0;
  padding: 0.5rem;
  text-align: left;
}

.preview-container th {
  background: #f1f5f9;
  font-weight: 600;
  color: #374151;
}

.responsive-dialog :deep(.el-dialog) {
  margin: 1rem;
  width: 90% !important;
  max-width: 600px;
}

.responsive-dialog :deep(.el-dialog__body) {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .stats-bar {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  }

  .table-container {
    background: #1f2937;
  }

  .preview-container {
    background: #374151;
    border-color: #4b5563;
  }

  .preview-container th {
    background: #374151;
    color: #f3f4f6;
  }
}

/* 响应式断点 */
@media (max-width: 640px) {
  .page-header {
    padding: 1.5rem 1rem;
    margin: -1.5rem -1rem 1.5rem -1rem;
  }

  .page-header .flex {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .stats-bar {
    flex-direction: column;
    gap: 1rem;
  }

  .stat-item {
    min-width: auto;
  }

  .table-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }

  .responsive-table :deep(.el-table__cell) {
    padding: 0.5rem 0.25rem;
  }

  .responsive-table :deep(.el-table__header) {
    padding: 0.75rem 0.25rem;
  }
}

@media (max-width: 768px) {
  .responsive-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 0.5rem;
  }

  .table-container {
    margin: 0 -1rem;
    border-radius: 0;
  }
}

@media (max-width: 1024px) {
  .table-container {
    overflow-x: auto;
  }

  .responsive-table {
    min-width: 800px;
  }
}

/* 加载状态优化 */
:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
}

:deep(.el-loading-spinner .path) {
  stroke: #3b82f6;
  stroke-width: 3;
}

/* 表格行悬停效果 */
:deep(.el-table__row) {
  transition: background-color 0.2s ease;
}

:deep(.el-table__row:hover) {
  background-color: #f0f9ff;
}

/* 按钮悬停效果 */
:deep(.el-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

:deep(.el-button:active) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 动画效果 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.table-container {
  animation: slideIn 0.3s ease-out;
}

/* 统计数字动画 */
.stat-item .text-2xl {
  animation: countUp 0.6s ease-out;
}

@keyframes countUp {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
