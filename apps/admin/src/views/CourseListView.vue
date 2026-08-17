<template>
  <div>
    <!-- ========== 列表 ========== -->
    <a-card>
      <div class="toolbar">
        <a-input
          v-model:value="search"
          placeholder="搜索课程标题"
          class="toolbar-search"
          allow-clear
          @press-enter="onSearch"
        >
          <template #prefix><SearchOutlined /></template>
        </a-input>
        <a-select
          v-model:value="category"
          class="toolbar-select"
          :options="categoryOptions"
          @change="onSearch"
        />
        <a-button class="toolbar-btn" @click="onReset">
          <template #icon><ReloadOutlined /></template>
          重置
        </a-button>
        <a-button v-if="auth.isContentOps" type="primary" @click="openCourseModal()">
          <template #icon><PlusOutlined /></template>
          新建课程
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
          <template v-if="column.key === 'cover'">
            <a-image
              v-if="record.coverUrl"
              :src="record.coverUrl"
              :width="48"
              :height="32"
              style="object-fit: cover; border-radius: 4px"
            />
            <span v-else class="no-cover">无封面</span>
          </template>
          <template v-else-if="column.key === 'title'">
            <span class="course-title">{{ record.title }}</span>
          </template>
          <template v-else-if="column.key === 'category'">
            <a-tag color="blue">{{ COURSE_CATEGORY_LABELS[record.category as keyof typeof COURSE_CATEGORY_LABELS] }}</a-tag>
          </template>
          <template v-else-if="column.key === 'createdAt'">
            {{ formatDateTime(record.createdAt) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="openDrawer(record)">管理内容</a-button>
            <a-button v-if="auth.isContentOps" type="link" size="small" @click="openCourseModal(record)">
              编辑
            </a-button>
            <a-popconfirm
              v-if="auth.isContentOps"
              title="确定删除该课程吗？其下视频与测试题将一并删除"
              ok-text="删除"
              cancel-text="取消"
              @confirm="onDeleteCourse(record)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- ========== 课程编辑弹窗 ========== -->
    <a-modal
      v-model:open="courseModalOpen"
      :title="courseForm.id ? '编辑课程' : '新建课程'"
      :confirm-loading="courseSaving"
      ok-text="保存"
      cancel-text="取消"
      width="560px"
      @ok="saveCourse"
    >
      <a-form ref="courseFormRef" :model="courseForm" :rules="courseRules" layout="vertical">
        <a-form-item label="课程标题" name="title">
          <a-input v-model:value="courseForm.title" placeholder="请输入课程标题" />
        </a-form-item>
        <a-form-item label="课程简介" name="description">
          <a-textarea v-model:value="courseForm.description" :rows="3" placeholder="请输入课程简介" />
        </a-form-item>
        <a-form-item label="封面图链接" name="coverUrl">
          <a-input v-model:value="courseForm.coverUrl" placeholder="https://..." />
        </a-form-item>
        <a-form-item label="模块分类" name="category">
          <a-select v-model:value="courseForm.category" :options="categoryOptions" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="学习人数（可手动设置初始值）" name="learnerCount">
              <a-input-number v-model:value="courseForm.learnerCount" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="排序权重" name="sort">
              <a-input-number v-model:value="courseForm.sort" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- ========== 管理内容抽屉 ========== -->
    <a-drawer
      v-model:open="drawerOpen"
      :title="`管理内容：${detail?.title || ''}`"
      :width="900"
      destroy-on-close
    >
      <a-spin :spinning="drawerLoading">
        <a-tabs v-model:activeKey="drawerTab">
          <!-- 视频列表 -->
          <a-tab-pane key="videos" tab="视频列表">
            <div class="tab-toolbar">
              <a-button v-if="auth.isContentOps" type="primary" size="small" @click="openVideoModal()">
                <template #icon><PlusOutlined /></template>
                新增视频
              </a-button>
              <span class="tab-tip">视频链接仅允许抖音 / 视频号 / B 站 / YouTube 等白名单域名</span>
            </div>
            <a-table
              :data-source="detail?.videos ?? []"
              :columns="videoColumns"
              :pagination="false"
              row-key="id"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'cover'">
                  <a-image
                    v-if="record.coverUrl"
                    :src="record.coverUrl"
                    :width="60"
                    :height="40"
                    style="object-fit: cover; border-radius: 4px"
                  />
                  <span v-else class="no-cover">无封面</span>
                </template>
                <template v-else-if="column.key === 'videoUrl'">
                  <a-tooltip :title="record.videoUrl">
                    <a class="url-cell" :href="record.videoUrl" target="_blank" rel="noopener noreferrer">
                      <LinkOutlined /> {{ record.videoUrl }}
                    </a>
                  </a-tooltip>
                </template>
                <template v-else-if="column.key === 'popup'">
                  <a-tag v-if="record.popup" color="orange">已配置</a-tag>
                  <a-tag v-else>未配置</a-tag>
                </template>
                <template v-else-if="column.key === 'action'">
                  <a-button v-if="auth.isContentOps" type="link" size="small" @click="openVideoModal(record)">
                    编辑
                  </a-button>
                  <a-popconfirm
                    v-if="auth.isContentOps"
                    title="确定删除该视频吗？"
                    ok-text="删除"
                    cancel-text="取消"
                    @confirm="onDeleteVideo(record)"
                  >
                    <a-button type="link" size="small" danger>删除</a-button>
                  </a-popconfirm>
                </template>
              </template>
            </a-table>
          </a-tab-pane>

          <!-- 测试题 -->
          <a-tab-pane key="quiz" tab="测试题">
            <div class="tab-toolbar">
              <a-button v-if="auth.isContentOps" type="primary" size="small" @click="openQuizModal()">
                <template #icon><PlusOutlined /></template>
                新增测试题
              </a-button>
            </div>
            <a-table
              :data-source="detail?.quizQuestions ?? []"
              :columns="quizColumns"
              :pagination="false"
              row-key="id"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'question'">
                  <a-tooltip :title="record.question">
                    <span class="ellipsis-cell">{{ record.question }}</span>
                  </a-tooltip>
                </template>
                <template v-else-if="column.key === 'options'">
                  <a-tooltip :title="record.options.join(' / ')">
                    <span class="ellipsis-cell">{{ record.options.join(' / ') }}</span>
                  </a-tooltip>
                </template>
                <template v-else-if="column.key === 'correctOption'">
                  <a-tag color="green">选项{{ record.correctOption + 1 }}</a-tag>
                </template>
                <template v-else-if="column.key === 'action'">
                  <a-button v-if="auth.isContentOps" type="link" size="small" @click="openQuizModal(record)">
                    编辑
                  </a-button>
                  <a-popconfirm
                    v-if="auth.isContentOps"
                    title="确定删除该测试题吗？"
                    ok-text="删除"
                    cancel-text="取消"
                    @confirm="onDeleteQuiz(record)"
                  >
                    <a-button type="link" size="small" danger>删除</a-button>
                  </a-popconfirm>
                </template>
              </template>
            </a-table>
          </a-tab-pane>
        </a-tabs>
      </a-spin>
    </a-drawer>

    <!-- ========== 视频编辑弹窗 ========== -->
    <a-modal
      v-model:open="videoModalOpen"
      :title="videoForm.id ? '编辑视频' : '新增视频'"
      :confirm-loading="videoSaving"
      ok-text="保存"
      cancel-text="取消"
      width="640px"
      @ok="saveVideo"
    >
      <a-form ref="videoFormRef" :model="videoForm" :rules="videoRules" layout="vertical">
        <a-form-item label="视频标题" name="title">
          <a-input v-model:value="videoForm.title" placeholder="请输入视频标题" />
        </a-form-item>
        <a-form-item label="封面图链接" name="coverUrl">
          <a-input v-model:value="videoForm.coverUrl" placeholder="https://..." />
        </a-form-item>
        <a-form-item label="视频链接" name="videoUrl">
          <a-input v-model:value="videoForm.videoUrl" placeholder="https://v.douyin.com/..." />
          <div class="form-tip">
            仅允许白名单域名：{{ VIDEO_URL_WHITELIST.join('、') }}
          </div>
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="时长（秒）" name="duration">
              <a-input-number v-model:value="videoForm.duration" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="排序" name="order">
              <a-input-number v-model:value="videoForm.order" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="视频描述" name="description">
          <a-textarea v-model:value="videoForm.description" :rows="2" placeholder="请输入视频描述" />
        </a-form-item>
        <a-form-item label="真相弹窗内容（可选，观看后弹出）" name="popupContent">
          <a-textarea v-model:value="videoForm.popupContent" :rows="3" placeholder="例如：本视频提到的“稳赚”为典型话术，请勿轻信…" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- ========== 测试题编辑弹窗 ========== -->
    <a-modal
      v-model:open="quizModalOpen"
      :title="quizForm.id ? '编辑测试题' : '新增测试题'"
      :confirm-loading="quizSaving"
      ok-text="保存"
      cancel-text="取消"
      width="640px"
      @ok="saveQuiz"
    >
      <a-form ref="quizFormRef" :model="quizForm" :rules="quizRules" layout="vertical">
        <a-form-item label="章节" name="chapter">
          <a-input-number v-model:value="quizForm.chapter" :min="1" style="width: 100%" />
        </a-form-item>
        <a-form-item label="题目" name="question">
          <a-textarea v-model:value="quizForm.question" :rows="2" placeholder="请输入题目内容" />
        </a-form-item>
        <a-form-item label="选项" required>
          <div v-for="(opt, index) in quizForm.options" :key="index" class="option-row">
            <span class="option-index">选项{{ index + 1 }}</span>
            <a-input v-model:value="quizForm.options[index]" :placeholder="`请输入选项 ${index + 1}`" />
            <a-button
              type="text"
              danger
              :disabled="quizForm.options.length <= 2"
              @click="removeOption(index)"
            >
              <template #icon><DeleteOutlined /></template>
            </a-button>
          </div>
          <a-button type="dashed" block @click="addOption">
            <template #icon><PlusOutlined /></template>
            添加选项
          </a-button>
        </a-form-item>
        <a-form-item label="正确答案" name="correctOption">
          <a-select v-model:value="quizForm.correctOption" :options="correctOptions" style="width: 100%" />
        </a-form-item>
        <a-form-item label="答案解析" name="explanation">
          <a-textarea v-model:value="quizForm.explanation" :rows="2" placeholder="请输入答案解析" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message, type FormInstance } from 'ant-design-vue';
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  LinkOutlined,
} from '@ant-design/icons-vue';
import {
  COURSE_CATEGORY_LABELS,
  VIDEO_URL_WHITELIST,
  type CourseCategory,
  type QuizQuestion,
} from '@jiucaibox/shared';
import {
  createCourse,
  createQuiz,
  createVideo,
  deleteCourse,
  deleteQuiz,
  deleteVideo,
  fetchCourseDetail,
  fetchCourses,
  updateCourse,
  updateQuiz,
  updateVideo,
  upsertPopup,
  type AdminCourseDetail,
  type AdminCourseRow,
  type AdminVideoItem,
  type QuizPayload,
} from '@/api';
import { useAuthStore } from '@/stores/auth';
import { formatDateTime } from '@/utils/format';

