<template>
  <div>
    <!-- ========== 列表 ========== -->
    <a-card>
      <div class="toolbar">
        <a-input
          v-model:value="search"
          placeholder="搜索昵称 / 手机号"
          class="toolbar-search"
          allow-clear
          @press-enter="onSearch"
        >
          <template #prefix><SearchOutlined /></template>
        </a-input>
        <a-select
          v-model:value="status"
          class="toolbar-select"
          :options="statusOptions"
          @change="onFilterChange"
        />
        <a-button class="toolbar-btn" @click="onReset">
          <template #icon><ReloadOutlined /></template>
          重置
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
          <template v-if="column.key === 'user'">
            <div class="user-cell">
              <a-avatar :src="record.avatar || undefined" size="small">
                <template #icon><UserOutlined /></template>
              </a-avatar>
              <span class="nickname">{{ record.nickname }}</span>
            </div>
          </template>
          <template v-else-if="column.key === 'createdAt'">
            {{ formatDateTime(record.createdAt) }}
          </template>
          <template v-else-if="column.key === 'lastActiveAt'">
            {{ formatDateTime(record.lastActiveAt) }}
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="USER_STATUS_COLORS[record.status]">
              {{ USER_STATUS_LABELS[record.status] }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="openDetail(record)">详情</a-button>
            <a-popconfirm
              v-if="auth.isSuperAdmin"
              :title="record.status === 'banned' ? '确定解封该用户吗？' : '确定封禁该用户吗？封禁后无法登录'"
              ok-text="确定"
              cancel-text="取消"
              @confirm="onToggleBan(record)"
            >
              <a-button type="link" size="small" :danger="record.status === 'active'">
                {{ record.status === 'banned' ? '解封' : '封禁' }}
              </a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- ========== 详情弹窗 ========== -->
    <a-modal
      v-model:open="detailOpen"
      :title="userDetail ? `用户详情：${userDetail.nickname}` : '用户详情'"
      :footer="null"
      width="760px"
    >
      <a-spin :spinning="detailLoading">
        <template v-if="userDetail">
          <!-- 基本资料 -->
          <a-descriptions title="基本资料" :column="2" size="small" bordered class="detail-block">
            <a-descriptions-item label="用户 ID">{{ userDetail.id }}</a-descriptions-item>
            <a-descriptions-item label="昵称">{{ userDetail.nickname }}</a-descriptions-item>
            <a-descriptions-item label="手机号">{{ userDetail.phone || '-' }}</a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag :color="USER_STATUS_COLORS[userDetail.status]">
                {{ USER_STATUS_LABELS[userDetail.status] }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="强制匿名">{{ userDetail.isAnonymous ? '是' : '否' }}</a-descriptions-item>
            <a-descriptions-item label="个人简介">{{ userDetail.bio || '-' }}</a-descriptions-item>
            <a-descriptions-item label="注册时间">{{ formatDateTime(userDetail.createdAt) }}</a-descriptions-item>
            <a-descriptions-item label="最近活跃">{{ formatDateTime(userDetail.lastActiveAt) }}</a-descriptions-item>
          </a-descriptions>

          <!-- 学习记录 -->
          <div class="block-title">学习记录（{{ userDetail.learning.length }}）</div>
          <a-table
            :data-source="userDetail.learning"
            :columns="learningColumns"
            :pagination="false"
            size="small"
            row-key="videoId"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'updatedAt'">
                {{ formatDateTime(record.updatedAt) }}
              </template>
            </template>
          </a-table>

          <!-- 测评历史 -->
          <div class="block-title">测评历史（{{ userDetail.analysis.length }}）</div>
          <a-table
            :data-source="userDetail.analysis"
            :columns="analysisColumns"
            :pagination="false"
            size="small"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'sourceUrl'">
                <a-tooltip :title="record.sourceUrl">
                  <span class="ellipsis-cell">{{ record.sourceUrl || '-' }}</span>
                </a-tooltip>
              </template>
              <template v-else-if="column.key === 'riskLevel'">
                <a-tag v-if="record.riskLevel" :color="riskMeta(record.riskLevel).color">
                  {{ riskMeta(record.riskLevel).label }}
                </a-tag>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'status'">
                {{ ANALYSIS_STATUS_LABELS[record.status] || record.status }}
              </template>
              <template v-else-if="column.key === 'createdAt'">
                {{ formatDateTime(record.createdAt) }}
              </template>
            </template>
          </a-table>

          <!-- 故事历史 -->
          <div class="block-title">故事历史（{{ userDetail.stories.length }}）</div>
          <a-table
            :data-source="userDetail.stories"
            :columns="storyColumns"
            :pagination="false"
            size="small"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'title'">
                <a-tooltip :title="record.title">
                  <span class="ellipsis-cell">{{ record.title }}</span>
                </a-tooltip>
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="STORY_STATUS_COLORS[record.status]">
                  {{ STORY_STATUS_LABELS[record.status] }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'createdAt'">
                {{ formatDateTime(record.createdAt) }}
              </template>
            </template>
          </a-table>
        </template>
      </a-spin>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { SearchOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons-vue';
import { RISK_LEVEL_META, type RiskLevel } from '@jiucaibox/shared';
import { fetchUserDetail, fetchUsers, setUserBan, type AdminUserDetail, type AdminUserRow } from '@/api';
import { ANALYSIS_STATUS_LABELS, STORY_STATUS_COLORS, STORY_STATUS_LABELS, USER_STATUS_COLORS, USER_STATUS_LABELS } from '@/constants';
import { useAuthStore } from '@/stores/auth';
import { formatDateTime } from '@/utils/format';

const auth = useAuthStore();

// ==================== 列表 ====================
const list = ref<AdminUserRow[]>([]);
const total = ref(0);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);
const search = ref('');
const status = ref('all');

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '正常', value: 'active' },
  { label: '已封禁', value: 'banned' },
];

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
    const res = await fetchUsers({
      page: page.value,
      pageSize: pageSize.value,
      search: search.value.trim() || undefined,
      status: status.value === 'all' ? undefined : status.value,
    });
    list.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}
