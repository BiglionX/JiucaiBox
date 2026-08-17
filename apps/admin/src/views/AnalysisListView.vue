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
        <a-select
          v-model:value="riskLevel"
          class="toolbar-select"
          :options="riskOptions"
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
            <span>{{ record.userNickname }}</span>
            <div class="sub-text">ID: {{ record.userId ?? '-' }}</div>
          </template>
          <template v-else-if="column.key === 'sourceUrl'">
            <a-tooltip :title="record.sourceUrl">
              <span class="ellipsis-cell">{{ record.sourceUrl || '（无链接）' }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'riskLevel'">
            <a-tag v-if="record.riskLevel" :color="riskMeta(record.riskLevel).color">
              {{ riskMeta(record.riskLevel).label }}
            </a-tag>
            <a-tag v-else>未评级</a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="ANALYSIS_STATUS_COLORS[record.status]">
              {{ ANALYSIS_STATUS_LABELS[record.status] }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'reviewed'">
            <a-tag v-if="record.reviewed" color="success">已复核</a-tag>
            <a-tag v-else color="default">未复核</a-tag>
          </template>
          <template v-else-if="column.key === 'createdAt'">
            {{ formatDateTime(record.createdAt) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="openDetail(record)">详情</a-button>
            <a-button
              v-if="auth.isReviewer && !record.reviewed"
              type="link"
              size="small"
              @click="openDetail(record)"
            >
              复核
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- ========== 详情抽屉 ========== -->
    <a-drawer v-model:open="detailOpen" title="测评报告详情" :width="760">
      <a-spin :spinning="detailLoading">
        <template v-if="detail">
          <!-- 原始输入 -->
          <a-card size="small" title="原始输入" class="block">
            <div v-if="detail.sourceUrl" class="source-url">
              <LinkOutlined />
              <a :href="detail.sourceUrl" target="_blank" rel="noopener noreferrer">
                {{ detail.sourceUrl }}
              </a>
            </div>
            <pre class="input-text">{{ detail.inputText || '（无文本输入）' }}</pre>
          </a-card>

          <!-- 状态信息 -->
          <a-card size="small" class="block">
            <a-descriptions :column="3" size="small">
              <a-descriptions-item label="报告 ID">{{ detail.id }}</a-descriptions-item>
              <a-descriptions-item label="用户">{{ detail.userNickname }}</a-descriptions-item>
              <a-descriptions-item label="状态">
                <a-tag :color="ANALYSIS_STATUS_COLORS[detail.status]">
                  {{ ANALYSIS_STATUS_LABELS[detail.status] }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="风险等级">
                <a-tag v-if="detail.riskLevel" :color="riskMeta(detail.riskLevel).color">
                  {{ riskMeta(detail.riskLevel).label }}
                </a-tag>
                <span v-else>未评级</span>
              </a-descriptions-item>
              <a-descriptions-item label="是否复核">
                <a-tag v-if="detail.reviewed" color="success">已复核</a-tag>
                <a-tag v-else color="default">未复核</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="提交时间">
                {{ formatDateTime(detail.createdAt) }}
              </a-descriptions-item>
            </a-descriptions>
            <a-alert
              v-if="detail.status === 'failed'"
              type="error"
              show-icon
              :message="`AI 分析失败：${detail.failReason || '未知原因'}`"
              class="block"
            />
          </a-card>

          <!-- AI 分析结果 -->
          <a-card v-if="detail.aiResult" size="small" title="AI 分析结果" class="block">
            <div class="sub-title">风险点</div>
            <a-table
              :data-source="detail.aiResult.riskPoints"
              :columns="riskPointColumns"
              :pagination="false"
              size="small"
              row-key="type"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'count'">
                  <a-tag color="red">×{{ record.count }}</a-tag>
                </template>
                <template v-else-if="column.key === 'evidence'">
                  <a-tooltip :title="record.evidence">
                    <span class="ellipsis-cell">{{ record.evidence }}</span>
                  </a-tooltip>
                </template>
              </template>
            </a-table>

            <div class="sub-title">风险维度评分</div>
            <div v-for="dim in detail.aiResult.dimensions" :key="dim.name" class="dim-row">
              <span class="dim-name">{{ dim.name }}</span>
              <a-progress :percent="dim.score" size="small" style="flex: 1" />
            </div>

            <div class="sub-title">综合分析</div>
            <p class="para">{{ detail.aiResult.analysis || '无' }}</p>

            <div class="sub-title">建议</div>
            <p class="para">{{ detail.aiResult.recommendation || '无' }}</p>
          </a-card>

          <!-- 深度接洽反馈 -->
          <a-card v-if="detail.deepFeedback && detail.deepFeedback.length" size="small" title="深度接洽反馈" class="block">
            <div v-for="item in detail.deepFeedback" :key="item.step" class="deep-step">
              <div class="deep-question">
                {{ item.step }}. {{ item.question || (DEEP_STEPS[item.step - 1]?.question ?? '') }}
              </div>
              <a-tag :color="deepAnswerColor(item.answer)">
                {{ DEEP_ANSWER_LABELS[item.answer] || item.answer }}
              </a-tag>
            </div>
            <div v-if="detail.deepRiskLevel" class="deep-risk">
              综合风险值：
              <a-tag :color="riskMeta(detail.deepRiskLevel).color">
                {{ riskMeta(detail.deepRiskLevel).label }}
              </a-tag>
            </div>
          </a-card>

          <!-- 复核表单 -->
          <a-card v-if="auth.isReviewer" size="small" title="手动复核" class="block">
            <a-form layout="vertical">
              <a-form-item label="复核风险等级" required>
                <a-select
                  v-model:value="reviewForm.riskLevel"
                  :options="reviewLevelOptions"
                  placeholder="请选择复核后的风险等级"
                  style="width: 100%"
                />
              </a-form-item>
              <a-form-item label="复核备注">
                <a-textarea v-model:value="reviewForm.note" :rows="3" placeholder="填写复核意见（可选）" />
              </a-form-item>
              <a-button type="primary" :loading="reviewSaving" @click="submitReview">
                提交复核
              </a-button>
            </a-form>
            <div v-if="detail.reviewed && detail.reviewerNote" class="review-note">
              复核备注：{{ detail.reviewerNote }}
              <span v-if="detail.reviewedBy">（{{ detail.reviewedBy }}）</span>
            </div>
          </a-card>
        </template>
      </a-spin>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { ReloadOutlined, LinkOutlined } from '@ant-design/icons-vue';
import {
  DEEP_STEPS,
  RISK_LEVEL_META,
  type RiskLevel,
} from '@jiucaibox/shared';
import {
  fetchAnalysisDetail,
  fetchAnalysisList,
  reviewAnalysis,
  type AdminAnalysisDetail,
  type AdminAnalysisRow,
} from '@/api';
import { ANALYSIS_STATUS_COLORS, ANALYSIS_STATUS_LABELS, DEEP_ANSWER_LABELS } from '@/constants';
import { useAuthStore } from '@/stores/auth';
import { formatDateTime } from '@/utils/format';

const auth = useAuthStore();

// ==================== 列表 ====================
const list = ref<AdminAnalysisRow[]>([]);
const total = ref(0);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);
const status = ref('all');
const riskLevel = ref('all');

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '分析中', value: 'pending' },
  { label: '已完成', value: 'done' },
  { label: '失败', value: 'failed' },
  { label: '已复核', value: 'reviewed' },
];

const riskOptions = [
  { label: '全部风险等级', value: 'all' },
  { label: '高风险', value: 'high' },
  { label: '中风险', value: 'medium' },
  { label: '低风险', value: 'low' },
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
    const params: Record<string, string | number> = { page: page.value, pageSize: pageSize.value };
    if (status.value !== 'all') {
      if (status.value === 'reviewed') {
        // 后端暂不支持 reviewed 状态过滤：以「已完成 + reviewed 标记」请求，
        // 后端支持 reviewed 参数后可直接生效
        params.status = 'done';
        params.reviewed = 1;
      } else {
        params.status = status.value;
      }
    }
    if (riskLevel.value !== 'all') params.riskLevel = riskLevel.value;
    const res = await fetchAnalysisList(params);
    list.value = res.list;
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
  riskLevel.value = 'all';
  page.value = 1;
  loadList();
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  page.value = pag.current || 1;
  pageSize.value = pag.pageSize || 10;
  loadList();
}

function riskMeta(level: RiskLevel) {
  return RISK_LEVEL_META[level];
}

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '用户', key: 'user', width: 150 },
  { title: '来源链接', key: 'sourceUrl', ellipsis: true },
  { title: '风险等级', key: 'riskLevel', width: 100 },
  { title: '状态', key: 'status', width: 90 },
  { title: '是否复核', key: 'reviewed', width: 90 },
  { title: '提交时间', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 130, fixed: 'right' },
];

