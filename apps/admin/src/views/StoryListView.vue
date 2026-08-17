<template>
  <div>
    <!-- ========== 列表 ========== -->
    <a-card>
      <div class="toolbar">
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
        <span class="toolbar-tip">待审核故事默认置顶显示</span>
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
          <template v-if="column.key === 'category'">
            <a-tag color="blue">{{ STORY_CATEGORY_LABELS[record.category as keyof typeof STORY_CATEGORY_LABELS] || record.category }}</a-tag>
          </template>
          <template v-else-if="column.key === 'lossAmount'">
            {{ formatMoney(record.lossAmount) }}
          </template>
          <template v-else-if="column.key === 'title'">
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
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="openDetail(record)">详情</a-button>
            <a-button
              v-if="auth.isReviewer && record.status === 'pending'"
              type="link"
              size="small"
              @click="onApprove(record)"
            >
              通过
            </a-button>
            <a-button
              v-if="auth.isReviewer && record.status === 'pending'"
              type="link"
              size="small"
              danger
              @click="openReject(record)"
            >
              驳回
            </a-button>
            <a-popconfirm
              v-if="auth.isReviewer"
              title="确定删除该故事吗？"
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

    <!-- ========== 详情弹窗 ========== -->
    <a-modal
      v-model:open="detailOpen"
      :title="detail ? `故事详情 #${detail.id}` : '故事详情'"
      :footer="null"
      width="720px"
    >
      <a-spin :spinning="detailLoading">
        <template v-if="detail">
          <a-descriptions :column="3" size="small" class="detail-desc">
            <a-descriptions-item label="匿名昵称">{{ detail.userNickname }}</a-descriptions-item>
            <a-descriptions-item label="分类">
              {{ STORY_CATEGORY_LABELS[detail.category] || detail.category }}
            </a-descriptions-item>
            <a-descriptions-item label="损失金额">{{ formatMoney(detail.lossAmount) }}</a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag :color="STORY_STATUS_COLORS[detail.status]">
                {{ STORY_STATUS_LABELS[detail.status] }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="抱抱数">{{ detail.hugCount }}</a-descriptions-item>
            <a-descriptions-item label="发布时间">{{ formatDateTime(detail.createdAt) }}</a-descriptions-item>
          </a-descriptions>

          <div class="block-title">损失类型</div>
          <div class="loss-tags">
            <a-tag v-for="t in detail.lossTypes" :key="t" color="orange">
              {{ LOSS_TYPE_LABELS[t as keyof typeof LOSS_TYPE_LABELS] || t }}
            </a-tag>
            <span v-if="!detail.lossTypes || !detail.lossTypes.length" class="empty-text">无</span>
          </div>

          <div class="block-title">标题</div>
          <p class="para">{{ detail.title }}</p>

          <div class="block-title">全文</div>
          <pre class="content-block">{{ detail.content }}</pre>

          <div class="block-title">教训</div>
          <p class="para">{{ detail.lesson || '无' }}</p>

          <div class="block-title">图片（已自动打码，请复核隐私信息）</div>
          <div v-if="detail.images && detail.images.length" class="images">
            <a-image
              v-for="(img, index) in detail.images"
              :key="index"
              :src="img"
              :width="120"
              :height="90"
              style="object-fit: cover; border-radius: 6px"
            />
          </div>
          <div v-else class="empty-text">无图片</div>

          <a-alert
            v-if="detail.status === 'rejected' && detail.rejectReason"
            type="warning"
            show-icon
            :message="`驳回原因：${detail.rejectReason}`"
            class="reject-alert"
          />

          <!-- 评论列表 -->
          <div class="block-title">评论（{{ detail.comments.length }}）</div>
          <div v-if="detail.comments.length" class="comments">
            <div v-for="c in detail.comments" :key="c.id" class="comment-row">
              <div class="comment-main">
                <span class="comment-nick">{{ c.userNickname }}</span>
                <span class="comment-time">{{ formatDateTime(c.createdAt) }}</span>
                <a-popconfirm
                  v-if="auth.isReviewer"
                  title="确定删除该评论吗？"
                  ok-text="删除"
                  cancel-text="取消"
                  @confirm="onDeleteComment(c)"
                >
                  <a-button type="link" size="small" danger>删除</a-button>
                </a-popconfirm>
              </div>
              <div class="comment-content">{{ c.content }}</div>
            </div>
          </div>
          <div v-else class="empty-text">暂无评论</div>

          <!-- 详情内操作 -->
          <div v-if="auth.isReviewer" class="detail-actions">
            <a-button
              v-if="detail.status === 'pending'"
              type="primary"
              :loading="actionLoading"
              @click="onApprove(detail)"
            >
              审核通过
            </a-button>
            <a-button
              v-if="detail.status === 'pending'"
              danger
              :loading="actionLoading"
              @click="openReject(detail)"
            >
              驳回
            </a-button>
            <a-popconfirm
              title="确定删除该故事吗？"
              ok-text="删除"
              cancel-text="取消"
              @confirm="onDelete(detail)"
            >
              <a-button danger :loading="actionLoading">删除故事</a-button>
            </a-popconfirm>
          </div>
        </template>
      </a-spin>
    </a-modal>

    <!-- ========== 驳回弹窗 ========== -->
    <a-modal
      v-model:open="rejectOpen"
      title="驳回故事"
      ok-text="确认驳回"
      cancel-text="取消"
      :confirm-loading="rejecting"
      @ok="submitReject"
    >
      <p class="reject-tip">驳回后作者将收到通知，可修改后重新提交。请填写驳回原因：</p>
      <a-textarea
        v-model:value="rejectReason"
        :rows="4"
        placeholder="例如：图片未完全打码，请打码手机号后再提交"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { ReloadOutlined } from '@ant-design/icons-vue';
import {
  LOSS_TYPE_LABELS,
  STORY_CATEGORY_LABELS,
  type StoryComment,
  type StoryStatus,
} from '@jiucaibox/shared';
import {
  approveStory,
  deleteComment,
  deleteStory,
  fetchStoryDetail,
  fetchStories,
  rejectStory,
  type AdminStoryDetail,
  type AdminStoryRow,
  type AdminCommentRow,
} from '@/api';
import { STORY_STATUS_COLORS, STORY_STATUS_LABELS } from '@/constants';
import { useAuthStore } from '@/stores/auth';
import { formatDateTime, formatMoney } from '@/utils/format';

const auth = useAuthStore();

// ==================== 列表 ====================
const list = ref<AdminStoryRow[]>([]);
const total = ref(0);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);
const status = ref('all');

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '待审核', value: 'pending' },
  { label: '已发布', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
];