const auth = useAuthStore();

const categoryOptions = (Object.keys(COURSE_CATEGORY_LABELS) as CourseCategory[]).map((v) => ({
  label: COURSE_CATEGORY_LABELS[v],
  value: v,
}));

// ==================== 列表 ====================
const list = ref<AdminCourseRow[]>([]);
const total = ref(0);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);
const search = ref('');
const category = ref('all');

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
    const res = await fetchCourses({
      page: page.value,
      pageSize: pageSize.value,
      category: category.value,
      search: search.value.trim() || undefined,
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

function onReset() {
  search.value = '';
  category.value = 'all';
  page.value = 1;
  loadList();
}

function onTableChange(pag: { current?: number; pageSize?: number }) {
  page.value = pag.current || 1;
  pageSize.value = pag.pageSize || 10;
  loadList();
}

const columns = [
  { title: '封面', key: 'cover', width: 90 },
  { title: '课程标题', key: 'title', ellipsis: true },
  { title: '分类', key: 'category', width: 130 },
  { title: '视频数', dataIndex: 'videoCount', width: 80 },
  { title: '学习人数', dataIndex: 'learnerCount', width: 100 },
  { title: '创建时间', key: 'createdAt', width: 170 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' },
];

// ==================== 课程编辑 ====================
const courseModalOpen = ref(false);
const courseSaving = ref(false);
const courseFormRef = ref<FormInstance>();
const courseForm = reactive({
  id: 0,
  title: '',
  description: '',
  coverUrl: '',
  category: 'truth' as CourseCategory,
  learnerCount: 0,
  sort: 0,
});

const courseRules = {
  title: [{ required: true, message: '请输入课程标题', trigger: 'blur' }],
};

function openCourseModal(row?: AdminCourseRow) {
  if (row) {
    Object.assign(courseForm, {
      id: row.id,
      title: row.title,
      description: row.description,
      coverUrl: row.coverUrl,
      category: row.category,
      learnerCount: row.learnerCount,
      sort: row.sort,
    });
  } else {
    Object.assign(courseForm, {
      id: 0,
      title: '',
      description: '',
      coverUrl: '',
      category: 'truth',
      learnerCount: 0,
      sort: 0,
    });
  }
  courseModalOpen.value = true;
}

async function saveCourse() {
  try {
    await courseFormRef.value?.validate();
  } catch {
    return;
  }
  courseSaving.value = true;
  try {
    const payload = {
      title: courseForm.title.trim(),
      description: courseForm.description,
      coverUrl: courseForm.coverUrl,
      category: courseForm.category,
      learnerCount: courseForm.learnerCount,
      sort: courseForm.sort,
    };
    if (courseForm.id) {
      await updateCourse(courseForm.id, payload);
      message.success('课程已更新');
    } else {
      await createCourse(payload);
      message.success('课程已创建');
    }
    courseModalOpen.value = false;
    await loadList();
  } finally {
    courseSaving.value = false;
  }
}

async function onDeleteCourse(row: AdminCourseRow) {
  try {
    await deleteCourse(row.id);
    message.success('课程已删除');
    await loadList();
  } catch {
    /* 错误提示由拦截器统一处理 */
  }
}

// ==================== 管理内容抽屉 ====================
const drawerOpen = ref(false);
const drawerLoading = ref(false);
const drawerTab = ref('videos');
const detail = ref<AdminCourseDetail | null>(null);

async function loadDrawer() {
  if (!detail.value) return;
  drawerLoading.value = true;
  try {
    detail.value = await fetchCourseDetail(detail.value.id);
  } finally {
    drawerLoading.value = false;
  }
}

function openDrawer(row: AdminCourseRow) {
  detail.value = { ...row, videos: [], quizQuestions: [] } as AdminCourseDetail;
  drawerTab.value = 'videos';
  drawerOpen.value = true;
  loadDrawer();
}

// ==================== 视频 ====================
interface VideoForm {
  id: number;
  title: string;
  coverUrl: string;
  videoUrl: string;
  duration: number;
  description: string;
  order: number;
  popupContent: string;
}

const videoModalOpen = ref(false);
const videoSaving = ref(false);
const videoFormRef = ref<FormInstance>();
const videoForm = reactive<VideoForm>({
  id: 0,
  title: '',
  coverUrl: '',
  videoUrl: '',
  duration: 0,
  description: '',
  order: 1,
  popupContent: '',
});

const videoRules = {
  title: [{ required: true, message: '请输入视频标题', trigger: 'blur' }],
  videoUrl: [{ required: true, message: '请输入视频链接', trigger: 'blur' }],
};

const videoColumns = [
  { title: '封面', key: 'cover', width: 90 },
  { title: '标题', dataIndex: 'title', ellipsis: true },
  { title: '视频链接', key: 'videoUrl', ellipsis: true },
  { title: '时长(秒)', dataIndex: 'duration', width: 90 },
  { title: '排序', dataIndex: 'order', width: 70 },
  { title: '弹窗', key: 'popup', width: 90 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' },
];

function openVideoModal(video?: AdminVideoItem) {
  if (video) {
    Object.assign(videoForm, {
      id: video.id,
      title: video.title,
      coverUrl: video.coverUrl,
      videoUrl: video.videoUrl,
      duration: video.duration,
      description: video.description,
      order: video.order,
      popupContent: video.popup?.content ?? '',
    });
  } else {
    Object.assign(videoForm, {
      id: 0,
      title: '',
      coverUrl: '',
      videoUrl: '',
      duration: 0,
      description: '',
      order: (detail.value?.videos.length ?? 0) + 1,
      popupContent: '',
    });
  }
  videoModalOpen.value = true;
}

/** 前端白名单校验（后端仍会二次校验） */
function isValidVideoUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return VIDEO_URL_WHITELIST.some((d) => host === d || host.endsWith('.' + d));
  } catch {
    return false;
  }
}

async function saveVideo() {
  try {
    await videoFormRef.value?.validate();
  } catch {
    return;
  }
  if (!isValidVideoUrl(videoForm.videoUrl)) {
    message.error(`视频链接域名不在白名单内，仅允许：${VIDEO_URL_WHITELIST.join('、')}`);
    return;
  }
  videoSaving.value = true;
  try {
    const { id, popupContent, ...payload } = videoForm;
    let videoId = id;
    if (id) {
      await updateVideo(id, payload);
      message.success('视频已更新');
    } else {
      const created = await createVideo({ ...payload, courseId: detail.value!.id });
      videoId = created.id;
      message.success('视频已添加');
    }
    // 弹窗内容：有内容或原本已配置（允许清空）时同步
    const hasPopupBefore = detail.value?.videos.find((v) => v.id === videoId)?.popup != null;
    if (popupContent.trim() || hasPopupBefore) {
      await upsertPopup(videoId, popupContent.trim());
    }
    videoModalOpen.value = false;
    await loadDrawer();
    await loadList();
  } finally {
    videoSaving.value = false;
  }
}

async function onDeleteVideo(video: AdminVideoItem) {
  try {
    await deleteVideo(video.id);
    message.success('视频已删除');
    await loadDrawer();
    await loadList();
  } catch {
    /* 错误提示由拦截器统一处理 */
  }
}

// ==================== 测试题 ====================
interface QuizForm {
  id: number;
  chapter: number;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

const quizModalOpen = ref(false);
const quizSaving = ref(false);
const quizFormRef = ref<FormInstance>();
const quizForm = reactive<QuizForm>({
  id: 0,
  chapter: 1,
  question: '',
  options: ['', ''],
  correctOption: 0,
  explanation: '',
});

const quizRules = {
  question: [{ required: true, message: '请输入题目', trigger: 'blur' }],
};

const correctOptions = computed(() =>
  quizForm.options.map((_, index) => ({ label: `选项${index + 1}`, value: index })),
);

function addOption() {
  quizForm.options.push('');
}

function removeOption(index: number) {
  quizForm.options.splice(index, 1);
  if (quizForm.correctOption >= quizForm.options.length) {
    quizForm.correctOption = Math.max(0, quizForm.options.length - 1);
  }
}

const quizColumns = [
  { title: '章节', dataIndex: 'chapter', width: 70 },
  { title: '题目', key: 'question', ellipsis: true },
  { title: '选项', key: 'options', ellipsis: true },
  { title: '正确答案', key: 'correctOption', width: 110 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' },
];

function openQuizModal(q?: QuizQuestion) {
  if (q) {
    Object.assign(quizForm, {
      id: q.id,
      chapter: q.chapter,
      question: q.question,
      options: [...q.options],
      correctOption: q.correctOption,
      explanation: q.explanation,
    });
  } else {
    Object.assign(quizForm, {
      id: 0,
      chapter: 1,
      question: '',
      options: ['', ''],
      correctOption: 0,
      explanation: '',
    });
  }
  quizModalOpen.value = true;
}

async function saveQuiz() {
  try {
    await quizFormRef.value?.validate();
  } catch {
    return;
  }
  const options = quizForm.options.map((o) => o.trim()).filter(Boolean);
  if (options.length < 2) {
    message.error('选项至少需要 2 个');
    return;
  }
  if (quizForm.correctOption < 0 || quizForm.correctOption >= options.length) {
    message.error('请选择正确的答案选项');
    return;
  }
  quizSaving.value = true;
  try {
    const payload: QuizPayload = {
      courseId: detail.value!.id,
      chapter: quizForm.chapter,
      question: quizForm.question.trim(),
      options,
      correctOption: quizForm.correctOption,
      explanation: quizForm.explanation,
    };
    if (quizForm.id) {
      await updateQuiz(quizForm.id, payload);
      message.success('测试题已更新');
    } else {
      await createQuiz(payload);
      message.success('测试题已添加');
    }
    quizModalOpen.value = false;
    await loadDrawer();
    await loadList();
  } finally {
    quizSaving.value = false;
  }
}

async function onDeleteQuiz(q: QuizQuestion) {
  try {
    await deleteQuiz(q.id);
    message.success('测试题已删除');
    await loadDrawer();
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
  flex-wrap: wrap;
}
.toolbar-search {
  width: 240px;
}
.toolbar-select {
  width: 160px;
}
.course-title {
  font-weight: 500;
}
.no-cover {
  color: rgba(0, 0, 0, 0.35);
  font-size: 12px;
}
.tab-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.tab-tip {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
.url-cell {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: bottom;
}
.ellipsis-cell {
  display: inline-block;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.5;
}
.option-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.option-index {
  width: 52px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
  flex-shrink: 0;
}
</style>