// ==================== 详情 ====================
const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<AdminAnalysisDetail | null>(null);

async function openDetail(row: AdminAnalysisRow) {
  detailOpen.value = true;
  detailLoading.value = true;
  try {
    detail.value = await fetchAnalysisDetail(row.id);
  } finally {
    detailLoading.value = false;
  }
}

const riskPointColumns = [
  { title: '风险点', dataIndex: 'type', width: 180 },
  { title: '命中次数', key: 'count', width: 100 },
  { title: '证据', key: 'evidence', ellipsis: true },
];

function deepAnswerColor(answer: string): string {
  if (answer === 'yes') return 'red';
  if (answer === 'no') return 'green';
  return 'default';
}

// ==================== 复核 ====================
const reviewForm = reactive<{ riskLevel?: RiskLevel; note: string }>({ riskLevel: undefined, note: '' });
const reviewSaving = ref(false);

const reviewLevelOptions = [
  { label: '高风险', value: 'high' },
  { label: '中风险', value: 'medium' },
  { label: '低风险', value: 'low' },
];

async function submitReview() {
  if (!detail.value) return;
  if (!reviewForm.riskLevel) {
    message.error('请选择复核后的风险等级');
    return;
  }
  reviewSaving.value = true;
  try {
    await reviewAnalysis(detail.value.id, { riskLevel: reviewForm.riskLevel, note: reviewForm.note });
    message.success('复核已提交');
    // 更新本地详情
    detail.value.reviewed = true;
    detail.value.riskLevel = reviewForm.riskLevel;
    detail.value.reviewerNote = reviewForm.note;
    reviewForm.note = '';
    await loadList();
  } finally {
    reviewSaving.value = false;
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
.sub-text {
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
.block {
  margin-bottom: 16px;
}
.source-url {
  margin-bottom: 8px;
  font-size: 13px;
}
.input-text {
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
.sub-title {
  font-weight: 600;
  margin: 12px 0 8px;
  color: rgba(0, 0, 0, 0.88);
}
.dim-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.dim-name {
  width: 110px;
  font-size: 13px;
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.65);
}
.para {
  margin: 0 0 8px;
  font-size: 13px;
  line-height: 1.7;
  color: rgba(0, 0, 0, 0.75);
  white-space: pre-wrap;
}
.deep-step {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px dashed #f0f0f0;
}
.deep-step:last-child {
  border-bottom: none;
}
.deep-question {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.75);
}
.deep-risk {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 500;
}
.review-note {
  margin-top: 12px;
  padding: 8px 12px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.75);
}
</style>