onMounted(loadList);

function onSearch() {
  page.value = 1;
  loadList();
}

function onFilterChange() {
  page.value = 1;
  loadList();
}

function onReset() {
  search.value = '';
  status.value = 'all';
  page.value = 1;
  loadList();
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  page.value = pag.current || 1;
  pageSize.value = pag.pageSize || 10;
  loadList();
}

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '用户', key: 'user', width: 160 },
  { title: '手机号', dataIndex: 'phone', width: 130 },
  { title: '注册时间', key: 'createdAt', width: 170 },
  { title: '最近活跃', key: 'lastActiveAt', width: 170 },
  { title: '课程数', dataIndex: 'courseCount', width: 80 },
  { title: '测评数', dataIndex: 'analysisCount', width: 80 },
  { title: '故事数', dataIndex: 'storyCount', width: 80 },
  { title: '状态', key: 'status', width: 90 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
];

// ==================== 详情 ====================
const detailOpen = ref(false);
const detailLoading = ref(false);
const userDetail = ref<AdminUserDetail | null>(null);

async function openDetail(row: AdminUserRow) {
  detailOpen.value = true;
  detailLoading.value = true;
  try {
    userDetail.value = await fetchUserDetail(row.id);
  } finally {
    detailLoading.value = false;
  }
}

const learningColumns = [
  { title: '视频标题', dataIndex: 'videoTitle', ellipsis: true },
  { title: '课程 ID', dataIndex: 'courseId', width: 90 },
  { title: '学习时间', key: 'updatedAt', width: 170 },
];

const analysisColumns = [
  { title: '报告 ID', dataIndex: 'id', width: 80 },
  { title: '来源链接', key: 'sourceUrl', ellipsis: true },
  { title: '风险等级', key: 'riskLevel', width: 100 },
  { title: '状态', key: 'status', width: 90 },
  { title: '时间', key: 'createdAt', width: 170 },
];

const storyColumns = [
  { title: '故事 ID', dataIndex: 'id', width: 80 },
  { title: '标题', key: 'title', ellipsis: true },
  { title: '状态', key: 'status', width: 90 },
  { title: '时间', key: 'createdAt', width: 170 },
];

function riskMeta(level: RiskLevel) {
  return RISK_LEVEL_META[level];
}

// ==================== 封禁 / 解封 ====================
async function onToggleBan(row: AdminUserRow) {
  const banned = row.status !== 'banned';
  try {
    await setUserBan(row.id, banned);
    message.success(banned ? '已封禁该用户' : '已解封该用户');
    if (userDetail.value?.id === row.id) {
      userDetail.value.status = banned ? 'banned' : 'active';
    }
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
.toolbar-search {
  width: 240px;
}
.toolbar-select {
  width: 150px;
}
.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.nickname {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.detail-block {
  margin-bottom: 8px;
}
.block-title {
  font-weight: 600;
  margin: 16px 0 8px;
  color: rgba(0, 0, 0, 0.88);
}
.ellipsis-cell {
  display: inline-block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
</style>
