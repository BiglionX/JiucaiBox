<template>
  <div>
    <a-card>
      <div class="toolbar">
        <a-button type="primary" @click="openModal()">
          <template #icon><PlusOutlined /></template>
          新增词条
        </a-button>
        <span class="toolbar-tip">风险词用于 AI 测评提示词调用，支持按分类维护</span>
      </div>

      <a-table
        :data-source="pageData"
        :columns="columns"
        :loading="loading"
        row-key="id"
        :pagination="pagination"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'word'">
            <span class="word-cell">{{ record.word }}</span>
          </template>
          <template v-else-if="column.key === 'category'">
            <a-tag :color="categoryColor(record.category)">
              {{ DIMENSION_LABELS[record.category] || record.category }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'weight'">
            <a-tag v-if="record.weight >= 3" color="red">{{ record.weight }}</a-tag>
            <a-tag v-else-if="record.weight >= 2" color="orange">{{ record.weight }}</a-tag>
            <a-tag v-else color="default">{{ record.weight }}</a-tag>
          </template>
          <template v-else-if="column.key === 'active'">
            <a-switch
              v-model:checked="record.active"
              :loading="switchLoadingId === record.id"
              :disabled="!auth.isContentOps"
              @change="(checked: any) => onToggleActive(record, !!checked)"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="openModal(record)">编辑</a-button>
            <a-popconfirm
              title="确定删除该词条吗？"
              ok-text="删除"
              cancel-text="取消"
              @confirm="onDelete(record)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- ========== 新增 / 编辑弹窗 ========== -->
    <a-modal
      v-model:open="modalOpen"
      :title="form.id ? '编辑词条' : '新增词条'"
      :confirm-loading="saving"
      ok-text="保存"
      cancel-text="取消"
      width="480px"
      @ok="save"
    >
      <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
        <a-form-item label="风险词" name="word">
          <a-input
            v-model:value="form.word"
            placeholder="例如：月入过万、躺赚、最后3天、保本保息"
            :disabled="!!form.id"
          />
          <div v-if="form.id" class="form-tip">词条与分类组合唯一，如需修改请删除后重建</div>
        </a-form-item>
        <a-form-item label="分类" name="category">
          <a-select v-model:value="form.category" :options="categoryOptions" style="width: 100%" />
        </a-form-item>
        <a-form-item label="权重（1-5，越高风险越强）" name="weight">
          <a-input-number v-model:value="form.weight" :min="1" :max="5" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message, type FormInstance } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { DIMENSION_LABELS, type RiskWord } from '@jiucaibox/shared';
import { createLexiconWord, deleteLexiconWord, fetchLexicon, updateLexiconWord } from '@/api';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();

// ==================== 列表 ====================
const list = ref<RiskWord[]>([]);
const loading = ref(false);
const switchLoadingId = ref<number | null>(null);

const categoryOptions = Object.keys(DIMENSION_LABELS).map((key) => ({
  label: DIMENSION_LABELS[key],
  value: key,
}));

const CATEGORY_COLORS: Record<string, string> = {
  income: 'volcano',
  urgency: 'orange',
  fakeCase: 'purple',
  opaque: 'geekblue',
  compliance: 'cyan',
};

function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] || 'default';
}

// 词库接口为全量返回，分页在前端完成
const page = ref(1);
const pageSize = ref(10);

const pagination = computed(() => ({
  current: page.value,
  pageSize: pageSize.value,
  total: list.value.length,
  showSizeChanger: true,
  showTotal: (t: number) => `共 ${t} 条`,
}));

const pageData = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return list.value.slice(start, start + pageSize.value);
});

async function loadList() {
  loading.value = true;
  try {
    list.value = await fetchLexicon();
    if (page.value > Math.ceil(list.value.length / pageSize.value)) {
      page.value = 1;
    }
  } finally {
    loading.value = false;
  }
}
onMounted(loadList);

function onTableChange(pag: { current?: number; pageSize?: number }) {
  page.value = pag.current || 1;
  pageSize.value = pag.pageSize || 10;
}

const columns = [
  { title: 'ID', dataIndex: 'id', width: 70 },
  { title: '风险词', key: 'word' },
  { title: '分类', key: 'category', width: 130 },
  { title: '权重', key: 'weight', width: 90 },
  { title: '启用', key: 'active', width: 90 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' },
];

// ==================== 编辑弹窗 ====================
const modalOpen = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();

const form = reactive<{ id: number; word: string; category: string; weight: number }>({
  id: 0,
  word: '',
  category: 'income',
  weight: 1,
});

const rules = {
  word: [{ required: true, message: '请输入风险词', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
};

function openModal(word?: RiskWord) {
  if (word) {
    Object.assign(form, { id: word.id, word: word.word, category: word.category, weight: word.weight });
  } else {
    Object.assign(form, { id: 0, word: '', category: 'income', weight: 1 });
  }
  modalOpen.value = true;
}

async function save() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  saving.value = true;
  try {
    if (form.id) {
      await updateLexiconWord(form.id, { category: form.category, weight: form.weight });
      message.success('词条已更新');
    } else {
      await createLexiconWord({ word: form.word.trim(), category: form.category, weight: form.weight });
      message.success('词条已添加');
    }
    modalOpen.value = false;
    await loadList();
  } finally {
    saving.value = false;
  }
}

async function onToggleActive(word: RiskWord, checked: boolean) {
  switchLoadingId.value = word.id;
  try {
    await updateLexiconWord(word.id, { active: checked });
    message.success(checked ? '已启用' : '已停用');
  } catch {
    // 失败时回滚开关状态
    word.active = !checked;
  } finally {
    switchLoadingId.value = null;
  }
}

async function onDelete(word: RiskWord) {
  try {
    await deleteLexiconWord(word.id);
    message.success('词条已删除');
    await loadList();
  } catch {
    /* 错误提示由拦截器统一处理 */
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.toolbar-tip {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
.word-cell {
  font-weight: 500;
}
.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
