<template>
  <div>
    <!-- ========== 列表 ========== -->
    <a-card>
      <div class="toolbar">
        <a-button v-if="auth.isContentOps" type="primary" @click="openModal()">
          <template #icon><PlusOutlined /></template>
          新建电台期数
        </a-button>
      </div>

      <a-table
        :data-source="list"
        :columns="columns"
        :loading="loading"
        row-key="id"
        :pagination="pagination"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <a-tooltip :title="record.title">
              <span class="ellipsis-cell">{{ record.title }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'sourceLabel'">
            <a-tag color="geekblue">{{ record.sourceLabel }}</a-tag>
          </template>
          <template v-else-if="column.key === 'tricks'">
            <span>{{ record.tricks?.length ?? 0 }} 条</span>
          </template>
          <template v-else-if="column.key === 'relatedCourse'">
            {{ record.relatedCourseTitle || '-' }}
          </template>
          <template v-else-if="column.key === 'createdAt'">
            {{ formatDateTime(record.createdAt) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button v-if="auth.isContentOps" type="link" size="small" @click="openModal(record)">
              编辑
            </a-button>
            <a-popconfirm
              v-if="auth.isContentOps"
              title="确定删除该期电台吗？"
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

    <!-- ========== 新建 / 编辑弹窗 ========== -->
    <a-modal
      v-model:open="modalOpen"
      :title="form.id ? '编辑电台' : '新建电台'"
      :confirm-loading="saving"
      ok-text="保存"
      cancel-text="取消"
      width="680px"
      @ok="save"
    >
      <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
        <a-form-item label="标题" name="title">
          <a-input v-model:value="form.title" placeholder="请输入电台标题" />
        </a-form-item>
        <a-form-item label="来源链接（官方通报 / 权威媒体）" name="sourceUrl">
          <a-input v-model:value="form.sourceUrl" placeholder="https://..." />
        </a-form-item>
        <a-form-item label="来源标签" name="sourceLabel">
          <a-input v-model:value="form.sourceLabel" placeholder="例如：央视新闻 / 市场监管总局通报" />
        </a-form-item>
        <a-form-item label="封面图链接" name="coverUrl">
          <a-input v-model:value="form.coverUrl" placeholder="https://..." />
        </a-form-item>
        <a-form-item label="事件速览" name="summary">
          <a-textarea v-model:value="form.summary" :rows="3" placeholder="本期事件摘要" />
        </a-form-item>

        <a-form-item label="套路拆解" required>
          <div v-for="(trick, index) in form.tricks" :key="index" class="trick-box">
            <div class="trick-row">
              <a-input v-model:value="trick.name" :placeholder="`套路名称 ${index + 1}`" />
              <a-button type="text" danger @click="removeTrick(index)">
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </div>
            <a-textarea
              v-model:value="trick.description"
              :rows="2"
              :placeholder="`套路 ${index + 1} 描述`"
            />
          </div>
          <a-button type="dashed" block @click="addTrick">
            <template #icon><PlusOutlined /></template>
            添加套路
          </a-button>
        </a-form-item>

        <a-form-item label="防割提醒" name="warning">
          <a-textarea v-model:value="form.warning" :rows="2" placeholder="给用户的提醒（可选）" />
        </a-form-item>
        <a-form-item label="关联课程（可选）" name="relatedCourseId">
          <a-select
            v-model:value="form.relatedCourseId"
            :options="courseOptions"
            placeholder="选择关联课程"
            allow-clear
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message, type FormInstance } from 'ant-design-vue';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import type { RadioEpisode, RadioTrick } from '@jiucaibox/shared';
import { createRadio, deleteRadio, fetchCourses, fetchRadioList, updateRadio } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { formatDateTime } from '@/utils/format';

const auth = useAuthStore();

// ==================== 列表 ====================
const list = ref<RadioEpisode[]>([]);
const total = ref(0);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);

const pagination = computed(() => ({
  current: page.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  showTotal: (t: number) => `共 ${t} 条`,
}));

async function loadList() {
  loading.value = true;
  try {
    const res = await fetchRadioList({ page: page.value, pageSize: pageSize.value });
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}
onMounted(loadList);

function onTableChange(pag: { current?: number; pageSize?: number }) {
  page.value = pag.current || 1;
  pageSize.value = pag.pageSize || 10;
  loadList();
}

const columns = [
  { title: '期数', dataIndex: 'id', width: 70 },
  { title: '标题', key: 'title', ellipsis: true },
  { title: '来源标签', key: 'sourceLabel', width: 130 },
  { title: '套路数', key: 'tricks', width: 90 },
  { title: '关联课程', key: 'relatedCourse', width: 180 },
  { title: '发布时间', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' },
];

// ==================== 课程选项（关联课程） ====================
const courseOptions = ref<{ label: string; value: number }[]>([]);

async function loadCourses() {
  try {
    const res = await fetchCourses({ page: 1, pageSize: 50 });
    courseOptions.value = res.list.map((c) => ({ label: c.title, value: c.id }));
  } catch {
    /* 关联课程加载失败不阻塞页面 */
  }
}
onMounted(loadCourses);

// ==================== 编辑弹窗 ====================
const modalOpen = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();

const form = reactive<{
  id: number;
  title: string;
  sourceUrl: string;
  sourceLabel: string;
  coverUrl: string;
  summary: string;
  tricks: RadioTrick[];
  warning: string;
  relatedCourseId: number | null;
}>({
  id: 0,
  title: '',
  sourceUrl: '',
  sourceLabel: '官方通报',
  coverUrl: '',
  summary: '',
  tricks: [{ name: '', description: '' }],
  warning: '',
  relatedCourseId: null,
});

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
};

function openModal(episode?: RadioEpisode) {
  if (episode) {
    Object.assign(form, {
      id: episode.id,
      title: episode.title,
      sourceUrl: episode.sourceUrl || '',
      sourceLabel: episode.sourceLabel || '官方通报',
      coverUrl: episode.coverUrl || '',
      summary: episode.summary || '',
      tricks: (episode.tricks || []).map((t) => ({ ...t })),
      warning: episode.warning || '',
      relatedCourseId: episode.relatedCourseId ?? null,
    });
  } else {
    Object.assign(form, {
      id: 0,
      title: '',
      sourceUrl: '',
      sourceLabel: '官方通报',
      coverUrl: '',
      summary: '',
      tricks: [{ name: '', description: '' }],
      warning: '',
      relatedCourseId: null,
    });
  }
  if (!form.tricks.length) form.tricks = [{ name: '', description: '' }];
  modalOpen.value = true;
}

function addTrick() {
  form.tricks.push({ name: '', description: '' });
}

function removeTrick(index: number) {
  form.tricks.splice(index, 1);
  if (!form.tricks.length) form.tricks = [{ name: '', description: '' }];
}

async function save() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  if (!form.title.trim()) {
    message.error('请输入标题');
    return;
  }
  const tricks = form.tricks
    .filter((t) => t.name.trim() || t.description.trim())
    .map((t) => ({ name: t.name.trim(), description: t.description.trim() }));
  saving.value = true;
  try {
    const payload = {
      title: form.title.trim(),
      sourceUrl: form.sourceUrl.trim(),
      sourceLabel: form.sourceLabel.trim() || '官方通报',
      coverUrl: form.coverUrl.trim(),
      summary: form.summary.trim(),
      tricks,
      warning: form.warning.trim(),
      relatedCourseId: form.relatedCourseId,
    };
    if (form.id) {
      await updateRadio(form.id, payload);
      message.success('电台期数已更新');
    } else {
      await createRadio(payload);
      message.success('电台期数已发布');
    }
    modalOpen.value = false;
    await loadList();
  } finally {
    saving.value = false;
  }
}

async function onDelete(episode: RadioEpisode) {
  try {
    await deleteRadio(episode.id);
    message.success('电台期数已删除');
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
.ellipsis-cell {
  display: inline-block;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
.trick-box {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 8px;
  background: #fafafa;
}
.trick-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
</style>