const STATUS_PRIORITY: Record<StoryStatus, number> = { pending: 0, approved: 1, rejected: 2 };

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
    const res = await fetchStories({
      page: page.value,
      pageSize: pageSize.value,
      status: status.value === 'all' ? undefined : status.value,
    });
    // 全部状态下：待审核置顶（同状态内保持时间倒序，稳定排序）
    list.value =
      status.value === 'all'
        ? [...res.list].sort(
            (a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status],
          )
        : res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}
onMounted(loadList);

function onFilterChange() {
  page.value = 1;
  loadList();
}

function onReset() {
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
  { title: 'ID', dataIndex: 'id', width: 70 },
  { title: '匿名昵称', dataIndex: 'userNickname', width: 120 },
  { title: '分类', key: 'category', width: 100 },
  { title: '损失金额', key: 'lossAmount', width: 100 },
  { title: '标题', key: 'title', ellipsis: true },
  { title: '状态', key: 'status', width: 90 },
  { title: '抱抱', dataIndex: 'hugCount', width: 70 },
  { title: '评论', dataIndex: 'commentCount', width: 70 },
  { title: '时间', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' },
];

// ==================== 详情 ====================
const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<AdminStoryDetail | null>(null);

async function openDetail(row: AdminStoryRow) {
  detailOpen.value = true;
  detailLoading.value = true;
  try {
    detail.value = await fetchStoryDetail(row.id);
  } finally {
    detailLoading.value = false;
  }
}

// ==================== 审核操作 ====================
const actionLoading = ref(false);
const rejectOpen = ref(false);
const rejectReason = ref('');
const rejecting = ref(false);
const rejectTarget = ref<AdminStoryRow | null>(null);

async function onApprove(row: AdminStoryRow) {
  actionLoading.value = true;
  try {
    await approveStory(row.id);
    message.success('审核通过，故事已发布');
    await refreshAfterAction(row.id);
  } finally {
    actionLoading.value = false;
  }
}

function openReject(row: AdminStoryRow) {
  rejectTarget.value = row;
  rejectReason.value = row.rejectReason || '';
  rejectOpen.value = true;
}

async function submitReject() {
  if (!rejectTarget.value) return;
  if (!rejectReason.value.trim()) {
    message.error('请填写驳回原因');
    return;
  }
  rejecting.value = true;
  try {
    await rejectStory(rejectTarget.value.id, rejectReason.value.trim());
    message.success('已驳回该故事');
    rejectOpen.value = false;
    await refreshAfterAction(rejectTarget.value.id);
  } finally {
    rejecting.value = false;
  }
}

async function onDelete(row: AdminStoryRow) {
  try {
    await deleteStory(row.id);
    message.success('故事已删除');
    if (detail.value?.id === row.id) {
      detail.value = null;
      detailOpen.value = false;
    }
    await loadList();
  } catch {
    /* 错误提示由拦截器统一处理 */
  }
}

/** 详情打开时同步刷新详情与列表 */
async function refreshAfterAction(id: number) {
  if (detail.value?.id === id) {
    detail.value = await fetchStoryDetail(id);
  }
  await loadList();
}

// ==================== 评论 ====================
async function onDeleteComment(c: StoryComment) {
  try {
    await deleteComment(c.id);
    message.success('评论已删除');
    if (detail.value) {
      detail.value.comments = detail.value.comments.filter((x) => x.id !== c.id);
      detail.value.commentCount = Math.max(0, detail.value.commentCount - 1);
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
.toolbar-select {
  width: 160px;
}
.toolbar-tip {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
.ellipsis-cell {
  display: inline-block;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
.detail-desc {
  margin-bottom: 12px;
}
.block-title {
  font-weight: 600;
  margin: 14px 0 8px;
  color: rgba(0, 0, 0, 0.88);
}
.para {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: rgba(0, 0, 0, 0.75);
}
.content-block {
  margin: 0;
  padding: 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
  color: rgba(0, 0, 0, 0.85);
}
.loss-tags,
.images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.empty-text {
  color: rgba(0, 0, 0, 0.35);
  font-size: 13px;
}
.reject-alert {
  margin-top: 12px;
}
.comments {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 0 12px;
}
.comment-row {
  padding: 10px 0;
  border-bottom: 1px dashed #f0f0f0;
}
.comment-row:last-child {
  border-bottom: none;
}
.comment-main {
  display: flex;
  align-items: center;
  gap: 12px;
}
.comment-nick {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
}
.comment-time {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  flex: 1;
}
.comment-content {
  margin-top: 4px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.75);
  word-break: break-all;
}
.detail-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.reject-tip {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
}
</style>
